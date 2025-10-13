import type { PublicFileRef } from '../../storage/common/file-ref';
import { StorageService } from '../../storage/storage.service';

type AvatarPayload = Record<'name', string> | PublicFileRef;

export async function buildAvatarPayload(
  storage: StorageService,
  userId: string,
  avatarPresetOrUndefined: string | undefined,
  avatarFileOrUndefined: Express.Multer["File"] | undefined,
): Promise<AvatarPayload> {
  if (avatarFileOrUndefined) {
    const ref = await storage.uploadAndMakeRef({
      buffer: avatarFileOrUndefined.buffer,
      mime: avatarFileOrUndefined.mimetype,
      originalName: avatarFileOrUndefined.originalname,
      prefix: `projects/${userId}/avatars`,
      public: true,
    });

    return {
      url: ref.url!,
      name: ref.name ?? 'file',
      mime: ref.mime,
      size: ref.size,
      uploadedAt: ref.uploadedAt!,
    };
  }

  return { name: (avatarPresetOrUndefined ?? '').trim() };
}
