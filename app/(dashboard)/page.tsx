"use client";

import { Users, Building2, TrendingUp, DollarSign } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCrmStore } from "@/lib/stores/crm";
import { formatCurrency } from "@/lib/utils";

const stageColors: Record<string, "default" | "info" | "warning" | "success" | "secondary" | "destructive"> = {
  lead: "secondary",
  qualified: "info",
  proposal: "warning",
  negotiation: "default",
  won: "success",
  lost: "destructive",
};

export default function DashboardPage() {
  const { contacts, companies, deals, invoices, activities } = useCrmStore();

  const activeDeals = deals.filter((d) => !["won", "lost"].includes(d.stage));
  const pipelineValue = activeDeals.reduce((sum, d) => sum + d.value, 0);
  const wonDeals = deals.filter((d) => d.stage === "won");
  const wonValue = wonDeals.reduce((sum, d) => sum + d.value, 0);
  const pendingInvoices = invoices.filter((i) => ["sent", "overdue"].includes(i.status));
  const recentDeals = [...deals].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);
  const recentActivities = [...activities].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);

  const getCompanyName = (companyId?: string) => companies.find((c) => c.id === companyId)?.name ?? "—";
  const getContactName = (contactId?: string) => {
    const contact = contacts.find((c) => c.id === contactId);
    return contact ? `${contact.firstName} ${contact.lastName.charAt(0)}.` : "";
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Vue d'ensemble de votre activité CRM" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Contacts" value={String(contacts.length)} change={`${contacts.filter((c) => c.status === "active").length} actifs`} changeType="positive" icon={Users} />
        <StatsCard title="Companies" value={String(companies.length)} icon={Building2} />
        <StatsCard title="Pipeline" value={formatCurrency(pipelineValue)} change={`${activeDeals.length} deals actifs`} changeType="neutral" icon={TrendingUp} />
        <StatsCard title="Won" value={formatCurrency(wonValue)} change={`${wonDeals.length} deals gagnés`} changeType="positive" icon={DollarSign} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Deals récents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDeals.map((deal) => (
                <div key={deal.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-brand/10 text-brand">
                        {getCompanyName(deal.companyId).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{deal.title}</p>
                      <p className="text-xs text-muted-foreground">{getCompanyName(deal.companyId)} · {getContactName(deal.contactId)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={stageColors[deal.stage]}>{deal.stage}</Badge>
                    <span className="text-sm font-medium">{formatCurrency(deal.value)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-brand shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.companyId ? getCompanyName(activity.companyId) : ""}
                      {activity.contactId ? ` · ${getContactName(activity.contactId)}` : ""}
                    </p>
                  </div>
                  <Badge variant={activity.completedAt ? "success" : "warning"} className="text-[10px] shrink-0">
                    {activity.completedAt ? "Fait" : "À faire"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Pipeline par étape</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(["lead", "qualified", "proposal", "negotiation"] as const).map((stage) => {
                const stageDeals = deals.filter((d) => d.stage === stage);
                const stageValue = stageDeals.reduce((sum, d) => sum + d.value, 0);
                const maxValue = pipelineValue || 1;
                return (
                  <div key={stage} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize font-medium">{stage}</span>
                      <span className="text-muted-foreground">{stageDeals.length} deals · {formatCurrency(stageValue)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(stageValue / maxValue) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Factures en attente</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Aucune facture en attente</p>
            ) : (
              <div className="space-y-3">
                {pendingInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{inv.number}</p>
                      <p className="text-xs text-muted-foreground">{getCompanyName(inv.companyId)} · Éch. {inv.dueDate}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={inv.status === "overdue" ? "destructive" : "warning"}>{inv.status}</Badge>
                      <span className="text-sm font-semibold">{formatCurrency(inv.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
