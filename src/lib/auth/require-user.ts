import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;

  if (error || !userId) {
    redirect("/sign-in");
  }

  return {
    email: typeof data.claims.email === "string" ? data.claims.email : null,
    id: userId,
  };
}
