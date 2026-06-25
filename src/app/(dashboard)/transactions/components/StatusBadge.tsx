import { Badge } from "@/components/ui/badge";

// pending = chưa thu/trả (trạng thái bình thường, không phải lỗi) → màu trung tính.
const STATUS: Record<string, { label: string; variant: "success" | "warning" | "muted" }> = {
  paid: { label: "Đủ", variant: "success" },
  partial: { label: "Một phần", variant: "warning" },
  pending: { label: "Chưa", variant: "muted" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? STATUS.pending;
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
