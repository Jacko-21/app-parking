const API_BASE_URL =
  process.env["API_BASE_URL"] ?? process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";
const DEV_TENANT_ID = process.env["DEV_TENANT_ID"] ?? "tenant_demo";

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

export async function fetchTenantParkings(): Promise<ParkingSummary[]> {
  return fetchJson<ParkingSummary[]>("/parkings", {
    headers: {
      "x-tenant-id": DEV_TENANT_ID,
    },
  });
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
