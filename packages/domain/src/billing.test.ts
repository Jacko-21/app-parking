import { describe, expect, it } from "vitest";

import { computeFiscalArchiveUntil, FISCAL_RETENTION_YEARS } from "./billing";

describe("computeFiscalArchiveUntil", () => {
  it("ajoute 10 ans à la date d'émission", () => {
    const issuedAt = new Date("2026-07-01T10:00:00.000Z");
    const archiveUntil = computeFiscalArchiveUntil(issuedAt);

    expect(FISCAL_RETENTION_YEARS).toBe(10);
    expect(archiveUntil.getUTCFullYear()).toBe(2036);
    expect(archiveUntil.getUTCMonth()).toBe(issuedAt.getUTCMonth());
    expect(archiveUntil.getUTCDate()).toBe(issuedAt.getUTCDate());
  });

  it("ne mute pas la date d'entrée", () => {
    const issuedAt = new Date("2026-07-01T10:00:00.000Z");
    computeFiscalArchiveUntil(issuedAt);

    expect(issuedAt.getUTCFullYear()).toBe(2026);
  });
});
