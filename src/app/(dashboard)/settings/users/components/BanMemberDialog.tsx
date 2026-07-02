"use client";

import { useActionState, useEffect } from "react";
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
import { banMember } from "../actions";

export function BanMemberDialog({
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
  const [state, formAction] = useActionState(banMember, null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Đã khóa tài khoản");
      onOpenChange(false);
    }
  }, [state, onOpenChange]);

  const { fieldErrors, formError } = getFormError(state);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Khóa tài khoản — {name}?</DialogTitle>
          <DialogDescription>
            Thành viên bị đăng xuất ngay và không thể đăng nhập cho tới khi mở
            khóa. Lịch sử giao dịch giữ nguyên.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="userId" value={userId} />
          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <Field
            label="Lý do khóa (tuỳ chọn)"
            name="banReason"
            error={fieldErrors?.banReason?.[0]}
          />
          <DialogFooter className="mt-0">
            <DialogClose
              render={
                <Button type="button" variant="ghost" size="sm">
                  Huỷ
                </Button>
              }
            />
            <SubmitButton size="sm" variant="destructive">
              Khóa tài khoản
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
