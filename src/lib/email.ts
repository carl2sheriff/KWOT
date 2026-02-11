import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const EMAIL_FROM = process.env.EMAIL_FROM || 'facturation@kwotfinance.com'

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  attachments?: { filename: string; content: Buffer }[]
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  if (!resend) {
    console.warn('[EMAIL] RESEND_API_KEY non configure - email non envoye')
    return false
  }

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments?.map(a => ({
        filename: a.filename,
        content: a.content,
      })),
    })

    if (error) {
      console.error('[EMAIL] Erreur envoi:', error)
      return false
    }

    console.log(`[EMAIL] Email envoye a ${options.to}: ${options.subject}`)
    return true
  } catch (error) {
    console.error('[EMAIL] Erreur:', error)
    return false
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function buildQuoteEmailHTML(data: {
  companyName: string
  reference: string
  clientName: string
  total: number
  validUntil?: string | null
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="border-bottom: 3px solid #3C01FC; padding-bottom: 15px; margin-bottom: 20px;">
    <h1 style="font-size: 18px; margin: 0; color: #111;">${data.companyName}</h1>
  </div>

  <p style="font-size: 14px;">Bonjour,</p>

  <p style="font-size: 14px;">
    Veuillez trouver ci-joint notre devis <strong>${data.reference}</strong>
    d'un montant de <strong>${formatCurrency(data.total)}</strong>.
  </p>

  ${data.validUntil ? `<p style="font-size: 13px; color: #666;">Ce devis est valable jusqu'au ${formatDate(data.validUntil)}.</p>` : ''}

  <p style="font-size: 14px;">
    N'hesitez pas a nous contacter pour toute question.
  </p>

  <p style="font-size: 14px;">Cordialement,<br><strong>${data.companyName}</strong></p>

  <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 15px; font-size: 11px; color: #999;">
    Ce message a ete envoye automatiquement par ${data.companyName}.
  </div>
</body>
</html>`
}

export function buildInvoiceEmailHTML(data: {
  companyName: string
  reference: string
  clientName: string
  total: number
  dueDate: string
  amountDue: number
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="border-bottom: 3px solid #3C01FC; padding-bottom: 15px; margin-bottom: 20px;">
    <h1 style="font-size: 18px; margin: 0; color: #111;">${data.companyName}</h1>
  </div>

  <p style="font-size: 14px;">Bonjour,</p>

  <p style="font-size: 14px;">
    Veuillez trouver ci-joint notre facture <strong>${data.reference}</strong>
    d'un montant de <strong>${formatCurrency(data.total)}</strong>.
  </p>

  <p style="font-size: 14px;">
    Date d'echeance : <strong>${formatDate(data.dueDate)}</strong><br>
    Montant a regler : <strong>${formatCurrency(data.amountDue)}</strong>
  </p>

  <p style="font-size: 14px;">Cordialement,<br><strong>${data.companyName}</strong></p>

  <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 15px; font-size: 11px; color: #999;">
    Ce message a ete envoye automatiquement par ${data.companyName}.
  </div>
</body>
</html>`
}
