"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field } from "@/components/forms/Field";
import { InputMoney } from "@/components/forms/InputMoney";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Label } from "@/components/ui/label";
import { getFormError } from "@/lib/form";
import { createDevice } from "../actions";
import { ConditionNoteField } from "./ConditionNoteField";

export function DeviceForm({ defaultDate }: { defaultDate: string }) {
  const router = useRouter();
  const [state, formAction] = useActionState(createDevice, null);
  const [buyPrice, setBuyPrice] = useState<number | undefined>(undefined);
  const [payLater, setPayLater] = useState(false);
  const [paid, setPaid] = useState<number | undefined>(undefined);

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
      <input type="hidden" name="paidAmount" value={paidAmount ?? ""} />

      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <Field label="Tên máy" name="name" required error={fieldErrors?.name?.[0]} />
      <ConditionNoteField error={fieldErrors?.conditionNote?.[0]} />
      <Label className="flex flex-col items-start gap-1.5">
        Giá mua (₫)
        <InputMoney value={buyPrice} onChange={setBuyPrice} name="buyPrice" required />
      </Label>
      {fieldErrors?.buyPrice?.[0] && <p className="text-xs text-destructive">{fieldErrors.buyPrice[0]}</p>}
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
          <Label className="flex flex-col items-start gap-1.5">
            Đã trả (₫)
            <InputMoney value={paid} onChange={setPaid} />
          </Label>
          {fieldErrors?.paidAmount?.[0] && (
            <p className="text-xs text-destructive">{fieldErrors.paidAmount[0]}</p>
          )}
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
