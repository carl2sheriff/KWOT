"use client";

import { useState } from "react";
import { Plus, Search, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useCrmStore } from "@/lib/stores/crm";
import { formatCurrency } from "@/lib/utils";
import { Company } from "@/types";
import { toast } from "sonner";

export default function CompaniesPage() {
  const { companies, contacts, deals, addCompany, updateCompany, deleteCompany } = useCrmStore();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState({ name: "", domain: "", industry: "", size: "", address: "", city: "", country: "", notes: "" });

  const filtered = companies.filter((c) =>
    `${c.name} ${c.industry} ${c.city}`.toLowerCase().includes(search.toLowerCase())
  );

  function openNew() {
    setEditing(null);
    setForm({ name: "", domain: "", industry: "", size: "", address: "", city: "", country: "", notes: "" });
    setDialogOpen(true);
  }

  function openEdit(company: Company) {
    setEditing(company);
    setForm({ name: company.name, domain: company.domain || "", industry: company.industry || "", size: company.size || "", address: company.address || "", city: company.city || "", country: company.country || "", notes: company.notes || "" });
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.name) { toast.error("Le nom est requis"); return; }
    if (editing) {
      updateCompany(editing.id, form);
      toast.success("Entreprise mise à jour");
    } else {
      addCompany(form);
      toast.success("Entreprise créée");
    }
    setDialogOpen(false);
  }

  function handleDelete(id: string) {
    deleteCompany(id);
    toast.success("Entreprise supprimée");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Companies" description={`${companies.length} entreprises`}>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle entreprise
        </Button>
      </PageHeader>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Rechercher une entreprise..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((company) => {
          const companyContacts = contacts.filter((c) => c.companyId === company.id);
          const companyDeals = deals.filter((d) => d.companyId === company.id);
          const revenue = companyDeals.filter((d) => d.stage === "won").reduce((sum, d) => sum + d.value, 0);

          return (
            <Card key={company.id} className="group relative hover:shadow-md transition-shadow">
              <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(company)}>
                      <Pencil className="mr-2 h-3.5 w-3.5" /> Modifier
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                          <Trash2 className="mr-2 h-3.5 w-3.5" /> Supprimer
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer {company.name} ?</AlertDialogTitle>
                          <AlertDialogDescription>Cette action supprimera l&apos;entreprise.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(company.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-brand/10 text-brand font-bold">
                      {company.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{company.name}</h3>
                    <div className="flex gap-2 mt-1">
                      {company.industry && <Badge variant="secondary">{company.industry}</Badge>}
                      {company.city && <span className="text-xs text-muted-foreground">{company.city}</span>}
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold">{companyContacts.length}</p>
                    <p className="text-xs text-muted-foreground">Contacts</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{companyDeals.length}</p>
                    <p className="text-xs text-muted-foreground">Deals</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold">{formatCurrency(revenue)}</p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier l'entreprise" : "Nouvelle entreprise"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Domaine</Label>
                <Input value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} placeholder="exemple.com" />
              </div>
              <div className="space-y-2">
                <Label>Industrie</Label>
                <Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ville</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Pays</Label>
                <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave}>{editing ? "Sauvegarder" : "Créer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
