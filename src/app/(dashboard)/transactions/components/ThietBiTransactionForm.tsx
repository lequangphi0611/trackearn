"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/forms/SubmitButton";
import {
  Combobox,
  ComboboxClear,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import { formatCurrency } from "@/lib/format";
import { SellDeviceForm } from "../../devices/components/SellDeviceForm";
import { TransactionForm } from "./TransactionForm";

type Category = { id: string; name: string };
type DeviceOption = { id: string; name: string; conditionNote: string | null; buyPrice: number };
type ComboItem = { value: string; label: string };

const MODES = [
  { key: "sell", label: "Bán máy trong kho" },
  { key: "income", label: "Thu khác (sửa chữa, phụ kiện...)" },
  { key: "expense", label: "Chi phí" },
] as const;
type Mode = (typeof MODES)[number]["key"];

/**
 * Mảng thiết bị có 3 kiểu giao dịch khác hẳn nhau — thay vì công tắc Thu/Chi
 * chung, cho chọn thẳng loại; "Bán máy" gắn nội tuyến với 1 máy còn hàng
 * (dùng chung SellDeviceForm với dialog "Bán ra" trên /devices/[id]) thay vì
 * bắt rời màn sang /devices như trước.
 */
export function ThietBiTransactionForm({
  devices,
  categories,
  defaultDateTime,
  defaultDate,
}: {
  devices: DeviceOption[];
  categories: Category[];
  defaultDateTime: string;
  defaultDate: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(devices.length > 0 ? "sell" : "income");
  const [selected, setSelected] = useState<ComboItem | null>(null);

  const items: ComboItem[] = devices.map((d) => ({
    value: d.id,
    label: [d.name, d.conditionNote, formatCurrency(d.buyPrice)].filter(Boolean).join(" — "),
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>Loại giao dịch</Label>
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <Button
              key={m.key}
              type="button"
              variant={mode === m.key ? "default" : "outline"}
              size="sm"
              onClick={() => setMode(m.key)}
            >
              {m.label}
            </Button>
          ))}
        </div>
      </div>

      {mode === "sell" &&
        (devices.length === 0 ? (
          <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            Chưa có máy còn hàng trong kho.{" "}
            <Link href="/devices/new" className="font-medium text-foreground underline">
              Nhập máy
            </Link>{" "}
            trước khi bán.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="device-combobox-input">Chọn máy</Label>
              <Combobox items={items} value={selected} onValueChange={setSelected}>
                <ComboboxInputGroup>
                  <ComboboxInput
                    id="device-combobox-input"
                    placeholder="Tìm theo tên máy, tình trạng..."
                  />
                  {selected && <ComboboxClear />}
                  <ComboboxTrigger />
                </ComboboxInputGroup>
                <ComboboxPopup>
                  <ComboboxEmpty>Không tìm thấy máy.</ComboboxEmpty>
                  <ComboboxList>
                    {(item: ComboItem) => (
                      <ComboboxItem key={item.value} value={item}>
                        {item.label}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxPopup>
              </Combobox>
            </div>

            {selected && (
              <SellDeviceForm
                id={selected.value}
                defaultDate={defaultDate}
                onSuccess={() => router.push("/transactions/thiet-bi")}
                footer={
                  <SubmitButton size="lg" fullWidth>
                    Lưu giao dịch
                  </SubmitButton>
                }
              />
            )}
          </>
        ))}

      {mode === "income" && (
        <TransactionForm
          line="thiet-bi"
          expenseOnly={false}
          lockType="income"
          defaultDateTime={defaultDateTime}
          categories={categories}
        />
      )}

      {mode === "expense" && (
        <TransactionForm
          line="thiet-bi"
          expenseOnly
          defaultDateTime={defaultDateTime}
          categories={categories}
        />
      )}
    </div>
  );
}
