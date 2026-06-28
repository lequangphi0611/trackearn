import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentSession } from "@/queries/session";
import { ownerExists } from "@/queries/users";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { RegisterForm } from "./RegisterForm";

export default async function RegisterPage() {
  const session = await getCurrentSession();
  if (session) redirect("/");

  const hasOwner = await ownerExists();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {hasOwner ? "Đăng ký đã đóng" : "Tạo tài khoản chủ hộ"}
        </CardTitle>
        <CardDescription>
          {hasOwner
            ? "Đã có chủ tài khoản. Liên hệ chủ hộ để được cấp tài khoản."
            : "Tài khoản đầu tiên là chủ hộ — quản lý toàn bộ thu chi và cấp tài khoản cho người nhà."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasOwner ? (
          <Link href="/login" className={buttonVariants({ size: "lg", className: "w-full" })}>
            Đăng nhập
          </Link>
        ) : (
          <RegisterForm />
        )}
      </CardContent>
    </Card>
  );
}
