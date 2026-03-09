import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusColors: Record<string, "default" | "success" | "warning" | "destructive" | "secondary" | "info"> = {
  draft: "secondary",
  sent: "info",
  paid: "success",
  overdue: "destructive",
};

const invoices = [
  { id: "INV-2025-001", company: "LVMH", project: "Campagne Luxe Q1", amount: "15 000 EUR", status: "paid", date: "15 Jan 2025", due: "15 Feb 2025" },
  { id: "INV-2025-002", company: "Kering", project: "Refonte Brand", amount: "25 000 EUR", status: "sent", date: "01 Feb 2025", due: "01 Mar 2025" },
  { id: "INV-2025-003", company: "Hermès", project: "Brand Audit", amount: "24 000 EUR", status: "paid", date: "10 Feb 2025", due: "10 Mar 2025" },
  { id: "INV-2025-004", company: "Chanel", project: "Digital Campaign", amount: "28 000 EUR", status: "overdue", date: "01 Jan 2025", due: "01 Feb 2025" },
  { id: "INV-2025-005", company: "Dior", project: "SEO Audit", amount: "9 000 EUR", status: "draft", date: "20 Feb 2025", due: "20 Mar 2025" },
];

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Invoices" description="Facturation et suivi des paiements">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle facture
        </Button>
      </PageHeader>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Rechercher une facture..." className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Facture</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Entreprise</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Projet</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Montant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Échéance</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer">
                  <td className="px-4 py-3 text-sm font-medium">{invoice.id}</td>
                  <td className="px-4 py-3 text-sm">{invoice.company}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{invoice.project}</td>
                  <td className="px-4 py-3 text-sm font-semibold">{invoice.amount}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusColors[invoice.status]}>{invoice.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{invoice.due}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
