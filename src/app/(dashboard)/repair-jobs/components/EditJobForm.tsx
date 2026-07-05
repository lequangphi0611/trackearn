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
import { updateRepairJob } from "../actions";
import { JobLinesEditor, type LineDraft, type PickerPart } from "./JobLinesEditor";

function partsTotal(lines: LineDraft[]): number {
  return lines.reduce((s, l) => s + Math.round(Number(l.quantity || 0) * (l.unitPrice ?? 0)), 0);
}
// `unitPrice` để trống → JSON.stringify bỏ key `undefined`, server (Zod bắt
// buộc `unitPrice`) sẽ reject — mặc định về 0 khi serialize, giữ hành vi cũ.
function cleanLines(lines: LineDraft[]) {
  return lines
    .filter((l) => l.sparePartId && Number(l.quantity) > 0)
    .map((l) => ({ ...l, unitPrice: l.unitPrice ?? 0 }));
}

export function EditJobForm({
  id,
  parts,
  customerName,
  jobDate,
  laborFee: initialLabor,
  note,
  initialLines,
}: {
  id: string;
  parts: PickerPart[];
  customerName: string;
  jobDate: string;
  laborFee: number;
  note: string | null;
  initialLines: LineDraft[];
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(updateRepairJob, null);
  const [lines, setLines] = useState<LineDraft[]>(initialLines);
  const [laborFee, setLaborFee] = useState<number | undefined>(initialLabor);

  useEffect(() => {
    if (state?.success) {
      toast.success("Đã cập nhật job");
      router.push(`/repair-jobs/${id}`);
      router.refresh();
    } else if (state && !state.success && !state.fieldErrors) {
      toast.error(state.error);
    }
  }, [state, router, id]);

  const total = useMemo(() => partsTotal(lines) + (laborFee ?? 0), [lines, laborFee]);
  const { fieldErrors, formError } = getFormError(state);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="lines" value={JSON.stringify(cleanLines(lines))} />

      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <Field label="Tên khách" name="customerName" defaultValue={customerName} required error={fieldErrors?.customerName?.[0]} />
      <Field label="Ngày sửa" name="jobDate" type="date" defaultValue={jobDate} required error={fieldErrors?.jobDate?.[0]} />

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

      <p className="text-xs text-muted-foreground">
        Tiền đã thu giữ nguyên; nếu tổng mới nhỏ hơn số đã thu, phần dư ghi nhận thành tip.
      </p>

      <Field label="Ghi chú" name="note" defaultValue={note ?? ""} />

      <SubmitButton size="lg" fullWidth>
        Lưu thay đổi
      </SubmitButton>
    </form>
  );
}
