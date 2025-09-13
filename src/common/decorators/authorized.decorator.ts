import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { User } from "@prisma/client";
import { Request } from "express";

type CurrentUser = { id: string };

export const Authorized = createParamDecorator(
  (data: keyof User, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest() as Request

    const user = (request as any).user as CurrentUser | undefined;

    return data ? user![data] : user
  }
)