import { Plus, Search, Filter } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const contacts = [
  { id: 1, name: "Marie Dupont", email: "marie@lvmh.com", company: "LVMH", position: "Directrice Marketing", status: "active" },
  { id: 2, name: "Jean Petit", email: "jean@kering.com", company: "Kering", position: "Brand Manager", status: "active" },
  { id: 3, name: "Sophie Laurent", email: "sophie@hermes.com", company: "Hermès", position: "Head of Digital", status: "active" },
  { id: 4, name: "Lucas Martin", email: "lucas@chanel.com", company: "Chanel", position: "Creative Director", status: "inactive" },
  { id: 5, name: "Emma Bernard", email: "emma@dior.com", company: "Dior", position: "PR Manager", status: "active" },
];

export default function ContactsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Contacts" description="Gérez vos contacts et relations clients">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau contact
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher un contact..." className="pl-9" />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Filtres
        </Button>
      </div>

      {/* Contacts Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Entreprise</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Poste</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-brand/10 text-brand">
                            {contact.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{contact.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{contact.company}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{contact.position}</td>
                    <td className="px-4 py-3">
                      <Badge variant={contact.status === "active" ? "success" : "secondary"}>
                        {contact.status === "active" ? "Actif" : "Inactif"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{contact.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
