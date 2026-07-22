"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { getFormError } from "@/lib/form";
import { resetOwnerPassword } from "./actions";

export function ResetOwnerPasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(resetOwnerPassword, null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Đã đặt lại mật khẩu chủ shop");
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
        label="Email chủ shop"
        name="email"
        type="email"
        required
        error={fieldErrors?.email?.[0]}
      />
      <Field
        label="Mật khẩu mới (tạm)"
        name="newPassword"
        type="password"
        required
        hint="Tối thiểu 8 ký tự. Sau khi đăng nhập, chủ shop tự đổi lại trong Cài đặt."
        error={fieldErrors?.newPassword?.[0]}
      />

      <SubmitButton size="sm" className="self-start">
        Đặt lại mật khẩu
      </SubmitButton>
    </form>
  );
}
