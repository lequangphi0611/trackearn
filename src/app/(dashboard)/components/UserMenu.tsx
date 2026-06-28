"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Settings, LogOut } from "lucide-react";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { signOut } from "@/lib/auth-client";

/** Chữ cái đầu của tên (viết hoa) cho avatar; "?" nếu rỗng. */
function initial(name: string): string {
  const ch = name.trim().charAt(0);
  return ch ? ch.toUpperCase() : "?";
}

// Menu hồ sơ ở header: avatar chữ-cái-đầu → Cài đặt + Đăng xuất. Gom các đích
// ít dùng ra khỏi thanh nav dưới (vùng ngón cái) cho gọn.
export function UserMenu({ name }: { name: string }) {
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
      toast.error("Đăng xuất thất bại, thử lại.");
      setPending(false);
    }
  }

  return (
    <Menu>
      <MenuTrigger
        aria-label="Tài khoản"
        className="flex size-9 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground transition-transform outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
      >
        {initial(name)}
      </MenuTrigger>
      <MenuContent align="end">
        <div className="border-b border-border px-3 py-1.5 text-xs text-muted-foreground">
          {name}
        </div>
        <MenuItem render={<Link href="/settings" />} className="gap-2">
          <Settings className="size-4" />
          Cài đặt
        </MenuItem>
        <MenuSeparator className="my-1 h-px bg-border" />
        <MenuItem
          onClick={handleSignOut}
          disabled={pending}
          className="gap-2 text-expense data-[highlighted]:text-expense"
        >
          <LogOut className="size-4" />
          Đăng xuất
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}
