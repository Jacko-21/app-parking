import { SetMetadata } from "@nestjs/common";
import type { UserRole } from "@bingoz/domain";

export const ROLES_KEY = "roles";

/** Restreint l'accès aux utilisateurs possédant l'un des rôles indiqués (admin passe toujours). */
export const Roles = (...roles: UserRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
