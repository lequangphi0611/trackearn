"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { getFormError } from "@/lib/form";
import type { ActionResult } from "@/lib/types";
import { createMember } from "../actions";

export function CreateMemberDialog() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (state?.success) {
      toast.success("Đã tạo thành viên");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
    }
  }, [state]);

  // Gọi Server Action thủ công — xem giải thích ở TransactionForm.tsx.
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createMember(null, formData);
      setState(result);
    });
  }

  const { fieldErrors, formError } = getFormError(state);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="max-sm:h-10">
            <Plus />
            Tạo thành viên
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo thành viên</DialogTitle>
          <DialogDescription>
            Tài khoản member đăng nhập bằng email + mật khẩu ban đầu dưới đây.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <Field label="Họ tên" name="name" required error={fieldErrors?.name?.[0]} />
          <Field
            label="Email"
            name="email"
            type="email"
            required
            error={fieldErrors?.email?.[0]}
          />
          <Field
            label="Mật khẩu ban đầu"
            name="password"
            type="password"
            required
            hint="Tối thiểu 8 ký tự"
            error={fieldErrors?.password?.[0]}
          />
          <DialogFooter className="mt-0">
            <DialogClose
              render={
                <Button type="button" variant="ghost" size="sm">
                  Huỷ
                </Button>
              }
            />
            <SubmitButton size="sm" pending={isPending}>Tạo tài khoản</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
