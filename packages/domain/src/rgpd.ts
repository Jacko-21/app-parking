/**
 * Règles RGPD pour la donnée personnelle « plaque d'immatriculation ».
 *
 * La durée de conservation est paramétrable par tenant ; on borne et on
 * centralise le calcul de l'échéance de rétention pour qu'il soit testable.
 */

export const DEFAULT_VEHICLE_RETENTION_DAYS = 90;
export const MIN_VEHICLE_RETENTION_DAYS = 1;
export const MAX_VEHICLE_RETENTION_DAYS = 365 * 3;

/** Échéance après laquelle la plaque doit être anonymisée ou supprimée. */
export function computeVehicleRetentionUntil(
  endsAt: Date,
  retentionDays: number = DEFAULT_VEHICLE_RETENTION_DAYS,
): Date {
  const until = new Date(endsAt);
  until.setDate(until.getDate() + clampRetentionDays(retentionDays));
  return until;
}

/** Ramène une durée de rétention dans une borne raisonnable. */
export function clampRetentionDays(retentionDays: number): number {
  if (!Number.isFinite(retentionDays)) {
    return DEFAULT_VEHICLE_RETENTION_DAYS;
  }
  return Math.min(MAX_VEHICLE_RETENTION_DAYS, Math.max(MIN_VEHICLE_RETENTION_DAYS, Math.trunc(retentionDays)));
}
