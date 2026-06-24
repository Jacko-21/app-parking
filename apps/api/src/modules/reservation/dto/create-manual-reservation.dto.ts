import { z } from "zod";

export const createManualReservationSchema = z.object({
  parkingId: z.string().min(1),
  offerId: z.string().min(1),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  customer: z.object({
    email: z.string().email(),
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

export type CreateManualReservationDto = z.infer<typeof createManualReservationSchema>;
