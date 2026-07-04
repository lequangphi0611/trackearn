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
  const [state, setState] = useState<ActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  // Ref giữ onOpenChange mới nhất — effect chỉ phụ thuộc `state`. onOpenChange
  // là closure mới mỗi lần MemberActions render lại (vd sau revalidatePath),
  // nếu để thẳng vào deps thì effect refire dù state không đổi → toast lặp lại
  // nhiều lần (xem cách làm gốc ở SellDeviceForm.tsx).
  const onOpenChangeRef = useRef(onOpenChange);
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  });

  useEffect(() => {
    if (state?.success) {
      toast.success("Đã khóa tài khoản");
      onOpenChangeRef.current(false);
    }
  }, [state]);

  const { fieldErrors, formError } = getFormError(state);

  // Gọi Server Action thủ công — xem giải thích ở RestockDialog.tsx.
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await banMember(null, formData);
      setState(result);
    });
  }

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
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            <SubmitButton size="sm" variant="destructive" pending={isPending}>
              Khóa tài khoản
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
