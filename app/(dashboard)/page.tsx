import { Users, Building2, Handshake, FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const stats = [
  { title: "Contacts", value: "248", change: "+12 ce mois", changeType: "positive" as const, icon: Users },
  { title: "Companies", value: "64", change: "+3 ce mois", changeType: "positive" as const, icon: Building2 },
  { title: "Deals actifs", value: "18", change: "342K EUR pipeline", changeType: "neutral" as const, icon: Handshake },
  { title: "Factures", value: "12", change: "4 en attente", changeType: "negative" as const, icon: FileText },
];

const recentDeals = [
  { title: "Campagne Luxe Q1", company: "LVMH", value: "45 000 EUR", stage: "Proposal", contact: "Marie D." },
  { title: "Refonte Brand", company: "Kering", value: "78 000 EUR", stage: "Negotiation", contact: "Jean P." },
  { title: "Content Strategy", company: "Hermès", value: "32 000 EUR", stage: "Qualified", contact: "Sophie L." },
  { title: "Digital Campaign", company: "Chanel", value: "56 000 EUR", stage: "Lead", contact: "Lucas M." },
];

const stageColors: Record<string, "default" | "info" | "warning" | "success"> = {
  Lead: "default",
  Qualified: "info",
  Proposal: "warning",
  Negotiation: "success",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Vue d'ensemble de votre activité CRM"
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Deals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Deals récents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDeals.map((deal) => (
                <div key={deal.title} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-brand/10 text-brand">
                        {deal.company.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{deal.title}</p>
                      <p className="text-xs text-muted-foreground">{deal.company} · {deal.contact}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={stageColors[deal.stage]}>{deal.stage}</Badge>
                    <span className="text-sm font-medium">{deal.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: "Nouveau contact ajouté", detail: "Marie Dupont — LVMH", time: "Il y a 2h" },
                { action: "Deal mis à jour", detail: "Campagne Luxe Q1 → Proposal", time: "Il y a 3h" },
                { action: "Facture envoyée", detail: "#INV-2024-042 — 15 000 EUR", time: "Il y a 5h" },
                { action: "Meeting planifié", detail: "Call avec Kering — Demain 10h", time: "Il y a 6h" },
                { action: "Projet complété", detail: "Brand Audit — Hermès", time: "Hier" },
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-brand shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.detail}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
