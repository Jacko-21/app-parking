import { ForbiddenException, Injectable, type CanActivate, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { UserRole } from "@bingoz/domain";

import type { AuthenticatedRequest } from "../../common/authenticated-request";
import { ROLES_KEY } from "./decorators/roles.decorator";

/**
 * Vérifie les rôles requis par `@Roles(...)`. Le rôle `admin` satisfait
 * toujours l'exigence. S'exécute après le `AuthGuard` (contexte déjà résolu).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const roles = request.tenantContext?.roles ?? [];

    if (roles.includes("admin") || roles.some((role) => requiredRoles.includes(role))) {
      return true;
    }

    throw new ForbiddenException("Rôle insuffisant pour cette action.");
  }
}
