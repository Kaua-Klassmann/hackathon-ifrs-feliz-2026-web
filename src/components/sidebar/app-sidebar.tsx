"use client";

import Link from "next/link";

import { Command } from "@/components/icons";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useMemo } from "react";

import { APP_CONFIG } from "@/config/app-config";
import type { SessionUser } from "@/lib/api/token";
import { filterSidebarItemsByRole, sidebarItems } from "@/navigation/sidebar/sidebar-items";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

export function AppSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & { user: SessionUser }) {

  const items = useMemo(() => filterSidebarItemsByRole(sidebarItems, user.role), [user.role]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/" />}>
              <Command />
              <span className="font-semibold text-base">{APP_CONFIG.name}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={items} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
