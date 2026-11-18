import { createClient } from "@/lib/supabase/server";

const noStoreHeaders = { "Cache-Control": "private, no-store" };
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!uuid.test(id)) {
    return new Response(null, { status: 404, headers: noStoreHeaders });
  }

  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) {
    return new Response(null, { status: 401, headers: noStoreHeaders });
  }

  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .select("icon_image_path")
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (accountError || !account?.icon_image_path) {
    return new Response(null, { status: 404, headers: noStoreHeaders });
  }

  const { data: image, error: imageError } = await supabase.storage
    .from("account-icons")
    .download(account.icon_image_path);
  if (imageError || !image) {
    return new Response(null, { status: 404, headers: noStoreHeaders });
  }

  return new Response(image, {
    headers: {
      ...noStoreHeaders,
      "Content-Type": "image/png",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
