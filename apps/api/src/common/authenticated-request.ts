import type { Request } from "express";
import type { TenantContext } from "@bingoz/domain";

/** Requête Express enrichie du contexte tenant résolu par le `AuthGuard`. */
export interface AuthenticatedRequest extends Request {
  tenantContext?: TenantContext;
}
