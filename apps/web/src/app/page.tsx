import { AlertTriangle, CalendarDays, Gauge, ParkingCircle, Plus, SquareParking, Users } from "lucide-react";
import Link from "next/link";

import { StatCard } from "../components/stat-card";
import { fetchTenantParkings, type ParkingSummary } from "../lib/api";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { parkings, error } = await getParkings();
  const activeSpaces = parkings.reduce((total, parking) => total + parking.activeSpaces, 0);
  const activeReservations = parkings.reduce((total, parking) => total + parking.activeReservations, 0);
  const occupancyRate = activeSpaces === 0 ? 0 : activeReservations / activeSpaces;
  const publishedParkings = parkings.filter((parking) => parking.isPublished).length;
  const firstParking = parkings[0];

  return (
    <main className="min-h-screen">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-ink text-white">
              <ParkingCircle aria-hidden="true" size={22} />
            </span>
            <span>
              <span className="block text-base font-semibold text-ink">Bingo'z Parking</span>
              <span className="block text-sm text-muted">
                {firstParking ? firstParking.name : "Tenant de développement"}
              </span>
            </span>
          </Link>
          <nav className="hidden items-center gap-2 md:flex" aria-label="Navigation principale">
            <Link className="rounded-lg px-3 py-2 text-sm font-medium text-ink" href="/">
              Tableau de bord
            </Link>
            <Link
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted"
              href={firstParking ? `/parkings/${firstParking.slug}` : "/"}
            >
              Réservation
            </Link>
          </nav>
          <Link
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white"
            href={firstParking ? `/parkings/${firstParking.slug}` : "/"}
          >
            <Plus aria-hidden="true" size={18} />
            Réservation
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {error ? (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Indicateurs">
          <StatCard
            icon={Gauge}
            label="Occupation"
            value={`${Math.round(occupancyRate * 100)} %`}
            detail={`${activeReservations} réservation(s) active(s) pour ${activeSpaces} place(s) actives`}
          />
          <StatCard
            icon={SquareParking}
            label="Parkings"
            value={String(parkings.length)}
            detail={`${publishedParkings} parking(s) publié(s) côté automobiliste`}
          />
          <StatCard
            icon={CalendarDays}
            label="Réservations"
            value={String(activeReservations)}
            detail="Créneaux bloquants remontés par l'API"
          />
          <StatCard
            icon={Users}
            label="Capacité"
            value={String(activeSpaces)}
            detail="Places actives configurées dans Prisma"
          />
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.8fr_1fr]">
          <div className="rounded-lg border border-border bg-white shadow-panel">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h1 className="text-lg font-semibold text-ink">Parkings configurés</h1>
              {firstParking ? (
                <Link className="text-sm font-semibold text-brand" href={`/parkings/${firstParking.slug}`}>
                  Ouvrir la page publique
                </Link>
              ) : null}
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
                  {parkings.map((parking) => (
                    <tr key={parking.id} className="border-t border-border">
                      <td className="px-5 py-4 font-medium text-ink">{parking.name}</td>
                      <td className="px-5 py-4 text-muted">{parking.city}</td>
                      <td className="px-5 py-4 text-muted">{parking.activeSpaces}</td>
                      <td className="px-5 py-4 text-muted">{parking.activeReservations}</td>
                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-semibold text-brand">
                          {parking.isPublished ? "Publié" : "Brouillon"}
                        </span>
                      </td>
                    </tr>
                  ))}
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
                <p className="text-sm font-medium text-ink">Tenant dev</p>
                <p className="mt-1 text-sm text-muted">Les appels exploitant utilisent l'en-tête x-tenant-id.</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium text-ink">RGPD plaques</p>
                <p className="mt-1 text-sm text-muted">La plaque reste hors du devis public.</p>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

async function getParkings(): Promise<{ parkings: ParkingSummary[]; error: string | null }> {
  try {
    return {
      parkings: await fetchTenantParkings(),
      error: null,
    };
  } catch (fetchError) {
    return {
      parkings: [],
      error: fetchError instanceof Error ? fetchError.message : "API Bingo'z indisponible.",
    };
  }
}
