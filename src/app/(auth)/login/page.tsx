import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ownerExists } from "@/queries/users";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackURL?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/");

  const { callbackURL } = await searchParams;
  const hasOwner = await ownerExists();

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Đăng nhập</CardTitle>
        <CardDescription>TrackEarn — quản lý doanh thu cửa hàng</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm callbackURL={callbackURL} showRegister={!hasOwner} />
      </CardContent>
    </Card>
  );
}
