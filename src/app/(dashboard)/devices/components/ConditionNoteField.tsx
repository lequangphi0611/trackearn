"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const PRESETS = ["Like new 99%", "Đẹp 95%", "Bình thường", "Trầy xước nhẹ", "Cần sửa"];

export function ConditionNoteField({
  defaultValue = "",
  error,
}: {
  defaultValue?: string;
  error?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  // Dedupe: người dùng có thể tự gõ trùng cụm giống 1 chip, filter/includes
  // bên dưới cần selected là tập hợp duy nhất để bấm chip luôn nhất quán.
  const selected = Array.from(
    new Set(
      value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  );

  function toggle(preset: string) {
    setValue(
      selected.includes(preset)
        ? selected.filter((s) => s !== preset).join(", ")
        : [...selected, preset].join(", "),
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="conditionNote">Tình trạng / ghi chú</Label>
      <Input
        id="conditionNote"
        name="conditionNote"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="vd: Đẹp 95%, còn bảo hành hãng"
        aria-invalid={Boolean(error)}
      />
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => {
          const active = selected.includes(preset);
          return (
            <button
              key={preset}
              type="button"
              onClick={() => toggle(preset)}
              aria-pressed={active}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-secondary text-secondary-foreground hover:border-ring",
              )}
            >
              {preset}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">Tuỳ chọn — bấm thẻ để chèn nhanh, gõ thêm nếu cần.</p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
