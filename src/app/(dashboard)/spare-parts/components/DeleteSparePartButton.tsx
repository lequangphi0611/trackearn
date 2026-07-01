"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
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
import { deleteSparePart } from "../actions";

export function DeleteSparePartButton({ id }: { id: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(deleteSparePart, null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Đã xoá phụ tùng");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
      router.push("/spare-parts");
      router.refresh();
    } else if (state && !state.success) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm" className="text-expense hover:text-expense">
            <Trash2 />
            Xoá phụ tùng
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xoá phụ tùng này?</DialogTitle>
          <DialogDescription>
            Chỉ xoá được khi chưa từng xuất cho job nào. Không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <input type="hidden" name="id" value={id} />
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="ghost" size="sm">Huỷ</Button>} />
            <SubmitButton size="sm" variant="destructive">
              Xoá phụ tùng
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
