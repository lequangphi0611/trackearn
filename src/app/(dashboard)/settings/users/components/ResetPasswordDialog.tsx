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
import { Field } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { getFormError } from "@/lib/form";
import type { ActionResult } from "@/lib/types";
import { resetMemberPassword } from "../actions";

export function ResetPasswordDialog({
  userId,
  name,
  open,
  onOpenChange,
}: {
  userId: string;
  name: string;
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
      toast.success("Đã đặt lại mật khẩu");
      onOpenChangeRef.current(false);
    }
  }, [state]);

  const { fieldErrors, formError } = getFormError(state);

  // Gọi Server Action thủ công — xem giải thích ở RestockDialog.tsx.
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await resetMemberPassword(null, formData);
      setState(result);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đặt lại mật khẩu — {name}</DialogTitle>
          <DialogDescription>
            Đặt mật khẩu mới cho thành viên, không cần mật khẩu cũ.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="userId" value={userId} />
          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <Field
            label="Mật khẩu mới"
            name="newPassword"
            type="password"
            required
            hint="Tối thiểu 8 ký tự"
            error={fieldErrors?.newPassword?.[0]}
          />
          <DialogFooter className="mt-0">
            <DialogClose
              render={
                <Button type="button" variant="ghost" size="sm">
                  Huỷ
                </Button>
              }
            />
            <SubmitButton size="sm" pending={isPending}>
              Đặt lại mật khẩu
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
