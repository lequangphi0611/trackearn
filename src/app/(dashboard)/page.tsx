import { getCurrentSession } from "@/queries/session";

export default async function DashboardPage() {
  const session = await getCurrentSession();
  const name = session?.user.name ?? "";

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-lg font-semibold">
        Xin chào{name ? `, ${name}` : ""}
      </h1>
      <p className="text-sm text-muted-foreground">
        Bảng điều khiển số liệu ngày sẽ được bổ sung ở giai đoạn sau.
      </p>
    </div>
  );
}
