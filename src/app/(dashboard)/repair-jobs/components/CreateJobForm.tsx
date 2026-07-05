"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field } from "@/components/forms/Field";
import { InputMoney } from "@/components/forms/InputMoney";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Label } from "@/components/ui/label";
import { getFormError } from "@/lib/form";
import { formatCurrency } from "@/lib/format";
import { createRepairJob } from "../actions";
import { JobLinesEditor, emptyLine, type LineDraft, type PickerPart } from "./JobLinesEditor";

function partsTotal(lines: LineDraft[]): number {
  return lines.reduce((s, l) => s + Math.round(Number(l.quantity || 0) * (l.unitPrice ?? 0)), 0);
}

// `unitPrice` để trống khi đang sửa dở → JSON.stringify bỏ qua key `undefined`,
// server (Zod `unitPrice` bắt buộc) sẽ reject. Mặc định về 0 khi serialize để
// giữ đúng hành vi cũ (giá trống → submit 0), không đổi khi đang gõ.
function cleanLines(lines: LineDraft[]) {
  return lines
    .filter((l) => l.sparePartId && Number(l.quantity) > 0)
    .map((l) => ({ ...l, unitPrice: l.unitPrice ?? 0 }));
}

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

      <Label className="flex flex-col items-start gap-1.5">
        Tiền công (₫)
        <InputMoney value={laborFee} onChange={setLaborFee} name="laborFee" />
      </Label>
      {fieldErrors?.laborFee?.[0] && <p className="text-xs text-destructive">{fieldErrors.laborFee[0]}</p>}

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
          <Label className="flex flex-col items-start gap-1.5">
            Đã thu (₫)
            <InputMoney value={paid} onChange={setPaid} />
          </Label>
          {fieldErrors?.paidAmount?.[0] && (
            <p className="text-xs text-destructive">{fieldErrors.paidAmount[0]}</p>
          )}
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
