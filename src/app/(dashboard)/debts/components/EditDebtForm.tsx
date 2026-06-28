"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Field } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { getFormError } from "@/lib/form";
import { updateDebt } from "../actions";

export function EditDebtForm({
  debtId,
  counterpartyName,
  dueDate,
}: {
  debtId: string;
  counterpartyName: string;
  dueDate: string | null;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(updateDebt, null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Đã cập nhật công nợ");
      router.refresh();
    } else if (state && !state.success && !state.fieldErrors) {
      toast.error(state.error);
    }
  }, [state, router]);

  const { fieldErrors } = getFormError(state);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="debtId" value={debtId} />
      <Field
        label="Tên đối tác"
        name="counterpartyName"
        defaultValue={counterpartyName}
        required
        error={fieldErrors?.counterpartyName?.[0]}
      />
      <Field label="Ngày hẹn trả" name="dueDate" type="date" defaultValue={dueDate ?? ""} />
      <SubmitButton size="sm" className="self-start">
        Lưu công nợ
      </SubmitButton>
    </form>
  );
}
