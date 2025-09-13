import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { PaginationParams } from '../types/pagination.types';

type Options = { defaultLimit?: number; maxLimit?: number };

export const Pagination = createParamDecorator(
  (opts: Options | undefined, ctx: ExecutionContext): PaginationParams => {
    const req = ctx.switchToHttp().getRequest<Request>();
    const q = req.query as Record<string, any>;

    const def = opts?.defaultLimit ?? 20;
    const max = opts?.maxLimit ?? 50;

    const rawPage = Number(q.page ?? 1);
    const rawLimit = Number(q.limit ?? def);

    const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.trunc(rawPage) : 1;
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.trunc(rawLimit), max) : def;

    const skip = (page - 1) * limit;
    const take = limit;

    return { page, limit, skip, take };
  }
);
