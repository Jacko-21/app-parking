import { z } from "zod";

export const createPublicReservationSchema = z.object({
  offerId: z.string().min(1),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  customer: z.object({
    email: z.string().trim().email(),
    firstName: z.string().trim().min(1).max(80).optional(),
    lastName: z.string().trim().min(1).max(80).optional(),
  }),
  vehicle: z
    .object({
      plateNumber: z.string().trim().min(2).max(20),
      countryCode: z.string().trim().length(2).default("FR"),
      label: z.string().trim().min(1).max(80).optional(),
    })
    .optional(),
});

export type CreatePublicReservationDto = z.infer<typeof createPublicReservationSchema>;
