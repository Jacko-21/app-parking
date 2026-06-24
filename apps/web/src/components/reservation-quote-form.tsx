"use client";

import { ArrowRight, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { z } from "zod";

import { type PublicParkingOffer } from "../lib/api";

const quoteFormSchema = z.object({
  offerId: z.string().min(1),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
});

type ReservationQuoteFormProps = {
  apiBaseUrl: string;
  parkingSlug: string;
  offers: PublicParkingOffer[];
};

type QuoteResult = {
  amountInCents: number;
  currency: "EUR";
  billableUnits: number;
  available: boolean;
  remainingSpaces: number;
};

export function ReservationQuoteForm({ apiBaseUrl, parkingSlug, offers }: ReservationQuoteFormProps) {
  const firstOffer = offers[0];
  const [offerId, setOfferId] = useState(firstOffer?.id ?? "");
  const [startsAt, setStartsAt] = useState("2026-05-10T14:00");
  const [endsAt, setEndsAt] = useState("2026-05-10T17:00");
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedOffer = useMemo(() => {
    return offers.find((offer) => offer.id === offerId) ?? null;
  }, [offerId, offers]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setQuote(null);

    const parsed = quoteFormSchema.safeParse({
      offerId,
      startsAt,
      endsAt,
    });

    if (!parsed.success) {
      setError("Renseigne une offre et un créneau complet.");
      return;
    }

    const startsAtDate = new Date(parsed.data.startsAt);
    const endsAtDate = new Date(parsed.data.endsAt);

    if (Number.isNaN(startsAtDate.getTime()) || Number.isNaN(endsAtDate.getTime()) || endsAtDate <= startsAtDate) {
      setError("La fin du créneau doit être après le début.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/public/parkings/${parkingSlug}/quote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          offerId: parsed.data.offerId,
          startsAt: startsAtDate.toISOString(),
          endsAt: endsAtDate.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Le devis n'a pas pu être calculé.");
      }

      setQuote((await response.json()) as QuoteResult);
    } catch (quoteError) {
      setError(quoteError instanceof Error ? quoteError.message : "Le devis n'a pas pu être calculé.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="rounded-lg border border-border bg-surface p-5"
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
    >
      <h2 className="text-lg font-semibold text-ink">Réserver un créneau</h2>

      <label className="mt-5 block text-sm font-medium text-ink" htmlFor="offer">
        Offre
      </label>
      <select
        id="offer"
        className="mt-2 h-11 w-full rounded-lg border border-border bg-white px-3 text-sm"
        value={offerId}
        onChange={(event) => {
          setOfferId(event.target.value);
          setQuote(null);
        }}
      >
        {offers.map((offer) => (
          <option key={offer.id} value={offer.id}>
            {offer.name}
          </option>
        ))}
      </select>

      <label className="mt-5 block text-sm font-medium text-ink" htmlFor="arrival">
        Arrivée
      </label>
      <input
        id="arrival"
        className="mt-2 h-11 w-full rounded-lg border border-border bg-white px-3 text-sm"
        type="datetime-local"
        value={startsAt}
        onChange={(event) => {
          setStartsAt(event.target.value);
          setQuote(null);
        }}
      />

      <label className="mt-4 block text-sm font-medium text-ink" htmlFor="departure">
        Départ
      </label>
      <input
        id="departure"
        className="mt-2 h-11 w-full rounded-lg border border-border bg-white px-3 text-sm"
        type="datetime-local"
        value={endsAt}
        onChange={(event) => {
          setEndsAt(event.target.value);
          setQuote(null);
        }}
      />

      {selectedOffer?.priceRules[0] ? (
        <p className="mt-4 text-sm text-muted">
          Tarif de base : {(selectedOffer.priceRules[0].amountInCents / 100).toLocaleString("fr-FR", {
            style: "currency",
            currency: selectedOffer.priceRules[0].currency,
          })}{" "}
          / {selectedOffer.priceRules[0].unit}
        </p>
      ) : null}

      <button
        className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting || offers.length === 0}
        type="submit"
      >
        {isSubmitting ? <Loader2 aria-hidden="true" className="animate-spin" size={18} /> : <ArrowRight aria-hidden="true" size={18} />}
        Calculer le devis
      </button>

      {quote ? (
        <div className="mt-5 rounded-lg border border-border bg-white p-4">
          <div className="flex items-center gap-2">
            {quote.available ? (
              <CheckCircle2 aria-hidden="true" className="text-brand" size={18} />
            ) : (
              <XCircle aria-hidden="true" className="text-red-600" size={18} />
            )}
            <p className="text-sm font-semibold text-ink">
              {(quote.amountInCents / 100).toLocaleString("fr-FR", {
                style: "currency",
                currency: quote.currency,
              })}
            </p>
          </div>
          <p className="mt-2 text-sm text-muted">
            {quote.available
              ? `${quote.remainingSpaces} place(s) encore disponible(s) sur ce créneau.`
              : "Aucune place disponible sur ce créneau."}
          </p>
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm font-medium text-red-600">{error}</p> : null}
    </form>
  );
}
