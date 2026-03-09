"use client";

import { useState } from "react";
import { Phone, Mail, Calendar, StickyNote, CheckCircle2, Plus, type LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCrmStore } from "@/lib/stores/crm";
import { cn } from "@/lib/utils";
import { ActivityType } from "@/types";
import { toast } from "sonner";

const typeIcons: Record<string, LucideIcon> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: StickyNote,
  task: CheckCircle2,
};

const typeColors: Record<string, string> = {
  call: "bg-green-100 text-green-600",
  email: "bg-blue-100 text-blue-600",
  meeting: "bg-purple-100 text-purple-600",
  note: "bg-amber-100 text-amber-600",
  task: "bg-brand/10 text-brand",
};

export default function ActivitiesPage() {
  const { activities, contacts, companies, addActivity, completeActivity } = useCrmStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ type: "call" as ActivityType, title: "", description: "", contactId: "", companyId: "", scheduledAt: "", userId: "1" });
  const [filter, setFilter] = useState<string>("all");

  const sorted = [...activities].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const filtered = filter === "all" ? sorted : filter === "pending" ? sorted.filter((a) => !a.completedAt) : sorted.filter((a) => a.type === filter);

  const getContactName = (contactId?: string) => {
    const c = contacts.find((c) => c.id === contactId);
    return c ? `${c.firstName} ${c.lastName}` : "";
  };
  const getCompanyName = (companyId?: string) => companies.find((c) => c.id === companyId)?.name ?? "";

  function openNew() {
    setForm({ type: "call", title: "", description: "", contactId: "", companyId: "", scheduledAt: "", userId: "1" });
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.title) { toast.error("Le titre est requis"); return; }
    addActivity(form);
    toast.success("Activité créée");
    setDialogOpen(false);
  }

  function handleComplete(id: string) {
    completeActivity(id);
    toast.success("Activité complétée");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Activities" description={`${activities.filter((a) => !a.completedAt).length} activités en attente`}>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle activité
        </Button>
      </PageHeader>

      <div className="flex gap-2">
        {[
          { key: "all", label: "Toutes" },
          { key: "pending", label: "À faire" },
          { key: "call", label: "Appels" },
          { key: "email", label: "Emails" },
          { key: "meeting", label: "Meetings" },
          { key: "task", label: "Tâches" },
          { key: "note", label: "Notes" },
        ].map((f) => (
          <Button key={f.key} variant={filter === f.key ? "default" : "outline"} size="sm" onClick={() => setFilter(f.key)}>
            {f.label}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((activity) => {
          const Icon = typeIcons[activity.type];
          return (
            <Card key={activity.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={cn("rounded-lg p-2", typeColors[activity.type])}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn("text-sm font-medium", activity.completedAt && "line-through text-muted-foreground")}>
                        {activity.title}
                      </p>
                      {!activity.completedAt && <Badge variant="warning" className="text-[10px]">À faire</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getContactName(activity.contactId)}{activity.contactId && activity.companyId ? " · " : ""}{getCompanyName(activity.companyId)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!activity.completedAt && (
                      <Button variant="outline" size="sm" onClick={() => handleComplete(activity.id)}>
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Fait
                      </Button>
                    )}
                    {activity.scheduledAt && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(activity.scheduledAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
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
            <DialogTitle>Nouvelle activité</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ActivityType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Appel</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="task">Tâche</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Titre *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            <div className="space-y-2">
              <Label>Date planifiée</Label>
              <Input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
