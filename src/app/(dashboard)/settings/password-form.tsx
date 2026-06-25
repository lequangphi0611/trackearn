"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { changePassword } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending} className="self-start">
      {pending && <Loader2 className="animate-spin" />}
      Đổi mật khẩu
    </Button>
  );
}

export function PasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(changePassword, null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Đã đổi mật khẩu");
      formRef.current?.reset();
    }
  }, [state]);

  const fieldErrors = state && !state.success ? state.fieldErrors : undefined;
  const formError =
    state && !state.success && !state.fieldErrors ? state.error : undefined;

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          aria-invalid={Boolean(fieldErrors?.currentPassword)}
        />
        {fieldErrors?.currentPassword && (
          <p className="text-xs text-destructive">{fieldErrors.currentPassword[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="newPassword">Mật khẩu mới</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          aria-invalid={Boolean(fieldErrors?.newPassword)}
        />
        <p className="text-xs text-muted-foreground">Tối thiểu 8 ký tự</p>
        {fieldErrors?.newPassword && (
          <p className="text-xs text-destructive">{fieldErrors.newPassword[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Nhập lại mật khẩu mới</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          aria-invalid={Boolean(fieldErrors?.confirmPassword)}
        />
        {fieldErrors?.confirmPassword && (
          <p className="text-xs text-destructive">{fieldErrors.confirmPassword[0]}</p>
        )}
      </div>

      <SubmitButton />
    </form>
  );
}
