import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
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
