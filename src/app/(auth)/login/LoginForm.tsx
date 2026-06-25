"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { getFormError } from "@/lib/form";
import { login } from "./actions";

export function LoginForm({
  callbackURL,
  showRegister,
}: {
  callbackURL?: string;
  showRegister: boolean;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(login, null);

  useEffect(() => {
    if (state?.success) router.push(state.data.redirectTo);
  }, [state, router]);

  const { fieldErrors, formError } = getFormError(state);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {callbackURL && <input type="hidden" name="callbackURL" value={callbackURL} />}

      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

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
        error={fieldErrors?.password?.[0]}
      />

      <SubmitButton size="lg" fullWidth>
        Đăng nhập
      </SubmitButton>

      {showRegister && (
        <p className="text-center text-sm text-muted-foreground">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Đăng ký
          </Link>
        </p>
      )}
    </form>
  );
}
