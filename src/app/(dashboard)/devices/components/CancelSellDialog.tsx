"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Undo2 } from "lucide-react";
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
import { SubmitButton } from "@/components/forms/SubmitButton";
import { cancelSell } from "../actions";

export function CancelSellDialog({ id, blocked }: { id: string; blocked: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(cancelSell, null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Đã hủy bán — máy về kho");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
      router.refresh();
    } else if (state && !state.success) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" disabled={blocked}>
            <Undo2 />
            Hủy bán
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hủy bán máy?</DialogTitle>
          <DialogDescription>
            Máy về lại kho (còn hàng) và giao dịch bán cùng công nợ (nếu có) sẽ bị xoá. Không thể
            hoàn tác.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <input type="hidden" name="id" value={id} />
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="ghost" size="sm">Huỷ</Button>} />
            <SubmitButton size="sm" variant="destructive">
              Xác nhận hủy bán
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
