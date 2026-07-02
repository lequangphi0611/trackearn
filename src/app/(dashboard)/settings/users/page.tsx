import { redirect } from "next/navigation";
import { getCurrentSession } from "@/queries/session";
import { listUsersWithStats } from "@/queries/users";
import { CreateMemberDialog } from "./components/CreateMemberDialog";
import { UserList } from "./components/UserList";

export default async function UsersPage() {
  // Owner-only: gác ở server component, không ở middleware (middleware.md §5).
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (session.user.role !== "owner") redirect("/");

  const users = await listUsersWithStats();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Người dùng</h1>
          <p className="text-sm text-muted-foreground">
            Tạo và quản lý tài khoản thành viên
          </p>
        </div>
        <CreateMemberDialog />
      </div>

      <UserList users={users} />
    </div>
  );
}
