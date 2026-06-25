"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { getFormError } from "@/lib/form";
import { changePassword } from "./actions";

export function PasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(changePassword, null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Đã đổi mật khẩu");
      formRef.current?.reset();
    }
  }, [state]);

  const { fieldErrors, formError } = getFormError(state);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <Field
        label="Mật khẩu hiện tại"
        name="currentPassword"
        type="password"
        required
        error={fieldErrors?.currentPassword?.[0]}
      />
      <Field
        label="Mật khẩu mới"
        name="newPassword"
        type="password"
        required
        hint="Tối thiểu 8 ký tự"
        error={fieldErrors?.newPassword?.[0]}
      />
      <Field
        label="Nhập lại mật khẩu mới"
        name="confirmPassword"
        type="password"
        required
        error={fieldErrors?.confirmPassword?.[0]}
      />

      <SubmitButton size="sm" className="self-start">
        Đổi mật khẩu
      </SubmitButton>
    </form>
  );
}
