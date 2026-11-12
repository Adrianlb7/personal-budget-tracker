import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getSupabaseConfig } from "@/lib/supabase/config";

const requestSchema = z.object({ email: z.email() });
const responseHeaders = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "email_address_invalid" },
      { status: 400, headers: responseHeaders },
    );
  }

  try {
    const { url, anonKey } = getSupabaseConfig();
    // Recovery links may be opened in a different browser from the request.
    // A stateless implicit request avoids binding the email to a local PKCE verifier.
    const supabase = createClient(url, anonKey, {
      auth: {
        flowType: "implicit",
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
    const { error } = await supabase.auth.resetPasswordForEmail(
      parsed.data.email,
      { redirectTo: `${new URL(request.url).origin}/auth/callback` },
    );

    if (error) {
      return NextResponse.json(
        { ok: false, code: error.code ?? "auth_error", status: error.status },
        { status: 502, headers: responseHeaders },
      );
    }

    return NextResponse.json(
      { ok: true },
      { status: 200, headers: responseHeaders },
    );
  } catch {
    return NextResponse.json(
      { ok: false, code: "server_connection_error" },
      { status: 502, headers: responseHeaders },
    );
  }
}
