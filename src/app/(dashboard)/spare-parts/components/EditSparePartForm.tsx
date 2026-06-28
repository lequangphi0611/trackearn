"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { getFormError } from "@/lib/form";
import { updateSparePart } from "../actions";

export function EditSparePartForm({
  id,
  name,
  unit,
  minQuantity,
}: {
  id: string;
  name: string;
  unit: string;
  minQuantity: string;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(updateSparePart, null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Đã cập nhật");
      router.refresh();
    } else if (state && !state.success && !state.fieldErrors) {
      toast.error(state.error);
    }
  }, [state, router]);

  const { fieldErrors, formError } = getFormError(state);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={id} />
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
      <Field label="Tên phụ tùng" name="name" defaultValue={name} required error={fieldErrors?.name?.[0]} />
      <Field label="Đơn vị" name="unit" defaultValue={unit} required error={fieldErrors?.unit?.[0]} />
      <Field
        label="Ngưỡng cảnh báo tồn thấp"
        name="minQuantity"
        type="number"
        inputMode="decimal"
        step="any"
        min="0"
        defaultValue={minQuantity}
        error={fieldErrors?.minQuantity?.[0]}
      />
      <SubmitButton size="lg" fullWidth>
        Lưu thay đổi
      </SubmitButton>
    </form>
  );
}
