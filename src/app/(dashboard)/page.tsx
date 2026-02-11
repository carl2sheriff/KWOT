'use client'

import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { TrendingUp, Receipt, AlertCircle, FileText } from 'lucide-react'
import Header from '@/components/layout/Header'
import { StatusBadge } from '@/components/financial/StatusBadge'

interface RecentPayment {
  id: string
  reference: string
  amount: number
  method: string
  status: string
  paidAt: string | null
  createdAt: string
  invoiceReference: string
  clientName: string
  clientCompany: string | null
}

interface RecentQuote {
  id: string
  reference: string
  status: string
  total: number
  createdAt: string
  clientName: string
  clientCompany: string | null
}

interface MonthlyRevenue {
  month: string
  amount: number
}

interface InvoiceByStatus {
  status: string
  count: number
  amount: number
}

interface DashboardStats {
  revenueMTD: number
  revenueYTD: number
  outstandingInvoices: number
  outstandingAmount: number
  overdueAmount: number
  overdueCount: number
  pendingQuotes: number
  pendingQuotesAmount: number
  conversionRate: number
  recentPayments: RecentPayment[]
  recentQuotes: RecentQuote[]
  monthlyRevenue: MonthlyRevenue[]
  invoicesByStatus: InvoiceByStatus[]
  mscvPrevisionnelleYTD: number
  mscvPrevisionnelleRateYTD: number
  mscvProvisoireYTD: number
  mscvProvisoireRateYTD: number
  mscvDefinitiveYTD: number
  mscvDefinitiveRateYTD: number
}

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)

const formatDate = (date: string): string =>
  new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

const INVOICE_STATUS_COLORS: Record<string, string> = {
  PAID: '#10B981',
  SENT: '#F59E0B',
  OVERDUE: '#F43F5E',
  DRAFT: '#3f3f46',
  PARTIALLY_PAID: '#8B5CF6',
  CANCELLED: '#71717A',
  CREDITED: '#52525B',
}

const INVOICE_STATUS_LABELS: Record<string, string> = {
  PAID: 'Paye',
  SENT: 'Envoye',
  OVERDUE: 'En retard',
  DRAFT: 'Brouillon',
  PARTIALLY_PAID: 'Partiel',
  CANCELLED: 'Annule',
  CREDITED: 'Credite',
}

function SkeletonKPICards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-surface-raised border border-zinc-800/50 rounded-xl p-5">
          <div className="h-3 w-24 skeleton rounded mb-3" />
          <div className="h-6 w-32 skeleton rounded mb-2" />
          <div className="h-2.5 w-16 skeleton rounded" />
        </div>
      ))}
    </div>
  )
}

function SkeletonCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      {[1, 2].map((i) => (
        <div key={i} className="bg-surface-raised border border-zinc-800/50 rounded-xl p-5">
          <div className="h-3 w-32 skeleton rounded mb-4" />
          <div className="h-[250px] skeleton rounded" />
        </div>
      ))}
    </div>
  )
}

function SkeletonLists() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
      {[1, 2].map((i) => (
        <div key={i} className="bg-surface-raised border border-zinc-800/50 rounded-xl p-5">
          <div className="h-3 w-28 skeleton rounded mb-4" />
          {[1, 2, 3, 4].map((j) => (
            <div key={j} className="flex justify-between py-3 border-b border-zinc-800/30">
              <div>
                <div className="h-3 w-20 skeleton rounded mb-2" />
                <div className="h-2.5 w-28 skeleton rounded" />
              </div>
              <div className="text-right">
                <div className="h-3 w-16 skeleton rounded mb-2" />
                <div className="h-2.5 w-12 skeleton rounded ml-auto" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

interface TooltipPayloadItem {
  value: number
  dataKey: string
  payload: MonthlyRevenue
}

function CustomBarTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-800 border border-zinc-700/50 text-zinc-100 px-3 py-1.5 rounded-md text-xs font-medium shadow-lg">
      {formatCurrency(payload[0].value)}
    </div>
  )
}

interface KPICardProps {
  label: string
  value: string
  sub: string
  icon: React.ReactNode
  iconColor: string
}

function KPICard({ label, value, sub, icon, iconColor }: KPICardProps) {
  return (
    <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-5 hover:border-zinc-700 transition-all duration-150 relative group">
      <div className={`absolute top-5 right-5 ${iconColor} opacity-60 group-hover:opacity-100 transition-opacity`}>
        {icon}
      </div>
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-zinc-100 tabular-nums">{value}</p>
      <p className="text-2xs text-zinc-600 mt-1">{sub}</p>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setStats(d.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const totalInvoices = stats?.invoicesByStatus.reduce((sum, s) => sum + s.count, 0) ?? 0

  return (
    <div>
      <Header title="Tableau de bord" subtitle="Vue financiere" />

      <div className="p-6">
        {loading ? (
          <SkeletonKPICards />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="CA du mois"
              value={formatCurrency(stats?.revenueMTD ?? 0)}
              sub={`YTD: ${formatCurrency(stats?.revenueYTD ?? 0)}`}
              icon={<TrendingUp size={18} />}
              iconColor="text-accent"
            />
            <KPICard
              label="Factures en attente"
              value={formatCurrency(stats?.outstandingAmount ?? 0)}
              sub={`${stats?.outstandingInvoices ?? 0} factures`}
              icon={<Receipt size={18} />}
              iconColor="text-warning"
            />
            <KPICard
              label="En retard"
              value={formatCurrency(stats?.overdueAmount ?? 0)}
              sub={`${stats?.overdueCount ?? 0} factures`}
              icon={<AlertCircle size={18} />}
              iconColor="text-danger"
            />
            <KPICard
              label="Devis en cours"
              value={formatCurrency(stats?.pendingQuotesAmount ?? 0)}
              sub={`${stats?.pendingQuotes ?? 0} devis`}
              icon={<FileText size={18} />}
              iconColor="text-info"
            />
          </div>
        )}

        {/* MSCV YTD */}
        {!loading && stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            {([
              { label: 'MSCV previsionnelle', value: stats.mscvPrevisionnelleYTD, rate: stats.mscvPrevisionnelleRateYTD, sub: 'Devis - Budget' },
              { label: 'MSCV provisoire', value: stats.mscvProvisoireYTD, rate: stats.mscvProvisoireRateYTD, sub: 'CA - (Temps + Dep.)' },
              { label: 'MSCV definitive', value: stats.mscvDefinitiveYTD, rate: stats.mscvDefinitiveRateYTD, sub: 'CA - PO' },
            ] as const).map((m) => (
              <div
                key={m.label}
                className={`bg-surface-raised border rounded-xl p-5 hover:border-zinc-700 transition-all duration-150 ${
                  m.value >= 0 ? 'border-success/30' : 'border-danger/30'
                }`}
              >
                <p className="text-xs text-zinc-500 mb-1">{m.label} (YTD)</p>
                <p className={`text-xl font-bold tabular-nums ${m.value >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatCurrency(m.value)}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-2xs text-zinc-600">{m.sub}</p>
                  <p className={`text-xs font-bold tabular-nums ${m.rate >= 0 ? 'text-success' : 'text-danger'}`}>
                    {m.rate.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <SkeletonCharts />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-5">
              <h2 className="text-sm font-medium text-zinc-300 mb-4">
                Chiffre d&apos;affaires mensuel
              </h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats?.monthlyRevenue ?? []}>
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: '#71717A' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#71717A' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                  />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(139, 92, 246, 0.06)' }} />
                  <Bar dataKey="amount" fill="#8B5CF6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-5">
              <h2 className="text-sm font-medium text-zinc-300 mb-4">
                Factures par statut
              </h2>
              {stats?.invoicesByStatus && stats.invoicesByStatus.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={stats.invoicesByStatus}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        strokeWidth={0}
                      >
                        {stats.invoicesByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={INVOICE_STATUS_COLORS[entry.status] ?? '#3f3f46'} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number | undefined, name: string | undefined) => [value ?? 0, INVOICE_STATUS_LABELS[name ?? ''] ?? name ?? '']}
                        contentStyle={{
                          backgroundColor: '#27272A',
                          color: '#F4F4F5',
                          border: '1px solid rgba(63,63,70,0.5)',
                          borderRadius: '8px',
                          fontSize: '12px',
                          padding: '6px 12px',
                        }}
                        itemStyle={{ color: '#F4F4F5' }}
                      />
                      <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" className="fill-zinc-100 text-2xl font-bold">
                        {totalInvoices}
                      </text>
                      <text x="50%" y="57%" textAnchor="middle" dominantBaseline="middle" className="fill-zinc-500 text-2xs">
                        factures
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-3 mt-2 justify-center">
                    {stats.invoicesByStatus.map((entry) => (
                      <div key={entry.status} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: INVOICE_STATUS_COLORS[entry.status] ?? '#3f3f46' }} />
                        <span className="text-2xs text-zinc-500">{INVOICE_STATUS_LABELS[entry.status] ?? entry.status}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[250px] flex items-center justify-center">
                  <p className="text-xs text-zinc-500">Aucune facture</p>
                </div>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <SkeletonLists />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-5">
              <h2 className="text-sm font-medium text-zinc-300 mb-4">Derniers paiements</h2>
              {stats?.recentPayments && stats.recentPayments.length > 0 ? (
                <div>
                  {stats.recentPayments.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center py-3 border-b border-zinc-800/30 last:border-b-0">
                      <div>
                        <p className="font-medium text-sm text-zinc-200">{payment.invoiceReference}</p>
                        <p className="text-xs text-zinc-500">{payment.clientName}{payment.clientCompany ? ` - ${payment.clientCompany}` : ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm text-zinc-100 tabular-nums">{formatCurrency(payment.amount)}</p>
                        <p className="text-2xs text-zinc-600">{payment.paidAt ? formatDate(payment.paidAt) : formatDate(payment.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-xs text-zinc-500">Aucun paiement recent</p>
                </div>
              )}
            </div>

            <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-5">
              <h2 className="text-sm font-medium text-zinc-300 mb-4">Derniers devis</h2>
              {stats?.recentQuotes && stats.recentQuotes.length > 0 ? (
                <div>
                  {stats.recentQuotes.map((quote) => (
                    <div key={quote.id} className="flex justify-between items-center py-3 border-b border-zinc-800/30 last:border-b-0">
                      <div>
                        <p className="font-medium text-sm text-zinc-200">{quote.reference}</p>
                        <p className="text-xs text-zinc-500">{quote.clientName}{quote.clientCompany ? ` - ${quote.clientCompany}` : ''}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={quote.status} />
                        <p className="font-semibold text-sm text-zinc-100 min-w-[80px] text-right tabular-nums">{formatCurrency(quote.total)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-xs text-zinc-500">Aucun devis recent</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
