import {
  LayoutDashboard,
  Users,
  Building2,
  Handshake,
  FolderKanban,
  FileText,
  Activity,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navigation: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    label: "CRM",
    items: [
      { title: "Contacts", href: "/contacts", icon: Users },
      { title: "Companies", href: "/companies", icon: Building2 },
      { title: "Deals", href: "/deals", icon: Handshake },
    ],
  },
  {
    label: "Delivery",
    items: [
      { title: "Projects", href: "/projects", icon: FolderKanban },
      { title: "Invoices", href: "/invoices", icon: FileText },
      { title: "Activities", href: "/activities", icon: Activity },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Settings", href: "/settings", icon: Settings },
    ],
  },
];
