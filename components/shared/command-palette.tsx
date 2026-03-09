"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCrmStore } from "@/lib/stores/crm";
import { Users, Building2, Handshake, FolderKanban, FileText, Activity, Settings, LayoutDashboard, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  href: string;
  category: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const { contacts, companies, deals } = useCrmStore();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery("");
        setSelectedIndex(0);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const pages: CommandItem[] = [
    { id: "nav-dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" />, href: "/", category: "Navigation" },
    { id: "nav-contacts", label: "Contacts", icon: <Users className="h-4 w-4" />, href: "/contacts", category: "Navigation" },
    { id: "nav-companies", label: "Companies", icon: <Building2 className="h-4 w-4" />, href: "/companies", category: "Navigation" },
    { id: "nav-deals", label: "Deals", icon: <Handshake className="h-4 w-4" />, href: "/deals", category: "Navigation" },
    { id: "nav-projects", label: "Projects", icon: <FolderKanban className="h-4 w-4" />, href: "/projects", category: "Navigation" },
    { id: "nav-invoices", label: "Invoices", icon: <FileText className="h-4 w-4" />, href: "/invoices", category: "Navigation" },
    { id: "nav-activities", label: "Activities", icon: <Activity className="h-4 w-4" />, href: "/activities", category: "Navigation" },
    { id: "nav-settings", label: "Settings", icon: <Settings className="h-4 w-4" />, href: "/settings", category: "Navigation" },
  ];

  const contactItems: CommandItem[] = contacts.slice(0, 5).map((c) => ({
    id: `contact-${c.id}`,
    label: `${c.firstName} ${c.lastName}`,
    sublabel: c.email,
    icon: <Users className="h-4 w-4" />,
    href: "/contacts",
    category: "Contacts",
  }));

  const companyItems: CommandItem[] = companies.slice(0, 5).map((c) => ({
    id: `company-${c.id}`,
    label: c.name,
    sublabel: c.industry || "",
    icon: <Building2 className="h-4 w-4" />,
    href: "/companies",
    category: "Companies",
  }));

  const dealItems: CommandItem[] = deals.slice(0, 5).map((d) => ({
    id: `deal-${d.id}`,
    label: d.title,
    sublabel: d.stage,
    icon: <Handshake className="h-4 w-4" />,
    href: "/deals",
    category: "Deals",
  }));

  const allItems = [...pages, ...contactItems, ...companyItems, ...dealItems];

  const filteredItems = query
    ? allItems.filter((item) =>
        `${item.label} ${item.sublabel || ""}`.toLowerCase().includes(query.toLowerCase())
      )
    : pages;

  const handleSelect = useCallback(
    (item: CommandItem) => {
      setOpen(false);
      router.push(item.href);
    },
    [router]
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filteredItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex]);
      }
    }
  }

  const grouped = filteredItems.reduce<Record<string, CommandItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Rechercher contacts, companies, deals..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            ESC
          </kbd>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Aucun résultat</p>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="mb-2">
                <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">{category}</p>
                {items.map((item) => {
                  const globalIndex = filteredItems.indexOf(item);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors",
                        globalIndex === selectedIndex
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50"
                      )}
                    >
                      <span className="text-muted-foreground">{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                      {item.sublabel && (
                        <span className="text-xs text-muted-foreground ml-auto">{item.sublabel}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
