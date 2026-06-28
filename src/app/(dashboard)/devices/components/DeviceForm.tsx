"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { getFormError } from "@/lib/form";
import { createDevice } from "../actions";

export function DeviceForm({ defaultDate }: { defaultDate: string }) {
  const router = useRouter();
  const [state, formAction] = useActionState(createDevice, null);
  const [buyPrice, setBuyPrice] = useState("");
  const [payLater, setPayLater] = useState(false);
  const [paid, setPaid] = useState("");

  useEffect(() => {
    if (state?.success) {
      toast.success("Đã nhập máy");
      router.push(`/devices/${state.data.id}`);
    }
  }, [state, router]);

  const { fieldErrors, formError } = getFormError(state);
  // Trả đủ → paidAmount = giá mua; trả sau → số đã trả nhập tay.
  const paidAmount = payLater ? paid : buyPrice;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="paidAmount" value={paidAmount} />

      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <Field label="Tên máy" name="name" required error={fieldErrors?.name?.[0]} />
      <Field label="Tình trạng / ghi chú" name="conditionNote" />
      <Field
        label="Giá mua (₫)"
        name="buyPrice"
        type="number"
        inputMode="numeric"
        min="0"
        required
        value={buyPrice}
        onChange={(e) => setBuyPrice(e.target.value)}
        error={fieldErrors?.buyPrice?.[0]}
      />
      <Field
        label="Ngày mua"
        name="buyDate"
        type="date"
        defaultValue={defaultDate}
        required
        error={fieldErrors?.buyDate?.[0]}
      />
      <Field label="Nguồn mua" name="buyFrom" />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={payLater}
          onChange={(e) => setPayLater(e.target.checked)}
          className="size-4 accent-primary"
        />
        Mua trả sau (ghi công nợ)
      </label>

      {payLater && (
        <>
          <Field
            label="Đã trả (₫)"
            name="paidVisible"
            type="number"
            inputMode="numeric"
            min="0"
            value={paid}
            onChange={(e) => setPaid(e.target.value)}
            error={fieldErrors?.paidAmount?.[0]}
          />
          <Field
            label="Tên đối tác (người bán)"
            name="counterpartyName"
            error={fieldErrors?.counterpartyName?.[0]}
          />
          <Field label="Ngày hẹn trả" name="dueDate" type="date" />
        </>
      )}

      <SubmitButton size="lg" fullWidth>
        Lưu máy
      </SubmitButton>
    </form>
  );
}
