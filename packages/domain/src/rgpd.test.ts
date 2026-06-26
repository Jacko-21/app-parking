import { describe, expect, it } from "vitest";

import {
  clampRetentionDays,
  computeVehicleRetentionUntil,
  DEFAULT_VEHICLE_RETENTION_DAYS,
  MAX_VEHICLE_RETENTION_DAYS,
  MIN_VEHICLE_RETENTION_DAYS,
} from "./rgpd";

describe("computeVehicleRetentionUntil", () => {
  it("ajoute la durée de rétention par défaut (90 jours)", () => {
    const endsAt = new Date("2026-07-01T00:00:00.000Z");
    const until = computeVehicleRetentionUntil(endsAt);

    expect(DEFAULT_VEHICLE_RETENTION_DAYS).toBe(90);
    expect(until.getTime()).toBe(endsAt.getTime() + 90 * 24 * 60 * 60 * 1000);
  });

  it("respecte une durée personnalisée", () => {
    const endsAt = new Date("2026-07-01T00:00:00.000Z");
    const until = computeVehicleRetentionUntil(endsAt, 30);

    expect(until.getTime()).toBe(endsAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  });
});

describe("clampRetentionDays", () => {
  it("borne les valeurs hors limites", () => {
    expect(clampRetentionDays(0)).toBe(MIN_VEHICLE_RETENTION_DAYS);
    expect(clampRetentionDays(99999)).toBe(MAX_VEHICLE_RETENTION_DAYS);
    expect(clampRetentionDays(Number.NaN)).toBe(DEFAULT_VEHICLE_RETENTION_DAYS);
    expect(clampRetentionDays(45.9)).toBe(45);
  });
});
