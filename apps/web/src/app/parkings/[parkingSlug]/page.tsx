import { CalendarDays, Car, CreditCard, MapPin, ParkingCircle } from "lucide-react";
import Link from "next/link";

import { ReservationQuoteForm } from "../../../components/reservation-quote-form";
import { fetchPublicParking, getPublicApiBaseUrl, type PublicParking } from "../../../lib/api";

export const dynamic = "force-dynamic";

type ReservationPageProps = {
  params: Promise<{
    parkingSlug: string;
  }>;
};

export default async function ReservationPage({ params }: ReservationPageProps) {
  const { parkingSlug } = await params;
  const { parking, error } = await getParking(parkingSlug);

  if (!parking) {
    return (
      <main className="min-h-screen bg-white">
        <header className="border-b border-border bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-sm font-semibold text-brand">
              Tableau de bord
            </Link>
            <span className="text-sm text-muted">/{parkingSlug}</span>
          </div>
        </header>
        <section className="mx-auto max-w-5xl px-6 py-10">
          <h1 className="text-2xl font-semibold text-ink">Parking indisponible</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted">{error ?? "Ce parking public n'est pas disponible."}</p>
        </section>
      </main>
    );
  }

  const firstOffer = parking.offers[0];
  const firstPriceRule = firstOffer?.priceRules[0];

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-brand">
            <ParkingCircle aria-hidden="true" size={18} />
            Tableau de bord
          </Link>
          <span className="text-sm text-muted">/{parking.slug}</span>
        </div>
      </header>

      <section className="mx-auto grid max-w-5xl gap-8 px-6 py-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="flex items-center gap-3 text-sm font-medium text-muted">
            <MapPin aria-hidden="true" size={18} />
            {parking.address}, {parking.postalCode} {parking.city}
          </div>
          <h1 className="mt-3 text-3xl font-semibold text-ink">{parking.name}</h1>
          <p className="mt-3 max-w-2xl text-base text-muted">
            Réservation directe avec devis instantané et accès QR ou validation manuelle selon exploitation.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border p-4">
              <CalendarDays aria-hidden="true" className="text-brand" size={22} />
              <p className="mt-3 text-sm font-medium text-ink">{parking.offers.length} offre(s)</p>
              <p className="text-sm text-muted">Tarification statique MVP</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <Car aria-hidden="true" className="text-brand" size={22} />
              <p className="mt-3 text-sm font-medium text-ink">{parking.activeSpaceCount} places</p>
              <p className="text-sm text-muted">{parking.pmrSpaceCount} place(s) PMR active(s)</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <CreditCard aria-hidden="true" className="text-brand" size={22} />
              <p className="mt-3 text-sm font-medium text-ink">
                {firstPriceRule
                  ? (firstPriceRule.amountInCents / 100).toLocaleString("fr-FR", {
                      style: "currency",
                      currency: firstPriceRule.currency,
                    })
                  : "N/A"}
              </p>
              <p className="text-sm text-muted">{firstOffer ? firstOffer.name : "Aucune offre active"}</p>
            </div>
          </div>
        </div>

        <ReservationQuoteForm
          apiBaseUrl={getPublicApiBaseUrl()}
          parkingSlug={parking.slug}
          offers={parking.offers}
        />
      </section>
    </main>
  );
}

async function getParking(slug: string): Promise<{ parking: PublicParking | null; error: string | null }> {
  try {
    return {
      parking: await fetchPublicParking(slug),
      error: null,
    };
  } catch (fetchError) {
    return {
      parking: null,
      error: fetchError instanceof Error ? fetchError.message : "API Bingo'z indisponible.",
    };
  }
}
