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
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>
            Logged in as <span className="font-medium">{user.email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            인증이 완료되었습니다. 이제 트레이딩 복기 기능을 이어서 구현하면 됩니다.
          </p>
        </CardContent>
        <CardFooter>
          <form action={logout} className="w-full">
            <Button type="submit" variant="outline" className="w-full">
              Logout
            </Button>
          </form>
        </CardFooter>
      </Card>
    </main>
  );
}
