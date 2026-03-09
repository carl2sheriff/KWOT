"use client";

import { useState } from "react";
import { Plus, Search, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useCrmStore } from "@/lib/stores/crm";
import { formatCurrency } from "@/lib/utils";
import { Invoice, InvoiceStatus } from "@/types";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; variant: "default" | "info" | "success" | "warning" | "destructive" | "secondary" }> = {
  draft: { label: "Brouillon", variant: "secondary" },
  sent: { label: "Envoyée", variant: "info" },
  paid: { label: "Payée", variant: "success" },
  overdue: { label: "En retard", variant: "destructive" },
  cancelled: { label: "Annulée", variant: "secondary" },
};

export default function InvoicesPage() {
  const { invoices, companies, addInvoice, updateInvoice, deleteInvoice } = useCrmStore();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [form, setForm] = useState({ number: "", projectId: "", companyId: "", amount: 0, currency: "EUR", status: "draft" as InvoiceStatus, dueDate: "" });

  const filtered = invoices.filter((inv) => {
    const company = companies.find((c) => c.id === inv.companyId);
    return `${inv.number} ${company?.name}`.toLowerCase().includes(search.toLowerCase());
  });

  const totalPending = invoices.filter((i) => i.status === "sent").reduce((s, i) => s + i.amount, 0);
  const totalOverdue = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.amount, 0);

  function openNew() {
    const nextNum = `INV-2025-${String(invoices.length + 1).padStart(3, "0")}`;
    setEditing(null);
    setForm({ number: nextNum, projectId: "", companyId: "", amount: 0, currency: "EUR", status: "draft", dueDate: "" });
    setDialogOpen(true);
  }

  function openEdit(invoice: Invoice) {
    setEditing(invoice);
    setForm({ number: invoice.number, projectId: invoice.projectId || "", companyId: invoice.companyId || "", amount: invoice.amount, currency: invoice.currency, status: invoice.status, dueDate: invoice.dueDate });
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.number || !form.dueDate) { toast.error("Numéro et date requis"); return; }
    if (editing) {
      updateInvoice(editing.id, form);
      toast.success("Facture mise à jour");
    } else {
      addInvoice(form);
      toast.success("Facture créée");
    }
    setDialogOpen(false);
  }

  function handleDelete(id: string) {
    deleteInvoice(id);
    toast.success("Facture supprimée");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Invoices" description={`En attente: ${formatCurrency(totalPending)} · En retard: ${formatCurrency(totalOverdue)}`}>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle facture
        </Button>
      </PageHeader>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Rechercher une facture..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Facture</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Entreprise</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Montant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Échéance</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((invoice) => {
                const company = companies.find((c) => c.id === invoice.companyId);
                const cfg = statusConfig[invoice.status];
                return (
                  <tr key={invoice.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">{invoice.number}</td>
                    <td className="px-4 py-3 text-sm">{company?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(invoice.amount)}</td>
                    <td className="px-4 py-3"><Badge variant={cfg.variant}>{cfg.label}</Badge></td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{invoice.dueDate}</td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(invoice)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {(["draft", "sent", "paid", "overdue", "cancelled"] as InvoiceStatus[]).filter((s) => s !== invoice.status).map((s) => (
                            <DropdownMenuItem key={s} onClick={() => { updateInvoice(invoice.id, { status: s, ...(s === "paid" ? { paidAt: new Date().toISOString() } : {}) }); toast.success(`Statut mis à jour`); }}>
                              Vers {statusConfig[s].label}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Supprimer
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer cette facture ?</AlertDialogTitle>
                                <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(invoice.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier la facture" : "Nouvelle facture"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Numéro *</Label>
                <Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Montant (EUR) *</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Entreprise</Label>
              <Select value={form.companyId} onValueChange={(v) => setForm({ ...form, companyId: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as InvoiceStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Échéance *</Label>
                <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
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
