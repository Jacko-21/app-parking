"use client";

import { ArrowRight, CheckCircle2, KeyRound, Loader2, XCircle } from "lucide-react";
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

type Confirmation = {
  accessCode: string;
  invoiceNumber: string;
  expiresAt: string;
};

export function ReservationQuoteForm({ apiBaseUrl, parkingSlug, offers }: ReservationQuoteFormProps) {
  const firstOffer = offers[0];
  const [offerId, setOfferId] = useState(firstOffer?.id ?? "");
  const [startsAt, setStartsAt] = useState("2026-05-10T14:00");
  const [endsAt, setEndsAt] = useState("2026-05-10T17:00");
  const [email, setEmail] = useState("");
  const [plate, setPlate] = useState("");
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  const selectedOffer = useMemo(() => {
    return offers.find((offer) => offer.id === offerId) ?? null;
  }, [offerId, offers]);

  function resetFlow(): void {
    setQuote(null);
    setConfirmation(null);
    setError(null);
  }

  function toIsoRange(): { startsAt: string; endsAt: string } | null {
    const startsAtDate = new Date(startsAt);
    const endsAtDate = new Date(endsAt);
    if (
      Number.isNaN(startsAtDate.getTime()) ||
      Number.isNaN(endsAtDate.getTime()) ||
      endsAtDate <= startsAtDate
    ) {
      return null;
    }
    return { startsAt: startsAtDate.toISOString(), endsAt: endsAtDate.toISOString() };
  }

  async function handleQuote(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    resetFlow();

    const parsed = quoteFormSchema.safeParse({ offerId, startsAt, endsAt });
    if (!parsed.success) {
      setError("Renseigne une offre et un créneau complet.");
      return;
    }
    const range = toIsoRange();
    if (!range) {
      setError("La fin du créneau doit être après le début.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${apiBaseUrl}/public/parkings/${parkingSlug}/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId: parsed.data.offerId, ...range }),
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

  async function handleBooking(): Promise<void> {
    setError(null);

    if (!z.string().email().safeParse(email).success) {
      setError("Renseigne un email valide pour réserver.");
      return;
    }
    const range = toIsoRange();
    if (!range) {
      setError("Le créneau est invalide.");
      return;
    }
    const trimmedPlate = plate.trim();

    setIsBooking(true);
    try {
      const reservationResponse = await fetch(
        `${apiBaseUrl}/public/parkings/${parkingSlug}/reservations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            offerId,
            ...range,
            customer: { email },
            vehicle: trimmedPlate.length >= 2 ? { plateNumber: trimmedPlate } : undefined,
          }),
        },
      );
      if (!reservationResponse.ok) {
        throw new Error("La réservation a échoué (plus de place ?).");
      }
      const reservation = (await reservationResponse.json()) as { paymentId: string };

      const paymentResponse = await fetch(
        `${apiBaseUrl}/public/payments/${reservation.paymentId}/confirm`,
        { method: "POST" },
      );
      if (!paymentResponse.ok) {
        throw new Error("Le paiement n'a pas pu être confirmé.");
      }
      setConfirmation((await paymentResponse.json()) as Confirmation);
    } catch (bookingError) {
      setError(bookingError instanceof Error ? bookingError.message : "La réservation a échoué.");
    } finally {
      setIsBooking(false);
    }
  }

  if (confirmation) {
    return (
      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="flex items-center gap-2">
          <CheckCircle2 aria-hidden="true" className="text-brand" size={20} />
          <h2 className="text-lg font-semibold text-ink">Réservation confirmée</h2>
        </div>
        <p className="mt-2 text-sm text-muted">Présente ce code d'accès à l'entrée du parking.</p>

        <div className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-white p-4">
          <KeyRound aria-hidden="true" className="text-brand" size={22} />
          <span className="font-mono text-xl font-semibold tracking-widest text-ink">
            {confirmation.accessCode}
          </span>
        </div>

        <dl className="mt-4 space-y-1 text-sm text-muted">
          <div className="flex justify-between">
            <dt>Facture</dt>
            <dd className="font-medium text-ink">{confirmation.invoiceNumber}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Valable jusqu'au</dt>
            <dd className="font-medium text-ink">
              {new Date(confirmation.expiresAt).toLocaleString("fr-FR")}
            </dd>
          </div>
        </dl>

        <button
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg border border-border bg-white text-sm font-semibold text-ink"
          onClick={resetFlow}
          type="button"
        >
          Nouvelle réservation
        </button>
      </div>
    );
  }

  return (
    <form
      className="rounded-lg border border-border bg-surface p-5"
      onSubmit={(event) => {
        void handleQuote(event);
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
          resetFlow();
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
          resetFlow();
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
          resetFlow();
        }}
      />

      {selectedOffer?.priceRules[0] ? (
        <p className="mt-4 text-sm text-muted">
          Tarif de base :{" "}
          {(selectedOffer.priceRules[0].amountInCents / 100).toLocaleString("fr-FR", {
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
        {isSubmitting ? (
          <Loader2 aria-hidden="true" className="animate-spin" size={18} />
        ) : (
          <ArrowRight aria-hidden="true" size={18} />
        )}
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

          {quote.available ? (
            <div className="mt-4 border-t border-border pt-4">
              <label className="block text-sm font-medium text-ink" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                className="mt-2 h-11 w-full rounded-lg border border-border bg-white px-3 text-sm"
                type="email"
                placeholder="vous@exemple.fr"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                }}
              />

              <label className="mt-4 block text-sm font-medium text-ink" htmlFor="plate">
                Plaque (optionnel)
              </label>
              <input
                id="plate"
                className="mt-2 h-11 w-full rounded-lg border border-border bg-white px-3 text-sm uppercase"
                type="text"
                placeholder="AB-123-CD"
                value={plate}
                onChange={(event) => {
                  setPlate(event.target.value);
                }}
              />

              <button
                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isBooking}
                onClick={() => {
                  void handleBooking();
                }}
                type="button"
              >
                {isBooking ? (
                  <Loader2 aria-hidden="true" className="animate-spin" size={18} />
                ) : (
                  <KeyRound aria-hidden="true" size={18} />
                )}
                Réserver et payer (démo)
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm font-medium text-red-600">{error}</p> : null}
    </form>
  );
}
