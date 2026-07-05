"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field } from "@/components/forms/Field";
import { MoneyField } from "@/components/forms/MoneyField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { getFormError } from "@/lib/form";
import { createOrRestockSparePart } from "../actions";

export function SparePartForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(createOrRestockSparePart, null);
  const [buyPrice, setBuyPrice] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (state?.success) {
      toast.success("Đã nhập kho");
      router.push(`/spare-parts/${state.data.id}`);
    }
  }, [state, router]);

  const { fieldErrors, formError } = getFormError(state);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
      <Field label="Tên phụ tùng" name="name" required error={fieldErrors?.name?.[0]} />
      <Field label="Đơn vị (cái, bộ, lít…)" name="unit" required error={fieldErrors?.unit?.[0]} />
      <Field
        label="Số lượng nhập"
        name="quantity"
        type="number"
        inputMode="decimal"
        step="any"
        min="0"
        required
        error={fieldErrors?.quantity?.[0]}
      />
      <MoneyField
        label="Giá nhập / đơn vị (₫)"
        name="buyPrice"
        value={buyPrice}
        onChange={setBuyPrice}
        required
        error={fieldErrors?.buyPrice?.[0]}
      />
      <Field
        label="Ngưỡng cảnh báo tồn thấp"
        name="minQuantity"
        type="number"
        inputMode="decimal"
        step="any"
        min="0"
        defaultValue="0"
        hint="Cảnh báo khi tồn ≤ ngưỡng này (mặc định 0 — chỉ báo khi hết)."
        error={fieldErrors?.minQuantity?.[0]}
      />
      <SubmitButton size="lg" fullWidth>
        Lưu nhập kho
      </SubmitButton>
    </form>
  );
}
