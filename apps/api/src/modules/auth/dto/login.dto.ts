import { z } from "zod";

export const loginSchema = z.object({
  tenantSlug: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export type LoginDto = z.infer<typeof loginSchema>;
