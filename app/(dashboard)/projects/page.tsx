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
import { Project, ProjectStatus } from "@/types";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; variant: "default" | "info" | "warning" | "success" | "secondary" | "destructive" }> = {
  planning: { label: "Planning", variant: "secondary" },
  active: { label: "Active", variant: "info" },
  on_hold: { label: "On Hold", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

export default function ProjectsPage() {
  const { projects, companies, addProject, updateProject, deleteProject } = useCrmStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState({ title: "", description: "", status: "planning" as ProjectStatus, companyId: "", dealId: "", startDate: "", endDate: "", budget: 0 });

  function openNew() {
    setEditing(null);
    setForm({ title: "", description: "", status: "planning", companyId: "", dealId: "", startDate: "", endDate: "", budget: 0 });
    setDialogOpen(true);
  }

  function openEdit(project: Project) {
    setEditing(project);
    setForm({ title: project.title, description: project.description || "", status: project.status, companyId: project.companyId || "", dealId: project.dealId || "", startDate: project.startDate || "", endDate: project.endDate || "", budget: project.budget || 0 });
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.title) { toast.error("Le titre est requis"); return; }
    if (editing) {
      updateProject(editing.id, form);
      toast.success("Projet mis à jour");
    } else {
      addProject(form);
      toast.success("Projet créé");
    }
    setDialogOpen(false);
  }

  function handleDelete(id: string) {
    deleteProject(id);
    toast.success("Projet supprimé");
  }

  const getCompanyName = (companyId?: string) => companies.find((c) => c.id === companyId)?.name ?? "—";

  return (
    <div className="space-y-6">
      <PageHeader title="Projects" description={`${projects.length} projets`}>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau projet
        </Button>
      </PageHeader>

      <div className="space-y-3">
        {projects.map((project) => {
          const cfg = statusConfig[project.status];
          return (
            <Card key={project.id} className="group relative hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-brand/10 text-brand text-sm font-bold">
                        {getCompanyName(project.companyId).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-sm font-semibold">{project.title}</h3>
                      <p className="text-xs text-muted-foreground">{getCompanyName(project.companyId)} · {project.startDate || "—"} → {project.endDate || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {project.budget ? (
                      <p className="text-sm font-medium">{formatCurrency(project.budget)}</p>
                    ) : null}
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(project)}>
                          <Pencil className="mr-2 h-3.5 w-3.5" /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {(["planning", "active", "on_hold", "completed", "cancelled"] as ProjectStatus[]).filter((s) => s !== project.status).map((s) => (
                          <DropdownMenuItem key={s} onClick={() => { updateProject(project.id, { status: s }); toast.success(`Statut mis à jour`); }}>
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
                              <AlertDialogTitle>Supprimer ce projet ?</AlertDialogTitle>
                              <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(project.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
            <DialogTitle>{editing ? "Modifier le projet" : "Nouveau projet"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
                <Label>Statut</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ProjectStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Budget (EUR)</Label>
                <Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} />
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
                <Label>Date début</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Date fin</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
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
