import { z } from "zod";

export const dealSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  value: z.coerce.number().min(0, "La valeur doit être positive"),
  currency: z.string().default("EUR"),
  stage: z.enum(["lead", "qualified", "proposal", "negotiation", "won", "lost"]).default("lead"),
  probability: z.coerce.number().min(0).max(100).default(10),
  contactId: z.string().optional(),
  companyId: z.string().optional(),
  ownerId: z.string().default("1"),
  expectedCloseDate: z.string().optional(),
  notes: z.string().optional(),
});

export type DealFormData = z.infer<typeof dealSchema>;
