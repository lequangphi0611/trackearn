"use client";

import { useEffect, useState, useTransition } from "react";
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
import { MoneyField } from "@/components/forms/MoneyField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { getFormError } from "@/lib/form";
import { formatCurrency } from "@/lib/format";
import type { ActionResult } from "@/lib/types";
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
  const [state, setState] = useState<ActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [amountPaid, setAmountPaid] = useState<number | undefined>(undefined);

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

  // Gọi Server Action thủ công — xem giải thích ở RestockDialog.tsx.
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await recordDebtPayment(null, formData);
      setState(result);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm">Ghi nhận trả</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ghi nhận trả</DialogTitle>
          <DialogDescription>Còn lại {formatCurrency(remaining)}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="debtId" value={debtId} />
          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <MoneyField
            label="Số tiền trả (₫)"
            name="amountPaid"
            value={amountPaid}
            onChange={setAmountPaid}
            min={1}
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
            <SubmitButton size="sm" pending={isPending}>Xác nhận</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
