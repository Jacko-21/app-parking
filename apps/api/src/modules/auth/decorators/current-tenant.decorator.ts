import { createParamDecorator, UnauthorizedException, type ExecutionContext } from "@nestjs/common";
import type { TenantContext } from "@bingoz/domain";

import type { AuthenticatedRequest } from "../../../common/authenticated-request";

/** Injecte le `TenantContext` résolu par le `AuthGuard` dans un handler. */
export const CurrentTenant = createParamDecorator(
  (_data: unknown, context: ExecutionContext): TenantContext => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.tenantContext) {
      throw new UnauthorizedException("Contexte tenant manquant.");
    }

    return request.tenantContext;
  },
);
