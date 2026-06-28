"use client";

import { useActionState, useEffect, useState } from "react";
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
import { SubmitButton } from "@/components/forms/SubmitButton";
import { getFormError } from "@/lib/form";
import { formatCurrency } from "@/lib/format";
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
  const [state, formAction] = useActionState(restockSparePart, null);

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
        <form action={formAction} className="flex flex-col gap-4">
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
          <Field
            label="Giá nhập / đơn vị (₫)"
            name="buyPrice"
            type="number"
            inputMode="numeric"
            min="1"
            required
            error={fieldErrors?.buyPrice?.[0]}
          />
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="ghost" size="sm">Huỷ</Button>} />
            <SubmitButton size="sm">Xác nhận nhập</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
