// Replicate downloads URL inputs to /tmp/<last path segment>. When that segment
// has no file extension (Google Drive `.../download?id=…`, signed links, …)
// models such as OmniHuman cannot tell the media type and fail with
// "Failed to upload /tmp/…download". Such URLs must be mirrored to a URL that
// ends in a real extension before being handed to a provider.

const MEDIA_EXTENSIONS = [
  'jpg', 'jpeg', 'png', 'webp', 'gif',
  'mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac',
  'mp4', 'webm', 'mov',
];

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/wave': 'wav',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/aac': 'aac',
  'audio/ogg': 'ogg',
  'audio/flac': 'flac',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};

/** True when the URL path already ends in a known media file extension. */
export function urlHasMediaExtension(raw: string): boolean {
  let path: string;
  try {
    path = new URL(raw).pathname.toLowerCase();
  } catch {
    return false;
  }
  const dot = path.lastIndexOf('.');
  if (dot < 0 || dot < path.lastIndexOf('/')) return false;
  return MEDIA_EXTENSIONS.includes(path.slice(dot + 1));
}

/** File extension for a Content-Type header value, or undefined if not a supported media type. */
export function extensionForContentType(contentType: string | null | undefined): string | undefined {
  if (!contentType) return undefined;
  const base = contentType.split(';')[0].trim().toLowerCase();
  return EXTENSION_BY_CONTENT_TYPE[base];
}
