"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { getFormError } from "@/lib/form";
import { formatCurrency } from "@/lib/format";
import { recordDebtPayment } from "../actions";

export function RecordPaymentDialog({
  debtId,
  remaining,
  defaultDate,
}: {
  debtId: string;
  remaining: number;
  defaultDate: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(recordDebtPayment, null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Đã ghi nhận trả");
      // Đóng dialog khi action thành công — không thể suy ra lúc render mà vẫn
      // cho mở lại, nên đành set state ở effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  const { fieldErrors, formError } = getFormError(state);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm">Ghi nhận trả</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ghi nhận trả</DialogTitle>
          <DialogDescription>Còn lại {formatCurrency(remaining)}</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="debtId" value={debtId} />
          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <Field
            label="Số tiền trả (₫)"
            name="amountPaid"
            type="number"
            inputMode="numeric"
            min="1"
            required
            error={fieldErrors?.amountPaid?.[0]}
          />
          <Field
            label="Ngày trả"
            name="paidDate"
            type="date"
            defaultValue={defaultDate}
            required
            error={fieldErrors?.paidDate?.[0]}
          />
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="ghost" size="sm">Huỷ</Button>} />
            <SubmitButton size="sm">Xác nhận</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
