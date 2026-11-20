import { vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { GET } from "./route";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const itemId = "b8e69e52-77d1-4e72-8403-17e8f7d7a2f9";
const ownerId = "b5d1c67d-6a18-4a4a-9289-f76789d682bc";

function requestFor(kind: string, id = itemId) {
  return {
    request: new Request(`http://localhost/api/item-icons/${kind}/${id}`),
    context: { params: Promise.resolve({ kind, id }) },
  };
}

function fakeSupabase(item: { icon_image_path: string } | null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: item, error: null });
  const eq = vi.fn();
  eq.mockReturnValue({ eq, maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  const download = vi.fn().mockResolvedValue({
    data: new Blob([new Uint8Array([137, 80, 78, 71])]),
    error: null,
  });
  const storageFrom = vi.fn().mockReturnValue({ download });
  const getUser = vi.fn().mockResolvedValue({
    data: { user: { id: ownerId } },
    error: null,
  });
  return {
    client: { auth: { getUser }, from, storage: { from: storageFrom } },
    download,
    eq,
    from,
    storageFrom,
  };
}

describe("private recurring and transaction icon route", () => {
  it("rejects unsupported kinds before accessing the database", async () => {
    const fake = fakeSupabase(null);
    vi.mocked(createClient).mockResolvedValue(fake.client as never);
    const { request, context } = requestFor("accounts");

    expect((await GET(request, context)).status).toBe(404);
    expect(fake.from).not.toHaveBeenCalled();
  });

  it("requires a signed-in user", async () => {
    const fake = fakeSupabase(null);
    fake.client.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    vi.mocked(createClient).mockResolvedValue(fake.client as never);
    const { request, context } = requestFor("recurring");

    const response = await GET(request, context);

    expect(response.status).toBe(401);
    expect(fake.from).not.toHaveBeenCalled();
  });

  it.each([
    ["recurring", "recurring_commitments", "recurring-icons"],
    ["transactions", "transactions", "transaction-icons"],
  ])(
    "serves an owned %s icon from its private bucket",
    async (kind, table, bucket) => {
      const path = `${ownerId}/${itemId}/icon.png`;
      const fake = fakeSupabase({ icon_image_path: path });
      vi.mocked(createClient).mockResolvedValue(fake.client as never);
      const { request, context } = requestFor(kind);

      const response = await GET(request, context);

      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toContain("no-store");
      expect(response.headers.get("content-type")).toBe("image/png");
      expect(fake.from).toHaveBeenCalledWith(table);
      expect(fake.eq).toHaveBeenCalledWith("user_id", ownerId);
      expect(fake.storageFrom).toHaveBeenCalledWith(bucket);
      expect(fake.download).toHaveBeenCalledWith(path);
    },
  );

  it("does not fetch Storage for an item the user cannot read", async () => {
    const fake = fakeSupabase(null);
    vi.mocked(createClient).mockResolvedValue(fake.client as never);
    const { request, context } = requestFor("transactions");

    expect((await GET(request, context)).status).toBe(404);
    expect(fake.storageFrom).not.toHaveBeenCalled();
  });
});
