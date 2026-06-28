"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Button } from "@/components/ui/button";
import { getFormError } from "@/lib/form";
import { createTransaction } from "../actions";

type Category = { id: string; name: string };

export function TransactionForm({
  line,
  expenseOnly,
  defaultDateTime,
  categories,
}: {
  line: string;
  expenseOnly: boolean;
  defaultDateTime: string;
  categories: Category[];
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(createTransaction, null);
  const [type, setType] = useState<"income" | "expense">(expenseOnly ? "expense" : "income");
  const [amount, setAmount] = useState("");
  const [payLater, setPayLater] = useState(false);
  const [paid, setPaid] = useState("");

  useEffect(() => {
    if (state?.success) {
      toast.success("Đã lưu giao dịch");
      router.push(`/transactions/${line}`);
    }
  }, [state, router, line]);

  const { fieldErrors, formError } = getFormError(state);
  const paidAmount = payLater ? paid : amount;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="line" value={line} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="paidAmount" value={paidAmount} />

      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {!expenseOnly && (
        <div className="flex flex-col gap-1.5">
          <Label>Loại</Label>
          <div className="flex gap-2">
            {(["income", "expense"] as const).map((t) => (
              <Button
                key={t}
                type="button"
                variant={type === t ? "default" : "outline"}
                size="sm"
                className={cn("flex-1")}
                onClick={() => setType(t)}
              >
                {t === "income" ? "Thu" : "Chi"}
              </Button>
            ))}
          </div>
        </div>
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
          <Field
            label="Đã trả (₫)"
            name="paidVisible"
            type="number"
            inputMode="numeric"
            min="0"
            value={paid}
            onChange={(e) => setPaid(e.target.value)}
            error={fieldErrors?.paidAmount?.[0]}
          />
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

      <SubmitButton size="lg" fullWidth>
        Lưu giao dịch
      </SubmitButton>
    </form>
  );
}
