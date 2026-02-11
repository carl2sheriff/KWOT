"use client";

import React from "react";
import {
  Plus,
  Edit,
  Trash2,
  Send,
  Check,
  X,
  CreditCard,
  RotateCcw,
  RefreshCw,
  FileText,
  Receipt,
  ShoppingCart,
} from "lucide-react";

export interface TimelineEvent {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  user: { id: string; name: string };
}

// Map action+entityType to French description
function getEventDescription(event: TimelineEvent): string {
  const ref = (event.metadata as Record<string, unknown>)?.reference as string || ''
  const refStr = ref ? ` ${ref}` : ''

  const entityLabels: Record<string, string> = {
    'quote': 'devis',
    'invoice': 'facture',
    'payment': 'paiement',
    'purchase-order': 'bon de commande',
    'credit-note': 'avoir',
  }
  const entityLabel = entityLabels[event.entityType] || event.entityType

  const actionLabels: Record<string, string> = {
    'CREATE': `Creation du ${entityLabel}${refStr}`,
    'UPDATE': `Modification du ${entityLabel}${refStr}`,
    'DELETE': `Suppression du ${entityLabel}${refStr}`,
    'STATUS_CHANGE': `Changement de statut du ${entityLabel}${refStr}`,
    'APPROVE': `Approbation du ${entityLabel}${refStr}`,
    'REJECT': `Refus du ${entityLabel}${refStr}`,
    'SEND': `Envoi du ${entityLabel}${refStr}`,
    'PAYMENT': `Paiement enregistre${refStr}`,
    'CREDIT': `Avoir emis${refStr}`,
  }

  return actionLabels[event.action] || `${event.action} - ${entityLabel}${refStr}`
}

// Map action to icon and color
function getEventStyle(action: string): { icon: React.ReactNode; color: string; bgColor: string } {
  switch (action) {
    case 'CREATE': return { icon: <Plus size={12} />, color: 'text-accent', bgColor: 'bg-accent/10' }
    case 'UPDATE': return { icon: <Edit size={12} />, color: 'text-warning', bgColor: 'bg-warning/10' }
    case 'DELETE': return { icon: <Trash2 size={12} />, color: 'text-danger', bgColor: 'bg-danger/10' }
    case 'STATUS_CHANGE': return { icon: <RefreshCw size={12} />, color: 'text-warning', bgColor: 'bg-warning/10' }
    case 'APPROVE': return { icon: <Check size={12} />, color: 'text-success', bgColor: 'bg-success/10' }
    case 'REJECT': return { icon: <X size={12} />, color: 'text-danger', bgColor: 'bg-danger/10' }
    case 'SEND': return { icon: <Send size={12} />, color: 'text-accent', bgColor: 'bg-accent/10' }
    case 'PAYMENT': return { icon: <CreditCard size={12} />, color: 'text-success', bgColor: 'bg-success/10' }
    case 'CREDIT': return { icon: <RotateCcw size={12} />, color: 'text-warning', bgColor: 'bg-warning/10' }
    default: return { icon: <FileText size={12} />, color: 'text-zinc-400', bgColor: 'bg-zinc-800/50' }
  }
}

// Entity type icon
function getEntityIcon(entityType: string): React.ReactNode {
  switch (entityType) {
    case 'quote': return <FileText size={10} className="text-zinc-600" />
    case 'invoice': return <Receipt size={10} className="text-zinc-600" />
    case 'payment': return <CreditCard size={10} className="text-zinc-600" />
    case 'purchase-order': return <ShoppingCart size={10} className="text-zinc-600" />
    case 'credit-note': return <RotateCcw size={10} className="text-zinc-600" />
    default: return null
  }
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (seconds < 60) return "A l'instant"
  if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`
  if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`
  if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)}j`
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Show status change details
function getChangeDetails(event: TimelineEvent): string | null {
  if (!event.changes) return null
  const changes = event.changes as Record<string, { from?: unknown; to?: unknown }>
  if (changes.status) {
    return `${changes.status.from} → ${changes.status.to}`
  }
  if (changes.convertedToInvoice) {
    return `Converti en facture ${changes.convertedToInvoice.to}`
  }
  return null
}

interface ActivityTimelineProps {
  events: TimelineEvent[];
  loading?: boolean;
  emptyMessage?: string;
}

export function ActivityTimeline({ events, loading, emptyMessage = "Aucune activite" }: ActivityTimelineProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-zinc-700 border-t-accent" />
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-xs text-zinc-600">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[15px] top-3 bottom-3 w-px bg-zinc-800/50" />

      <div className="space-y-0">
        {events.map((event) => {
          const style = getEventStyle(event.action)
          const changeDetails = getChangeDetails(event)

          return (
            <div key={event.id} className="relative flex items-start gap-3 py-2.5 group">
              {/* Dot */}
              <div className={`relative z-10 flex items-center justify-center w-[30px] h-[30px] rounded-full ${style.bgColor} ${style.color} shrink-0`}>
                {style.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-xs text-zinc-200 leading-relaxed">
                  {getEventDescription(event)}
                </p>
                {changeDetails && (
                  <p className="text-2xs text-zinc-500 mt-0.5 font-mono">
                    {changeDetails}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {getEntityIcon(event.entityType)}
                  <span className="text-2xs text-zinc-600">{event.user.name}</span>
                  <span className="text-2xs text-zinc-700">&middot;</span>
                  <span className="text-2xs text-zinc-600">{timeAgo(event.createdAt)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
