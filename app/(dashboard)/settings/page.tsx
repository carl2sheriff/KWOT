"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/stores/auth";
import { toast } from "sonner";

const teamMembers = [
  { name: "Carl Sheriff", email: "carl@sheriff.studio", role: "Admin" },
  { name: "Alex Designer", email: "alex@sheriff.studio", role: "Member" },
  { name: "Jordan Dev", email: "jordan@sheriff.studio", role: "Member" },
];

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [firstName, setFirstName] = useState("Carl");
  const [lastName, setLastName] = useState("Sheriff");
  const [email, setEmail] = useState(user?.email || "carl@sheriff.studio");

  function handleSave() {
    toast.success("Profil mis à jour");
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Settings" description="Gérez votre profil et vos préférences" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profil</CardTitle>
          <CardDescription>Informations personnelles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-brand text-white text-lg">CS</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{firstName} {lastName}</p>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>
          <Separator />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rôle</Label>
              <Input id="role" defaultValue="Admin" disabled />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave}>Sauvegarder</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Équipe</CardTitle>
          <CardDescription>Membres de votre équipe Sheriff</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.map((member) => (
              <div key={member.email} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs bg-brand/10 text-brand">
                      {member.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <Badge variant={member.role === "Admin" ? "default" : "secondary"}>{member.role}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Zone de danger</CardTitle>
          <CardDescription>Actions irréversibles</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" size="sm">Supprimer mon compte</Button>
        </CardContent>
      </Card>
    </div>
  );
}
