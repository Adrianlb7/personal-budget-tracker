import { createClient } from "@/lib/supabase/server";

const noStoreHeaders = { "Cache-Control": "private, no-store" };
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const iconSources = {
  recurring: {
    table: "recurring_commitments",
    bucket: "recurring-icons",
  },
  transactions: {
    table: "transactions",
    bucket: "transaction-icons",
  },
} as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  const { kind, id } = await params;
  const source = iconSources[kind as keyof typeof iconSources];
  if (!source || !uuid.test(id)) {
    return new Response(null, { status: 404, headers: noStoreHeaders });
  }

  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) {
    return new Response(null, { status: 401, headers: noStoreHeaders });
  }

  const { data: item, error: itemError } = await supabase
    .from(source.table)
    .select("icon_image_path")
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (itemError || !item?.icon_image_path) {
    return new Response(null, { status: 404, headers: noStoreHeaders });
  }

  const { data: image, error: imageError } = await supabase.storage
    .from(source.bucket)
    .download(item.icon_image_path);
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
