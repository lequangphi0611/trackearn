"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Field } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { getFormError } from "@/lib/form";
import { updateProfile } from "./actions";

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

  const { fieldErrors } = getFormError(state);

  return (
    <form action={formAction} className="flex flex-col gap-1.5">
      <Field
        label="Họ tên"
        name="name"
        defaultValue={defaultName}
        required
        error={fieldErrors?.name?.[0]}
      />
      <div className="mt-2">
        <SubmitButton size="sm">Lưu thay đổi</SubmitButton>
      </div>
    </form>
  );
}
