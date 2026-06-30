"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { updateDevice } from "../actions";

export function EditDeviceForm({
  id,
  sold,
  name,
  conditionNote,
  buyPrice: initialBuyPrice,
  buyDate,
  buyFrom,
  buyDebtPaid,
}: {
  id: string;
  sold: boolean;
  name: string;
  conditionNote: string | null;
  buyPrice: number;
  buyDate: string | null;
  buyFrom: string | null;
  buyDebtPaid: number | null;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(updateDevice, null);
  const [buyPrice, setBuyPrice] = useState(String(initialBuyPrice));
  const [confirmed, setConfirmed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (state?.success) {
      toast.success("Đã cập nhật");
      router.refresh();
    } else if (state && !state.success && !state.fieldErrors) {
      toast.error(state.error);
    }
  }, [state, router]);

  const { fieldErrors, formError } = getFormError(state);
  // Hạ giá mua xuống dưới số đã trả (mua trả sau) → cần xác nhận như giao dịch.
  const needsConfirm = !sold && buyDebtPaid !== null && Number(buyPrice) < buyDebtPaid;

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

        <Field label="Tên máy" name="name" defaultValue={name} required error={fieldErrors?.name?.[0]} />
        <Field label="Tình trạng / ghi chú" name="conditionNote" defaultValue={conditionNote ?? ""} />

        {/* Máy đã bán: chỉ sửa tên + tình trạng (server cũng chặn). */}
        {!sold && (
          <>
            <Field
              label="Giá mua (₫)"
              name="buyPrice"
              type="number"
              inputMode="numeric"
              min="0"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              error={fieldErrors?.buyPrice?.[0]}
            />
            <Field label="Ngày mua" name="buyDate" type="date" defaultValue={buyDate ?? ""} />
            <Field label="Nguồn mua" name="buyFrom" defaultValue={buyFrom ?? ""} />
          </>
        )}

        <SubmitButton size="lg" fullWidth>
          Lưu thay đổi
        </SubmitButton>
      </form>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Giá mua nhỏ hơn đã trả</DialogTitle>
            <DialogDescription>
              {buyDebtPaid !== null
                ? `Đã trả ${formatCurrency(buyDebtPaid)}, lớn hơn giá mua mới. Nếu tiếp tục, số đã trả sẽ hạ xuống bằng giá mua mới và công nợ coi như tất toán.`
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
