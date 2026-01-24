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

export function mapProjectRowToResponse(row: any): ProjectResponse {
  const owner = mapUserBrief(row.owner);
  const assignees = row.assignees.map((m: any) => ({ role: m.role, user: mapUserBrief(m.user) }));

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
    assignees,
  };
}
