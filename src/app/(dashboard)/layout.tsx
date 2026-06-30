import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentSession } from "@/queries/session";
import { Logo } from "@/components/brand/Logo";
import { DashboardNav } from "./components/DashboardNav";
import { UserMenu } from "./components/UserMenu";
import { BottomNav } from "./components/BottomNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense-in-depth ngoài proxy: xác thực session thật khi render.
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-2 px-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold tracking-tight"
            >
              <Logo className="size-6 rounded-md" />
              <span>TrackEarn</span>
            </Link>
            <DashboardNav />
          </div>
          <UserMenu name={session.user.name} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-24 sm:pb-8">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
