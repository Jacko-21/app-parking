import { describe, expect, it } from "vitest";

import { getCapacityAvailability, type ExistingReservation } from "./availability";

const window = {
  startsAt: new Date("2026-05-10T14:00:00.000Z"),
  endsAt: new Date("2026-05-10T17:00:00.000Z"),
};

describe("getCapacityAvailability", () => {
  it("décompte les réservations bloquantes qui chevauchent le créneau", () => {
    const reservations: ExistingReservation[] = [
      {
        id: "r1",
        status: "confirmed",
        startsAt: new Date("2026-05-10T14:00:00.000Z"),
        endsAt: new Date("2026-05-10T15:00:00.000Z"),
      },
    ];

    expect(getCapacityAvailability(window, reservations, 2)).toEqual({
      available: true,
      remaining: 1,
    });
  });

  it("ignore les réservations annulées ou expirées", () => {
    const reservations: ExistingReservation[] = [
      { id: "r1", status: "cancelled", startsAt: window.startsAt, endsAt: window.endsAt },
      { id: "r2", status: "expired", startsAt: window.startsAt, endsAt: window.endsAt },
    ];

    expect(getCapacityAvailability(window, reservations, 1)).toEqual({
      available: true,
      remaining: 1,
    });
  });

  it("ignore les réservations hors du créneau", () => {
    const reservations: ExistingReservation[] = [
      {
        id: "r1",
        status: "confirmed",
        startsAt: new Date("2026-05-10T17:00:00.000Z"),
        endsAt: new Date("2026-05-10T18:00:00.000Z"),
      },
    ];

    expect(getCapacityAvailability(window, reservations, 1)).toEqual({
      available: true,
      remaining: 1,
    });
  });

  it("indique l'absence de disponibilité quand la capacité est saturée", () => {
    const reservations: ExistingReservation[] = [
      { id: "r1", status: "confirmed", startsAt: window.startsAt, endsAt: window.endsAt },
      { id: "r2", status: "pending_payment", startsAt: window.startsAt, endsAt: window.endsAt },
    ];

    expect(getCapacityAvailability(window, reservations, 2)).toEqual({
      available: false,
      remaining: 0,
    });
  });
});
