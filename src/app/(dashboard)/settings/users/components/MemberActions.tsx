"use client";

import { useState } from "react";
import { EllipsisVertical, KeyRound, Lock, LockOpen, Trash2 } from "lucide-react";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { ResetPasswordDialog } from "./ResetPasswordDialog";
import { BanMemberDialog } from "./BanMemberDialog";
import { UnbanMemberDialog } from "./UnbanMemberDialog";
import { DeleteMemberDialog } from "./DeleteMemberDialog";

type DialogKind = "reset" | "ban" | "unban" | "delete" | null;

export function MemberActions({
  userId,
  name,
  banned,
  hasTransactions,
}: {
  userId: string;
  name: string;
  banned: boolean;
  hasTransactions: boolean;
}) {
  const [dialog, setDialog] = useState<DialogKind>(null);
  const close = (open: boolean) => {
    if (!open) setDialog(null);
  };

  return (
    <>
      <Menu>
        <MenuTrigger
          aria-label={`Thao tác với ${name}`}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <EllipsisVertical className="size-4" />
        </MenuTrigger>
        <MenuContent align="end">
          <MenuItem onClick={() => setDialog("reset")} className="gap-2">
            <KeyRound className="size-4" />
            Đặt lại mật khẩu
          </MenuItem>
          {banned ? (
            <MenuItem onClick={() => setDialog("unban")} className="gap-2">
              <LockOpen className="size-4" />
              Mở khóa
            </MenuItem>
          ) : (
            <MenuItem onClick={() => setDialog("ban")} className="gap-2">
              <Lock className="size-4" />
              Khóa tài khoản
            </MenuItem>
          )}
          <MenuSeparator className="my-1 h-px bg-border" />
          <MenuItem
            onClick={() => setDialog("delete")}
            className="gap-2 text-expense data-[highlighted]:text-expense"
          >
            <Trash2 className="size-4" />
            Xóa
          </MenuItem>
        </MenuContent>
      </Menu>

      <ResetPasswordDialog
        userId={userId}
        name={name}
        open={dialog === "reset"}
        onOpenChange={close}
      />
      <BanMemberDialog
        userId={userId}
        name={name}
        open={dialog === "ban"}
        onOpenChange={close}
      />
      <UnbanMemberDialog
        userId={userId}
        name={name}
        open={dialog === "unban"}
        onOpenChange={close}
      />
      <DeleteMemberDialog
        userId={userId}
        name={name}
        hasTransactions={hasTransactions}
        open={dialog === "delete"}
        onOpenChange={close}
      />
    </>
  );
}
