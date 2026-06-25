"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { getFormError } from "@/lib/form";
import { registerOwner } from "./actions";

export function RegisterForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(registerOwner, null);

  useEffect(() => {
    if (state?.success) router.push("/");
  }, [state, router]);

  const { fieldErrors, formError } = getFormError(state);

  return (
    <form action={formAction} className="flex flex-col gap-4">
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
        label="Mật khẩu"
        name="password"
        type="password"
        required
        hint="Tối thiểu 8 ký tự"
        error={fieldErrors?.password?.[0]}
      />
      <Field
        label="Nhập lại mật khẩu"
        name="confirmPassword"
        type="password"
        required
        error={fieldErrors?.confirmPassword?.[0]}
      />

      <SubmitButton size="lg" fullWidth>
        Tạo tài khoản chủ hộ
      </SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        Đã có tài khoản?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Đăng nhập
        </Link>
      </p>
    </form>
  );
}
