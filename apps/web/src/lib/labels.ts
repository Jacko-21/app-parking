// Libellés français et styles de pastilles partagés par la console exploitant.
// Centralisés ici pour éviter la divergence entre les pages.

export type BadgeTone = "neutral" | "brand" | "amber" | "red" | "slate";

const BADGE_CLASS: Record<BadgeTone, string> = {
  neutral: "bg-surface text-ink",
  brand: "bg-teal-50 text-brand",
  amber: "bg-amber-50 text-accent",
  red: "bg-red-50 text-red-700",
  slate: "bg-slate-100 text-slate-600",
};

export function badgeClass(tone: BadgeTone): string {
  return BADGE_CLASS[tone];
}

type StatusMeta = { label: string; tone: BadgeTone };

export const RESERVATION_STATUS_META: Record<string, StatusMeta> = {
  draft: { label: "Brouillon", tone: "slate" },
  pending_payment: { label: "Paiement en attente", tone: "amber" },
  confirmed: { label: "Confirmée", tone: "brand" },
  completed: { label: "Terminée", tone: "neutral" },
  cancelled: { label: "Annulée", tone: "red" },
  expired: { label: "Expirée", tone: "slate" },
};

export const RESERVATION_STATUS_OPTIONS = [
  "pending_payment",
  "confirmed",
  "completed",
  "cancelled",
  "expired",
  "draft",
] as const;

const RESERVATION_CANCELLABLE = new Set(["draft", "pending_payment", "confirmed"]);

export function isReservationCancellable(status: string): boolean {
  return RESERVATION_CANCELLABLE.has(status);
}

export const INCIDENT_STATUS_META: Record<string, StatusMeta> = {
  open: { label: "Ouvert", tone: "red" },
  in_progress: { label: "En cours", tone: "amber" },
  resolved: { label: "Résolu", tone: "brand" },
  closed: { label: "Clôturé", tone: "slate" },
};

export const INCIDENT_STATUS_OPTIONS = ["open", "in_progress", "resolved", "closed"] as const;

export function statusMeta(map: Record<string, StatusMeta>, status: string): StatusMeta {
  return map[status] ?? { label: status, tone: "neutral" };
}

const OFFER_TYPE_LABELS: Record<string, string> = {
  hourly: "Horaire",
  daily: "Journalier",
  nightly: "Nuitée",
  monthly: "Mensuel",
  subscription: "Abonnement",
};

export const OFFER_TYPE_OPTIONS = ["hourly", "daily", "nightly", "monthly", "subscription"] as const;

export function offerTypeLabel(type: string): string {
  return OFFER_TYPE_LABELS[type] ?? type;
}

const SPACE_TYPE_LABELS: Record<string, string> = {
  hourly: "Horaire",
  subscriber: "Abonné",
  pmr: "PMR",
  ev: "Recharge",
  mixed: "Mixte",
};

export const SPACE_TYPE_OPTIONS = ["mixed", "hourly", "subscriber", "pmr", "ev"] as const;

export function spaceTypeLabel(type: string): string {
  return SPACE_TYPE_LABELS[type] ?? type;
}

const PRICE_UNIT_LABELS: Record<string, string> = {
  hour: "par heure",
  day: "par jour",
  month: "par mois",
  flat: "forfait",
};

export const PRICE_UNIT_OPTIONS = ["hour", "day", "month", "flat"] as const;

export function priceUnitLabel(unit: string): string {
  return PRICE_UNIT_LABELS[unit] ?? unit;
}

export function formatCurrencyFromCents(amountInCents: number, currency: string): string {
  return (amountInCents / 100).toLocaleString("fr-FR", { style: "currency", currency });
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("fr-FR", { dateStyle: "medium" });
}
