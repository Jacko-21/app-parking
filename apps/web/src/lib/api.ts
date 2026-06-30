import { cookies } from "next/headers";

const API_BASE_URL =
  process.env["API_BASE_URL"] ?? process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";
const DEV_TENANT_ID = process.env["DEV_TENANT_ID"] ?? "tenant_demo";
export const AUTH_COOKIE = "bingoz_token";

export type ParkingSummary = {
  id: string;
  slug: string;
  name: string;
  city: string;
  isPublished: boolean;
  occupancyRate: number;
  activeReservations: number;
  activeSpaces: number;
};

export type PublicParking = {
  id: string;
  slug: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  countryCode: string;
  timezone: string;
  offers: PublicParkingOffer[];
  activeSpaceCount: number;
  pmrSpaceCount: number;
};

export type PublicParkingOffer = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  priceRules: PublicParkingPriceRule[];
};

export type PublicParkingPriceRule = {
  id: string;
  label: string;
  unit: string;
  amountInCents: number;
  currency: string;
};

export type ReservationSummary = {
  id: string;
  status: string;
  startsAt: string;
  endsAt: string;
  amountInCents: number;
  currency: string;
  customer: { id: string; email: string; firstName: string | null; lastName: string | null };
  offer: { id: string; name: string; type: string };
};

export type OperatorOffer = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  isActive: boolean;
  priceRules: PublicParkingPriceRule[];
};

export type ParkingDetail = {
  id: string;
  slug: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  countryCode: string;
  timezone: string;
  isPublished: boolean;
  zones: { id: string; name: string }[];
  spaces: { id: string; label: string; type: string; isActive: boolean; zoneId: string | null }[];
  offers: OperatorOffer[];
};

export type SubscriptionSummary = {
  id: string;
  startsAt: string;
  endsAt: string | null;
  isActive: boolean;
  customer: { id: string; email: string; firstName: string | null; lastName: string | null };
};

export type IncidentSummary = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: string;
};

export type DashboardDailyPoint = {
  date: string;
  revenueInCents: number;
  reservationCount: number;
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

export type MutationResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function operatorHeaders(): Promise<Record<string, string>> {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  // Repli développement tant que la session n'est pas établie.
  return { "x-tenant-id": DEV_TENANT_ID };
}

export async function fetchTenantParkings(): Promise<ParkingSummary[]> {
  return fetchJson<ParkingSummary[]>("/parkings", { headers: await operatorHeaders() });
}

export async function fetchTenantReservations(parkingId: string): Promise<ReservationSummary[]> {
  const query = new URLSearchParams({ parkingId }).toString();
  return fetchJson<ReservationSummary[]>(`/reservations?${query}`, { headers: await operatorHeaders() });
}

export async function fetchParkingDetail(parkingId: string): Promise<ParkingDetail> {
  return fetchJson<ParkingDetail>(`/config/parkings/${parkingId}`, { headers: await operatorHeaders() });
}

export async function fetchTenantDashboard(): Promise<DashboardSummary> {
  return fetchJson<DashboardSummary>("/dashboard", { headers: await operatorHeaders() });
}

export async function fetchOperatorReservations(params: {
  parkingId: string;
  status?: string;
}): Promise<ReservationSummary[]> {
  const query = new URLSearchParams({ parkingId: params.parkingId });
  if (params.status) {
    query.set("status", params.status);
  }
  return fetchJson<ReservationSummary[]>(`/reservations?${query.toString()}`, {
    headers: await operatorHeaders(),
  });
}

export async function fetchSubscriptions(parkingId: string): Promise<SubscriptionSummary[]> {
  const query = new URLSearchParams({ parkingId }).toString();
  return fetchJson<SubscriptionSummary[]>(`/subscriptions?${query}`, {
    headers: await operatorHeaders(),
  });
}

export async function fetchIncidents(params: {
  parkingId: string;
  status?: string;
}): Promise<IncidentSummary[]> {
  const query = new URLSearchParams({ parkingId: params.parkingId });
  if (params.status) {
    query.set("status", params.status);
  }
  return fetchJson<IncidentSummary[]>(`/incidents?${query.toString()}`, {
    headers: await operatorHeaders(),
  });
}

/**
 * Exécute une mutation exploitant côté serveur : réutilise l'en-tête d'auth
 * (jeton Bearer ou repli `x-tenant-id`) et remonte le message d'erreur lisible
 * renvoyé par l'API plutôt qu'un statut HTTP brut.
 */
export async function operatorMutate<T = unknown>(
  path: string,
  init: { method: string; body?: unknown },
): Promise<MutationResult<T>> {
  try {
    const headers: Record<string, string> = { ...(await operatorHeaders()) };
    const requestInit: RequestInit = { method: init.method, headers, cache: "no-store" };
    if (init.body !== undefined) {
      headers["Content-Type"] = "application/json";
      requestInit.body = JSON.stringify(init.body);
    }

    const response = await fetch(`${API_BASE_URL}${path}`, requestInit);

    if (!response.ok) {
      return { ok: false, error: await extractApiError(response) };
    }

    const data = response.status === 204 ? (undefined as T) : ((await response.json()) as T);
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "API Bingo'z indisponible.",
    };
  }
}

async function extractApiError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: unknown };
    const message = body.message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
    if (Array.isArray(message) && message.length > 0) {
      return message.map((item) => String(item)).join(", ");
    }
    if (message && typeof message === "object") {
      const fieldErrors = (message as { fieldErrors?: Record<string, string[]> }).fieldErrors;
      const flattened = fieldErrors
        ? Object.values(fieldErrors)
            .flat()
            .filter((item): item is string => typeof item === "string")
        : [];
      if (flattened.length > 0) {
        return flattened.join(", ");
      }
    }
  } catch {
    // Corps non JSON : on retombe sur le statut.
  }

  if (response.status === 401 || response.status === 403) {
    return "Action non autorisée : reconnecte-toi à l'espace exploitant.";
  }
  return `Action refusée par l'API (${response.status}).`;
}

export async function fetchPublicParking(slug: string): Promise<PublicParking> {
  return fetchJson<PublicParking>(`/public/parkings/${slug}`);
}

export function getPublicApiBaseUrl(): string {
  return process.env["NEXT_PUBLIC_API_URL"] ?? API_BASE_URL;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API Bingo'z indisponible (${response.status}) pour ${path}.`);
  }

  return (await response.json()) as T;
}
