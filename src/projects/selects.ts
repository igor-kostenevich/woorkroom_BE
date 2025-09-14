export const USER_BRIEF_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  avatar: true,
} as const;

export const PROJECT_SELECT = {
  id: true,
  code: true,
  name: true,
  description: true,
  priority: true,
  startDate: true,
  deadline: true,
  createdAt: true,
  updatedAt: true,
  avatar: true,
  owner:   { select: USER_BRIEF_SELECT },
  members: { select: { role: true, user: { select: USER_BRIEF_SELECT } } },
} as const;
