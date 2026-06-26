import { redirect } from "next/navigation";
import { getCurrentSession } from "@/queries/session";
import { ownerExists } from "@/queries/users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackURL?: string }>;
}) {
  const session = await getCurrentSession();
  if (session) redirect("/");

  const { callbackURL } = await searchParams;
  const hasOwner = await ownerExists();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Đăng nhập</CardTitle>
      </CardHeader>
      <CardContent>
        <LoginForm callbackURL={callbackURL} showRegister={!hasOwner} />
      </CardContent>
    </Card>
  );
}
