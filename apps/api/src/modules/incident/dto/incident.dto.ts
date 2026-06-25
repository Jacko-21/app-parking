import { z } from "zod";

export const incidentStatusSchema = z.enum(["open", "in_progress", "resolved", "closed"]);

export const createIncidentSchema = z.object({
  parkingId: z.string().min(1),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(1).max(500).optional(),
});

export const updateIncidentSchema = z
  .object({
    title: z.string().trim().min(2).max(120),
    description: z.string().trim().min(1).max(500),
    status: incidentStatusSchema,
  })
  .partial();

export const listIncidentsSchema = z.object({
  parkingId: z.string().min(1),
  status: incidentStatusSchema.optional(),
});

export type CreateIncidentDto = z.infer<typeof createIncidentSchema>;
export type UpdateIncidentDto = z.infer<typeof updateIncidentSchema>;
export type ListIncidentsDto = z.infer<typeof listIncidentsSchema>;
