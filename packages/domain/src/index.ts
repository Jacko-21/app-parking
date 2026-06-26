export { asTenantId } from "./tenant";
export type { TenantId, TenantContext, UserRole } from "./tenant";

export { quoteStaticPrice } from "./pricing";
export type {
  PriceUnit,
  StaticPriceRule,
  QuoteStaticPriceInput,
  StaticPriceQuote,
} from "./pricing";

export { computeFiscalArchiveUntil, FISCAL_RETENTION_YEARS } from "./billing";

export {
  clampRetentionDays,
  computeVehicleRetentionUntil,
  DEFAULT_VEHICLE_RETENTION_DAYS,
  MIN_VEHICLE_RETENTION_DAYS,
  MAX_VEHICLE_RETENTION_DAYS,
} from "./rgpd";

export { getCapacityAvailability } from "./availability";
export type {
  ExistingReservation,
  ReservationStatusLike,
  TimeWindow,
  CapacityAvailability,
} from "./availability";
