import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentSession } from "@/queries/session";
import { DashboardNav } from "./components/DashboardNav";
import { SignOutButton } from "./components/SignOutButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense-in-depth ngoài proxy: xác thực session thật khi render.
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const role = session.user.role ?? "member";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-2 px-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-semibold">
              TrackEarn
            </Link>
            <DashboardNav role={role} />
          </div>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
