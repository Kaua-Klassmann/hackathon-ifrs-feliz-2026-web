"use client";

import * as React from "react";

import { MoreHorizontal } from "@/components/icons";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { UserRow } from "./data";

interface UserRowActionsProps {
  readonly user: UserRow;
  readonly onDeactivate: (user: UserRow) => void;
}

export function UserRowActions({ user, onDeactivate }: UserRowActionsProps) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const isDeactivated = user.status === "Desativado";

  function handleConfirm() {
    setConfirmOpen(false);
    onDeactivate(user);
  }

  return (
    <div className="text-right">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              aria-label={`Abrir ações de ${user.name}`}
              className="text-muted-foreground"
              size="icon-sm"
              variant="ghost"
            />
          }
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Ver perfil</DropdownMenuItem>
          <DropdownMenuItem>Editar usuário</DropdownMenuItem>
          <DropdownMenuItem>Gerenciar time</DropdownMenuItem>
          <DropdownMenuItem>Reenviar convite</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={isDeactivated}
            onClick={() => setConfirmOpen(true)}
          >
            Desativar usuário
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="text-left">
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar {user.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              A pessoa perde o acesso à organização imediatamente. Você pode reativá-la depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirm}>
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
