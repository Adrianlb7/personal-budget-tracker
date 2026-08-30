import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getAuthRedirect } from "@/lib/auth/routes";
import { getSupabaseConfig } from "./config";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, anonKey } = getSupabaseConfig();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const destination = getAuthRedirect(
    request.nextUrl.pathname,
    Boolean(data?.claims.sub),
  );

  if (destination) {
    const redirectUrl = request.nextUrl.clone();
    const [pathname, search = ""] = destination.split("?");
    redirectUrl.pathname = pathname;
    redirectUrl.search = search;
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
