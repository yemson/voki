"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface LoginFormProps extends React.ComponentProps<"div"> {
  action: (
    prevState: { error?: string } | null,
    formData: FormData,
  ) => Promise<{ error?: string }>;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "로그인 중이에요" : "로그인"}
    </Button>
  );
}

export function LoginForm({ className, action, ...props }: LoginFormProps) {
  const [state, formAction] = useActionState(action, null);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>로그인</CardTitle>
          <CardDescription>이메일과 비밀번호를 입력해 주세요</CardDescription>
        </CardHeader>

        <CardContent>
          <form action={formAction}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">이메일</FieldLabel>
                <Input id="email" name="email" type="email" required />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">비밀번호</FieldLabel>
                <Input id="password" name="password" type="password" required />
              </Field>

              {state?.error && (
                <p className="text-sm text-red-500 text-center">
                  {state.error}
                </p>
              )}

              <Field>
                <SubmitButton />
              </Field>

              <Field>
                <p className="text-sm text-center text-muted-foreground">
                  아직 계정이 없나요?{" "}
                  <Link href="/signup" className="underline underline-offset-4">
                    회원가입
                  </Link>
                </p>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
