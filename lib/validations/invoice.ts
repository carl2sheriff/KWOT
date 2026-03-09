import { z } from "zod";

export const invoiceSchema = z.object({
  number: z.string().min(1, "Le numéro est requis"),
  projectId: z.string().optional(),
  companyId: z.string().optional(),
  amount: z.coerce.number().min(0, "Le montant doit être positif"),
  currency: z.string().default("EUR"),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).default("draft"),
  dueDate: z.string().min(1, "La date d'échéance est requise"),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;
