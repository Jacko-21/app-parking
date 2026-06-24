/**
 * Contrats abstraits d'accès au parking.
 *
 * Au MVP (software-only), aucune intégration fournisseur n'est développée ici.
 * Ce package fige les contrats qui permettront, plus tard, d'alimenter un même
 * journal d'accès depuis un QR code, une validation manuelle, la LAPI, une
 * barrière ou un agent local — sans casser le domaine métier.
 *
 * Voir docs/architecture.md § « Préparation des agents locaux futurs ».
 */

/** Au MVP, seules les sources `qr_code`, `access_code` et `manual` sont utilisées. */
export type AccessSource =
  | "qr_code"
  | "access_code"
  | "manual"
  | "lapi"
  | "barrier"
  | "agent";

export type AccessDirection = "entry" | "exit" | "unknown";

export type AccessDecision = "allowed" | "denied" | "pending";

export type AccessEvent = {
  id: string;
  tenantId: string;
  parkingId: string;
  reservationId?: string;
  vehicleId?: string;
  source: AccessSource;
  direction: AccessDirection;
  decision: AccessDecision;
  occurredAt: Date;
  metadata?: Record<string, unknown>;
};

/**
 * Passerelle d'accès : abstraction qu'un futur agent local implémentera.
 * Au MVP, une implémentation logicielle (QR/code/manuel) suffit.
 */
export interface AccessGateway {
  publish(event: AccessEvent): Promise<void>;
}
