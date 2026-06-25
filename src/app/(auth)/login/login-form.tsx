"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { login } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending && <Loader2 className="animate-spin" />}
      Đăng nhập
    </Button>
  );
}

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

  const fieldErrors = state && !state.success ? state.fieldErrors : undefined;
  const formError =
    state && !state.success && !state.fieldErrors ? state.error : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {callbackURL && <input type="hidden" name="callbackURL" value={callbackURL} />}

      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          aria-invalid={Boolean(fieldErrors?.email)}
        />
        {fieldErrors?.email && (
          <p className="text-xs text-destructive">{fieldErrors.email[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Mật khẩu</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          aria-invalid={Boolean(fieldErrors?.password)}
        />
        {fieldErrors?.password && (
          <p className="text-xs text-destructive">{fieldErrors.password[0]}</p>
        )}
      </div>

      <SubmitButton />

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
