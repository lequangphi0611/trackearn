"use client";

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
  return (
    <div role="radiogroup" className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Button
          key={o.key}
          type="button"
          role="radio"
          aria-checked={value === o.key}
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
