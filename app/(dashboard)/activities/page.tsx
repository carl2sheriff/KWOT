import { Phone, Mail, Calendar, StickyNote, CheckCircle2, type LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

const activities = [
  { id: 1, type: "call", title: "Appel avec Marie Dupont", contact: "Marie Dupont", company: "LVMH", time: "Aujourd'hui 14:30", completed: true },
  { id: 2, type: "meeting", title: "Review Brand Strategy", contact: "Jean Petit", company: "Kering", time: "Aujourd'hui 10:00", completed: true },
  { id: 3, type: "email", title: "Envoi proposition commerciale", contact: "Sophie Laurent", company: "Hermès", time: "Hier 16:45", completed: true },
  { id: 4, type: "task", title: "Préparer deck présentation", contact: "Lucas Martin", company: "Chanel", time: "Demain 09:00", completed: false },
  { id: 5, type: "note", title: "Notes réunion stratégie Q2", contact: "Emma Bernard", company: "Dior", time: "Hier 11:00", completed: true },
  { id: 6, type: "call", title: "Follow-up proposal", contact: "Marie Dupont", company: "LVMH", time: "Demain 15:00", completed: false },
];

export default function ActivitiesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Activities" description="Historique et planification des activités" />

      <div className="space-y-3">
        {activities.map((activity) => {
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
                      <p className={cn("text-sm font-medium", activity.completed && "line-through text-muted-foreground")}>
                        {activity.title}
                      </p>
                      {!activity.completed && <Badge variant="warning" className="text-[10px]">À faire</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activity.contact} · {activity.company}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
