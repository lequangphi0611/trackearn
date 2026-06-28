"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteTransaction } from "../actions";

export function DeleteTransactionButton({ id, line }: { id: string; line: string }) {
  const router = useRouter();
  const [state, formAction] = useActionState(deleteTransaction, null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Đã xoá giao dịch");
      router.push(`/transactions/${line}`);
      router.refresh();
    } else if (state && !state.success) {
      toast.error(state.error);
    }
  }, [state, router, line]);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("Xoá giao dịch này?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="destructive" size="sm">
        <Trash2 />
        Xoá
      </Button>
    </form>
  );
}
