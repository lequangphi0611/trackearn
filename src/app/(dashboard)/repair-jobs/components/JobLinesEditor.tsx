"use client";

import { Trash2, Plus, AlertTriangle } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { InputMoney } from "@/components/forms/InputMoney";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatQuantity } from "@/lib/format";

export type PickerPart = {
  id: string;
  name: string;
  unit: string;
  quantity: string;
  buyPrice: number;
};

export type LineDraft = { sparePartId: string; quantity: string; unitPrice: number | undefined };

export const emptyLine: LineDraft = { sparePartId: "", quantity: "", unitPrice: undefined };

export function JobLinesEditor({
  parts,
  value,
  onChange,
}: {
  parts: PickerPart[];
  value: LineDraft[];
  onChange: (lines: LineDraft[]) => void;
}) {
  const byId = new Map(parts.map((p) => [p.id, p]));

  function update(i: number, patch: Partial<LineDraft>) {
    onChange(value.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function pickPart(i: number, sparePartId: string) {
    const part = byId.get(sparePartId);
    // Tự điền giá bán = giá vốn hiện tại nếu chưa nhập.
    const unitPrice = value[i].unitPrice ?? (part ? part.buyPrice : undefined);
    update(i, { sparePartId, unitPrice });
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium">Phụ tùng xuất</span>
      {value.length === 0 && (
        <p className="text-xs text-muted-foreground">Chưa có dòng nào — có thể tạo job chỉ tính tiền công.</p>
      )}
      {value.map((line, i) => {
        const part = byId.get(line.sparePartId);
        const overStock = part ? Number(line.quantity || 0) > Number(part.quantity) : false;
        return (
          <div key={i} className="rounded-lg border border-border p-2">
            <div className="flex items-center gap-2">
              <Select
                aria-label="Phụ tùng"
                value={line.sparePartId}
                onChange={(e) => pickPart(i, e.target.value)}
                className="flex-1"
              >
                <option value="">— Chọn phụ tùng —</option>
                {parts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (tồn {formatQuantity(p.quantity, p.unit)})
                  </option>
                ))}
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Xoá dòng"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                aria-label="Số lượng"
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                placeholder={part ? `SL (${part.unit})` : "Số lượng"}
                value={line.quantity}
                onChange={(e) => update(i, { quantity: e.target.value })}
                className="w-1/2"
              />
              <Label className="w-1/2">
                <span className="sr-only">Giá bán</span>
                <InputMoney
                  value={line.unitPrice}
                  onChange={(v) => update(i, { unitPrice: v })}
                  placeholder="Giá bán"
                />
              </Label>
            </div>
            {overStock && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-expense">
                <AlertTriangle className="size-3.5" />
                Xuất quá tồn — tồn sẽ về âm.
              </p>
            )}
          </div>
        );
      })}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, { ...emptyLine }])}>
        <Plus className="size-4" />
        Thêm phụ tùng
      </Button>
    </div>
  );
}
