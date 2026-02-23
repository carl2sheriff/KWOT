"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Clock,
  Wallet,
  FileText,
  Receipt,
  CreditCard,
  FileX2,
  ShoppingCart,
  BarChart3,
  Package,
  Settings,
  LogOut,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Navigation",
    items: [
      { label: "Tableau de bord", href: "/", icon: LayoutDashboard },
      { label: "Projets", href: "/projets", icon: FolderKanban },
      { label: "Pipeline", href: "/pipeline", icon: FolderKanban },
      { label: "Clients", href: "/clients", icon: Users },
    ],
  },
  {
    title: "Production",
    items: [
      { label: "Suivi du temps", href: "/temps", icon: Clock },
      { label: "Depenses", href: "/depenses", icon: Wallet },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Devis", href: "/devis", icon: FileText },
      { label: "Factures", href: "/factures", icon: Receipt },
      { label: "Paiements", href: "/paiements", icon: CreditCard },
      { label: "Avoirs", href: "/avoirs", icon: FileX2 },
      { label: "Bons de commande", href: "/purchase-orders", icon: ShoppingCart },
      { label: "Reporting", href: "/reporting", icon: BarChart3 },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { label: "Catalogue", href: "/catalogue", icon: Package },
    ],
  },
  {
    title: "Systeme",
    items: [
      { label: "Parametres", href: "/settings", icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string): boolean => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 w-[240px] h-full bg-surface-raised border-r border-zinc-800/50 flex flex-col z-50">
      {/* Logo */}
      <div className="px-5 pt-7 pb-2">
        <Link href="/" className="flex items-baseline gap-1.5 hover:opacity-80 transition-opacity">
          <span className="text-gradient font-bold text-xl">FINANCE</span>
          <span className="text-xs text-zinc-500 ml-1">by Sheriff Projects</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto pt-2 px-3">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="text-2xs font-medium tracking-wider uppercase text-zinc-600 px-3 mt-6 mb-1.5">
              {section.title}
            </p>

            {section.items.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "text-sm font-medium",
                    "px-3 py-2 rounded-lg",
                    "flex items-center gap-3",
                    "transition-all duration-150",
                    active
                      ? "bg-accent/10 text-accent"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-5 pb-5 pt-4 border-t border-zinc-800/50">
        <button
          className="flex items-center gap-3 text-sm font-medium text-zinc-500 hover:text-danger transition-colors px-1 py-2"
          onClick={() => {}}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Deconnexion</span>
        </button>
        <p className="text-2xs text-zinc-700 px-1 mt-2">v0.1 beta</p>
      </div>
    </aside>
  );
}
