"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    try {
      const { error } = await signOut();
      if (error) {
        toast.error("Đăng xuất thất bại, thử lại.");
        setPending(false);
        return;
      }
      router.push("/login");
      router.refresh();
    } catch {
      // Lỗi mạng → cho người dùng thử lại thay vì kẹt nút.
      toast.error("Đăng xuất thất bại, thử lại.");
      setPending(false);
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleSignOut} disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <LogOut />}
      Đăng xuất
    </Button>
  );
}
