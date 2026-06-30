import { describe, expect, it } from "vitest";

import { summarizeDashboard, type DashboardReservation } from "./dashboard";

const NOW = new Date("2026-06-30T12:00:00.000Z");

function reservation(partial: Partial<DashboardReservation>): DashboardReservation {
  return {
    status: "confirmed",
    amountInCents: 1000,
    currency: "EUR",
    createdAt: NOW,
    ...partial,
  };
}

describe("summarizeDashboard", () => {
  const reservations: DashboardReservation[] = [
    reservation({ status: "confirmed", amountInCents: 1000, createdAt: new Date("2026-06-30T08:00:00.000Z") }),
    reservation({ status: "completed", amountInCents: 2000, createdAt: new Date("2026-06-25T10:00:00.000Z") }),
    reservation({ status: "confirmed", amountInCents: 3000, createdAt: new Date("2026-06-10T10:00:00.000Z") }),
    reservation({ status: "cancelled", amountInCents: 9999, createdAt: new Date("2026-06-30T09:00:00.000Z") }),
    reservation({ status: "pending_payment", amountInCents: 500, createdAt: new Date("2026-06-29T10:00:00.000Z") }),
    reservation({ status: "confirmed", amountInCents: 4000, createdAt: new Date("2026-05-01T10:00:00.000Z") }),
  ];

  const summary = summarizeDashboard({
    now: NOW,
    reservations,
    occupancy: { activeSpaces: 10, activeReservations: 4 },
    parkingCount: 2,
    publishedParkingCount: 1,
  });

  it("ne reconnaît le chiffre d'affaires que sur les statuts confirmé/terminé", () => {
    expect(summary.revenue.todayInCents).toBe(1000);
    expect(summary.revenue.last7DaysInCents).toBe(3000);
    expect(summary.revenue.last30DaysInCents).toBe(6000);
    expect(summary.paidReservations.last30Days).toBe(3);
  });

  it("exclut les réservations hors fenêtre de 30 jours", () => {
    // La réservation du 2026-05-01 (4000) est antérieure à 30 jours : ignorée,
    // donc le total reste 1000 + 2000 + 3000 = 6000.
    expect(summary.revenue.last30DaysInCents).toBe(6000);
  });

  it("compte toutes les réservations par statut", () => {
    expect(summary.reservationsByStatus["confirmed"]).toBe(3);
    expect(summary.reservationsByStatus["completed"]).toBe(1);
    expect(summary.reservationsByStatus["cancelled"]).toBe(1);
    expect(summary.reservationsByStatus["pending_payment"]).toBe(1);
  });

  it("calcule le taux d'occupation", () => {
    expect(summary.occupancy.rate).toBeCloseTo(0.4);
    expect(summary.parkings).toEqual({ total: 2, published: 1 });
  });

  it("produit une série journalière de 14 jours par défaut, bucketée par jour UTC", () => {
    expect(summary.dailyRevenue).toHaveLength(14);
    const last = summary.dailyRevenue.at(-1);
    expect(last?.date).toBe("2026-06-30");
    expect(last?.revenueInCents).toBe(1000);
    const midPoint = summary.dailyRevenue.find((point) => point.date === "2026-06-25");
    expect(midPoint?.revenueInCents).toBe(2000);
  });

  it("retombe sur EUR et des zéros sans réservation", () => {
    const empty = summarizeDashboard({
      now: NOW,
      reservations: [],
      occupancy: { activeSpaces: 0, activeReservations: 0 },
      parkingCount: 0,
      publishedParkingCount: 0,
      dailySeriesDays: 7,
    });
    expect(empty.currency).toBe("EUR");
    expect(empty.revenue.last30DaysInCents).toBe(0);
    expect(empty.occupancy.rate).toBe(0);
    expect(empty.dailyRevenue).toHaveLength(7);
  });
});
