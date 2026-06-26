import { cn } from "@/lib/utils";

/**
 * Logo TrackEarn: ô bo góc hổ phách + chữ "đ" (đồng) hình học — nhận diện
 * "sổ thu chi". Kích thước truyền qua className (vd size-11, size-6).
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid aspect-square place-items-center rounded-xl bg-brand text-brand-foreground",
        className,
      )}
    >
      <svg
        viewBox="0 0 48 48"
        className="size-[68%]"
        fill="none"
        stroke="currentColor"
        strokeWidth={3.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="20.5" cy="30.5" r="7.5" />
        <path d="M28 11.5V38" />
        <path d="M22 15.5h12" />
      </svg>
    </span>
  );
}
