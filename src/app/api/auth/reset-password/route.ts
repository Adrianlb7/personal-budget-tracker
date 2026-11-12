import { NextResponse } from "next/server";
import { z } from "zod";
import { isSameOriginRequest } from "@/lib/auth/same-origin";
import { createClient } from "@/lib/supabase/server";

const passwordSchema = z.object({ password: z.string().min(8) });
const headers = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { ok: false, code: "invalid_origin" },
      { status: 403, headers },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = passwordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        code: "invalid_password",
        message: "Use at least 8 characters.",
      },
      { status: 400, headers },
    );
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });
    if (error) {
      return NextResponse.json(
        { ok: false, code: error.code ?? "auth_error", message: error.message },
        { status: error.status === 401 ? 401 : 400, headers },
      );
    }

    // A failure while signing out must not report that a successful password
    // update failed, which would prompt the user to repeat the reset.
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // The password is already updated. The user can sign in with it.
    }

    return NextResponse.json({ ok: true }, { headers });
  } catch {
    return NextResponse.json(
      { ok: false, code: "connection_error" },
      { status: 502, headers },
    );
  }
}
