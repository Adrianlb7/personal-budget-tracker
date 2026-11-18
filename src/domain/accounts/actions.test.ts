import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { vi } from "vitest";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { createAccount } from "./actions";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));
vi.mock("@/lib/auth/require-user", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const ownerId = "b5d1c67d-6a18-4a4a-9289-f76789d682bc";
const onePixelPng = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAXpeqz8AAAAASUVORK5CYII=",
  ),
  (character) => character.charCodeAt(0),
);

function accountFormData() {
  const formData = new FormData();
  formData.set("name", "Headphones");
  formData.set("type", "savings");
  formData.set("currency", "USD");
  formData.set("openingBalance", "100.00");
  return formData;
}

function pngFile() {
  const buffer = new Uint8Array(onePixelPng).buffer;
  const file = new File([buffer], "headphones.png", { type: "image/png" });
  Object.defineProperty(file, "arrayBuffer", { value: async () => buffer });
  return file;
}

function fakeSupabase({
  uploadError = false,
  updateError = false,
}: {
  uploadError?: boolean;
  updateError?: boolean;
} = {}) {
  const insert = vi.fn().mockResolvedValue({ error: null });
  const maybeSingle = vi
    .fn()
    .mockResolvedValue(
      updateError
        ? { data: null, error: new Error("update failed") }
        : { data: { id: "saved" }, error: null },
    );
  const eq = vi.fn();
  const select = vi.fn();
  const query = { eq, maybeSingle, select };
  eq.mockReturnValue(query);
  select.mockReturnValue(query);
  const update = vi.fn().mockReturnValue(query);
  const from = vi.fn().mockReturnValue({ insert, update });
  const upload = vi.fn().mockResolvedValue({
    error: uploadError ? new Error("upload failed") : null,
  });
  const remove = vi.fn().mockResolvedValue({ error: null });
  const storageFrom = vi.fn().mockReturnValue({ remove, upload });
  const rpc = vi.fn().mockResolvedValue({ data: true, error: null });
  vi.mocked(createClient).mockResolvedValue({
    from,
    rpc,
    storage: { from: storageFrom },
  } as never);
  return { eq, from, insert, remove, rpc, storageFrom, update, upload };
}

describe("createAccount icon selection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireUser).mockResolvedValue({ id: ownerId } as never);
  });

  it("creates an account with its chosen emoji", async () => {
    const fake = fakeSupabase();
    const formData = accountFormData();
    formData.set("iconEmoji", "🎧");

    await expect(createAccount({}, formData)).rejects.toThrow("NEXT_REDIRECT");

    expect(fake.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: "USD",
        icon_emoji: "🎧",
        name: "Headphones",
        opening_balance: "100.00",
        type: "savings",
        user_id: ownerId,
      }),
    );
    expect(fake.storageFrom).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/app/accounts");
    expect(redirect).toHaveBeenCalledWith("/app/accounts");
  });

  it("uploads a validated PNG to the new owner's account and records its path", async () => {
    const fake = fakeSupabase();
    const formData = accountFormData();
    formData.set("iconImage", pngFile());

    await expect(createAccount({}, formData)).rejects.toThrow("NEXT_REDIRECT");

    const accountId = fake.insert.mock.calls[0][0].id as string;
    const imagePath = fake.upload.mock.calls[0][0] as string;
    expect(imagePath).toMatch(
      new RegExp(`^${ownerId}/${accountId}/[0-9a-f-]{36}\\.png$`),
    );
    expect(fake.storageFrom).toHaveBeenCalledWith("account-icons");
    expect(fake.upload).toHaveBeenCalledWith(
      imagePath,
      expect.any(ArrayBuffer),
      { contentType: "image/png", upsert: false },
    );
    expect(fake.update).toHaveBeenCalledWith({ icon_image_path: imagePath });
    expect(fake.eq).toHaveBeenCalledWith("id", accountId);
    expect(fake.eq).toHaveBeenCalledWith("user_id", ownerId);
    expect(fake.remove).not.toHaveBeenCalled();
    expect(fake.rpc).not.toHaveBeenCalled();
  });

  it("removes an incomplete account when its icon upload fails", async () => {
    const fake = fakeSupabase({ uploadError: true });
    const formData = accountFormData();
    formData.set("iconImage", pngFile());

    const result = await createAccount({}, formData);

    const accountId = fake.insert.mock.calls[0][0].id as string;
    const imagePath = fake.upload.mock.calls[0][0] as string;
    expect(result.message).toMatch(/image could not be saved/i);
    expect(fake.update).not.toHaveBeenCalled();
    expect(fake.remove).toHaveBeenCalledWith([imagePath]);
    expect(fake.rpc).toHaveBeenCalledWith("delete_empty_account", {
      p_account_id: accountId,
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("removes the uploaded image and new account when saving its path fails", async () => {
    const fake = fakeSupabase({ updateError: true });
    const formData = accountFormData();
    formData.set("iconImage", pngFile());

    const result = await createAccount({}, formData);

    const accountId = fake.insert.mock.calls[0][0].id as string;
    const imagePath = fake.upload.mock.calls[0][0] as string;
    expect(result.message).toMatch(/image could not be saved/i);
    expect(fake.update).toHaveBeenCalledWith({ icon_image_path: imagePath });
    expect(fake.remove).toHaveBeenCalledWith([imagePath]);
    expect(fake.rpc).toHaveBeenCalledWith("delete_empty_account", {
      p_account_id: accountId,
    });
    expect(redirect).not.toHaveBeenCalled();
  });
});
