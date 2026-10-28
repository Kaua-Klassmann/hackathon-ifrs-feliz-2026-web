import {
  Activity,
  FileText,
  History,
  type Icon,
  LayoutDashboard,
  Stethoscope,
  Users,
} from "@/components/icons";

import { hasRoleAccess, type UserRole } from "@/lib/api/token";

export type NavBadge = "new" | "soon";

export interface NavSubItem {
  id: string;
  title: string;
  url: string;
  icon?: Icon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
  requiredRole?: UserRole;
}

interface NavItemBase {
  id: string;
  title: string;
  icon?: Icon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
  requiredRole?: UserRole;
}

export interface NavMainLinkItem extends NavItemBase {
  url: string;
  subItems?: never;
}

export interface NavMainParentItem extends NavItemBase {
  subItems: NavSubItem[];
}

export type NavMainItem = NavMainLinkItem | NavMainParentItem;

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
  requiredRole?: UserRole;
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Aplicação",
    items: [
      {
        id: "dashboard",
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboard,
      },
      {
        id: "patient",
        title: "Pacientes",
        url: "/patient",
        icon: Stethoscope,
        badge: "new",
      },
      {
        id: "analysis",
        title: "Análises",
        url: "/analysis",
        icon: Activity,
        badge: "new",
      },
      {
        id: "history",
        title: "Histórico",
        url: "/history",
        icon: History,
        badge: "new",
      },
      {
        id: "reports",
        title: "Relatórios",
        url: "/reports",
        icon: FileText,
        badge: "soon",
        disabled: true,
      },
    ],
  },
  {
    id: 2,
    label: "Administração",
    requiredRole: "ADMIN",
    items: [
      {
        id: "users",
        title: "Usuários",
        url: "/users",
        icon: Users,
      },
    ],
  },
];

function isVisibleToRole(requiredRole: UserRole | undefined, role: UserRole): boolean {
  return requiredRole === undefined || hasRoleAccess(role, requiredRole);
}

function isParentItem(item: NavMainItem): item is NavMainParentItem {
  return Boolean(item.subItems?.length);
}

export function filterSidebarItemsByRole(groups: readonly NavGroup[], role: UserRole): NavGroup[] {
  return groups
    .filter((group) => isVisibleToRole(group.requiredRole, role))
    .map<NavGroup>((group) => ({
      ...group,
      items: group.items
        .filter((item) => isVisibleToRole(item.requiredRole, role))
        .map((item) =>
          isParentItem(item)
            ? { ...item, subItems: item.subItems.filter((sub) => isVisibleToRole(sub.requiredRole, role)) }
            : item,
        ),
    }))
    .filter((group) => group.items.length > 0);
}
