"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signup(
  prevState: { error?: string } | null,
  formData: FormData,
) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = (formData.get("full_name") as string | null)?.trim();

  if (!fullName) {
    return { error: "이름을 입력해 주세요." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.session) {
    redirect("/dashboard");
  }

  return { error: "회원가입 후 로그인해 주세요." };
}
