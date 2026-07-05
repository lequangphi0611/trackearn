"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PackagePlus } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field } from "@/components/forms/Field";
import { MoneyField } from "@/components/forms/MoneyField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { getFormError } from "@/lib/form";
import { formatCurrency } from "@/lib/format";
import type { ActionResult } from "@/lib/types";
import { restockSparePart } from "../actions";

export function RestockDialog({
  id,
  unit,
  buyPrice,
}: {
  id: string;
  unit: string;
  buyPrice: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [newBuyPrice, setNewBuyPrice] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (state?.success) {
      toast.success("Đã nhập thêm");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
      router.refresh();
    } else if (state && !state.success && !state.fieldErrors) {
      toast.error(state.error);
    }
  }, [state, router]);

  const { fieldErrors, formError } = getFormError(state);

  // Gọi Server Action thủ công thay vì <form action={dispatch}> — form trong
  // Dialog (Portal) từng bị "kẹt" ~30% số lần do state không resolve dù server
  // xử lý xong (xem docs/coding-rules.md § Server Actions trong Dialog).
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await restockSparePart(null, formData);
      setState(result);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm"><PackagePlus />Nhập thêm</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nhập thêm kho</DialogTitle>
          <DialogDescription>
            Cộng tồn + cập nhật giá vốn bình quân. Giá vốn hiện tại {formatCurrency(buyPrice)}/{unit}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={id} />
          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <Field
            label={`Số lượng nhập (${unit})`}
            name="quantity"
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            required
            error={fieldErrors?.quantity?.[0]}
          />
          <MoneyField
            label="Giá nhập / đơn vị (₫)"
            name="buyPrice"
            value={newBuyPrice}
            onChange={setNewBuyPrice}
            min={1}
            required
            error={fieldErrors?.buyPrice?.[0]}
          />
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="ghost" size="sm">Huỷ</Button>} />
            <SubmitButton size="sm" pending={isPending}>Xác nhận nhập</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
