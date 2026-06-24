/**
 * Tarification statique (MVP).
 *
 * Le yield management dynamique est hors périmètre MVP : on calcule un prix
 * déterministe à partir d'une grille statique et d'une durée de réservation.
 * Le nombre d'unités facturées est arrondi à l'unité supérieure (toute heure
 * entamée est due, idem jour / mois).
 */

export type PriceUnit = "hour" | "day" | "month" | "flat";

export type StaticPriceRule = {
  id: string;
  label: string;
  unit: PriceUnit;
  amountInCents: number;
};

export type QuoteStaticPriceInput = {
  startsAt: Date;
  endsAt: Date;
  rule: StaticPriceRule;
};

export type StaticPriceQuote = {
  amountInCents: number;
  currency: "EUR";
  billableUnits: number;
};

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;
// Mois facturé sur une base forfaitaire de 30 jours au stade MVP.
const MS_PER_MONTH = 30 * MS_PER_DAY;

function billableUnitsFor(unit: PriceUnit, durationMs: number): number {
  switch (unit) {
    case "flat":
      return 1;
    case "hour":
      return Math.max(1, Math.ceil(durationMs / MS_PER_HOUR));
    case "day":
      return Math.max(1, Math.ceil(durationMs / MS_PER_DAY));
    case "month":
      return Math.max(1, Math.ceil(durationMs / MS_PER_MONTH));
  }
}

/**
 * Calcule un devis statique pour un créneau et une règle tarifaire donnés.
 * Suppose que `endsAt` est strictement postérieur à `startsAt` (vérifié par
 * l'appelant).
 */
export function quoteStaticPrice(input: QuoteStaticPriceInput): StaticPriceQuote {
  const durationMs = input.endsAt.getTime() - input.startsAt.getTime();
  const billableUnits = billableUnitsFor(input.rule.unit, Math.max(0, durationMs));

  return {
    amountInCents: billableUnits * input.rule.amountInCents,
    currency: "EUR",
    billableUnits,
  };
}
