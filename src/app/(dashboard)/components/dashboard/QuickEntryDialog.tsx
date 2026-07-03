"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { TRANSACTION_LINES, getTransactionLine } from "@/lib/transaction-lines";
import { useQuickEntryStore } from "@/lib/quick-entry-store";
import { TransactionForm } from "../../transactions/components/TransactionForm";
import { DeviceTransactionForm } from "../../transactions/components/DeviceTransactionForm";

type Category = { id: string; name: string };
type DeviceOption = { id: string; name: string; conditionNote: string | null };

/**
 * Nhập nhanh ngay trên dashboard (dialog — spec dashboard.md §10.1): chọn mảng
 * trước (không mặc định, tránh nhập nhầm — §10.2) rồi tái dùng đúng form của
 * /transactions/<mảng>/new. Lưu xong đóng dialog, revalidate giữ nguyên trang.
 */
export function QuickEntryDialog({
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
  // Store thay useState để FAB ở BottomNav mở được cùng dialog này.
  const open = useQuickEntryStore((s) => s.isOpen);
  const openStore = useQuickEntryStore((s) => s.open);
  const close = useQuickEntryStore((s) => s.close);
  const [line, setLine] = useState("");
  const config = line ? getTransactionLine(line) : undefined;

  // `isOpen` sống trong store toàn cục, ngoài vòng đời component — nếu người
  // dùng điều hướng đi (vd bấm link "Nhập máy" trong form) mà không đóng
  // dialog trước, store vẫn giữ true và lần quay lại "/" dialog tự bật lại.
  // Reset khi unmount để mỗi lần vào "/" luôn bắt đầu từ trạng thái đóng.
  useEffect(() => {
    return () => close();
  }, [close]);

  function handleOpenChange(next: boolean) {
    if (next) openStore();
    else close();
    if (!next) setLine(""); // lần mở sau bắt chọn lại mảng từ đầu
  }

  function handleSuccess() {
    close();
    setLine("");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button size="lg" className="w-full">
            <Plus />
            Nhập giao dịch
          </Button>
        }
      />
      <DialogContent variant="sheet" className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nhập giao dịch nhanh</DialogTitle>
          <DialogDescription>
            Chọn mảng rồi ghi thu/chi như ở màn giao dịch.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="quick-entry-line">Mảng</Label>
            <Select
              id="quick-entry-line"
              value={line}
              onChange={(e) => setLine(e.target.value)}
            >
              <option value="" disabled>
                — Chọn mảng —
              </option>
              {TRANSACTION_LINES.map((l) => (
                <option key={l.slug} value={l.slug}>
                  {l.label}
                </option>
              ))}
            </Select>
          </div>

          {config &&
            // key={line}: đổi mảng phải remount form, không giữ state mảng cũ.
            (config.hasDevicePicker ? (
              <DeviceTransactionForm
                key={line}
                line={config.slug}
                devices={devices}
                categories={categories}
                defaultDateTime={defaultDateTime}
                defaultDate={defaultDate}
                onSuccess={handleSuccess}
                stickySubmit
              />
            ) : (
              <TransactionForm
                key={line}
                line={config.slug}
                lockType={config.expenseOnly ? "expense" : undefined}
                defaultDateTime={defaultDateTime}
                categories={categories}
                onSuccess={handleSuccess}
                stickySubmit
              />
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
