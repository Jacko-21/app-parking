/**
 * Règles de facturation / conservation.
 *
 * En France, les factures et pièces justificatives doivent être conservées
 * 10 ans. On centralise ici le calcul de l'échéance d'archivage pour qu'il
 * soit testable et réutilisable (interdiction de suppression avant cette date).
 */

export const FISCAL_RETENTION_YEARS = 10;

/** Échéance avant laquelle une facture ne doit pas être supprimée/purgée. */
export function computeFiscalArchiveUntil(issuedAt: Date): Date {
  const archiveUntil = new Date(issuedAt);
  archiveUntil.setFullYear(archiveUntil.getFullYear() + FISCAL_RETENTION_YEARS);
  return archiveUntil;
}
