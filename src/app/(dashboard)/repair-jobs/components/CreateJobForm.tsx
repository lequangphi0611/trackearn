"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field } from "@/components/forms/Field";
import { MoneyField } from "@/components/forms/MoneyField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { getFormError } from "@/lib/form";
import { formatCurrency } from "@/lib/format";
import { createRepairJob } from "../actions";
import { JobLinesEditor, emptyLine, partsTotal, cleanLines, type LineDraft, type PickerPart } from "./JobLinesEditor";

export function CreateJobForm({ parts, defaultDate }: { parts: PickerPart[]; defaultDate: string }) {
  const router = useRouter();
  const [state, formAction] = useActionState(createRepairJob, null);
  const [lines, setLines] = useState<LineDraft[]>([{ ...emptyLine }]);
  const [laborFee, setLaborFee] = useState<number | undefined>(undefined);
  const [payLater, setPayLater] = useState(false);
  const [paid, setPaid] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (state?.success) {
      toast.success("Đã tạo job");
      router.push(`/repair-jobs/${state.data.id}`);
    } else if (state && !state.success && !state.fieldErrors) {
      toast.error(state.error);
    }
  }, [state, router]);

  const total = useMemo(() => partsTotal(lines) + (laborFee ?? 0), [lines, laborFee]);
  const { fieldErrors, formError } = getFormError(state);
  const paidAmount = payLater ? paid : total;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="lines" value={JSON.stringify(cleanLines(lines))} />
      <input type="hidden" name="paidAmount" value={paidAmount ?? ""} />

      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <Field label="Tên khách" name="customerName" required error={fieldErrors?.customerName?.[0]} />
      <Field
        label="Ngày sửa"
        name="jobDate"
        type="date"
        defaultValue={defaultDate}
        required
        error={fieldErrors?.jobDate?.[0]}
      />

      <JobLinesEditor parts={parts} value={lines} onChange={setLines} />

      <MoneyField
        label="Tiền công (₫)"
        name="laborFee"
        value={laborFee}
        onChange={setLaborFee}
        error={fieldErrors?.laborFee?.[0]}
      />

      <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
        <span className="text-muted-foreground">Tổng tiền</span>
        <span className="font-mono text-base font-semibold tabular">{formatCurrency(total)}</span>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={payLater}
          onChange={(e) => setPayLater(e.target.checked)}
          className="size-4 accent-primary"
        />
        Khách trả sau (ghi công nợ)
      </label>

      {payLater && (
        <>
          <MoneyField
            label="Đã thu (₫)"
            value={paid}
            onChange={setPaid}
            error={fieldErrors?.paidAmount?.[0]}
          />
          <Field label="Tên người nợ" name="counterpartyName" error={fieldErrors?.counterpartyName?.[0]} />
          <Field label="Ngày hẹn trả" name="dueDate" type="date" />
        </>
      )}

      <Field label="Ghi chú" name="note" />

      <SubmitButton size="lg" fullWidth>
        Lưu job
      </SubmitButton>
    </form>
  );
}
