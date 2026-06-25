"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending} className="self-start">
      {pending && <Loader2 className="animate-spin" />}
      Lưu thay đổi
    </Button>
  );
}

export function ProfileForm({ defaultName }: { defaultName: string }) {
  const router = useRouter();
  const [state, formAction] = useActionState(updateProfile, null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Đã cập nhật hồ sơ");
      router.refresh();
    } else if (state && !state.success && !state.fieldErrors) {
      toast.error(state.error);
    }
  }, [state, router]);

  const nameError = state && !state.success ? state.fieldErrors?.name?.[0] : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-1.5">
      <Label htmlFor="name">Họ tên</Label>
      <Input
        id="name"
        name="name"
        defaultValue={defaultName}
        required
        aria-invalid={Boolean(nameError)}
      />
      {nameError && <p className="text-xs text-destructive">{nameError}</p>}
      <div className="mt-2">
        <SubmitButton />
      </div>
    </form>
  );
}
