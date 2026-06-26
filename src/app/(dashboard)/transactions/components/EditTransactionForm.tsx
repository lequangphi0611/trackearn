"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getFormError } from "@/lib/form";
import { formatCurrency } from "@/lib/format";
import { updateTransaction } from "../actions";

type Category = { id: string; name: string };

type EditDebt = {
  paid: number;
  counterpartyName: string;
  dueDate: string | null;
} | null;

type EditTransactionFormProps = {
  line: string;
  id: string;
  type: string;
  amount: number;
  categoryId: string | null;
  note: string | null;
  defaultDateTime: string;
  categories: Category[];
  debt: EditDebt;
};

export function EditTransactionForm({
  line,
  id,
  type,
  amount: initialAmount,
  categoryId,
  note,
  defaultDateTime,
  categories,
  debt,
}: EditTransactionFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(updateTransaction, null);
  const [amount, setAmount] = useState(String(initialAmount));
  const [confirmed, setConfirmed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (state?.success) {
      toast.success("Đã cập nhật giao dịch");
      router.push(`/transactions/${line}`);
      router.refresh();
    } else if (state && !state.success && !state.fieldErrors) {
      toast.error(state.error);
    }
  }, [state, router, line]);

  const { fieldErrors, formError } = getFormError(state);
  const needsConfirm = debt !== null && Number(amount) < debt.paid;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (needsConfirm && !confirmed) {
      e.preventDefault();
      setConfirmOpen(true);
    }
  }

  function agreeReduce() {
    setConfirmed(true);
    setConfirmOpen(false);
    requestAnimationFrame(() => formRef.current?.requestSubmit());
  }

  return (
    <>
      <form ref={formRef} action={formAction} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="confirmReduce" value={confirmed ? "true" : ""} />

        {formError && (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <Field
          label="Số tiền (₫)"
          name="amount"
          type="number"
          inputMode="numeric"
          min="0"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={fieldErrors?.amount?.[0]}
        />

        {type === "expense" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="categoryId">Danh mục</Label>
            <Select id="categoryId" name="categoryId" defaultValue={categoryId ?? ""}>
              <option value="">— Khác —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        {debt && (
          <>
            <Field
              label="Tên đối tác"
              name="counterpartyName"
              defaultValue={debt.counterpartyName}
              error={fieldErrors?.counterpartyName?.[0]}
            />
            <Field
              label="Ngày hẹn trả"
              name="dueDate"
              type="date"
              defaultValue={debt.dueDate ?? ""}
            />
          </>
        )}

        <Field label="Ghi chú" name="note" defaultValue={note ?? ""} />
        <Field
          label="Thời điểm giao dịch"
          name="transactedAt"
          type="datetime-local"
          defaultValue={defaultDateTime}
          required
          error={fieldErrors?.transactedAt?.[0]}
        />

        <SubmitButton size="lg" fullWidth>
          Lưu thay đổi
        </SubmitButton>
      </form>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Số tiền nhỏ hơn đã trả</DialogTitle>
            <DialogDescription>
              {debt
                ? `Khách đã trả ${formatCurrency(debt.paid)}, lớn hơn số tiền mới. Nếu tiếp tục, số đã trả sẽ được điều chỉnh xuống bằng số tiền mới và công nợ coi như tất toán.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmOpen(false)}>
              Huỷ
            </Button>
            <Button type="button" size="sm" onClick={agreeReduce}>
              Tôi đồng ý
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
