/**
 * Contexte multi-tenant — types et helpers partagés par l'API.
 *
 * `TenantId` est un type « branded » : un simple `string` n'est pas accepté
 * là où un `TenantId` est attendu, ce qui force à passer explicitement par
 * `asTenantId()` et évite de propager par erreur une valeur libre du client.
 */

export type TenantId = string & { readonly __brand: "TenantId" };

/** Rôles d'un membre côté exploitant. */
export type UserRole = "admin" | "gestionnaire" | "agent";

/**
 * Contexte serveur résolu pour chaque requête authentifiée.
 * Le `tenantId` doit toujours être dérivé côté serveur (jamais d'une valeur
 * libre envoyée par le client).
 */
export type TenantContext = {
  tenantId: TenantId;
  userId: string;
  roles: UserRole[];
};

/** Convertit une chaîne en `TenantId` après résolution serveur. */
export function asTenantId(value: string): TenantId {
  return value as TenantId;
}
