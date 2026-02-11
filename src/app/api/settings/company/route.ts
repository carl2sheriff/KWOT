import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { updateCompanySettingsSchema } from '@/lib/schemas'
import { withApiMiddleware, apiSuccess, apiError } from '@/lib/api-middleware'

// ============================================
// GET /api/settings/company - Get company settings
// ============================================
export const GET = withApiMiddleware(async () => {
  let settings = await prisma.companySettings.findFirst()

  // Create default settings if none exist
  if (!settings) {
    settings = await prisma.companySettings.create({
      data: {
        companyName: 'Sheriff Projects',
        defaultTaxRate: 20,
        defaultPaymentTerms: 30,
        quotePrefix: 'DEV',
        invoicePrefix: 'FAC',
        poPrefix: 'PO',
        paymentPrefix: 'PAY',
        currency: 'EUR',
        locale: 'fr-FR',
      },
    })
  }

  return apiSuccess(settings)
})

// ============================================
// PUT /api/settings/company - Update company settings
// ============================================
export const PUT = withApiMiddleware(async (req: NextRequest) => {
  const body = await req.json()
  const validation = updateCompanySettingsSchema.safeParse(body)

  if (!validation.success) {
    return apiError('Donnees invalides', 400, validation.error.flatten().fieldErrors)
  }

  const data = validation.data

  // Get existing settings or create default
  let existing = await prisma.companySettings.findFirst()

  if (!existing) {
    existing = await prisma.companySettings.create({
      data: {
        companyName: 'Sheriff Projects',
      },
    })
  }

  const updated = await prisma.companySettings.update({
    where: { id: existing.id },
    data: {
      ...(data.companyName !== undefined && { companyName: data.companyName }),
      ...(data.siret !== undefined && { siret: data.siret || null }),
      ...(data.address !== undefined && { address: data.address || null }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.email !== undefined && { email: data.email || null }),
      ...(data.defaultTaxRate !== undefined && { defaultTaxRate: data.defaultTaxRate }),
      ...(data.defaultPaymentTerms !== undefined && {
        defaultPaymentTerms: data.defaultPaymentTerms,
      }),
      ...(data.quotePrefix !== undefined && { quotePrefix: data.quotePrefix }),
      ...(data.invoicePrefix !== undefined && { invoicePrefix: data.invoicePrefix }),
      ...(data.poPrefix !== undefined && { poPrefix: data.poPrefix }),
      ...(data.paymentPrefix !== undefined && { paymentPrefix: data.paymentPrefix }),
      ...(data.currency !== undefined && { currency: data.currency }),
      ...(data.locale !== undefined && { locale: data.locale }),
      ...(data.legalForm !== undefined && { legalForm: data.legalForm || null }),
      ...(data.shareCapital !== undefined && { shareCapital: data.shareCapital || null }),
      ...(data.siren !== undefined && { siren: data.siren || null }),
      ...(data.rcsNumber !== undefined && { rcsNumber: data.rcsNumber || null }),
      ...(data.rcsCity !== undefined && { rcsCity: data.rcsCity || null }),
      ...(data.tvaIntracom !== undefined && { tvaIntracom: data.tvaIntracom || null }),
      ...(data.apeCode !== undefined && { apeCode: data.apeCode || null }),
      ...(data.website !== undefined && { website: data.website || null }),
      ...(data.iban !== undefined && { iban: data.iban || null }),
      ...(data.bic !== undefined && { bic: data.bic || null }),
      ...(data.latePenaltyRate !== undefined && { latePenaltyRate: data.latePenaltyRate }),
      ...(data.earlyPaymentDiscount !== undefined && {
        earlyPaymentDiscount: data.earlyPaymentDiscount || null,
      }),
      ...(data.legalFooter !== undefined && { legalFooter: data.legalFooter || null }),
      ...(data.creditNotePrefix !== undefined && { creditNotePrefix: data.creditNotePrefix }),
      ...(data.acAccountId !== undefined && { acAccountId: data.acAccountId || null }),
      ...(data.acApiToken !== undefined && { acApiToken: data.acApiToken || null }),
      ...(data.acSyncEnabled !== undefined && { acSyncEnabled: data.acSyncEnabled }),
    },
  })

  return apiSuccess(updated)
})
