"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field } from "@/components/forms/Field";
import { getFormError } from "@/lib/form";
import type { ActionResult } from "@/lib/types";
import { sellDevice } from "../actions";

/**
 * Form "Bán ra" dùng chung cho 2 lối vào (dialog trên /devices/[id], và
 * gắn máy nội tuyến ở /transactions/thiet-bi/new) — cùng action, cùng kết quả.
 */
export function SellDeviceForm({
  id,
  defaultDate,
  onSuccess,
  footer,
}: {
  id: string;
  defaultDate: string;
  onSuccess: () => void;
  /** Nhận `pending` để SubmitButton bên trong hiện đúng spinner (form tự gọi
   * action qua onSubmit, không dùng <form action> nên useFormStatus không
   * tự biết). */
  footer: (pending: boolean) => React.ReactNode;
}) {
  const [state, setState] = useState<ActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [sellPrice, setSellPrice] = useState("");
  const [payLater, setPayLater] = useState(false);
  const [paid, setPaid] = useState("");

  // Ref giữ onSuccess mới nhất — effect bán máy chỉ cần phụ thuộc `state`,
  // tránh gọi closure cũ nếu caller truyền onSuccess khác nhau giữa các lần
  // render. Cập nhật ref trong effect riêng (sau render) — không được gán
  // ref lúc đang render.
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  });

  useEffect(() => {
    if (state?.success) {
      toast.success("Đã bán máy");
      onSuccessRef.current();
    } else if (state && !state.success && !state.fieldErrors) {
      toast.error(state.error);
    }
  }, [state]);

  const { fieldErrors, formError } = getFormError(state);
  const paidAmount = payLater ? paid : sellPrice;

  // Gọi Server Action thủ công — xem giải thích ở TransactionForm.tsx.
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await sellDevice(null, formData);
      setState(result);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
      {footer(isPending)}
    </form>
  );
}
