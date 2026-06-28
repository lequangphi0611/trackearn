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
import { sellDevice } from "../actions";

export function SellDeviceDialog({ id, defaultDate }: { id: string; defaultDate: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(sellDevice, null);
  const [sellPrice, setSellPrice] = useState("");
  const [payLater, setPayLater] = useState(false);
  const [paid, setPaid] = useState("");

  useEffect(() => {
    if (state?.success) {
      toast.success("Đã bán máy");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
      router.refresh();
    } else if (state && !state.success && !state.fieldErrors) {
      toast.error(state.error);
    }
  }, [state, router]);

  const { fieldErrors, formError } = getFormError(state);
  const paidAmount = payLater ? paid : sellPrice;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm">Bán ra</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bán máy</DialogTitle>
          <DialogDescription>Ghi giá bán; trả sau sẽ sinh công nợ.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="paidAmount" value={paidAmount} />
          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <Field
            label="Giá bán (₫)"
            name="sellPrice"
            type="number"
            inputMode="numeric"
            min="1"
            required
            value={sellPrice}
            onChange={(e) => setSellPrice(e.target.value)}
            error={fieldErrors?.sellPrice?.[0]}
          />
          <Field
            label="Ngày bán"
            name="sellDate"
            type="date"
            defaultValue={defaultDate}
            required
            error={fieldErrors?.sellDate?.[0]}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={payLater}
              onChange={(e) => setPayLater(e.target.checked)}
              className="size-4 accent-primary"
            />
            Bán trả sau (ghi công nợ)
          </label>
          {payLater && (
            <>
              <Field
                label="Đã thu (₫)"
                name="paidVisible"
                type="number"
                inputMode="numeric"
                min="0"
                value={paid}
                onChange={(e) => setPaid(e.target.value)}
                error={fieldErrors?.paidAmount?.[0]}
              />
              <Field
                label="Tên đối tác (người mua)"
                name="counterpartyName"
                error={fieldErrors?.counterpartyName?.[0]}
              />
              <Field label="Ngày hẹn trả" name="dueDate" type="date" />
            </>
          )}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="ghost" size="sm">Huỷ</Button>} />
            <SubmitButton size="sm">Xác nhận bán</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
