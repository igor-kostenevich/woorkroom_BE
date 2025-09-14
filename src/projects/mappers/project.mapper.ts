import { ProjectRole } from '@prisma/client';
import type { PublicFileRef } from '../../storage/common/file-ref';
import type { ProjectResponse } from '../dto/response/project.response';

export function toPublicRef(ref: any): PublicFileRef | null {
  if (!ref) return null;
  return {
    url: ref.url,
    mime: ref.mime,
    size: ref.size,
    name: ref.name,
    uploadedAt: ref.uploadedAt,
  };
}

export function mapUserBrief(u: any) {
  return { ...u, avatar: toPublicRef(u?.avatar) };
}

export function getMyRole(members: Array<{ role: ProjectRole; user: { id: string } }>, userId: string, fallback: ProjectRole) {
  return members.find(m => m.user.id === userId)?.role ?? fallback;
}

export function mapProjectRowToResponse(row: any, userId: string, fallback: ProjectRole): ProjectResponse {
  const owner = mapUserBrief(row.owner);
  const members = row.members.map((m: any) => ({ role: m.role, user: mapUserBrief(m.user) }));
  const myRole = getMyRole(members, userId, fallback);

  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    priority: row.priority,
    startDate: row.startDate,
    deadline: row.deadline,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    avatar: toPublicRef(row.avatar),
    owner,
    members,
    myRole,
  };
}
