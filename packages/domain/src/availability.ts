/**
 * Disponibilité de capacité d'un parking sur un créneau.
 *
 * Modèle MVP : capacité = nombre de places actives. Une place est considérée
 * occupée si une réservation « bloquante » (en attente de paiement, confirmée
 * ou terminée) chevauche le créneau demandé. Les réservations annulées ou
 * expirées ne bloquent pas.
 */

export type ReservationStatusLike =
  | "draft"
  | "pending_payment"
  | "confirmed"
  | "cancelled"
  | "expired"
  | "completed";

export type ExistingReservation = {
  id: string;
  status: ReservationStatusLike;
  startsAt: Date;
  endsAt: Date;
};

export type TimeWindow = {
  startsAt: Date;
  endsAt: Date;
};

export type CapacityAvailability = {
  available: boolean;
  remaining: number;
};

const BLOCKING_STATUSES: ReadonlyArray<ReservationStatusLike> = [
  "pending_payment",
  "confirmed",
  "completed",
];

function overlaps(reservation: ExistingReservation, window: TimeWindow): boolean {
  return reservation.startsAt < window.endsAt && reservation.endsAt > window.startsAt;
}

/**
 * Retourne la disponibilité restante sur le créneau `window`, compte tenu des
 * réservations existantes et de la capacité totale.
 */
export function getCapacityAvailability(
  window: TimeWindow,
  existingReservations: ExistingReservation[],
  capacity: number,
): CapacityAvailability {
  const occupied = existingReservations.filter(
    (reservation) =>
      BLOCKING_STATUSES.includes(reservation.status) && overlaps(reservation, window),
  ).length;

  const remaining = Math.max(0, capacity - occupied);

  return {
    available: remaining > 0,
    remaining,
  };
}
