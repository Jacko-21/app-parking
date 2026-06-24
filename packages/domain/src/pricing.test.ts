import { describe, expect, it } from "vitest";

import { quoteStaticPrice } from "./pricing";

describe("quoteStaticPrice", () => {
  it("facture chaque heure entamée pour une règle horaire", () => {
    const quote = quoteStaticPrice({
      startsAt: new Date("2026-05-10T14:00:00.000Z"),
      endsAt: new Date("2026-05-10T17:00:00.000Z"),
      rule: { id: "rule_1", label: "Tarif horaire", unit: "hour", amountInCents: 350 },
    });

    expect(quote).toEqual({ amountInCents: 1050, currency: "EUR", billableUnits: 3 });
  });

  it("arrondit toute heure entamée à l'unité supérieure", () => {
    const quote = quoteStaticPrice({
      startsAt: new Date("2026-05-10T14:00:00.000Z"),
      endsAt: new Date("2026-05-10T15:30:00.000Z"),
      rule: { id: "rule_1", label: "Tarif horaire", unit: "hour", amountInCents: 350 },
    });

    expect(quote.billableUnits).toBe(2);
    expect(quote.amountInCents).toBe(700);
  });

  it("applique un prix forfaitaire indépendant de la durée", () => {
    const quote = quoteStaticPrice({
      startsAt: new Date("2026-05-10T14:00:00.000Z"),
      endsAt: new Date("2026-05-12T14:00:00.000Z"),
      rule: { id: "rule_flat", label: "Forfait journée", unit: "flat", amountInCents: 1500 },
    });

    expect(quote).toEqual({ amountInCents: 1500, currency: "EUR", billableUnits: 1 });
  });

  it("facture au moins une unité pour une durée nulle ou négative", () => {
    const quote = quoteStaticPrice({
      startsAt: new Date("2026-05-10T14:00:00.000Z"),
      endsAt: new Date("2026-05-10T14:00:00.000Z"),
      rule: { id: "rule_1", label: "Tarif horaire", unit: "hour", amountInCents: 350 },
    });

    expect(quote.billableUnits).toBe(1);
  });
});
