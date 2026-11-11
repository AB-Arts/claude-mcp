import { Hono } from 'hono';
import { McpServer, StreamableHttpTransport } from 'mcp-lite';
import { createClient } from '@supabase/supabase-js';
import { AsyncLocalStorage } from 'node:async_hooks';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { getCatalogModel, listCatalogModels, type CatalogModel } from '../_shared/model-catalog.generated.ts';
import { fetchPricingConfig } from '../_shared/pricing-service.ts';
import { deductTokens, refundTokens } from '../_shared/workspace-tokens.ts';
import { extensionForContentType, urlHasMediaExtension } from '../_shared/media-url.ts';
import { uploadToR2 } from '../_shared/r2-storage.ts';

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

// Providers (Replicate) name a downloaded input after the URL's last path
// segment; without a file extension (Google Drive links, signed URLs, …) models
// like OmniHuman cannot detect the media type and fail. Mirror such inputs into
// the studio's own storage under a real extension. URLs that already end in a
// media extension are passed through untouched.
const MIRROR_MAX_BYTES = 100 * 1024 * 1024;

async function withMediaExtension(url: string, field: string, userId: string): Promise<string> {
  if (urlHasMediaExtension(url)) return url;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const res = await fetch(url, { redirect: 'follow', signal: controller.signal });
    if (!res.ok) throw new Error(`Invalid ${field}: download failed (HTTP ${res.status})`);
    const contentType = res.headers.get('content-type');
    const ext = extensionForContentType(contentType);
    if (!ext) {
      throw new Error(
        `Invalid ${field}: the link does not return a media file (got ${contentType ?? 'no content-type'}). ` +
          'Make sure it is publicly downloadable, e.g. a Google Drive file shared with "anyone with the link".',
      );
    }
    const declared = Number(res.headers.get('content-length') ?? 0);
    if (declared > MIRROR_MAX_BYTES) throw new Error(`Invalid ${field}: file larger than 100 MB`);
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.byteLength > MIRROR_MAX_BYTES) throw new Error(`Invalid ${field}: file larger than 100 MB`);
    const key = `uploaded-media/${userId}/mcp-inputs/${crypto.randomUUID()}.${ext}`;
    return await uploadToR2(key, bytes, contentType!.split(';')[0].trim());
  } finally {
    clearTimeout(timeout);
  }
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
  version: '1.3.0',
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
    const refs = await Promise.all(
      collectReferenceImages(m, args).map((u, i) =>
        withMediaExtension(u, `reference_image_urls[${i}]`, ctx.userId),
      ),
    );
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
    // Mirror extension-less inputs (e.g. Google Drive links) — see withMediaExtension.
    for (const [field] of urlFields) {
      if (args?.[field]) args[field] = await withMediaExtension(String(args[field]), field, ctx.userId);
    }
    for (let i = 0; i < refs.length; i++) {
      refs[i] = await withMediaExtension(refs[i], `reference_image_urls[${i}]`, ctx.userId);
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
// Upscale (Topaz) — billed here, not in upscale-*-async
// =========================
// The upscale-*-async edge functions authenticate with a user JWT, which an MCP
// caller never has: it presents an ab_arts_ key that resolves to ctx.userId. So
// the same pipeline runs here on the service-role client — price from the
// catalogue, deduct, create the asset row, submit to Replicate, then hand the
// job over to check-generation-status.

// Upscale models come in two incompatible shapes (a video one and an image one)
// and the catalogue types them both as 'upscale', so each tool names the ids it
// accepts rather than guessing from the parameter list.
const UPSCALE_VIDEO_MODELS = new Set(['topaz-video-upscaler']);
const UPSCALE_IMAGE_MODELS = new Set(['topaz-upscaler']);
const MAX_UPSCALE_DURATION_SECONDS = 600;
const TOKEN_PRICE_EUR = 0.01;

function requireUpscaleModel(id: string, kind: 'video' | 'image'): CatalogModel {
  const m = requireModel(id, 'upscale');
  const allowed = kind === 'video' ? UPSCALE_VIDEO_MODELS : UPSCALE_IMAGE_MODELS;
  if (!allowed.has(m.id)) {
    throw new Error(
      `Invalid model: "${m.id}" is not a ${kind} upscaler. Accepted: ${[...allowed].join(', ')}`,
    );
  }
  return m;
}

// Per-variant API cost, read from the model JSON. The same numbers the app's
// variant table holds, minus the second copy that can drift out of step.
function variantApiCost(m: CatalogModel, condition: Record<string, string | number>): number {
  const variants = (m.pricing?.variants ?? []) as Array<{
    apiCostEur?: number;
    condition?: Record<string, unknown>;
  }>;
  const hit = variants.find((v) =>
    Object.entries(condition).every(([k, want]) => String(v.condition?.[k]) === String(want)),
  );
  const cost = Number(hit?.apiCostEur ?? m.pricing?.apiCostEur);
  if (!Number.isFinite(cost) || cost <= 0) {
    throw new Error(`Bad request: no price configured for ${m.id} ${JSON.stringify(condition)}`);
  }
  return cost;
}

async function upscaleMarginPercent(): Promise<number> {
  const pricing = await fetchPricingConfig(SUPABASE_URL, SERVICE_ROLE);
  const margin = Number(pricing.margins['upscale'] ?? pricing.margins['video'] ?? 300);
  return Number.isFinite(margin) ? margin : 300;
}

function tokensFor(apiCostEur: number, marginPercent: number): number {
  // Round off the binary dust before the ceiling: 0.025 * 6 lands on
  // 0.15000000000000002, which would bill one token more than the price asks.
  const tokens = (apiCostEur * (1 + marginPercent / 100)) / TOKEN_PRICE_EUR;
  return Math.ceil(Number(tokens.toFixed(6)));
}

// Reads one of the caller's own assets. Doubles as the ownership check that lets
// us trust its stored duration and file_url.
async function ownedAsset(assetId: string, ctx: UserCtx, acceptedTypes: string[]) {
  const { data, error } = await service
    .from('assets')
    .select('id, type, status, file_url, prompt, original_prompt, metadata')
    .eq('id', assetId)
    .eq('user_id', ctx.userId)
    .maybeSingle();
  if (error) throw new Error('Bad request: query failed');
  if (!data) throw new Error('Asset not found');
  if (!acceptedTypes.includes(data.type)) {
    throw new Error(
      `Invalid source_asset_id: asset ${data.id} is a ${data.type}, expected ${acceptedTypes.join(' or ')}`,
    );
  }
  if (!data.file_url) throw new Error(`Invalid source_asset_id: asset ${data.id} has no file yet`);
  return data;
}

// The duration drives the bill, so prefer the one we stored ourselves when the
// caller names a source asset, and only fall back to the declared value — bounded,
// whole seconds, rounded up — for an external URL. A declared value that
// contradicts the stored one is rejected rather than quietly overridden.
function resolveUpscaleDuration(
  declared: unknown,
  storedRaw: unknown,
): { seconds: number; source: 'source_asset' | 'declared' } {
  const stored = Number(storedRaw);
  const hasStored = Number.isFinite(stored) && stored > 0;
  const hasDeclared = declared !== undefined && declared !== null;
  const d = hasDeclared ? Number(declared) : NaN;

  if (hasDeclared && (!Number.isFinite(d) || d <= 0)) {
    throw new Error('Invalid duration_seconds: expected a positive number of seconds');
  }

  if (hasStored) {
    if (hasDeclared && Math.abs(d - stored) / stored > 0.1) {
      throw new Error(
        `Invalid duration_seconds: the source asset is ${stored}s, not ${d}s. Omit duration_seconds to bill on the stored duration.`,
      );
    }
    if (stored > MAX_UPSCALE_DURATION_SECONDS) {
      throw new Error(
        `Invalid duration_seconds: ${stored}s exceeds the ${MAX_UPSCALE_DURATION_SECONDS}s limit. Cut the clip first.`,
      );
    }
    return { seconds: Math.ceil(stored), source: 'source_asset' };
  }

  if (!hasDeclared) {
    throw new Error(
      'Bad request: duration_seconds required (or pass a source_asset_id whose duration we hold)',
    );
  }
  if (d > MAX_UPSCALE_DURATION_SECONDS) {
    throw new Error(
      `Invalid duration_seconds: maximum is ${MAX_UPSCALE_DURATION_SECONDS}s. Cut the clip first.`,
    );
  }
  return { seconds: Math.ceil(d), source: 'declared' };
}

async function submitReplicate(apiModel: string, input: Record<string, unknown>): Promise<string> {
  const key = Deno.env.get('REPLICATE_API_KEY');
  if (!key) throw new Error('Bad request: upscale service not configured');
  // Ask Replicate to call us back when the prediction ends. Without it the only
  // thing watching is a poll loop inside an edge worker, and a worker recycled
  // mid-job leaves the asset in 'processing' until the output is purged.
  const res = await fetch(`https://api.replicate.com/v1/models/${apiModel}/predictions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input,
      webhook: `${SUPABASE_URL}/functions/v1/replicate-webhook`,
      webhook_events_filter: ['completed'],
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error('[mcp:upscale] Replicate rejected the prediction:', res.status, text.slice(0, 500));
    throw new Error('Bad request: upscale submission failed');
  }
  let data: { id?: string };
  try { data = JSON.parse(text); } catch { data = {}; }
  if (!data.id) throw new Error('Bad request: upscale submission returned no prediction id');
  return data.id;
}

// Hands the job to the shared poller, which writes the finished file back onto
// the asset row — the same path the app's upscales take.
function startPolling(assetId: string, taskId: string) {
  service.functions
    .invoke('check-generation-status', { body: { assetId, taskId, provider: 'replicate' } })
    .catch(() => {});
}

// Replicate refused the job after we charged for it: give the tokens back and
// mark the row failed, so nothing is left hanging in processing.
async function unwindUpscale(
  assetId: string,
  ctx: UserCtx,
  tokenCost: number,
  label: string,
  message: string,
  metadata: Record<string, unknown>,
) {
  try {
    await service
      .from('assets')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        metadata: { ...metadata, error: message, error_title: 'Upscale could not be started' },
      })
      .eq('id', assetId);
  } catch (_) { /* the refund matters more than the status */ }
  const refund = await refundTokens(service, ctx.userId, ctx.workspaceId, tokenCost, assetId, `Refund: ${label}`);
  if (!refund.success) console.error(`[mcp:upscale] refund failed for asset ${assetId}:`, refund.error);
}

mcp.tool('upscale_video', {
  description:
    'Upscale a video with Topaz (720p/1080p/4k, 25/30/50/60 fps). Pass a public https video_url, or a source_asset_id to upscale one of your own videos. Billing is per 5 seconds of source, so an external URL needs duration_seconds. Returns asset_id immediately; poll with wait_for_asset (the job usually outlives one call).',
  inputSchema: z.object({
    video_url: z.string().optional(),
    source_asset_id: z.string().optional(),
    model: z.string().optional(),
    duration_seconds: z.number().optional(),
    parameters: z.record(z.unknown()).optional(),
  }),
  handler: withAudit('upscale_video', async (args: any, ctx) => {
    const m = requireUpscaleModel(String(args?.model ?? 'topaz-video-upscaler').trim(), 'video');
    const params = validateParameters(m, args?.parameters);

    const resolution = String(params.targetResolution ?? '1080p');
    const fps = Number(params.targetFps ?? 30);
    if (!['720p', '1080p', '4k'].includes(resolution)) {
      throw new Error('Invalid targetResolution: expected 720p, 1080p or 4k');
    }
    if (![25, 30, 50, 60].includes(fps)) {
      throw new Error('Invalid targetFps: expected 25, 30, 50 or 60');
    }

    // Source: either one of the caller's assets (trusted url and duration) or an
    // external public https url with a declared duration.
    const sourceAssetId = args?.source_asset_id ? String(args.source_asset_id) : null;
    const source = sourceAssetId
      ? await ownedAsset(sourceAssetId, ctx, ['video', 'upscale_video'])
      : null;
    const videoUrl = String(args?.video_url ?? source?.file_url ?? '').trim();
    if (!videoUrl) throw new Error('Bad request: video_url or source_asset_id required');
    assertPublicHttpsUrl(videoUrl, 'video_url');

    const { seconds, source: durationSource } = resolveUpscaleDuration(
      args?.duration_seconds,
      (source?.metadata as Record<string, unknown> | null)?.duration,
    );

    const apiCost = variantApiCost(m, { resolution, fps }) * (seconds / 5);
    const marginPercent = await upscaleMarginPercent();
    const tokenCost = tokensFor(apiCost, marginPercent);

    const label = `Video upscale ${resolution}@${fps}fps`;
    const deduction = await deductTokens(service, ctx.userId, ctx.workspaceId, tokenCost, label);
    if (!deduction.success) {
      throw new Error(
        `Invalid request: insufficient tokens — ${tokenCost} required, ${deduction.available ?? deduction.newBalance} available`,
      );
    }

    const basePrompt = source ? (source.original_prompt || source.prompt) : null;
    const prompt = basePrompt ? `Upscale ${resolution}@${fps}fps - ${basePrompt}` : label;
    const metadata = {
      target_resolution: resolution,
      target_fps: fps,
      duration: seconds,
      duration_source: durationSource,
      source_asset_id: sourceAssetId,
      via: 'mcp',
    };
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: asset, error: assetError } = await service
      .from('assets')
      .insert({
        user_id: ctx.userId,
        workspace_id: ctx.workspaceId,
        type: 'upscale_video',
        status: 'processing',
        prompt,
        original_prompt: prompt,
        model: m.id,
        provider: m.provider,
        tokens_cost: tokenCost,
        api_cost_eur: apiCost,
        source_asset_id: sourceAssetId,
        expires_at: expiresAt,
        in_gallery: false,
        metadata,
      })
      .select('id')
      .single();

    if (assetError || !asset?.id) {
      await refundTokens(service, ctx.userId, ctx.workspaceId, tokenCost, null, `Refund: ${label}`);
      console.error('[mcp:upscale_video] asset insert failed:', assetError?.message);
      throw new Error('Bad request: could not create the upscale job');
    }

    let taskId: string;
    try {
      taskId = await submitReplicate(m.apiModel ?? 'topazlabs/video-upscale', {
        video: videoUrl,
        target_resolution: resolution,
        target_fps: fps,
      });
    } catch (e) {
      await unwindUpscale(asset.id, ctx, tokenCost, label, (e as Error).message, metadata);
      throw e;
    }

    await service.from('assets').update({ task_id: taskId }).eq('id', asset.id);
    startPolling(asset.id, taskId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              asset_id: asset.id,
              status: 'processing',
              model: m.id,
              target_resolution: resolution,
              target_fps: fps,
              billed_duration_seconds: seconds,
              duration_source: durationSource,
              tokens_cost: tokenCost,
              api_cost_eur: Number(apiCost.toFixed(4)),
              margin_percent: marginPercent,
              new_balance: deduction.newBalance,
              expires_at: expiresAt,
              message:
                'Upscale started. Poll with wait_for_asset (max 120s per call) · a 4k job can take several minutes. The result expires in 7 days.',
            },
            null,
            2,
          ),
        },
      ],
    };
  }),
});

mcp.tool('upscale_image', {
  description:
    'Upscale an image with Topaz (x2 or x4, face enhancement on). Pass a public https image_url, or a source_asset_id to upscale one of your own images. Returns asset_id immediately; poll with wait_for_asset.',
  inputSchema: z.object({
    image_url: z.string().optional(),
    source_asset_id: z.string().optional(),
    model: z.string().optional(),
    upscale_factor: z.enum(['x2', 'x4']).optional(),
    output_format: z.enum(['png', 'jpg']).optional(),
    parameters: z.record(z.unknown()).optional(),
  }),
  handler: withAudit('upscale_image', async (args: any, ctx) => {
    const m = requireUpscaleModel(String(args?.model ?? 'topaz-upscaler').trim(), 'image');
    const params = validateParameters(m, args?.parameters);

    const factor = String(args?.upscale_factor ?? 'x2');
    if (!['x2', 'x4'].includes(factor)) throw new Error('Invalid upscale_factor: expected x2 or x4');
    const format = args?.output_format === 'jpg' ? 'jpg' : 'png';
    const enhanceModel = String(params.enhanceModel ?? 'Standard V2');

    const sourceAssetId = args?.source_asset_id ? String(args.source_asset_id) : null;
    const source = sourceAssetId
      ? await ownedAsset(sourceAssetId, ctx, ['image', 'upscale_image'])
      : null;
    const imageUrl = String(args?.image_url ?? source?.file_url ?? '').trim();
    if (!imageUrl) throw new Error('Bad request: image_url or source_asset_id required');
    assertPublicHttpsUrl(imageUrl, 'image_url');

    // Fixed price per image; x4 is the double pass the app also charges double for.
    const apiCost = variantApiCost(m, {}) * (factor === 'x4' ? 2 : 1);
    const marginPercent = await upscaleMarginPercent();
    const tokenCost = tokensFor(apiCost, marginPercent);

    const label = `Image upscale ${factor}`;
    const deduction = await deductTokens(service, ctx.userId, ctx.workspaceId, tokenCost, label);
    if (!deduction.success) {
      throw new Error(
        `Invalid request: insufficient tokens — ${tokenCost} required, ${deduction.available ?? deduction.newBalance} available`,
      );
    }

    const basePrompt = source ? (source.original_prompt || source.prompt) : null;
    const prompt = basePrompt ? `Upscale ${factor} - ${basePrompt}` : label;
    const metadata = {
      upscale_factor: factor,
      enhance_model: enhanceModel,
      format,
      source_asset_id: sourceAssetId,
      via: 'mcp',
    };
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: asset, error: assetError } = await service
      .from('assets')
      .insert({
        user_id: ctx.userId,
        workspace_id: ctx.workspaceId,
        type: 'upscale_image',
        status: 'processing',
        prompt,
        original_prompt: prompt,
        model: m.id,
        provider: m.provider,
        tokens_cost: tokenCost,
        api_cost_eur: apiCost,
        source_asset_id: sourceAssetId,
        expires_at: expiresAt,
        in_gallery: false,
        metadata,
      })
      .select('id')
      .single();

    if (assetError || !asset?.id) {
      await refundTokens(service, ctx.userId, ctx.workspaceId, tokenCost, null, `Refund: ${label}`);
      console.error('[mcp:upscale_image] asset insert failed:', assetError?.message);
      throw new Error('Bad request: could not create the upscale job');
    }

    let taskId: string;
    try {
      taskId = await submitReplicate(m.apiModel ?? 'topazlabs/image-upscale', {
        image: imageUrl,
        enhance_model: enhanceModel,
        upscale_factor: factor === 'x2' ? '2x' : '4x',
        output_format: format,
        face_enhancement: true,
        face_enhancement_creativity: 0.5,
        face_enhancement_strength: 0.8,
        subject_detection: 'None',
      });
    } catch (e) {
      await unwindUpscale(asset.id, ctx, tokenCost, label, (e as Error).message, metadata);
      throw e;
    }

    await service.from('assets').update({ task_id: taskId }).eq('id', asset.id);
    startPolling(asset.id, taskId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              asset_id: asset.id,
              status: 'processing',
              model: m.id,
              upscale_factor: factor,
              enhance_model: enhanceModel,
              output_format: format,
              tokens_cost: tokenCost,
              api_cost_eur: Number(apiCost.toFixed(4)),
              margin_percent: marginPercent,
              new_balance: deduction.newBalance,
              expires_at: expiresAt,
              message:
                'Upscale started. Poll with wait_for_asset, or get_asset with include_image=true once it completes. The result expires in 7 days.',
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
