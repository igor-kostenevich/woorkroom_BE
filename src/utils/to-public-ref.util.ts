import type { FileRef, PublicFileRef } from '../storage/common/file-ref';

export function toPublicRef(ref?: FileRef | null): PublicFileRef | null {
  if (!ref) return null;
  const { url, mime, size, name, uploadedAt } = ref;
  return { url, mime, size, name, uploadedAt };
}