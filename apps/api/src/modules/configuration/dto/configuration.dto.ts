import { z } from "zod";

const slug = z
  .string()
  .trim()
  .min(2)
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug attendu en minuscules avec des tirets.");

export const spaceTypeSchema = z.enum(["hourly", "subscriber", "pmr", "ev", "mixed"]);
export const offerTypeSchema = z.enum(["hourly", "daily", "nightly", "monthly", "subscription"]);
export const priceUnitSchema = z.enum(["hour", "day", "month", "flat"]);

export const createParkingSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug,
  address: z.string().trim().min(2).max(160),
  city: z.string().trim().min(1).max(80),
  postalCode: z.string().trim().min(2).max(12),
  countryCode: z.string().trim().length(2).default("FR"),
  timezone: z.string().trim().min(3).max(60).default("Europe/Paris"),
});

export const updateParkingSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    address: z.string().trim().min(2).max(160),
    city: z.string().trim().min(1).max(80),
    postalCode: z.string().trim().min(2).max(12),
    countryCode: z.string().trim().length(2),
    timezone: z.string().trim().min(3).max(60),
  })
  .partial();

export const publishParkingSchema = z.object({ isPublished: z.boolean() });

export const createZoneSchema = z.object({ name: z.string().trim().min(1).max(80) });

export const createSpaceSchema = z.object({
  label: z.string().trim().min(1).max(40),
  type: spaceTypeSchema.default("mixed"),
  zoneId: z.string().min(1).optional(),
});

export const updateSpaceSchema = z
  .object({
    label: z.string().trim().min(1).max(40),
    type: spaceTypeSchema,
    isActive: z.boolean(),
  })
  .partial();

export const createOfferSchema = z.object({
  name: z.string().trim().min(2).max(80),
  type: offerTypeSchema,
  description: z.string().trim().min(1).max(280).optional(),
});

export const createPriceRuleSchema = z.object({
  label: z.string().trim().min(1).max(60),
  unit: priceUnitSchema,
  amountInCents: z.number().int().nonnegative().max(10_000_00),
  currency: z.string().trim().length(3).default("EUR"),
});

export type CreateParkingDto = z.infer<typeof createParkingSchema>;
export type UpdateParkingDto = z.infer<typeof updateParkingSchema>;
export type PublishParkingDto = z.infer<typeof publishParkingSchema>;
export type CreateZoneDto = z.infer<typeof createZoneSchema>;
export type CreateSpaceDto = z.infer<typeof createSpaceSchema>;
export type UpdateSpaceDto = z.infer<typeof updateSpaceSchema>;
export type CreateOfferDto = z.infer<typeof createOfferSchema>;
export type CreatePriceRuleDto = z.infer<typeof createPriceRuleSchema>;
