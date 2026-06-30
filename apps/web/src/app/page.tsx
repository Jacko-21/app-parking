import {
  AlertTriangle,
  CalendarDays,
  Gauge,
  Plus,
  SquareParking,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";

import { DailyRevenueChart } from "../components/daily-revenue-chart";
import { OperatorShell } from "../components/operator-shell";
import { StatCard } from "../components/stat-card";
import { StatusPill } from "../components/status-pill";
import {
  fetchTenantDashboard,
  fetchTenantParkings,
  fetchTenantReservations,
  type DashboardSummary,
  type ParkingSummary,
  type ReservationSummary,
} from "../lib/api";
import {
  formatCurrencyFromCents,
  formatDateTime,
  RESERVATION_STATUS_META,
  RESERVATION_STATUS_OPTIONS,
  statusMeta,
} from "../lib/labels";

export const dynamic = "force-dynamic";

const EMPTY = "—";

export default async function DashboardPage() {
  const [{ parkings, error }, summary] = await Promise.all([getParkings(), getDashboard()]);

  const fallbackActiveSpaces = parkings.reduce((total, parking) => total + parking.activeSpaces, 0);
  const fallbackActiveReservations = parkings.reduce(
    (total, parking) => total + parking.activeReservations,
    0,
  );
  const occupancy = summary
    ? summary.occupancy
    : {
        activeSpaces: fallbackActiveSpaces,
        activeReservations: fallbackActiveReservations,
        rate: fallbackActiveSpaces === 0 ? 0 : fallbackActiveReservations / fallbackActiveSpaces,
      };

  const firstParking = parkings[0];
  const reservations = firstParking ? await getReservations(firstParking.id) : [];

  return (
    <OperatorShell active="dashboard" subtitle={firstParking ? firstParking.name : "Tableau de bord"}>
      {error ? (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Tableau de bord</h1>
          <p className="text-sm text-muted">
            Chiffre d&apos;affaires, occupation et activité — agrégés côté API par tenant.
          </p>
        </div>
        <Link
          className="inline-flex h-10 items-center gap-2 self-start rounded-lg bg-brand px-4 text-sm font-semibold text-white"
          href="/exploitation/reservations"
        >
          <Plus aria-hidden="true" size={18} />
          Nouvelle réservation
        </Link>
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Indicateurs clés">
        <StatCard
          icon={Wallet}
          label="CA aujourd'hui"
          value={revenueValue(summary?.revenue.todayInCents, summary?.currency)}
          detail={paidDetail(summary?.paidReservations.today)}
        />
        <StatCard
          icon={CalendarDays}
          label="CA 7 jours"
          value={revenueValue(summary?.revenue.last7DaysInCents, summary?.currency)}
          detail={paidDetail(summary?.paidReservations.last7Days)}
        />
        <StatCard
          icon={TrendingUp}
          label="CA 30 jours"
          value={revenueValue(summary?.revenue.last30DaysInCents, summary?.currency)}
          detail={paidDetail(summary?.paidReservations.last30Days)}
        />
        <StatCard
          icon={Gauge}
          label="Occupation"
          value={`${Math.round(occupancy.rate * 100)} %`}
          detail={`${occupancy.activeReservations} créneau(x) actif(s) / ${occupancy.activeSpaces} place(s)`}
        />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.8fr_1fr]">
        <div className="rounded-lg border border-border bg-white p-5 shadow-panel">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Chiffre d&apos;affaires (14 jours)</h2>
            <SquareParking aria-hidden="true" className="text-muted" size={18} />
          </div>
          <div className="mt-4">
            {summary ? (
              <DailyRevenueChart points={summary.dailyRevenue} currency={summary.currency} />
            ) : (
              <p className="text-sm text-muted">Indicateurs indisponibles (API).</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-white p-5 shadow-panel">
          <h2 className="text-lg font-semibold text-ink">Réservations (30 jours)</h2>
          <p className="mt-1 text-sm text-muted">Répartition par statut.</p>
          <ul className="mt-4 space-y-2">
            {RESERVATION_STATUS_OPTIONS.map((status) => {
              const meta = statusMeta(RESERVATION_STATUS_META, status);
              const count = summary?.reservationsByStatus[status] ?? 0;
              return (
                <li key={status} className="flex items-center justify-between">
                  <StatusPill label={meta.label} tone={meta.tone} />
                  <span className="text-sm font-semibold text-ink">{count}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.8fr_1fr]">
        <div className="rounded-lg border border-border bg-white shadow-panel">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-lg font-semibold text-ink">Parkings configurés</h2>
            <Link className="text-sm font-semibold text-brand" href="/exploitation/configuration">
              Configurer
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead className="bg-surface text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Parking</th>
                  <th className="px-5 py-3 font-medium">Ville</th>
                  <th className="px-5 py-3 font-medium">Places actives</th>
                  <th className="px-5 py-3 font-medium">Réservations</th>
                  <th className="px-5 py-3 font-medium">Publication</th>
                </tr>
              </thead>
              <tbody>
                {parkings.length === 0 ? (
                  <tr>
                    <td className="px-5 py-4 text-muted" colSpan={5}>
                      Aucun parking. <Link className="font-semibold text-brand" href="/exploitation/configuration">Configurer un parking</Link>.
                    </td>
                  </tr>
                ) : (
                  parkings.map((parking) => (
                    <tr key={parking.id} className="border-t border-border">
                      <td className="px-5 py-4 font-medium text-ink">{parking.name}</td>
                      <td className="px-5 py-4 text-muted">{parking.city}</td>
                      <td className="px-5 py-4 text-muted">{parking.activeSpaces}</td>
                      <td className="px-5 py-4 text-muted">{parking.activeReservations}</td>
                      <td className="px-5 py-4">
                        {parking.isPublished ? (
                          <StatusPill label="Publié" tone="brand" />
                        ) : (
                          <StatusPill label="Brouillon" tone="slate" />
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="rounded-lg border border-border bg-white p-5 shadow-panel">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-amber-50 text-accent">
              <AlertTriangle aria-hidden="true" size={20} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-ink">Garde-fous MVP</h2>
              <p className="text-sm text-muted">Mode software-only, tenant résolu côté serveur.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <div className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium text-ink">CA reconnu</p>
              <p className="mt-1 text-sm text-muted">
                Réservations confirmées ou terminées uniquement.
              </p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium text-ink">RGPD plaques</p>
              <p className="mt-1 text-sm text-muted">La plaque reste hors du devis public.</p>
            </div>
          </div>
        </aside>
      </section>

      {firstParking ? (
        <section className="mt-8 rounded-lg border border-border bg-white shadow-panel" aria-label="Réservations">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-lg font-semibold text-ink">Réservations — {firstParking.name}</h2>
            <Link
              className="text-sm font-semibold text-brand"
              href={`/exploitation/reservations?parking=${firstParking.id}`}
            >
              Gérer
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead className="bg-surface text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-5 py-3 font-medium">Offre</th>
                  <th className="px-5 py-3 font-medium">Créneau</th>
                  <th className="px-5 py-3 font-medium">Montant</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {reservations.length === 0 ? (
                  <tr>
                    <td className="px-5 py-4 text-muted" colSpan={5}>
                      Aucune réservation pour le moment.
                    </td>
                  </tr>
                ) : (
                  reservations.map((reservation) => {
                    const meta = statusMeta(RESERVATION_STATUS_META, reservation.status);
                    return (
                      <tr key={reservation.id} className="border-t border-border">
                        <td className="px-5 py-4 text-ink">{reservation.customer.email}</td>
                        <td className="px-5 py-4 text-muted">{reservation.offer.name}</td>
                        <td className="px-5 py-4 text-muted">{formatDateTime(reservation.startsAt)}</td>
                        <td className="px-5 py-4 text-muted">
                          {formatCurrencyFromCents(reservation.amountInCents, reservation.currency)}
                        </td>
                        <td className="px-5 py-4">
                          <StatusPill label={meta.label} tone={meta.tone} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </OperatorShell>
  );
}

function revenueValue(amountInCents: number | undefined, currency: string | undefined): string {
  if (amountInCents === undefined) {
    return EMPTY;
  }
  return formatCurrencyFromCents(amountInCents, currency ?? "EUR");
}

function paidDetail(count: number | undefined): string {
  if (count === undefined) {
    return "Données indisponibles";
  }
  return `${count} réservation(s) payée(s)`;
}

async function getDashboard(): Promise<DashboardSummary | null> {
  try {
    return await fetchTenantDashboard();
  } catch {
    return null;
  }
}

async function getReservations(parkingId: string): Promise<ReservationSummary[]> {
  try {
    return await fetchTenantReservations(parkingId);
  } catch {
    return [];
  }
}

async function getParkings(): Promise<{ parkings: ParkingSummary[]; error: string | null }> {
  try {
    return { parkings: await fetchTenantParkings(), error: null };
  } catch (fetchError) {
    return {
      parkings: [],
      error: fetchError instanceof Error ? fetchError.message : "API Bingo'z indisponible.",
    };
  }
}
