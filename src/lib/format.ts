/**
 * Format date for display
 */
export function formatDate(date: Date | string, locale: string = 'fr-FR'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Format date with time
 */
export function formatDateTime(date: Date | string, locale: string = 'fr-FR'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Relative time (il y a 2 heures)
 */
export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (seconds < 60) return 'A l\'instant'
  if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`
  if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`
  if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)}j`
  return formatDate(d)
}

/**
 * Format percentage
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

/**
 * Truncate text
 */
export function truncate(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * Status label mapping for French UI
 */
export const STATUS_LABELS: Record<string, string> = {
  // Quote statuses
  DRAFT: 'BROUILLON',
  SENT: 'ENVOYE',
  APPROVED: 'APPROUVE',
  REJECTED: 'REFUSE',
  EXPIRED: 'EXPIRE',
  CANCELLED: 'ANNULE',
  // Invoice statuses
  PAID: 'PAYE',
  PARTIALLY_PAID: 'PARTIELLEMENT PAYE',
  OVERDUE: 'EN RETARD',
  CREDITED: 'CREDITE',
  // Payment statuses
  PENDING: 'EN ATTENTE',
  COMPLETED: 'COMPLETE',
  FAILED: 'ECHOUE',
  REFUNDED: 'REMBOURSE',
  // Credit note statuses
  APPLIED: 'APPLIQUE',
  // PO statuses
  CONFIRMED: 'CONFIRME',
  RECEIVED: 'RECU',
  // General
  active: 'ACTIF',
  inactive: 'INACTIF',
  prospect: 'PROSPECT',
  draft: 'BROUILLON',
  completed: 'TERMINE',
  todo: 'A FAIRE',
  in_progress: 'EN COURS',
  done: 'FAIT',
}

/**
 * Get status badge variant
 */
export function getStatusVariant(status: string): 'default' | 'success' | 'warning' | 'danger' | 'outline' | 'muted' {
  const successStatuses = ['APPROVED', 'PAID', 'COMPLETED', 'CONFIRMED', 'RECEIVED', 'APPLIED', 'active', 'done']
  const warningStatuses = ['SENT', 'PENDING', 'PARTIALLY_PAID', 'in_progress', 'prospect']
  const dangerStatuses = ['REJECTED', 'OVERDUE', 'FAILED', 'CANCELLED', 'EXPIRED', 'cancelled']
  const mutedStatuses = ['DRAFT', 'draft', 'CREDITED', 'REFUNDED', 'inactive']

  if (successStatuses.includes(status)) return 'success'
  if (warningStatuses.includes(status)) return 'warning'
  if (dangerStatuses.includes(status)) return 'danger'
  if (mutedStatuses.includes(status)) return 'muted'
  return 'default'
}

/**
 * Generate mandatory French legal mentions for invoices
 */
export function generateLegalMentions(settings: {
  latePenaltyRate?: number | null
  earlyPaymentDiscount?: string | null
  defaultPaymentTerms?: number
  legalForm?: string | null
  shareCapital?: string | null
  siren?: string | null
  rcsNumber?: string | null
  rcsCity?: string | null
  tvaIntracom?: string | null
  companyName?: string
}): string[] {
  const mentions: string[] = []

  // Payment terms
  if (settings.defaultPaymentTerms) {
    mentions.push(`Delai de paiement : ${settings.defaultPaymentTerms} jours a compter de la date de facture.`)
  }

  // Late payment penalty (mandatory on French invoices)
  const penaltyRate = settings.latePenaltyRate ?? 12
  mentions.push(
    `En cas de retard de paiement, une penalite de ${penaltyRate}% par an sera appliquee, conformement a l'article L441-10 du Code de commerce.`
  )

  // Recovery fee (mandatory 40€)
  mentions.push(
    `Une indemnite forfaitaire de 40 euros pour frais de recouvrement sera exigee en cas de retard de paiement (art. D441-5 du Code de commerce).`
  )

  // Early payment discount
  if (settings.earlyPaymentDiscount) {
    mentions.push(`Escompte pour paiement anticipe : ${settings.earlyPaymentDiscount}.`)
  } else {
    mentions.push(`Pas d'escompte pour paiement anticipe.`)
  }

  return mentions
}
