// Agrégations du tableau de bord exploitant — logique métier pure et testable.
// Le chiffre d'affaires est reconnu sur les réservations confirmées ou terminées
// (le tunnel de paiement passe `pending_payment` -> `confirmed`, la réservation
// manuelle est créée directement `confirmed`). Les fenêtres temporelles sont
// calculées en UTC pour rester déterministes.

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_DAILY_SERIES_DAYS = 14;

export const REVENUE_RESERVATION_STATUSES = ["confirmed", "completed"] as const;
const REVENUE_STATUS_SET = new Set<string>(REVENUE_RESERVATION_STATUSES);

export function isRevenueStatus(status: string): boolean {
  return REVENUE_STATUS_SET.has(status);
}

export type DashboardReservation = {
  status: string;
  amountInCents: number;
  currency: string;
  createdAt: Date;
};

export type DashboardDailyPoint = {
  date: string;
  revenueInCents: number;
  reservationCount: number;
};

export type SummarizeDashboardInput = {
  now: Date;
  reservations: DashboardReservation[];
  occupancy: { activeSpaces: number; activeReservations: number };
  parkingCount: number;
  publishedParkingCount: number;
  dailySeriesDays?: number;
};

export type DashboardSummary = {
  currency: string;
  revenue: { todayInCents: number; last7DaysInCents: number; last30DaysInCents: number };
  paidReservations: { today: number; last7Days: number; last30Days: number };
  occupancy: { activeSpaces: number; activeReservations: number; rate: number };
  parkings: { total: number; published: number };
  reservationsByStatus: Record<string, number>;
  dailyRevenue: DashboardDailyPoint[];
};

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function utcDayKey(date: Date): string {
  return startOfUtcDay(date).toISOString().slice(0, 10);
}

export function summarizeDashboard(input: SummarizeDashboardInput): DashboardSummary {
  const { now, reservations, occupancy, parkingCount, publishedParkingCount } = input;
  const dailySeriesDays = Math.max(1, input.dailySeriesDays ?? DEFAULT_DAILY_SERIES_DAYS);

  const todayStart = startOfUtcDay(now).getTime();
  const sevenDaysAgo = now.getTime() - 7 * DAY_MS;
  const thirtyDaysAgo = now.getTime() - 30 * DAY_MS;

  let todayInCents = 0;
  let last7DaysInCents = 0;
  let last30DaysInCents = 0;
  let todayCount = 0;
  let last7Count = 0;
  let last30Count = 0;
  let currency: string | undefined;
  const reservationsByStatus: Record<string, number> = {};

  const dayKeys: string[] = [];
  const dailyMap = new Map<string, { revenueInCents: number; reservationCount: number }>();
  for (let offset = dailySeriesDays - 1; offset >= 0; offset -= 1) {
    const key = utcDayKey(new Date(todayStart - offset * DAY_MS));
    dayKeys.push(key);
    dailyMap.set(key, { revenueInCents: 0, reservationCount: 0 });
  }

  for (const reservation of reservations) {
    reservationsByStatus[reservation.status] = (reservationsByStatus[reservation.status] ?? 0) + 1;

    if (!isRevenueStatus(reservation.status)) {
      continue;
    }
    if (currency === undefined) {
      currency = reservation.currency;
    }

    const timestamp = reservation.createdAt.getTime();
    const amount = reservation.amountInCents;
    if (timestamp >= thirtyDaysAgo) {
      last30DaysInCents += amount;
      last30Count += 1;
    }
    if (timestamp >= sevenDaysAgo) {
      last7DaysInCents += amount;
      last7Count += 1;
    }
    if (timestamp >= todayStart) {
      todayInCents += amount;
      todayCount += 1;
    }

    const bucket = dailyMap.get(utcDayKey(reservation.createdAt));
    if (bucket) {
      bucket.revenueInCents += amount;
      bucket.reservationCount += 1;
    }
  }

  const dailyRevenue: DashboardDailyPoint[] = dayKeys.map((date) => {
    const bucket = dailyMap.get(date) ?? { revenueInCents: 0, reservationCount: 0 };
    return { date, revenueInCents: bucket.revenueInCents, reservationCount: bucket.reservationCount };
  });

  const rate =
    occupancy.activeSpaces === 0 ? 0 : occupancy.activeReservations / occupancy.activeSpaces;

  return {
    currency: currency ?? "EUR",
    revenue: { todayInCents, last7DaysInCents, last30DaysInCents },
    paidReservations: { today: todayCount, last7Days: last7Count, last30Days: last30Count },
    occupancy: {
      activeSpaces: occupancy.activeSpaces,
      activeReservations: occupancy.activeReservations,
      rate,
    },
    parkings: { total: parkingCount, published: publishedParkingCount },
    reservationsByStatus,
    dailyRevenue,
  };
}
