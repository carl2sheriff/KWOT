'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Download, Upload, FileText, Package, Clock, CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react'

// Types
interface POItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface SupplierInvoiceInfo {
  id: string
  reference: string
  status: string
  amount: number | null
  submittedAt: string
  fileName: string
}

interface PurchaseOrder {
  id: string
  reference: string
  status: string
  orderDate: string
  expectedDelivery: string | null
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  notes: string | null
  project: { id: string; name: string } | null
  items: POItem[]
  supplierInvoices: SupplierInvoiceInfo[]
}

interface SupplierInfo {
  id: string
  name: string
  company: string | null
  email: string | null
}

// Helpers
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Status helpers
const PO_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  SENT: { label: 'Envoye', className: 'bg-warning/10 text-warning' },
  CONFIRMED: { label: 'Confirme', className: 'bg-accent/10 text-accent' },
  RECEIVED: { label: 'Recu', className: 'bg-success/10 text-success' },
}

const INVOICE_STATUS_CONFIG: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  SUBMITTED: { label: 'Soumise', className: 'bg-info/10 text-info', icon: Clock },
  UNDER_REVIEW: { label: 'En revue', className: 'bg-warning/10 text-warning', icon: Eye },
  APPROVED: { label: 'Approuvee', className: 'bg-success/10 text-success', icon: CheckCircle },
  REJECTED: { label: 'Rejetee', className: 'bg-danger/10 text-danger', icon: XCircle },
  PAID: { label: 'Payee', className: 'bg-success/10 text-success', icon: CheckCircle },
}

function StatusBadge({ status, config }: { status: string; config: Record<string, { label: string; className: string }> }) {
  const c = config[status] || { label: status, className: 'bg-zinc-800 text-zinc-400' }
  return (
    <span className={`${c.className} px-2.5 py-1 rounded-md text-2xs font-semibold uppercase tracking-wide`}>
      {c.label}
    </span>
  )
}

// Upload Modal
function UploadModal({ po, token, onClose, onSuccess }: { po: PurchaseOrder; token: string; onClose: () => void; onSuccess: () => void }) {
  const [reference, setReference] = useState('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !reference) return

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('token', token)
      formData.append('purchaseOrderId', po.id)
      formData.append('reference', reference)
      if (amount) formData.append('amount', amount)
      if (notes) formData.append('notes', notes)
      formData.append('file', file)

      const res = await fetch('/api/extranet/invoices', { method: 'POST', body: formData })
      const json = await res.json()

      if (json.success) {
        onSuccess()
        onClose()
      } else {
        setError(json.error || 'Erreur lors du depot')
      }
    } catch {
      setError('Erreur reseau')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-raised border border-zinc-800/50 rounded-xl w-full max-w-lg p-6 shadow-2xl">
        <h3 className="text-sm font-semibold text-zinc-200 mb-1">Deposer une facture</h3>
        <p className="text-xs text-zinc-500 mb-5">Pour le bon de commande {po.reference}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Reference de votre facture *</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="FAC-2026-001"
              required
              className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Montant TTC</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={formatCurrency(po.total)}
              step="0.01"
              min="0"
              className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Fichier PDF *</label>
            <div className="relative">
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
                className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-accent/10 file:text-accent"
              />
            </div>
            <p className="text-2xs text-zinc-600 mt-1">PDF uniquement, 5 Mo max</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-surface border border-zinc-800 focus:border-accent rounded-lg px-3 py-2.5 text-sm text-zinc-200 outline-none transition-colors resize-none placeholder:text-zinc-600"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-danger text-xs bg-danger/10 px-3 py-2 rounded-lg">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={uploading || !file || !reference}
              className="flex-1 px-4 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Upload size={14} />
                  Deposer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Main Page
export default function ExtranetPortalPage() {
  const { token } = useParams<{ token: string }>()

  const [supplier, setSupplier] = useState<SupplierInfo | null>(null)
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadPO, setUploadPO] = useState<PurchaseOrder | null>(null)
  const [expandedPO, setExpandedPO] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      // Verify token
      const verifyRes = await fetch('/api/extranet/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const verifyJson = await verifyRes.json()

      if (!verifyJson.success) {
        setError(verifyJson.error || 'Acces refuse')
        setLoading(false)
        return
      }

      setSupplier(verifyJson.data)

      // Fetch POs
      const posRes = await fetch(`/api/extranet/purchase-orders?token=${token}`)
      const posJson = await posRes.json()

      if (posJson.success) {
        setPurchaseOrders(posJson.data)
      }
    } catch {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-zinc-400">Verification de l&apos;acces...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center bg-surface-raised border border-zinc-800/50 rounded-xl p-8 max-w-md">
          <AlertCircle size={40} className="text-danger mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-zinc-200 mb-2">Acces refuse</h2>
          <p className="text-sm text-zinc-400">{error}</p>
          <p className="text-xs text-zinc-600 mt-4">Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, contactez Sheriff Projects.</p>
        </div>
      </div>
    )
  }

  const totalPOs = purchaseOrders.length
  const totalAmount = purchaseOrders.reduce((sum, po) => sum + po.total, 0)
  const totalInvoices = purchaseOrders.reduce((sum, po) => sum + po.supplierInvoices.length, 0)

  return (
    <div>
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-zinc-100">
          Bienvenue, {supplier?.name}
        </h1>
        {supplier?.company && (
          <p className="text-sm text-zinc-400 mt-1">{supplier.company}</p>
        )}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-5">
          <p className="text-xs text-zinc-500 mb-1">Bons de commande</p>
          <p className="text-xl font-bold text-zinc-100">{totalPOs}</p>
        </div>
        <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-5">
          <p className="text-xs text-zinc-500 mb-1">Montant total</p>
          <p className="text-xl font-bold text-zinc-100">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-5">
          <p className="text-xs text-zinc-500 mb-1">Factures deposees</p>
          <p className="text-xl font-bold text-zinc-100">{totalInvoices}</p>
        </div>
      </div>

      {/* PO List */}
      <h2 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center gap-2">
        <Package size={16} className="text-zinc-500" />
        Vos bons de commande
      </h2>

      {purchaseOrders.length === 0 ? (
        <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-12 text-center">
          <Package size={40} className="text-zinc-700 mx-auto mb-4" />
          <p className="text-sm text-zinc-400">Aucun bon de commande</p>
        </div>
      ) : (
        <div className="space-y-4">
          {purchaseOrders.map((po) => (
            <div key={po.id} className="bg-surface-raised border border-zinc-800/50 rounded-xl overflow-hidden">
              {/* PO Header */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-sm font-bold text-zinc-100">{po.reference}</h3>
                      <StatusBadge status={po.status} config={PO_STATUS_CONFIG} />
                    </div>
                    {po.project && (
                      <p className="text-xs text-zinc-500">Projet: {po.project.name}</p>
                    )}
                    <p className="text-2xs text-zinc-600 mt-1">
                      Commande du {formatDate(po.orderDate)}
                      {po.expectedDelivery && ` - Livraison prevue: ${formatDate(po.expectedDelivery)}`}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-zinc-100 tabular-nums">{formatCurrency(po.total)}</p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3 mt-4">
                  <a
                    href={`/api/extranet/purchase-orders/${po.id}/pdf?token=${token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition-colors"
                  >
                    <Download size={14} />
                    Telecharger le BDC
                  </a>
                  <button
                    onClick={() => setUploadPO(po)}
                    className="flex items-center gap-2 px-3 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    <Upload size={14} />
                    Deposer une facture
                  </button>
                  {po.items.length > 0 && (
                    <button
                      onClick={() => setExpandedPO(expandedPO === po.id ? null : po.id)}
                      className="flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-colors"
                    >
                      <FileText size={14} />
                      {expandedPO === po.id ? 'Masquer les details' : 'Voir les details'}
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded items */}
              {expandedPO === po.id && (
                <div className="border-t border-zinc-800/50 px-5 py-4 bg-surface/50">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-zinc-500 text-2xs uppercase tracking-wider">
                        <th className="text-left pb-2">Description</th>
                        <th className="text-right pb-2">Qte</th>
                        <th className="text-right pb-2">Prix unit.</th>
                        <th className="text-right pb-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {po.items.map((item) => (
                        <tr key={item.id} className="border-t border-zinc-800/30">
                          <td className="py-2 text-zinc-300">{item.description}</td>
                          <td className="py-2 text-right text-zinc-400 tabular-nums">{item.quantity}</td>
                          <td className="py-2 text-right text-zinc-400 tabular-nums">{formatCurrency(item.unitPrice)}</td>
                          <td className="py-2 text-right text-zinc-200 font-medium tabular-nums">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-zinc-700">
                        <td colSpan={3} className="py-2 text-right text-zinc-400 font-medium">Sous-total HT</td>
                        <td className="py-2 text-right text-zinc-200 font-medium tabular-nums">{formatCurrency(po.subtotal)}</td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="py-1 text-right text-zinc-500">TVA ({po.taxRate}%)</td>
                        <td className="py-1 text-right text-zinc-400 tabular-nums">{formatCurrency(po.taxAmount)}</td>
                      </tr>
                      <tr className="border-t border-zinc-700">
                        <td colSpan={3} className="py-2 text-right text-zinc-200 font-bold">Total TTC</td>
                        <td className="py-2 text-right text-zinc-100 font-bold tabular-nums">{formatCurrency(po.total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* Submitted invoices for this PO */}
              {po.supplierInvoices.length > 0 && (
                <div className="border-t border-zinc-800/50 px-5 py-4">
                  <p className="text-2xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Factures deposees</p>
                  <div className="space-y-2">
                    {po.supplierInvoices.map((inv) => {
                      const statusConf = INVOICE_STATUS_CONFIG[inv.status]
                      const Icon = statusConf?.icon || Clock
                      return (
                        <div key={inv.id} className="flex items-center justify-between py-1.5">
                          <div className="flex items-center gap-3">
                            <Icon size={14} className={statusConf?.className.split(' ')[1] || 'text-zinc-400'} />
                            <span className="text-xs text-zinc-300">{inv.reference}</span>
                            <StatusBadge status={inv.status} config={INVOICE_STATUS_CONFIG} />
                          </div>
                          <div className="flex items-center gap-3">
                            {inv.amount && <span className="text-xs text-zinc-400 tabular-nums">{formatCurrency(inv.amount)}</span>}
                            <span className="text-2xs text-zinc-600">{formatDate(inv.submittedAt)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {uploadPO && (
        <UploadModal
          po={uploadPO}
          token={token}
          onClose={() => setUploadPO(null)}
          onSuccess={fetchData}
        />
      )}
    </div>
  )
}
