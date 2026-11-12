import { NextResponse } from "next/server";
import { z } from "zod";
import { isSameOriginRequest } from "@/lib/auth/same-origin";
import { createClient } from "@/lib/supabase/server";

const sessionSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
});

const headers = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { ok: false, code: "invalid_origin" },
      { status: 403, headers },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = sessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "invalid_session" },
      { status: 400, headers },
    );
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.setSession(parsed.data);
    if (error || !data.session) {
      return NextResponse.json(
        { ok: false, code: error?.code ?? "invalid_session" },
        { status: 401, headers },
      );
    }

    return NextResponse.json({ ok: true }, { headers });
  } catch {
    return NextResponse.json(
      { ok: false, code: "session_connection_error" },
      { status: 502, headers },
    );
  }
}
