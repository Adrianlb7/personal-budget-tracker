"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signInSchema, type SignInState } from "./validation";

export async function signIn(
  _state: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const result = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(result.data);

  if (error) {
    return { message: "The email or password is incorrect." };
  }

  redirect("/app");
}

export async function signOut() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims.sub) {
    await supabase.auth.signOut();
  }

  redirect("/sign-in");
}
