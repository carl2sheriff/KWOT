import { z } from "zod";

export const companySchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  domain: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
});

export type CompanyFormData = z.infer<typeof companySchema>;
