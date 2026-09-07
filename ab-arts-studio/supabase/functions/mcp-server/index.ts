import { Hono } from 'hono';
import { McpServer, StreamableHttpTransport } from 'mcp-lite';
import { createClient } from '@supabase/supabase-js';
import { AsyncLocalStorage } from 'node:async_hooks';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { getCatalogModel, listCatalogModels, type CatalogModel } from '../_shared/model-catalog.generated.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const service = createClient(SUPABASE_URL, SERVICE_ROLE);

// =========================
// Context propagation (per-request, async-safe)
// =========================
interface UserCtx {
  userId: string;
  workspaceId: string | null;
  keyId: string;
  ip: string;
  userAgent: string;
}
const ctxStore = new AsyncLocalStorage<UserCtx>();
const getCtx = (): UserCtx => {
  const c = ctxStore.getStore();
  if (!c) throw new Error('Unauthenticated');
  return c;
};

// =========================
// Helpers
// =========================
async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function logAudit(entry: {
  keyId: string;
  userId: string;
  toolName?: string;
  success: boolean;
  errorCode?: string;
  ip: string;
  userAgent: string;
  metadata?: Record<string, unknown>;
}) {
  // fire-and-forget
  service
    .from('api_key_audit_log')
    .insert({
      key_id: entry.keyId,
      user_id: entry.userId,
      tool_name: entry.toolName,
      success: entry.success,
      error_code: entry.errorCode,
      ip: entry.ip,
      user_agent: entry.userAgent,
      metadata: entry.metadata ?? null,
    })
    .then(() => {});
}

// SSRF guard: only public HTTPS URLs, reject private/loopback/link-local IPs
function assertPublicHttpsUrl(raw: string, field: string): void {
  let u: URL;
  try { u = new URL(raw); } catch { throw new Error(`Invalid ${field}: not a URL`); }
  if (u.protocol !== 'https:') throw new Error(`Invalid ${field}: must be https`);
  const host = u.hostname;
  // Reject explicit IP literals in private ranges
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224 // multicast / reserved
    ) {
      throw new Error(`Invalid ${field}: private network`);
    }
  }
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) {
    throw new Error(`Invalid ${field}: private host`);
  }
  if (host.startsWith('[') /* IPv6 literal */) {
    throw new Error(`Invalid ${field}: IPv6 literals not allowed`);
  }
}

async function authenticate(req: Request): Promise<UserCtx | null> {
  // Prefer X-API-Key (passes through Supabase gateway which parses Authorization as JWT).
  // Fall back to Authorization: Bearer for clients that can only set Authorization.
  let token: string | null = null;
  const xKey = req.headers.get('x-api-key') || req.headers.get('X-API-Key');
  if (xKey) token = xKey.trim();
  if (!token) {
    const auth = req.headers.get('authorization') || req.headers.get('Authorization');
    if (auth?.toLowerCase().startsWith('bearer ')) token = auth.slice(7).trim();
  }
  // Also accept ?api_key=... for clients that cannot set headers at all
  if (!token) {
    try {
      const u = new URL(req.url);
      const q = u.searchParams.get('api_key');
      if (q) token = q.trim();
    } catch { /* noop */ }
  }
  if (!token || !token.startsWith('ab_arts_')) return null;
  const hash = await sha256Hex(token);
  const { data, error } = await service.rpc('verify_api_key', { _token_hash: hash });
  if (error || !data || data.length === 0) return null;
  const row = data[0];
  service.from('user_api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', row.key_id).then(() => {});
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('cf-connecting-ip') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  return { userId: row.user_id, workspaceId: row.workspace_id, keyId: row.key_id, ip, userAgent };
}

// Wraps a tool handler to centralize audit + safe error messages.
function withAudit<TArgs, TRes>(toolName: string, fn: (args: TArgs, ctx: UserCtx) => Promise<TRes>) {
  return async (args: TArgs): Promise<TRes> => {
    const ctx = getCtx();
    try {
      const out = await fn(args, ctx);
      logAudit({ keyId: ctx.keyId, userId: ctx.userId, toolName, success: true, ip: ctx.ip, userAgent: ctx.userAgent });
      return out;
    } catch (e) {
      const msg = (e as Error)?.message || 'error';
      console.error(`[mcp:${toolName}] error:`, msg);
      logAudit({
        keyId: ctx.keyId, userId: ctx.userId, toolName, success: false,
        errorCode: msg.slice(0, 200), ip: ctx.ip, userAgent: ctx.userAgent,
      });
      // Re-throw only safe messages
      const safe = /^(Invalid |Asset not found|Not authenticated|Unauthenticated|Forbidden|Bad request|Timeout)/i.test(msg)
        ? msg : 'Internal error';
      throw new Error(safe);
    }
  };
}


// =========================
// Catalogue-driven request building
// =========================

// The React app derives these from the model JSON and sends them with every
// request; generate-content relies on them to resolve the provider model and to
// map parameters. Reading them from the generated catalogue instead means an MCP
// caller reaches every model the app reaches, with every advanced parameter —
// and that the values come from the catalogue rather than from the caller.
function generationEnvelope(m: CatalogModel) {
  return {
    ...(m.apiModel && { apiModel: m.apiModel }),
    provider: m.provider,
    supportsOutputQuality: m.supportsOutputQuality,
    supportsMultiOutput: m.supportsMultiOutput,
    defaultOutputFormat: m.defaultOutputFormat,
  };
}

function catalogueOptions(m: CatalogModel) {
  return {
    ...(m.apiMapping && { _apiMapping: m.apiMapping }),
    ...(m.parameterKeys.length > 0 && { _parameterKeys: m.parameterKeys }),
  };
}

function requireModel(id: string, expectedType: string): CatalogModel {
  const m = getCatalogModel(id);
  if (!m) {
    const near = listCatalogModels(expectedType).map((x) => x.id).slice(0, 40).join(", ");
    throw new Error(`Invalid model: \"${id}\" is not available. Try list_models. Known ${expectedType} models: ${near}`);
  }
  if (m.type !== expectedType) {
    throw new Error(`Invalid model: \"${id}\" is a ${m.type} model, not ${expectedType}`);
  }
  return m;
}

// Validates caller-supplied advanced parameters against the catalogue and returns
// them keyed the way generate-content expects (options[param.key]).
// Anything not declared by the model is rejected rather than forwarded: the
// catalogue is the allow-list, so a caller cannot smuggle an arbitrary field
// through to the provider.
function validateParameters(m: CatalogModel, raw: unknown): Record<string, unknown> {
  if (raw === undefined || raw === null) return {};
  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Invalid parameters: expected an object of key/value pairs");
  }
  const declared = [...m.parameters.basic, ...m.parameters.advanced];
  const out: Record<string, unknown> = {};

  for (const [name, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value === undefined || value === null) continue;
    // Accept either the internal key or the provider parameter name, because a
    // caller reading the provider docs will naturally reach for the latter.
    const spec = declared.find((d) => d.key === name || d.apiParam === name);
    if (!spec) {
      const allowed = declared.map((d) => d.apiParam ?? d.key).join(", ");
      throw new Error(`Invalid parameter \"${name}\" for ${m.id}. Accepted: ${allowed || "none"}`);
    }

    if (spec.type === "select" && Array.isArray(spec.options) && !spec.options.includes(value as never)) {
      throw new Error(`Invalid value for \"${name}\": expected one of ${spec.options.join(", ")}`);
    }
    if (spec.type === "slider" || spec.type === "number") {
      const n = Number(value);
      if (!Number.isFinite(n)) throw new Error(`Invalid value for \"${name}\": expected a number`);
      if (typeof spec.min === "number" && n < spec.min) throw new Error(`Invalid value for \"${name}\": minimum is ${spec.min}`);
      if (typeof spec.max === "number" && n > spec.max) throw new Error(`Invalid value for \"${name}\": maximum is ${spec.max}`);
      out[spec.key] = n;
      continue;
    }
    if (spec.type === "toggle" || spec.type === "boolean") {
      out[spec.key] = value === true || value === "true";
      continue;
    }
    out[spec.key] = value;
  }
  return out;
}

// Normalises the reference-image input. Accepts the historical singular field so
// existing client setups keep working, caps the list at what the model actually
// takes, and runs every URL through the SSRF guard.
function collectReferenceImages(m: CatalogModel, args: any): string[] {
  const raw: unknown[] = Array.isArray(args?.reference_image_urls)
    ? args.reference_image_urls
    : args?.reference_image_url
      ? [args.reference_image_url]
      : [];
  if (raw.length === 0) return [];

  const max = Number(m.capabilities?.maxReferenceImages ?? 0);
  if (!m.capabilities?.supportsReferenceImage || max < 1) {
    throw new Error(`Invalid reference_image_urls: ${m.id} does not accept reference images`);
  }
  const urls = raw.map((u) => String(u));
  if (urls.length > max) {
    throw new Error(`Invalid reference_image_urls: ${m.id} accepts at most ${max} (got ${urls.length})`);
  }
  urls.forEach((u, i) => assertPublicHttpsUrl(u, `reference_image_urls[${i}]`));
  return urls;
}

// =========================
// MCP Server
// =========================
const mcp = new McpServer({
  name: 'ab-arts-studio',
  version: '1.2.0',
  schemaAdapter: (schema) => zodToJsonSchema(schema as z.ZodType) as Record<string, unknown>,
});

mcp.tool('list_models', {
  description:
    'List available models: id, name, type, provider, category, how many reference images each takes, and its parameter names. Call describe_model for the full schema of a given model.',
  inputSchema: z.object({
    category: z
      .enum(['image', 'video', 'audio', 'llm', 'upscale', 'vectorize', '3d', 'avatar', 'all'])
      .optional(),
  }),
  handler: withAudit('list_models', async ({ category }: { category?: string }) => {
    // Served from the generated catalogue rather than pricing_models. That table
    // only holds what an admin last synced and carries no parameter schema, so it
    // used to advertise models generate_image could not actually run.
    const rows = listCatalogModels(category).map((m) => ({
      id: m.id,
      name: m.name,
      type: m.type,
      provider: m.provider,
      category: m.category,
      description: m.description,
      max_reference_images: m.capabilities?.supportsReferenceImage
        ? (m.capabilities?.maxReferenceImages ?? 0)
        : 0,
      parameters: [...m.parameters.basic, ...m.parameters.advanced].map(
        (x) => x.apiParam ?? x.key,
      ),
    }));
    return { content: [{ type: 'text', text: JSON.stringify(rows, null, 2) }] };
  }),
});

mcp.tool('describe_model', {
  description:
    'Full input schema for one model: every parameter with type, default, allowed values and bounds, plus reference-image and duration limits. Call this before generate_image or generate_video.',
  inputSchema: z.object({ model: z.string() }),
  handler: withAudit('describe_model', async ({ model }: { model: string }) => {
    const m = getCatalogModel(String(model ?? '').trim());
    if (!m) throw new Error(`Invalid model: '${model}' is not available. Try list_models.`);
    const supportsRefs = m.capabilities?.supportsReferenceImage === true;
    const shape = {
      id: m.id,
      name: m.name,
      type: m.type,
      provider: m.provider,
      description: m.description,
      reference_images: {
        supported: supportsRefs,
        max: supportsRefs ? (m.capabilities?.maxReferenceImages ?? 0) : 0,
        field: 'reference_image_urls',
      },
      ...(m.duration && { duration: m.duration }),
      parameters: [...m.parameters.basic, ...m.parameters.advanced].map((x) => ({
        name: x.apiParam ?? x.key,
        type: x.type,
        ...(x.default !== undefined && { default: x.default }),
        ...(x.options && { allowed_values: x.options }),
        ...(x.min !== undefined && { min: x.min }),
        ...(x.max !== undefined && { max: x.max }),
        ...(x.label && { label: x.label }),
        ...(x.tooltip && { note: x.tooltip }),
      })),
    };
    return { content: [{ type: 'text', text: JSON.stringify(shape, null, 2) }] };
  }),
});

mcp.tool('get_token_balance', {
  description: 'Get the current AB-Arts token balance for the authenticated user.',
  inputSchema: z.object({}),
  handler: withAudit('get_token_balance', async (_a, ctx) => {
    const { data, error } = await service
      .from('tokens')
      .select('balance, total_earned, total_spent')
      .eq('user_id', ctx.userId)
      .maybeSingle();
    if (error) throw new Error('Bad request: query failed');
    return { content: [{ type: 'text', text: JSON.stringify(data ?? { balance: 0 }, null, 2) }] };
  }),
});

mcp.tool('list_recent_assets', {
  description: 'List the most recent generated assets for the authenticated user.',
  inputSchema: z.object({
    limit: z.number().optional(),
    type: z.string().optional(),
  }),
  handler: withAudit('list_recent_assets', async ({ limit, type }: { limit?: number; type?: string }, ctx) => {
    const lim = Math.min(Math.max(Number(limit) || 10, 1), 50);
    let q = service
      .from('assets')
      .select('id, type, status, prompt, file_url, thumbnail_url, model, created_at')
      .eq('user_id', ctx.userId)
      .order('created_at', { ascending: false })
      .limit(lim);
    if (type && typeof type === 'string') q = q.eq('type', type);
    const { data, error } = await q;
    if (error) throw new Error('Bad request: query failed');
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }),
});

mcp.tool('get_asset', {
  description: 'Get details for a specific asset by id. include_image=true returns the image inline (base64).',
  inputSchema: z.object({
    asset_id: z.string(),
    include_image: z.boolean().optional(),
  }),
  handler: withAudit('get_asset', async ({ asset_id, include_image }: { asset_id: string; include_image?: boolean }, ctx) => {
    if (typeof asset_id !== 'string' || asset_id.length < 8) throw new Error('Bad request: asset_id required');
    const { data: asset, error } = await service
      .from('assets')
      .select('id, type, status, prompt, file_url, thumbnail_url, model, metadata, created_at, completed_at')
      .eq('id', asset_id)
      .eq('user_id', ctx.userId)
      .maybeSingle();
    if (error) throw new Error('Bad request: query failed');
    if (!asset) throw new Error('Asset not found');

    const content: any[] = [{ type: 'text', text: JSON.stringify(asset, null, 2) }];

    if (include_image && asset.type === 'image' && asset.status === 'completed' && asset.file_url) {
      try {
        const res = await fetch(asset.file_url);
        if (res.ok) {
          const bytes = new Uint8Array(await res.arrayBuffer());
          if (bytes.byteLength <= 10 * 1024 * 1024) {
            let bin = '';
            for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
            content.push({ type: 'image', data: btoa(bin), mimeType: res.headers.get('content-type') || 'image/png' });
          }
        }
      } catch (_) { /* noop */ }
    }
    return { content };
  }),
});

mcp.tool('wait_for_asset', {
  description: 'Poll an asset until completed or failed. Default 60s, max 120s. Returns the final asset.',
  inputSchema: z.object({
    asset_id: z.string(),
    timeout_seconds: z.number().optional(),
    include_image: z.boolean().optional(),
  }),
  handler: withAudit('wait_for_asset', async ({ asset_id, timeout_seconds, include_image }: { asset_id: string; timeout_seconds?: number; include_image?: boolean }, ctx) => {
    if (typeof asset_id !== 'string' || asset_id.length < 8) throw new Error('Bad request: asset_id required');
    const deadline = Date.now() + Math.min(Math.max(Number(timeout_seconds) || 60, 5), 120) * 1000;
    while (Date.now() < deadline) {
      const { data: asset, error } = await service
        .from('assets')
        .select('id, type, status, prompt, file_url, thumbnail_url, model, metadata, created_at, completed_at')
        .eq('id', asset_id)
        .eq('user_id', ctx.userId)
        .maybeSingle();
      if (error) throw new Error('Bad request: query failed');
      if (!asset) throw new Error('Asset not found');
      if (asset.status === 'completed' || asset.status === 'failed') {
        const content: any[] = [{ type: 'text', text: JSON.stringify(asset, null, 2) }];
        if (include_image && asset.type === 'image' && asset.status === 'completed' && asset.file_url) {
          try {
            const res = await fetch(asset.file_url);
            if (res.ok) {
              const bytes = new Uint8Array(await res.arrayBuffer());
              if (bytes.byteLength <= 10 * 1024 * 1024) {
                let bin = '';
                for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
                content.push({ type: 'image', data: btoa(bin), mimeType: res.headers.get('content-type') || 'image/png' });
              }
            }
          } catch (_) { /* noop */ }
        }
        return { content };
      }
      service.functions.invoke('check-generation-status', { body: { assetId: asset_id } }).catch(() => {});
      await new Promise((r) => setTimeout(r, 4000));
    }
    return { content: [{ type: 'text', text: JSON.stringify({ status: 'timeout', asset_id }, null, 2) }] };
  }),
});

async function invokeGenerate(body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-content`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SERVICE_ROLE}` },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok || data?.error) {
    console.error('[mcp] generate-content failed:', res.status, data?.error);
    throw new Error('Bad request: generation failed');
  }
  return data;
}

mcp.tool('generate_image', {
  description:
    'Generate an image. Advanced options go in `parameters` — call describe_model first to see what the model accepts. Returns asset_id immediately; poll with wait_for_asset.',
  inputSchema: z.object({
    prompt: z.string(),
    model: z.string(),
    aspect_ratio: z.string().optional(),
    reference_image_urls: z.array(z.string()).optional(),
    reference_image_url: z.string().optional(),
    parameters: z.record(z.unknown()).optional(),
  }),
  handler: withAudit('generate_image', async (args: any, ctx) => {
    const prompt = String(args?.prompt ?? '').trim();
    const modelId = String(args?.model ?? '').trim();
    if (!prompt) throw new Error('Bad request: prompt required');
    if (!modelId) throw new Error('Bad request: model required');
    if (prompt.length > 4000) throw new Error('Bad request: prompt too long');

    const m = requireModel(modelId, 'image');
    const refs = collectReferenceImages(m, args);
    const params = validateParameters(m, args?.parameters);
    const aspect = args?.aspect_ratio ? String(args.aspect_ratio).slice(0, 16) : undefined;

    const data = await invokeGenerate({
      _pipelineUserId: ctx.userId,
      prompt,
      type: 'image',
      model: m.id,
      ...generationEnvelope(m),
      ...(ctx.workspaceId && { workspace_id: ctx.workspaceId }),
      options: {
        ...catalogueOptions(m),
        ...params,
        ...(aspect && { aspectRatio: aspect }),
        // refImages drives the multi-reference path; the singular fields stay for
        // the model branches in generate-content that still read them.
        ...(refs.length > 0 && {
          refImages: refs,
          referenceImage: refs[0],
          refImage: refs[0],
        }),
        via: 'mcp',
      },
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              asset_id: data.assetId,
              status: data.status,
              model: m.id,
              reference_images: refs.length,
              applied_parameters: params,
              message:
                'Use wait_for_asset to poll, or get_asset with include_image=true to view it.',
            },
            null,
            2,
          ),
        },
      ],
    };
  }),
});

mcp.tool('generate_video', {
  description:
    'Generate a video. Advanced options go in `parameters` — call describe_model first. Returns asset_id immediately; poll with wait_for_asset.',
  inputSchema: z.object({
    prompt: z.string(),
    model: z.string(),
    aspect_ratio: z.string().optional(),
    duration_seconds: z.number().optional(),
    start_image_url: z.string().optional(),
    last_image_url: z.string().optional(),
    reference_image_urls: z.array(z.string()).optional(),
    reference_image_url: z.string().optional(),
    video_reference_url: z.string().optional(),
    audio_reference_url: z.string().optional(),
    parameters: z.record(z.unknown()).optional(),
  }),
  handler: withAudit('generate_video', async (args: any, ctx) => {
    const prompt = String(args?.prompt ?? '').trim();
    const modelId = String(args?.model ?? '').trim();
    if (!prompt) throw new Error('Bad request: prompt required');
    if (!modelId) throw new Error('Bad request: model required');
    if (prompt.length > 4000) throw new Error('Bad request: prompt too long');

    const m = requireModel(modelId, 'video');
    const refs = collectReferenceImages(m, args);
    const params = validateParameters(m, args?.parameters);

    const urlFields: Array<[string, unknown]> = [
      ['start_image_url', args?.start_image_url],
      ['last_image_url', args?.last_image_url],
      ['video_reference_url', args?.video_reference_url],
      ['audio_reference_url', args?.audio_reference_url],
    ];
    for (const [field, val] of urlFields) {
      if (val) assertPublicHttpsUrl(String(val), field);
    }

    const aspect = args?.aspect_ratio ? String(args.aspect_ratio).slice(0, 16) : undefined;

    // Clamp against what this model declares rather than a blanket 1-60.
    let dur: number | undefined;
    if (args?.duration_seconds !== undefined) {
      const d = Number(args.duration_seconds);
      const spec = m.duration as Record<string, unknown> | undefined;
      const allowed = spec?.allowedDurations as number[] | undefined;
      if (Array.isArray(allowed) && allowed.length > 0 && !allowed.includes(d)) {
        throw new Error(
          `Invalid duration_seconds for ${m.id}: allowed values are ${allowed.join(', ')}`,
        );
      }
      const lo = Number(spec?.minDuration ?? 1);
      const hi = Number(spec?.maxDuration ?? 60);
      dur = Math.min(Math.max(d, lo), hi);
    }

    const data = await invokeGenerate({
      _pipelineUserId: ctx.userId,
      prompt,
      type: 'video',
      model: m.id,
      ...generationEnvelope(m),
      ...(ctx.workspaceId && { workspace_id: ctx.workspaceId }),
      options: {
        ...catalogueOptions(m),
        ...params,
        ...(aspect && { aspectRatio: aspect }),
        ...(dur !== undefined && { duration: dur }),
        ...(args.start_image_url && {
          startImage: args.start_image_url,
          referenceImage: args.start_image_url,
        }),
        ...(args.last_image_url && { lastImage: args.last_image_url }),
        ...(args.video_reference_url && { videoRef: args.video_reference_url }),
        ...(args.audio_reference_url && { audioRef: args.audio_reference_url }),
        ...(refs.length > 0 && { refImages: refs }),
        via: 'mcp',
      },
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              asset_id: data.assetId,
              status: data.status,
              model: m.id,
              reference_images: refs.length,
              applied_parameters: params,
              message:
                'Video generation started. Use wait_for_asset (max 120s) · call repeatedly if needed.',
            },
            null,
            2,
          ),
        },
      ],
    };
  }),
});

// =========================
// Hono + transport
// =========================
const app = new Hono();
const transport = new StreamableHttpTransport();
const handler = transport.bind(mcp);

// CORS: MCP is server-to-server. We do not expose to arbitrary browser origins.
// Allow only AB-Arts origins (preview, prod, custom domain) for occasional dev tooling.
const ALLOWED_ORIGINS = new Set(
  [
    'https://ab-arts.studio',
    'https://www.ab-arts.studio',
    Deno.env.get('APP_URL') ?? '',
  ].filter(Boolean),
);
function corsFor(origin: string | null): Record<string, string> {
  if (origin && (ALLOWED_ORIGINS.has(origin) || origin.endsWith('.vercel.app'))) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'authorization, x-api-key, content-type, mcp-session-id',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Vary': 'Origin',
    };
  }
  return {};
}

app.options('/*', (c) => {
  return new Response('ok', { headers: corsFor(c.req.header('origin') ?? null) });
});

app.all('/*', async (c) => {
  const ctx = await authenticate(c.req.raw);
  const cors = corsFor(c.req.header('origin') ?? null);
  if (!ctx) {
    return new Response(
      JSON.stringify({ jsonrpc: '2.0', error: { code: -32001, message: 'Unauthorized: provide a valid AB-Arts API key as Bearer token.' }, id: null }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...cors } },
    );
  }
  return await ctxStore.run(ctx, async () => {
    const res = await handler(c.req.raw);
    const headers = new Headers(res.headers);
    for (const [k, v] of Object.entries(cors)) headers.set(k, v);
    return new Response(res.body, { status: res.status, headers });
  });
});

Deno.serve(app.fetch);
