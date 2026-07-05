import { Wrench } from "lucide-react";
import { HubCard } from "./HubCard";

/**
 * Lối vào "Tạo job sửa máy" (xe múc) — lặp lại y hệt ở 3 nơi (QuickEntryDialog,
 * transactions/xe-muc/new, transactions/xe-muc list) nên tách dùng chung, tránh
 * lệch nội dung giữa các bản (issue #12).
 */
export const RepairJobHubCard = () => (
  <HubCard href="/repair-jobs/new" icon={<Wrench className="size-5" />} title="Tạo job sửa máy">
    Sửa máy cho khách, xuất phụ tùng từ kho — dùng thay cho form bên dưới nếu có
  </HubCard>
);
