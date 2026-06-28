"use client";

import Link, { useLinkStatus } from "next/link";
import { Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

function PendingSpinner() {
  const { pending } = useLinkStatus();
  return pending ? <Loader2 className="size-3.5 animate-spin" /> : null;
}

/**
 * "Xem thêm" tải thêm trang kế: giữ nguyên vị trí cuộn (scroll={false}),
 * hiện spinner trong lúc điều hướng; nội dung cũ giữ nguyên tới khi có dữ liệu.
 */
export function LoadMore({ href }: { href: string }) {
  return (
    <Link
      href={href}
      scroll={false}
      className={buttonVariants({
        variant: "outline",
        size: "sm",
        className: "gap-2 self-center",
      })}
    >
      <PendingSpinner />
      Xem thêm
    </Link>
  );
}
