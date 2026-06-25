"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SubmitButtonProps = {
  children: React.ReactNode;
  size?: React.ComponentProps<typeof Button>["size"];
  fullWidth?: boolean;
  className?: string;
};

/**
 * Nút submit dùng chung cho form Server Action: tự disable + hiện spinner
 * khi đang gửi (useFormStatus). Phải đặt bên trong <form action={...}>.
 */
export function SubmitButton({
  children,
  size,
  fullWidth,
  className,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size={size}
      disabled={pending}
      className={cn(fullWidth && "w-full", className)}
    >
      {pending && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  );
}
