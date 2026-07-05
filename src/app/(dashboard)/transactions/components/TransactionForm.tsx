"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/forms/Field";
import { InputMoney } from "@/components/forms/InputMoney";
import { SegmentedToggle } from "@/components/forms/SegmentedToggle";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { getFormError } from "@/lib/form";
import type { ActionResult } from "@/lib/types";
import { createTransaction } from "../actions";

type Category = { id: string; name: string };

const TYPE_OPTIONS = [
  { key: "income", label: "Thu" },
  { key: "expense", label: "Chi" },
] as const;

export function TransactionForm({
  line,
  lockType,
  defaultDateTime,
  categories,
  onSuccess,
  stickySubmit,
}: {
  line: string;
  /** Cố định loại giao dịch, ẩn công tắc Thu/Chi — dùng khi màn cha đã tự quyết loại. */
  lockType?: "income" | "expense";
  defaultDateTime: string;
  categories: Category[];
  /** Có mặt → thay điều hướng mặc định về list sau khi lưu (vd quick-entry đóng dialog). */
  onSuccess?: () => void;
  /** Ghim nút Lưu ở đáy vùng cuộn (dialog dài, vd mở "Trả sau") — luôn thấy submit. */
  stickySubmit?: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<ActionResult<{ id: string }> | null>(null);
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<"income" | "expense">(lockType ?? "income");
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [payLater, setPayLater] = useState(false);
  const [paid, setPaid] = useState<number | undefined>(undefined);

  // Ref giữ onSuccess mới nhất — effect chỉ phụ thuộc `state`. onSuccess là
  // closure mới mỗi lần cha (vd QuickEntryDialog/DeviceTransactionForm) render
  // lại (vd sau revalidatePath của createTransaction), nếu để thẳng vào deps
  // thì effect refire dù state không đổi → toast "Đã lưu giao dịch" lặp lại
  // nhiều lần (đã dùng cách này ở SellDeviceForm.tsx, áp dụng lại đây).
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  });

  useEffect(() => {
    if (state?.success) {
      toast.success("Đã lưu giao dịch");
      if (onSuccessRef.current) onSuccessRef.current();
      else router.push(`/transactions/${line}`);
    }
  }, [state, router, line]);

  const { fieldErrors, formError } = getFormError(state);
  const paidAmount = payLater ? paid : amount;

  // Gọi Server Action thủ công (không dùng <form action={dispatch}> của
  // useActionState) — trong Base UI Dialog (Portal), transition của form
  // action đôi khi không bao giờ resolve `state` dù server đã xử lý xong
  // (~30% số lần, xem tmp/TODO.md US-3). Gọi trực tiếp + tự set state tránh
  // đúng cơ chế bị lỗi đó.
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createTransaction(null, formData);
      setState(result);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="line" value={line} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="paidAmount" value={paidAmount ?? ""} />

      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {!lockType && (
        <div className="flex flex-col gap-1.5">
          <Label>Loại</Label>
          <SegmentedToggle options={TYPE_OPTIONS} value={type} onChange={setType} fill />
        </div>
      )}

      <Label className="flex flex-col items-start gap-1.5">
        Số tiền (₫)
        <InputMoney value={amount} onChange={setAmount} name="amount" required />
      </Label>
      {fieldErrors?.amount?.[0] && <p className="text-xs text-destructive">{fieldErrors.amount[0]}</p>}

      {type === "expense" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="categoryId">Danh mục</Label>
          <Select id="categoryId" name="categoryId" defaultValue="">
            <option value="">— Khác —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={payLater}
          onChange={(e) => setPayLater(e.target.checked)}
          className="size-4 accent-primary"
        />
        Trả sau (ghi công nợ)
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
            label="Tên đối tác"
            name="counterpartyName"
            error={fieldErrors?.counterpartyName?.[0]}
          />
          <Field label="Ngày hẹn trả" name="dueDate" type="date" />
        </>
      )}

      <Field label="Ghi chú" name="note" />
      <Field
        label="Thời điểm giao dịch"
        name="transactedAt"
        type="datetime-local"
        defaultValue={defaultDateTime}
        required
        error={fieldErrors?.transactedAt?.[0]}
      />

      <div
        className={
          stickySubmit
            ? "sticky bottom-0 -mx-6 border-t border-border/60 bg-card px-6 pt-3 pb-1"
            : undefined
        }
      >
        <SubmitButton size="lg" fullWidth pending={isPending}>
          Lưu giao dịch
        </SubmitButton>
      </div>
    </form>
  );
}
