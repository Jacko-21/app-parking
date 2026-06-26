import { z } from "zod";
import { MAX_VEHICLE_RETENTION_DAYS, MIN_VEHICLE_RETENTION_DAYS } from "@bingoz/domain";

export const updateRetentionSchema = z.object({
  vehicleRetentionDays: z
    .number()
    .int()
    .min(MIN_VEHICLE_RETENTION_DAYS)
    .max(MAX_VEHICLE_RETENTION_DAYS),
});

export type UpdateRetentionDto = z.infer<typeof updateRetentionSchema>;
