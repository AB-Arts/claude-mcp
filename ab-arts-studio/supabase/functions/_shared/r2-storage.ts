/**
 * Shared R2 upload module for Edge Functions.
 * Uploads to Cloudflare R2 via S3-compatible API (aws4fetch).
 * Single bucket with subfolder structure replacing old Supabase buckets.
 */

import { AwsClient } from "https://esm.sh/aws4fetch@1.0.20";

const R2_PUBLIC_URL = "https://pub-4db3da4bac5d49e5a9dbc446a96bb0c6.r2.dev";

function getR2Client(): AwsClient {
  return new AwsClient({
    accessKeyId: Deno.env.get("R2_ACCESS_KEY_ID")!,
    secretAccessKey: Deno.env.get("R2_SECRET_ACCESS_KEY")!,
    region: "auto",
    service: "s3",
  });
}

function getR2Endpoint(): string {
  const accountId = Deno.env.get("R2_ACCOUNT_ID")!;
  const bucket = Deno.env.get("R2_BUCKET_NAME")!;
  return `https://${accountId}.r2.cloudflarestorage.com/${bucket}`;
}

function getContentType(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".mp3")) return "audio/mpeg";
  if (lower.endsWith(".wav")) return "audio/wav";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

/**
 * Returns the public URL for an R2 object.
 */
export function getR2PublicUrl(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`;
}

/**
 * Upload raw bytes to R2 at the given key path.
 * Returns the public CDN URL or throws on failure.
 */
export async function uploadToR2(
  key: string,
  data: Uint8Array,
  contentType?: string,
): Promise<string> {
  const r2 = getR2Client();
  const endpoint = getR2Endpoint();
  const ct = contentType || getContentType(key);

  const res = await r2.fetch(`${endpoint}/${key}`, {
    method: "PUT",
    headers: { "Content-Type": ct },
    body: data,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`R2 upload failed for ${key}: ${res.status} ${errText}`);
  }

  return getR2PublicUrl(key);
}

/**
 * Stream a remote URL directly to R2 without buffering the full file in memory.
 * Critical for large files (e.g. Topaz x4 PNG upscales >100MB) that would otherwise
 * crash edge functions with "Memory limit exceeded".
 *
 * Uses R2's S3-compatible API with UNSIGNED-PAYLOAD so we can pass a ReadableStream
 * as the body without computing a SHA-256 of the whole content first.
 */
export async function streamUrlToR2(
  key: string,
  sourceUrl: string,
  contentType?: string,
): Promise<string> {
  const r2 = getR2Client();
  const endpoint = getR2Endpoint();
  const ct = contentType || getContentType(key);

  // 5-minute timeout on the source fetch — prevents hanging multipart uploads
  // if the upstream provider stalls mid-stream (cause of orphaned multipart
  // uploads in R2 dashboard).
  const sourceController = new AbortController();
  const sourceTimeout = setTimeout(() => sourceController.abort(), 300_000);
  const sourceResponse = await fetch(sourceUrl, { signal: sourceController.signal });
  if (!sourceResponse.ok || !sourceResponse.body) {
    clearTimeout(sourceTimeout);
    throw new Error(`Failed to fetch source ${sourceUrl}: ${sourceResponse.status}`);
  }

  const contentLength = sourceResponse.headers.get("content-length");
  const sizeMB = contentLength ? (parseInt(contentLength, 10) / 1024 / 1024).toFixed(1) : "unknown";
  console.log(`📥 [R2 Multipart] ${key} - size: ${sizeMB} MB`);

  if (contentLength && parseInt(contentLength, 10) > 2 * 1024 * 1024 * 1024) {
    throw new Error(`File too large: ${sizeMB} MB (>2GB) for ${key}`);
  }

  // 1. Initiate multipart upload
  const initRes = await r2.fetch(`${endpoint}/${key}?uploads=`, {
    method: "POST",
    headers: { "Content-Type": ct },
  });
  if (!initRes.ok) {
    clearTimeout(sourceTimeout);
    throw new Error(`R2 multipart init failed: ${initRes.status} ${await initRes.text()}`);
  }
  const initXml = await initRes.text();
  const uploadId = initXml.match(/<UploadId>([^<]+)<\/UploadId>/)?.[1];
  if (!uploadId) {
    clearTimeout(sourceTimeout);
    throw new Error(`R2 multipart init: no UploadId in response`);
  }
  console.log(`🆔 [R2 Multipart] Initiated UploadId=${uploadId} for ${key}`);

  let completed = false;

  const PART_SIZE = 8 * 1024 * 1024; // 8 MB per part
  const parts: { PartNumber: number; ETag: string }[] = [];
  const reader = sourceResponse.body.getReader();
  let partNumber = 1;

  // Accumulate incoming network chunks and slice off exactly PART_SIZE-sized
  // parts, copying each byte at most once (into its part). The previous
  // approach re-concatenated the whole pending buffer on every chunk
  // (`new Uint8Array(buffer + value)`), which is O(n^2) in copies and churned
  // enough memory to trip the edge function's compute limit
  // (WORKER_RESOURCE_LIMIT) on large files, e.g. ~120 MB Topaz upscales that
  // then stayed stuck in "processing" forever.
  const pending: Uint8Array[] = [];
  let pendingLen = 0;

  const takeChunk = (size: number): Uint8Array => {
    const out = new Uint8Array(size);
    let off = 0;
    while (off < size) {
      const head = pending[0];
      const need = size - off;
      if (head.length <= need) {
        out.set(head, off);
        off += head.length;
        pending.shift();
      } else {
        out.set(head.subarray(0, need), off);
        pending[0] = head.subarray(need);
        off += need;
      }
    }
    pendingLen -= size;
    return out;
  };

  const uploadPart = async (data: Uint8Array, num: number) => {
    const t0 = Date.now();
    const partRes = await r2.fetch(
      `${endpoint}/${key}?partNumber=${num}&uploadId=${encodeURIComponent(uploadId)}`,
      { method: "PUT", body: data },
    );
    if (!partRes.ok) {
      throw new Error(`R2 upload part ${num} failed: ${partRes.status} ${await partRes.text()}`);
    }
    const etag = partRes.headers.get("etag")?.replace(/"/g, "") ?? "";
    parts.push({ PartNumber: num, ETag: etag });
    console.log(`📦 [R2 Multipart] part ${num} (${(data.length / 1024 / 1024).toFixed(1)} MB) uploaded in ${Date.now() - t0}ms`);
  };

  // Kept modest so peak in-flight memory (CONCURRENCY * PART_SIZE) stays well
  // under the edge function limit even for very large files.
  const CONCURRENCY = 4;
  const inflight: Promise<void>[] = [];

  const scheduleUpload = (data: Uint8Array, num: number) => {
    const p = uploadPart(data, num).finally(() => {
      const idx = inflight.indexOf(p);
      if (idx >= 0) inflight.splice(idx, 1);
    });
    inflight.push(p);
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value.length === 0) continue;
      pending.push(value);
      pendingLen += value.length;

      while (pendingLen >= PART_SIZE) {
        scheduleUpload(takeChunk(PART_SIZE), partNumber++);
        // Backpressure: don't get too far ahead
        if (inflight.length >= CONCURRENCY) {
          await Promise.race(inflight);
        }
      }
    }
    // Flush the remainder as the final part (or the sole part for small files)
    if (pendingLen > 0 || partNumber === 1) {
      scheduleUpload(takeChunk(pendingLen), partNumber++);
    }
    // Wait for all parts to finish
    await Promise.all(inflight);

    // Parts upload concurrently, so `parts` is in completion order. R2/S3 require
    // the CompleteMultipartUpload body to list parts in ascending PartNumber order,
    // otherwise the request is rejected (InvalidPartOrder) and the whole upload
    // fails. This bit large multipart uploads (e.g. Topaz upscales) that stayed
    // stuck in "processing" forever. Sort before building the completion XML.
    parts.sort((a, b) => a.PartNumber - b.PartNumber);

    // 3. Complete multipart upload
    const completeXml = `<?xml version="1.0" encoding="UTF-8"?><CompleteMultipartUpload>${
      parts.map((p) => `<Part><PartNumber>${p.PartNumber}</PartNumber><ETag>"${p.ETag}"</ETag></Part>`).join("")
    }</CompleteMultipartUpload>`;

    const completeRes = await r2.fetch(
      `${endpoint}/${key}?uploadId=${encodeURIComponent(uploadId)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/xml" },
        body: completeXml,
      },
    );
    if (!completeRes.ok) {
      throw new Error(`R2 multipart complete failed: ${completeRes.status} ${await completeRes.text()}`);
    }

    completed = true;
    console.log(`✅ [R2 Multipart] Upload complete for ${key} (${parts.length} parts)`);
    return getR2PublicUrl(key);
  } finally {
    clearTimeout(sourceTimeout);
    // Always abort the multipart upload if not completed — guarantees no
    // orphaned "Ongoing Multipart Upload" entries remain in R2.
    if (!completed) {
      try {
        await r2.fetch(`${endpoint}/${key}?uploadId=${encodeURIComponent(uploadId)}`, { method: "DELETE" });
        console.log(`🧹 [R2 Multipart] Aborted incomplete upload ${uploadId} for ${key}`);
      } catch (abortErr) {
        console.error(`⚠️ [R2 Multipart] Failed to abort ${uploadId}:`, abortErr);
      }
    }
  }
}

/**
 * Delete an object from R2.
 */
export async function deleteFromR2(key: string): Promise<void> {
  const r2 = getR2Client();
  const endpoint = getR2Endpoint();

  const res = await r2.fetch(`${endpoint}/${key}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`R2 delete failed for ${key}: ${res.status} ${errText}`);
  }
}

/**
 * Generate a presigned PUT URL for direct client upload to R2.
 * Uses aws4fetch (edge-compatible) instead of @aws-sdk (which requires Node fs).
 */
export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 600,
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const r2 = getR2Client();
  const accountId = Deno.env.get("R2_ACCOUNT_ID")!;
  const bucket = Deno.env.get("R2_BUCKET_NAME")!;
  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

  // Build the URL with query params for presigned PUT
  const url = new URL(`${endpoint}/${bucket}/${key}`);
  url.searchParams.set("X-Amz-Expires", String(expiresIn));

  // aws4fetch signs the request; we use it to produce a presigned URL
  const signed = await r2.sign(
    new Request(url.toString(), {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
      },
    }),
    {
      aws: { signQuery: true },
    },
  );

  const uploadUrl = signed.url;
  const publicUrl = getR2PublicUrl(key);

  return { uploadUrl, publicUrl, key };
}

// Legacy type compatibility
export type R2Prefix =
  | "generated-images"
  | "generated-videos"
  | "uploaded-media"
  | "audio-files"
  | "thumbnails"
  | "help-videos"
  | "email-assets";

export function isValidPrefix(prefix: string): prefix is R2Prefix {
  return [
    "generated-images",
    "generated-videos",
    "uploaded-media",
    "audio-files",
    "thumbnails",
    "help-videos",
    "email-assets",
  ].includes(prefix);
}
