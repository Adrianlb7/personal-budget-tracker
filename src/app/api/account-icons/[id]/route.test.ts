import { vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { GET } from "./route";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const accountId = "b8e69e52-77d1-4e72-8403-17e8f7d7a2f9";
const ownerId = "b5d1c67d-6a18-4a4a-9289-f76789d682bc";
const request = new Request(`http://localhost/api/account-icons/${accountId}`);
const context = { params: Promise.resolve({ id: accountId }) };

function fakeSupabase(account: { icon_image_path: string } | null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: account, error: null });
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
    storageFrom,
  };
}

describe("private account icon route", () => {
  it("requires a signed-in user", async () => {
    const fake = fakeSupabase({
      icon_image_path: `${ownerId}/${accountId}/icon.png`,
    });
    fake.client.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    vi.mocked(createClient).mockResolvedValue(fake.client as never);

    const response = await GET(request, context);

    expect(response.status).toBe(401);
    expect(fake.client.from).not.toHaveBeenCalled();
    expect(fake.storageFrom).not.toHaveBeenCalled();
  });

  it("does not read Storage when no account belongs to the user", async () => {
    const fake = fakeSupabase(null);
    vi.mocked(createClient).mockResolvedValue(fake.client as never);

    const response = await GET(request, context);

    expect(response.status).toBe(404);
    expect(fake.eq).toHaveBeenCalledWith("user_id", ownerId);
    expect(fake.storageFrom).not.toHaveBeenCalled();
  });

  it("serves only the path from the owned account and disables caching", async () => {
    const path = `${ownerId}/${accountId}/icon.png`;
    const fake = fakeSupabase({ icon_image_path: path });
    vi.mocked(createClient).mockResolvedValue(fake.client as never);

    const response = await GET(request, context);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(fake.storageFrom).toHaveBeenCalledWith("account-icons");
    expect(fake.download).toHaveBeenCalledWith(path);
  });
});
