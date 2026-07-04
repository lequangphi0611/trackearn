import { Badge } from "@/components/ui/badge";
import type { UserWithStats } from "@/queries/users";
import { MemberActions } from "./MemberActions";

const ROLE_LABELS: Record<string, string> = {
  owner: "Chủ hộ",
  member: "Thành viên",
};

export function UserList({ users }: { users: UserWithStats[] }) {
  return (
    <ul className="overflow-hidden rounded-lg border border-border">
      {users.map((u, idx) => (
        <li
          key={u.id}
          className={idx > 0 ? "border-t border-t-border/70" : undefined}
        >
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate text-sm font-medium">{u.name}</span>
                <Badge variant={u.role === "owner" ? "default" : "muted"}>
                  {ROLE_LABELS[u.role] ?? u.role}
                </Badge>
                {u.banned ? (
                  <Badge variant="danger">Đã khóa</Badge>
                ) : (
                  <Badge variant="success">Hoạt động</Badge>
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
              {u.banned && u.banReason && (
                <p className="truncate text-xs text-muted-foreground">
                  Lý do khóa: {u.banReason}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {u.hasTransactions ? "Đã có giao dịch" : "Chưa có giao dịch"}
              </p>
            </div>
            {/* Owner không tự khóa/xóa/reset chính mình — ẩn menu (spec 4.1). */}
            {u.role === "member" && (
              <MemberActions
                userId={u.id}
                name={u.name}
                banned={u.banned}
                hasTransactions={u.hasTransactions}
              />
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
