import { z } from "zod";

export const reservationStatusSchema = z.enum([
  "draft",
  "pending_payment",
  "confirmed",
  "cancelled",
  "expired",
  "completed",
]);

export const listReservationsSchema = z.object({
  parkingId: z.string().min(1),
  status: reservationStatusSchema.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const cancelReservationSchema = z.object({
  reason: z.string().trim().min(1).max(280).optional(),
});

export type ListReservationsDto = z.infer<typeof listReservationsSchema>;
export type CancelReservationDto = z.infer<typeof cancelReservationSchema>;
