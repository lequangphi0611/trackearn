"use client";

import { useRef, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";

/** Nhóm nút chọn 1-trong-N (Thu/Chi, loại giao dịch...) — dùng chung thay vì tự ghép Button rời. */
export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  fill,
}: {
  options: readonly { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
  /** Mỗi nút chia đều chiều rộng — hợp với 2 lựa chọn ngắn (Thu/Chi). */
  fill?: boolean;
}) {
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Roving tabindex theo WAI-ARIA APG cho radiogroup: chỉ option đang chọn
  // nằm trong Tab order, mũi tên trái/phải (hoặc lên/xuống) di chuyển + chọn
  // luôn option kế tiếp.
  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const delta =
      e.key === "ArrowLeft" || e.key === "ArrowUp"
        ? -1
        : e.key === "ArrowRight" || e.key === "ArrowDown"
          ? 1
          : 0;
    if (delta === 0) return;
    e.preventDefault();
    const currentIndex = options.findIndex((o) => o.key === value);
    const nextIndex =
      (currentIndex + delta + options.length) % options.length;
    const next = options[nextIndex];
    onChange(next.key);
    btnRefs.current[nextIndex]?.focus();
  }

  return (
    <div role="radiogroup" className="flex flex-wrap gap-2" onKeyDown={handleKeyDown}>
      {options.map((o, i) => (
        <Button
          key={o.key}
          ref={(el) => {
            btnRefs.current[i] = el;
          }}
          type="button"
          role="radio"
          aria-checked={value === o.key}
          tabIndex={value === o.key ? 0 : -1}
          variant={value === o.key ? "default" : "outline"}
          size="sm"
          className={fill ? "flex-1" : undefined}
          onClick={() => onChange(o.key)}
        >
          {o.label}
        </Button>
      ))}
    </div>
  );
}
