import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Deal {
  id: number;
  title: string;
  company: string;
  value: string;
  contact: string;
  probability: number;
}

const stages: { key: string; label: string; color: string; deals: Deal[] }[] = [
  {
    key: "lead",
    label: "Lead",
    color: "bg-gray-400",
    deals: [
      { id: 1, title: "Digital Campaign", company: "Chanel", value: "56 000 EUR", contact: "Lucas M.", probability: 10 },
      { id: 2, title: "SEO Audit", company: "Dior", value: "18 000 EUR", contact: "Emma B.", probability: 20 },
    ],
  },
  {
    key: "qualified",
    label: "Qualified",
    color: "bg-blue-500",
    deals: [
      { id: 3, title: "Content Strategy", company: "Hermès", value: "32 000 EUR", contact: "Sophie L.", probability: 40 },
    ],
  },
  {
    key: "proposal",
    label: "Proposal",
    color: "bg-amber-500",
    deals: [
      { id: 4, title: "Campagne Luxe Q1", company: "LVMH", value: "45 000 EUR", contact: "Marie D.", probability: 60 },
    ],
  },
  {
    key: "negotiation",
    label: "Negotiation",
    color: "bg-brand",
    deals: [
      { id: 5, title: "Refonte Brand", company: "Kering", value: "78 000 EUR", contact: "Jean P.", probability: 80 },
    ],
  },
  {
    key: "won",
    label: "Won",
    color: "bg-green-500",
    deals: [
      { id: 6, title: "Brand Audit", company: "Hermès", value: "24 000 EUR", contact: "Sophie L.", probability: 100 },
    ],
  },
];

export default function DealsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Deals" description="Pipeline commercial et opportunités">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau deal
        </Button>
      </PageHeader>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div key={stage.key} className="min-w-[280px] flex-1">
            <div className="mb-3 flex items-center gap-2">
              <div className={cn("h-2 w-2 rounded-full", stage.color)} />
              <h3 className="text-sm font-semibold">{stage.label}</h3>
              <Badge variant="secondary" className="ml-auto text-xs">
                {stage.deals.length}
              </Badge>
            </div>
            <div className="space-y-3">
              {stage.deals.map((deal) => (
                <Card key={deal.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{deal.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{deal.company}</p>
                      </div>
                      <Avatar className="h-6 w-6 shrink-0">
                        <AvatarFallback className="text-[10px] bg-brand/10 text-brand">
                          {deal.contact.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-bold">{deal.value}</span>
                      <span className="text-xs text-muted-foreground">{deal.probability}%</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
