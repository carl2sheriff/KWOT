"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  BarChart3,
  Users,
  Building2,
  Calendar,
  TrendingUp,
  Loader2,
} from "lucide-react";
import Header from "@/components/layout/Header";

// ============================================
// Types
// ============================================

interface BuRevenueRow {
  buId: string;
  buName: string;
  buCode: string;
  invoiceCount: number;
  totalHT: number;
  totalTTC: number;
}

interface BuProductiveRow {
  buId: string;
  buName: string;
  buCode: string;
  itemCount: number;
  totalHT: number;
}

interface SellerRow {
  sellerId: string;
  sellerName: string;
  invoiceCount: number;
  totalHT: number;
  totalTTC: number;
}

interface MonthRow {
  month: string;
  caAlloue: number;
  caFacture: number;
  caEncaisse: number;
}

interface MscvData {
  previsionnelle: number;
  previsionnelleRate: number;
  provisoire: number;
  provisoireRate: number;
  definitive: number;
  definitiveRate: number;
}

interface RevenueData {
  buSales?: BuRevenueRow[];
  buProductive?: BuProductiveRow[];
  sellers?: SellerRow[];
  months?: MonthRow[];
  mscv?: MscvData;
}

type TabView = "bu" | "seller" | "month";

// ============================================
// Helpers
// ============================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function formatMonthLabel(month: string): string {
  const [year, m] = month.split("-");
  const MONTHS = [
    "Jan",
    "Fev",
    "Mar",
    "Avr",
    "Mai",
    "Jun",
    "Jul",
    "Aou",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthIndex = parseInt(m, 10) - 1;
  return `${MONTHS[monthIndex]} ${year}`;
}

// ============================================
// Custom Tooltip
// ============================================

interface TooltipPayloadItem {
  value: number;
  dataKey: string;
  name: string;
  color: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-800 border border-zinc-700/50 text-zinc-100 px-3 py-2 rounded-md text-xs shadow-lg">
      <div className="font-medium mb-1">{label}</div>
      {payload.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-zinc-400">{item.name}:</span>
          <span className="font-medium tabular-nums">
            {formatCurrency(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Tab Button
// ============================================

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-xs font-bold tracking-[0.1em] uppercase rounded-lg transition-all duration-150 ${
        active
          ? "bg-accent/10 text-accent border border-accent/30"
          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border border-transparent"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ============================================
// Main Page
// ============================================

export default function ReportingPage() {
  const [activeTab, setActiveTab] = useState<TabView>("bu");
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RevenueData>({});
  const [mscv, setMscv] = useState<MscvData | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/reporting/revenue?year=${year}&view=${activeTab}`
      );
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        if (json.data.mscv) {
          setMscv(json.data.mscv);
        }
      }
    } catch (err) {
      console.error("Failed to fetch reporting data:", err);
    } finally {
      setLoading(false);
    }
  }, [year, activeTab]);

  // Fetch MSCV data on year change (from month view)
  const fetchMscv = useCallback(async () => {
    try {
      const res = await fetch(`/api/reporting/revenue?year=${year}&view=month`);
      const json = await res.json();
      if (json.success && json.data.mscv) {
        setMscv(json.data.mscv);
      }
    } catch {
      // silently fail
    }
  }, [year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    // Only fetch MSCV separately if we're not on the month tab
    if (activeTab !== "month") {
      fetchMscv();
    }
  }, [year, activeTab, fetchMscv]);

  const years = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear - 3; y <= currentYear + 1; y++) {
    years.push(y);
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Reporting"
        subtitle="CA et MSCV"
        actions={
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-accent" />
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="px-3 py-1.5 text-xs font-medium bg-surface-overlay border border-zinc-800/50 rounded-lg text-zinc-200 outline-none focus:border-accent transition-colors cursor-pointer"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        {/* MSCV Summary Cards */}
        {mscv && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {([
              { label: "MSCV previsionnelle", value: mscv.previsionnelle, rate: mscv.previsionnelleRate, sub: "Devis - Budget" },
              { label: "MSCV provisoire", value: mscv.provisoire, rate: mscv.provisoireRate, sub: "CA - (Temps + Dep.)" },
              { label: "MSCV definitive", value: mscv.definitive, rate: mscv.definitiveRate, sub: "CA - PO" },
            ] as const).map((m) => (
              <div
                key={m.label}
                className={`bg-surface-raised border rounded-xl p-5 ${
                  m.value >= 0 ? "border-success/30" : "border-danger/30"
                }`}
              >
                <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 mb-2">
                  {m.label} {year}
                </p>
                <p className={`text-2xl font-bold tabular-nums ${m.value >= 0 ? "text-success" : "text-danger"}`}>
                  {formatCurrency(m.value)}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-2xs text-zinc-600">{m.sub}</p>
                  <p className={`text-xs font-bold tabular-nums ${m.rate >= 0 ? "text-success" : "text-danger"}`}>
                    {m.rate.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <TabButton
            active={activeTab === "bu"}
            onClick={() => setActiveTab("bu")}
            icon={<Building2 size={12} />}
            label="PAR BU"
          />
          <TabButton
            active={activeTab === "seller"}
            onClick={() => setActiveTab("seller")}
            icon={<Users size={12} />}
            label="PAR VENDEUR"
          />
          <TabButton
            active={activeTab === "month"}
            onClick={() => setActiveTab("month")}
            icon={<Calendar size={12} />}
            label="PAR MOIS"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={20} className="animate-spin text-zinc-500" />
            <span className="text-sm text-zinc-500 ml-3">Chargement...</span>
          </div>
        ) : (
          <>
            {/* BU Tab */}
            {activeTab === "bu" && <BuView data={data} />}

            {/* Seller Tab */}
            {activeTab === "seller" && <SellerView data={data} />}

            {/* Month Tab */}
            {activeTab === "month" && <MonthView data={data} year={year} />}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================
// BU View
// ============================================

function BuView({ data }: { data: RevenueData }) {
  const buSales = data.buSales || [];
  const buProductive = data.buProductive || [];

  // Compute delta between sales and productive per BU
  const deltaMap = new Map<string, { buName: string; buCode: string; sales: number; productive: number; delta: number }>();
  for (const s of buSales) {
    deltaMap.set(s.buCode, {
      buName: s.buName,
      buCode: s.buCode,
      sales: s.totalHT,
      productive: 0,
      delta: s.totalHT,
    });
  }
  for (const p of buProductive) {
    const existing = deltaMap.get(p.buCode);
    if (existing) {
      existing.productive = p.totalHT;
      existing.delta = existing.sales - p.totalHT;
    } else {
      deltaMap.set(p.buCode, {
        buName: p.buName,
        buCode: p.buCode,
        sales: 0,
        productive: p.totalHT,
        delta: -p.totalHT,
      });
    }
  }
  const deltas = Array.from(deltaMap.values());

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CA Vente par BU */}
        <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={14} className="text-accent" />
            <h2 className="text-xs font-bold tracking-[0.15em] uppercase text-zinc-400">
              CA VENTE PAR BU
            </h2>
          </div>

          {buSales.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              Aucune donnee de vente
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800/50">
                  <th className="text-left text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 pb-2">
                    BU
                  </th>
                  <th className="text-left text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 pb-2">
                    CODE
                  </th>
                  <th className="text-right text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 pb-2">
                    FACTURES
                  </th>
                  <th className="text-right text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 pb-2">
                    TOTAL HT
                  </th>
                  <th className="text-right text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 pb-2">
                    TOTAL TTC
                  </th>
                </tr>
              </thead>
              <tbody>
                {buSales.map((row) => (
                  <tr
                    key={row.buId}
                    className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors"
                  >
                    <td className="py-2.5 text-sm text-zinc-100">{row.buName}</td>
                    <td className="py-2.5">
                      <span className="text-2xs font-mono font-bold tracking-wider text-zinc-500 bg-zinc-800/50 px-1.5 py-0.5 rounded">
                        {row.buCode}
                      </span>
                    </td>
                    <td className="py-2.5 text-sm text-zinc-100 text-right tabular-nums">
                      {row.invoiceCount}
                    </td>
                    <td className="py-2.5 text-sm text-zinc-100 text-right tabular-nums font-medium">
                      {formatCurrency(row.totalHT)}
                    </td>
                    <td className="py-2.5 text-sm text-zinc-100 text-right tabular-nums font-medium">
                      {formatCurrency(row.totalTTC)}
                    </td>
                  </tr>
                ))}
                {/* Total row */}
                <tr className="border-t border-zinc-700/50">
                  <td colSpan={2} className="py-2.5 text-xs font-bold text-zinc-400">
                    TOTAL
                  </td>
                  <td className="py-2.5 text-sm text-zinc-100 text-right tabular-nums font-bold">
                    {buSales.reduce((s, r) => s + r.invoiceCount, 0)}
                  </td>
                  <td className="py-2.5 text-sm text-zinc-100 text-right tabular-nums font-bold">
                    {formatCurrency(buSales.reduce((s, r) => s + r.totalHT, 0))}
                  </td>
                  <td className="py-2.5 text-sm text-zinc-100 text-right tabular-nums font-bold">
                    {formatCurrency(buSales.reduce((s, r) => s + r.totalTTC, 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {/* CA Productif par BU */}
        <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={14} className="text-success" />
            <h2 className="text-xs font-bold tracking-[0.15em] uppercase text-zinc-400">
              CA PRODUCTIF PAR BU
            </h2>
          </div>

          {buProductive.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              Aucune donnee productive
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800/50">
                  <th className="text-left text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 pb-2">
                    BU
                  </th>
                  <th className="text-left text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 pb-2">
                    CODE
                  </th>
                  <th className="text-right text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 pb-2">
                    ARTICLES
                  </th>
                  <th className="text-right text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 pb-2">
                    TOTAL HT
                  </th>
                </tr>
              </thead>
              <tbody>
                {buProductive.map((row) => (
                  <tr
                    key={row.buId}
                    className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors"
                  >
                    <td className="py-2.5 text-sm text-zinc-100">{row.buName}</td>
                    <td className="py-2.5">
                      <span className="text-2xs font-mono font-bold tracking-wider text-zinc-500 bg-zinc-800/50 px-1.5 py-0.5 rounded">
                        {row.buCode}
                      </span>
                    </td>
                    <td className="py-2.5 text-sm text-zinc-100 text-right tabular-nums">
                      {row.itemCount}
                    </td>
                    <td className="py-2.5 text-sm text-zinc-100 text-right tabular-nums font-medium">
                      {formatCurrency(row.totalHT)}
                    </td>
                  </tr>
                ))}
                {/* Total row */}
                <tr className="border-t border-zinc-700/50">
                  <td colSpan={2} className="py-2.5 text-xs font-bold text-zinc-400">
                    TOTAL
                  </td>
                  <td className="py-2.5 text-sm text-zinc-100 text-right tabular-nums font-bold">
                    {buProductive.reduce((s, r) => s + r.itemCount, 0)}
                  </td>
                  <td className="py-2.5 text-sm text-zinc-100 text-right tabular-nums font-bold">
                    {formatCurrency(buProductive.reduce((s, r) => s + r.totalHT, 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Delta table */}
      {deltas.length > 0 && (
        <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-warning" />
            <h2 className="text-xs font-bold tracking-[0.15em] uppercase text-zinc-400">
              DELTA VENTE / PRODUCTIF PAR BU
            </h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800/50">
                <th className="text-left text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 pb-2">
                  BU
                </th>
                <th className="text-right text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 pb-2">
                  CA VENTE HT
                </th>
                <th className="text-right text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 pb-2">
                  CA PRODUCTIF HT
                </th>
                <th className="text-right text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 pb-2">
                  DELTA
                </th>
              </tr>
            </thead>
            <tbody>
              {deltas.map((row) => (
                <tr
                  key={row.buCode}
                  className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors"
                >
                  <td className="py-2.5">
                    <span className="text-sm text-zinc-100">{row.buName}</span>
                    <span className="text-2xs font-mono text-zinc-500 ml-2">
                      {row.buCode}
                    </span>
                  </td>
                  <td className="py-2.5 text-sm text-zinc-100 text-right tabular-nums">
                    {formatCurrency(row.sales)}
                  </td>
                  <td className="py-2.5 text-sm text-zinc-100 text-right tabular-nums">
                    {formatCurrency(row.productive)}
                  </td>
                  <td
                    className={`py-2.5 text-sm text-right tabular-nums font-bold ${
                      row.delta >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {row.delta >= 0 ? "+" : ""}
                    {formatCurrency(row.delta)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================
// Seller View
// ============================================

function SellerView({ data }: { data: RevenueData }) {
  const sellers = (data.sellers || []).sort((a, b) => b.totalHT - a.totalHT);

  return (
    <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Users size={14} className="text-accent" />
        <h2 className="text-xs font-bold tracking-[0.15em] uppercase text-zinc-400">
          CA PAR VENDEUR
        </h2>
      </div>

      {sellers.length === 0 ? (
        <div className="py-8 text-center text-xs text-zinc-500">
          Aucune donnee de vente par vendeur
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800/50">
              <th className="text-left text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 pb-2">
                VENDEUR
              </th>
              <th className="text-right text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 pb-2">
                FACTURES
              </th>
              <th className="text-right text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 pb-2">
                TOTAL HT
              </th>
              <th className="text-right text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 pb-2">
                TOTAL TTC
              </th>
              <th className="text-right text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 pb-2">
                % DU TOTAL
              </th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const grandTotal = sellers.reduce((s, r) => s + r.totalHT, 0);
              return sellers.map((row) => (
                <tr
                  key={row.sellerId}
                  className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors"
                >
                  <td className="py-2.5 text-sm text-zinc-100 font-medium">
                    {row.sellerName}
                  </td>
                  <td className="py-2.5 text-sm text-zinc-100 text-right tabular-nums">
                    {row.invoiceCount}
                  </td>
                  <td className="py-2.5 text-sm text-zinc-100 text-right tabular-nums font-medium">
                    {formatCurrency(row.totalHT)}
                  </td>
                  <td className="py-2.5 text-sm text-zinc-100 text-right tabular-nums font-medium">
                    {formatCurrency(row.totalTTC)}
                  </td>
                  <td className="py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{
                            width: `${grandTotal > 0 ? (row.totalHT / grandTotal) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-zinc-400 tabular-nums w-10 text-right">
                        {grandTotal > 0
                          ? ((row.totalHT / grandTotal) * 100).toFixed(1)
                          : "0.0"}
                        %
                      </span>
                    </div>
                  </td>
                </tr>
              ));
            })()}
            {/* Total row */}
            <tr className="border-t border-zinc-700/50">
              <td className="py-2.5 text-xs font-bold text-zinc-400">TOTAL</td>
              <td className="py-2.5 text-sm text-zinc-100 text-right tabular-nums font-bold">
                {sellers.reduce((s, r) => s + r.invoiceCount, 0)}
              </td>
              <td className="py-2.5 text-sm text-zinc-100 text-right tabular-nums font-bold">
                {formatCurrency(sellers.reduce((s, r) => s + r.totalHT, 0))}
              </td>
              <td className="py-2.5 text-sm text-zinc-100 text-right tabular-nums font-bold">
                {formatCurrency(sellers.reduce((s, r) => s + r.totalTTC, 0))}
              </td>
              <td className="py-2.5 text-sm text-zinc-400 text-right tabular-nums font-bold">
                100%
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}

// ============================================
// Month View
// ============================================

function MonthView({ data, year }: { data: RevenueData; year: number }) {
  const months = data.months || [];

  // Prepare chart data
  const chartData = months.map((m) => ({
    month: formatMonthLabel(m.month),
    "CA Alloue": m.caAlloue,
    "CA Facture": m.caFacture,
    "CA Encaisse": m.caEncaisse,
  }));

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={14} className="text-accent" />
          <h2 className="text-xs font-bold tracking-[0.15em] uppercase text-zinc-400">
            EVOLUTION MENSUELLE DU CA - {year}
          </h2>
        </div>

        {chartData.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            Aucune donnee pour cette annee
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} barGap={2} barCategoryGap="15%">
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: "#71717A" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#71717A" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                }
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(139, 92, 246, 0.06)" }} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "11px", color: "#A1A1AA" }}
              />
              <Bar
                dataKey="CA Alloue"
                fill="#8B5CF6"
                radius={[3, 3, 0, 0]}
                maxBarSize={30}
              />
              <Bar
                dataKey="CA Facture"
                fill="#3B82F6"
                radius={[3, 3, 0, 0]}
                maxBarSize={30}
              />
              <Bar
                dataKey="CA Encaisse"
                fill="#10B981"
                radius={[3, 3, 0, 0]}
                maxBarSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Table */}
      <div className="bg-surface-raised border border-zinc-800/50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={14} className="text-info" />
          <h2 className="text-xs font-bold tracking-[0.15em] uppercase text-zinc-400">
            DETAIL MENSUEL
          </h2>
        </div>

        {months.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            Aucune donnee pour cette annee
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800/50">
                <th className="text-left text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 pb-2">
                  MOIS
                </th>
                <th className="text-right text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 pb-2">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-accent inline-block" />
                    CA ALLOUE
                  </span>
                </th>
                <th className="text-right text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 pb-2">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-info inline-block" />
                    CA FACTURE
                  </span>
                </th>
                <th className="text-right text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 pb-2">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-success inline-block" />
                    CA ENCAISSE
                  </span>
                </th>
                <th className="text-right text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500 pb-2">
                  ECART FACT/ALLOUE
                </th>
              </tr>
            </thead>
            <tbody>
              {months.map((row) => {
                const ecart = row.caFacture - row.caAlloue;
                return (
                  <tr
                    key={row.month}
                    className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors"
                  >
                    <td className="py-2.5 text-sm text-zinc-100 font-medium">
                      {formatMonthLabel(row.month)}
                    </td>
                    <td className="py-2.5 text-sm text-zinc-100 text-right tabular-nums">
                      {formatCurrency(row.caAlloue)}
                    </td>
                    <td className="py-2.5 text-sm text-zinc-100 text-right tabular-nums">
                      {formatCurrency(row.caFacture)}
                    </td>
                    <td className="py-2.5 text-sm text-zinc-100 text-right tabular-nums">
                      {formatCurrency(row.caEncaisse)}
                    </td>
                    <td
                      className={`py-2.5 text-sm text-right tabular-nums font-medium ${
                        ecart >= 0 ? "text-success" : "text-danger"
                      }`}
                    >
                      {ecart >= 0 ? "+" : ""}
                      {formatCurrency(ecart)}
                    </td>
                  </tr>
                );
              })}
              {/* Total row */}
              <tr className="border-t border-zinc-700/50">
                <td className="py-2.5 text-xs font-bold text-zinc-400">TOTAL</td>
                <td className="py-2.5 text-sm text-zinc-100 text-right tabular-nums font-bold">
                  {formatCurrency(months.reduce((s, r) => s + r.caAlloue, 0))}
                </td>
                <td className="py-2.5 text-sm text-zinc-100 text-right tabular-nums font-bold">
                  {formatCurrency(months.reduce((s, r) => s + r.caFacture, 0))}
                </td>
                <td className="py-2.5 text-sm text-zinc-100 text-right tabular-nums font-bold">
                  {formatCurrency(months.reduce((s, r) => s + r.caEncaisse, 0))}
                </td>
                <td
                  className={`py-2.5 text-sm text-right tabular-nums font-bold ${
                    months.reduce((s, r) => s + r.caFacture - r.caAlloue, 0) >= 0
                      ? "text-success"
                      : "text-danger"
                  }`}
                >
                  {months.reduce((s, r) => s + r.caFacture - r.caAlloue, 0) >= 0 ? "+" : ""}
                  {formatCurrency(
                    months.reduce((s, r) => s + r.caFacture - r.caAlloue, 0)
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
