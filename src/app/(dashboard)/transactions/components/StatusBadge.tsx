import { Badge } from "@/components/ui/badge";

const STATUS: Record<string, { label: string; variant: "success" | "warning" | "danger" }> = {
  paid: { label: "Đủ", variant: "success" },
  partial: { label: "Một phần", variant: "warning" },
  pending: { label: "Chưa", variant: "danger" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? STATUS.pending;
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
