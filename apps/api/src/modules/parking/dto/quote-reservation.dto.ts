import { z } from "zod";

export const quoteReservationSchema = z.object({
  offerId: z.string().min(1),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});

export type QuoteReservationDto = z.infer<typeof quoteReservationSchema>;
