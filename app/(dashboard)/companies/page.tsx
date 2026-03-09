import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const companies = [
  { id: 1, name: "LVMH", industry: "Luxe", contacts: 12, deals: 3, revenue: "145 000 EUR" },
  { id: 2, name: "Kering", industry: "Luxe", contacts: 8, deals: 2, revenue: "98 000 EUR" },
  { id: 3, name: "Hermès", industry: "Luxe", contacts: 5, deals: 1, revenue: "32 000 EUR" },
  { id: 4, name: "Chanel", industry: "Luxe", contacts: 6, deals: 2, revenue: "112 000 EUR" },
  { id: 5, name: "Dior", industry: "Luxe", contacts: 4, deals: 1, revenue: "56 000 EUR" },
];

export default function CompaniesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Companies" description="Gérez vos entreprises clientes">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle entreprise
        </Button>
      </PageHeader>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Rechercher une entreprise..." className="pl-9" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((company) => (
          <Card key={company.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-brand/10 text-brand font-bold">
                    {company.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{company.name}</h3>
                  <Badge variant="secondary" className="mt-1">{company.industry}</Badge>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold">{company.contacts}</p>
                  <p className="text-xs text-muted-foreground">Contacts</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{company.deals}</p>
                  <p className="text-xs text-muted-foreground">Deals</p>
                </div>
                <div>
                  <p className="text-sm font-bold">{company.revenue}</p>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
