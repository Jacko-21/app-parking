import { z } from "zod";

export const createSubscriptionSchema = z.object({
  parkingId: z.string().min(1),
  customer: z.object({
    email: z.string().trim().email(),
    firstName: z.string().trim().min(1).max(80).optional(),
    lastName: z.string().trim().min(1).max(80).optional(),
  }),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
});

export const updateSubscriptionSchema = z
  .object({
    endsAt: z.string().datetime(),
    isActive: z.boolean(),
  })
  .partial();

export const listSubscriptionsSchema = z.object({ parkingId: z.string().min(1) });

export type CreateSubscriptionDto = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionDto = z.infer<typeof updateSubscriptionSchema>;
export type ListSubscriptionsDto = z.infer<typeof listSubscriptionsSchema>;
