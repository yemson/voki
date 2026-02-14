import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>대시보드</CardTitle>
          <CardDescription>
            <span className="font-medium">{user.email}</span> 계정으로 로그인했어요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            준비가 끝났어요. 이제 매매 복기를 기록해 보세요.
          </p>
        </CardContent>
        <CardFooter>
          <form action={logout} className="w-full">
            <Button type="submit" variant="outline" className="w-full">
              로그아웃
            </Button>
          </form>
        </CardFooter>
      </Card>
    </main>
  );
}
