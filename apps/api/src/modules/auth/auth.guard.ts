import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { asTenantId } from "@bingoz/domain";

import type { AuthenticatedRequest } from "../../common/authenticated-request";
import { TenantContextService } from "../tenant/tenant-context.service";
import { AuthTokenService } from "./auth-token.service";
import { IS_PUBLIC_KEY } from "./decorators/public.decorator";

/**
 * Garde global : exige un jeton Bearer valide et injecte le `TenantContext`
 * dans la requête. En dehors de la production, accepte en repli l'en-tête de
 * développement `x-tenant-id` (le temps que l'UI d'authentification existe).
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authTokenService: AuthTokenService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;

    if (typeof authorization === "string" && authorization.startsWith("Bearer ")) {
      const payload = this.authTokenService.verify(authorization.slice("Bearer ".length));

      if (!payload) {
        throw new UnauthorizedException("Jeton invalide ou expiré.");
      }

      request.tenantContext = {
        tenantId: asTenantId(payload.tenantId),
        userId: payload.userId,
        roles: payload.roles,
      };
      return true;
    }

    if (process.env["NODE_ENV"] !== "production") {
      const devHeader = request.headers["x-tenant-id"];
      if (devHeader !== undefined) {
        request.tenantContext = this.tenantContextService.resolveFromDevHeader(devHeader);
        return true;
      }
    }

    throw new UnauthorizedException("Authentification requise.");
  }
}
