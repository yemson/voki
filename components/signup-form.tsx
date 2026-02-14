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

interface SignupFormProps extends React.ComponentProps<"div"> {
  action: (
    prevState: { error?: string } | null,
    formData: FormData,
  ) => Promise<{ error?: string }>;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "가입 중이에요" : "회원가입"}
    </Button>
  );
}

export function SignupForm({ className, action, ...props }: SignupFormProps) {
  const [state, formAction] = useActionState(action, null);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>회원가입</CardTitle>
          <CardDescription>복기 기록을 시작해 볼까요?</CardDescription>
        </CardHeader>

        <CardContent>
          <form action={formAction}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="full_name">이름</FieldLabel>
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  minLength={2}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="email">이메일</FieldLabel>
                <Input id="email" name="email" type="email" required />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">비밀번호</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  minLength={8}
                  required
                />
              </Field>

              {state?.error && (
                <p className="text-sm text-red-500 text-center">{state.error}</p>
              )}

              <Field>
                <SubmitButton />
              </Field>

              <Field>
                <p className="text-sm text-center text-muted-foreground">
                  이미 계정이 있나요?{" "}
                  <Link href="/login" className="underline underline-offset-4">
                    로그인
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
