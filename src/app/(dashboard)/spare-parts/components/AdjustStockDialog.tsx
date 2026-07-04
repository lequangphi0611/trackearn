"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ClipboardCheck } from "lucide-react";
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
import type { ActionResult } from "@/lib/types";
import { adjustStock } from "../actions";

export function AdjustStockDialog({
  id,
  unit,
  currentQuantity,
}: {
  id: string;
  unit: string;
  currentQuantity: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (state?.success) {
      toast.success("Đã cập nhật tồn");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
      router.refresh();
    } else if (state && !state.success && !state.fieldErrors) {
      toast.error(state.error);
    }
  }, [state, router]);

  const { fieldErrors, formError } = getFormError(state);

  // Gọi Server Action thủ công — xem giải thích ở RestockDialog.tsx.
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await adjustStock(null, formData);
      setState(result);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm"><ClipboardCheck />Kiểm kê</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kiểm kê tồn</DialogTitle>
          <DialogDescription>
            Đặt lại tồn theo số đếm thực tế. Không sinh giao dịch chi (chỉ đính chính số đếm).
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
            label={`Tồn thực đếm (${unit})`}
            name="quantity"
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            defaultValue={currentQuantity}
            required
            error={fieldErrors?.quantity?.[0]}
          />
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="ghost" size="sm">Huỷ</Button>} />
            <SubmitButton size="sm" pending={isPending}>Xác nhận</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
