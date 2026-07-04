"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SubmitButtonProps = {
  children: React.ReactNode;
  size?: React.ComponentProps<typeof Button>["size"];
  variant?: React.ComponentProps<typeof Button>["variant"];
  fullWidth?: boolean;
  className?: string;
  /** Override cho form gọi Server Action thủ công qua onSubmit (không dùng
   * <form action={...}>) — useFormStatus không tự biết pending trong trường
   * hợp đó, caller tự truyền vào (xem TransactionForm, SellDeviceForm,
   * CreateMemberDialog — bỏ <form action> vì bug treo dialog khi ở trong
   * Portal, xem tmp/TODO.md US-3). */
  pending?: boolean;
};

/**
 * Nút submit dùng chung cho form Server Action: tự disable + hiện spinner
 * khi đang gửi. Mặc định đọc từ useFormStatus (đặt trong <form action={...}>);
 * truyền `pending` để override khi form tự quản lý pending state.
 */
export function SubmitButton({
  children,
  size,
  variant,
  fullWidth,
  className,
  pending: pendingProp,
}: SubmitButtonProps) {
  const { pending: formPending } = useFormStatus();
  const pending = pendingProp ?? formPending;
  return (
    <Button
      type="submit"
      size={size}
      variant={variant}
      disabled={pending}
      className={cn(fullWidth && "w-full", className)}
    >
      {pending && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  );
}
