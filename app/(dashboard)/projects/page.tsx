import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const statusColors: Record<string, "default" | "info" | "warning" | "success" | "secondary"> = {
  planning: "secondary",
  active: "info",
  on_hold: "warning",
  completed: "success",
};

const projects = [
  { id: 1, title: "Campagne Luxe Q1", company: "LVMH", status: "active", budget: "45 000 EUR", progress: 65, deadline: "15 Mar 2025" },
  { id: 2, title: "Refonte Brand", company: "Kering", status: "active", budget: "78 000 EUR", progress: 30, deadline: "30 Apr 2025" },
  { id: 3, title: "Content Strategy", company: "Hermès", status: "planning", budget: "32 000 EUR", progress: 0, deadline: "01 Jun 2025" },
  { id: 4, title: "Brand Audit", company: "Hermès", status: "completed", budget: "24 000 EUR", progress: 100, deadline: "01 Feb 2025" },
  { id: 5, title: "Digital Campaign", company: "Chanel", status: "on_hold", budget: "56 000 EUR", progress: 15, deadline: "15 May 2025" },
];

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Projects" description="Suivi de vos projets en cours">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau projet
        </Button>
      </PageHeader>

      <div className="space-y-3">
        {projects.map((project) => (
          <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-brand/10 text-brand text-sm font-bold">
                      {project.company.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-sm font-semibold">{project.title}</h3>
                    <p className="text-xs text-muted-foreground">{project.company} · {project.deadline}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{project.budget}</p>
                  </div>
                  <Badge variant={statusColors[project.status]}>
                    {project.status.replace("_", " ")}
                  </Badge>
                  {/* Progress bar */}
                  <div className="w-24">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{project.progress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
