"use client";
"use no memo";

import type { ColumnDef } from "@tanstack/react-table";
import { parse } from "date-fns";
import { Check, Clock, X } from "@/components/icons";

import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn, getInitials } from "@/lib/utils";

import { statusMeta, type UserRow } from "./data";
import { UserRowActions } from "./user-row-actions";

function RoleCell({ role, team }: { role: string; team: string }) {
  return (
    <div className="grid gap-0.5">
      <span className="whitespace-nowrap">{role}</span>
      <span className="text-muted-foreground text-xs">{team}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: UserRow["status"] }) {
  const meta = statusMeta[status];

  return (
    <Badge className={cn("gap-1.5 border px-2 py-1 font-medium", meta.badgeClass)} variant="outline">
      <span className={cn("size-1.5 rounded-full", meta.dotClass)} />
      {status}
    </Badge>
  );
}

function getLastActiveBadge(lastActive: number) {
  if (lastActive < 1) {
    return {
      className: "bg-success text-background",
      icon: Check,
    };
  }

  if (lastActive < 4 * 60) {
    return {
      className: "bg-warning text-background",
      icon: Clock,
    };
  }

  if (lastActive < 7 * 24 * 60) {
    return {
      className: "bg-destructive",
      icon: null,
    };
  }

  return {
    className: "bg-muted-foreground text-muted",
    icon: X,
  };
}

function AvatarCell({ lastActive, name }: { lastActive: number; name: string }) {
  const badge = getLastActiveBadge(lastActive);
  const BadgeIcon = badge.icon;

  return (
    <Avatar size="lg" className="font-medium">
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
      <AvatarBadge className={badge.className}>{BadgeIcon ? <BadgeIcon /> : null}</AvatarBadge>
    </Avatar>
  );
}

function WorkspaceCell({ workspaces }: { workspaces: string[] }) {
  const [firstWorkspace, ...remainingWorkspaces] = workspaces;
  const remainingCount = remainingWorkspaces.length;

  return (
    <AvatarGroup className="*:data-[slot=avatar]:ring-0">
      {firstWorkspace ? (
        <Avatar className="after:rounded-sm">
          <AvatarFallback className="rounded-sm ring-0">{getInitials(firstWorkspace)}</AvatarFallback>
        </Avatar>
      ) : null}
      {remainingCount > 0 ? (
        <AvatarGroupCount className="rounded-sm border ring-card">+{remainingCount}</AvatarGroupCount>
      ) : null}
    </AvatarGroup>
  );
}

export function createUsersColumns({
  onDeactivate,
}: {
  onDeactivate: (user: UserRow) => void;
}): ColumnDef<UserRow>[] {
  return [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          aria-label="Selecionar todos os usuários"
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          aria-label={`Selecionar ${row.original.name}`}
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      </div>
    ),
    enableHiding: false,
    enableSorting: false,
  },
  {
    id: "search",
    accessorFn: (row) => `${row.name} ${row.email}`,
    filterFn: "includesString",
    enableHiding: true,
  },
  {
    accessorKey: "name",
    header: "Usuário",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <AvatarCell name={row.original.name} lastActive={row.original.lastActive} />
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground text-sm">{row.original.name}</div>
          <div className="truncate text-muted-foreground text-sm">{row.original.email}</div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "role",
    header: "Cargo / Time",
    filterFn: "equalsString",
    cell: ({ row }) => <RoleCell role={row.original.role} team={row.original.team} />,
  },
  {
    accessorKey: "team",
    header: "Time",
    filterFn: "equalsString",
    cell: ({ row }) => <div className="text-sm">{row.original.team}</div>,
  },
  {
    accessorKey: "workspace",
    header: "Workspace",
    filterFn: "arrIncludes",
    cell: ({ row }) => <WorkspaceCell workspaces={row.original.workspace} />,
  },
  {
    accessorKey: "status",
    header: "Status",
    filterFn: "equalsString",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: "joinedDate",
    accessorFn: (row) => parse(row.joinedDate, "dd MMM yyyy, h:mm a", new Date()).getTime(),
    header: "Entrou em",
    cell: ({ row }) => <div className="text-foreground text-sm">{row.original.joinedDate}</div>,
  },
  {
    id: "actions",
    header: () => <div className="text-right">Ações</div>,
    cell: ({ row }) => <UserRowActions user={row.original} onDeactivate={onDeactivate} />,
    enableHiding: false,
    enableSorting: false,
  },
  ];
}
