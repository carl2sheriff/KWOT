"use client";

import { useState } from "react";
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useCrmStore } from "@/lib/stores/crm";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Deal, DealStage } from "@/types";
import { toast } from "sonner";

const stageConfig: { key: DealStage; label: string; color: string }[] = [
  { key: "lead", label: "Lead", color: "bg-gray-400" },
  { key: "qualified", label: "Qualified", color: "bg-blue-500" },
  { key: "proposal", label: "Proposal", color: "bg-amber-500" },
  { key: "negotiation", label: "Negotiation", color: "bg-brand" },
  { key: "won", label: "Won", color: "bg-green-500" },
  { key: "lost", label: "Lost", color: "bg-red-500" },
];

export default function DealsPage() {
  const { deals, contacts, companies, addDeal, updateDeal, moveDeal, deleteDeal } = useCrmStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Deal | null>(null);
  const [form, setForm] = useState({ title: "", value: 0, currency: "EUR", stage: "lead" as DealStage, probability: 10, contactId: "", companyId: "", ownerId: "1", expectedCloseDate: "", notes: "" });

  function openNew() {
    setEditing(null);
    setForm({ title: "", value: 0, currency: "EUR", stage: "lead", probability: 10, contactId: "", companyId: "", ownerId: "1", expectedCloseDate: "", notes: "" });
    setDialogOpen(true);
  }

  function openEdit(deal: Deal) {
    setEditing(deal);
    setForm({ title: deal.title, value: deal.value, currency: deal.currency, stage: deal.stage, probability: deal.probability, contactId: deal.contactId || "", companyId: deal.companyId || "", ownerId: deal.ownerId, expectedCloseDate: deal.expectedCloseDate || "", notes: deal.notes || "" });
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.title) { toast.error("Le titre est requis"); return; }
    if (editing) {
      updateDeal(editing.id, form);
      toast.success("Deal mis à jour");
    } else {
      addDeal(form);
      toast.success("Deal créé");
    }
    setDialogOpen(false);
  }

  function handleStageMove(dealId: string, stage: DealStage) {
    moveDeal(dealId, stage);
    toast.success(`Deal déplacé vers ${stage}`);
  }

  function handleDelete(id: string) {
    deleteDeal(id);
    toast.success("Deal supprimé");
  }

  const getContactName = (contactId?: string) => {
    const c = contacts.find((c) => c.id === contactId);
    return c ? `${c.firstName} ${c.lastName.charAt(0)}.` : "";
  };
  const getCompanyName = (companyId?: string) => companies.find((c) => c.id === companyId)?.name ?? "";

  return (
    <div className="space-y-6">
      <PageHeader title="Deals" description={`${deals.length} deals · Pipeline: ${formatCurrency(deals.filter((d) => !["won", "lost"].includes(d.stage)).reduce((s, d) => s + d.value, 0))}`}>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau deal
        </Button>
      </PageHeader>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stageConfig.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.key);
          const stageValue = stageDeals.reduce((s, d) => s + d.value, 0);
          return (
            <div key={stage.key} className="min-w-[280px] flex-1">
              <div className="mb-3 flex items-center gap-2">
                <div className={cn("h-2 w-2 rounded-full", stage.color)} />
                <h3 className="text-sm font-semibold">{stage.label}</h3>
                <Badge variant="secondary" className="ml-auto text-xs">{stageDeals.length}</Badge>
                <span className="text-xs text-muted-foreground">{formatCurrency(stageValue)}</span>
              </div>
              <div className="space-y-3">
                {stageDeals.map((deal) => (
                  <Card key={deal.id} className="group relative hover:shadow-md transition-shadow">
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(deal)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {stageConfig.filter((s) => s.key !== deal.stage).map((s) => (
                            <DropdownMenuItem key={s.key} onClick={() => handleStageMove(deal.id, s.key)}>
                              <div className={cn("mr-2 h-2 w-2 rounded-full", s.color)} /> Vers {s.label}
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
                                <AlertDialogTitle>Supprimer ce deal ?</AlertDialogTitle>
                                <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(deal.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 pr-6">
                        <div>
                          <p className="text-sm font-medium">{deal.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{getCompanyName(deal.companyId)}</p>
                        </div>
                        {deal.contactId && (
                          <Avatar className="h-6 w-6 shrink-0">
                            <AvatarFallback className="text-[10px] bg-brand/10 text-brand">
                              {getContactName(deal.contactId).split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm font-bold">{formatCurrency(deal.value)}</span>
                        <span className="text-xs text-muted-foreground">{deal.probability}%</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier le deal" : "Nouveau deal"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Titre *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valeur (EUR)</Label>
                <Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Probabilité (%)</Label>
                <Input type="number" min={0} max={100} value={form.probability} onChange={(e) => setForm({ ...form, probability: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Étape</Label>
                <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v as DealStage })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {stageConfig.map((s) => (
                      <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date de clôture prévue</Label>
                <Input type="date" value={form.expectedCloseDate} onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })} />
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
            <div className="space-y-2">
              <Label>Contact</Label>
              <Select value={form.contactId} onValueChange={(v) => setForm({ ...form, contactId: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
