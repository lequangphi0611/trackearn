"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { getFormError } from "@/lib/form";
import type { ActionResult } from "@/lib/types";
import { deleteMember } from "../actions";

export function DeleteMemberDialog({
  userId,
  name,
  hasTransactions,
  open,
  onOpenChange,
}: {
  userId: string;
  name: string;
  hasTransactions: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, setState] = useState<ActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  // Ref giữ onOpenChange mới nhất — xem giải thích ở BanMemberDialog.tsx.
  const onOpenChangeRef = useRef(onOpenChange);
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  });

  useEffect(() => {
    if (state?.success) {
      toast.success("Đã xóa thành viên");
      onOpenChangeRef.current(false);
    }
  }, [state]);

  const { formError } = getFormError(state);

  // Gọi Server Action thủ công — xem giải thích ở RestockDialog.tsx.
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await deleteMember(null, formData);
      setState(result);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xóa thành viên — {name}?</DialogTitle>
          <DialogDescription>
            {hasTransactions
              ? "Thành viên đã có giao dịch nên không thể xóa (để giữ dấu người thực hiện). Hãy dùng Khóa tài khoản thay thế."
              : "Xóa vĩnh viễn tài khoản này. Không thể hoàn tác."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="userId" value={userId} />
          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <DialogFooter className="mt-0">
            <DialogClose
              render={
                <Button type="button" variant="ghost" size="sm">
                  Huỷ
                </Button>
              }
            />
            {!hasTransactions && (
              <SubmitButton size="sm" variant="destructive" pending={isPending}>
                Xóa vĩnh viễn
              </SubmitButton>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
