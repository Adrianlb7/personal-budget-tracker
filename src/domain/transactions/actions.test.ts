import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import { createTransfer } from "./actions";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));
vi.mock("@/lib/auth/require-user", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const ownerId = "b5d1c67d-6a18-4a4a-9289-f76789d682bc";
const sourceId = "27130d7e-6829-4da9-9f11-09e16445a891";
const destinationId = "c4b7eb68-1a94-407f-94e2-f47b56e4e6f8";
const transferId = "c6f26a0b-ab0d-4376-8f7d-656ba4c69b88";
const onePixelPng = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAXpeqz8AAAAASUVORK5CYII=",
  ),
  (character) => character.charCodeAt(0),
);

function formData() {
  const form = new FormData();
  form.set("amount", "20.00");
  form.set("date", "2026-11-18");
  form.set("description", "Move to savings");
  form.set("sourceAccountId", sourceId);
  form.set("destinationAccountId", destinationId);
  form.set("exchangeRate", "");
  form.set("notes", "");
  return form;
}

function pngFile() {
  const buffer = new Uint8Array(onePixelPng).buffer;
  const file = new File([buffer], "icon.png", { type: "image/png" });
  Object.defineProperty(file, "arrayBuffer", { value: async () => buffer });
  return file;
}

function fakeSupabase({
  uploadError = false,
  iconRpcThrows = false,
}: {
  uploadError?: boolean;
  iconRpcThrows?: boolean;
} = {}) {
  const accountQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    is: vi.fn(),
    in: vi.fn().mockResolvedValue({
      data: [
        { id: sourceId, currency: "USD", type: "checking" },
        { id: destinationId, currency: "USD", type: "savings" },
      ],
      error: null,
    }),
  };
  accountQuery.select.mockReturnValue(accountQuery);
  accountQuery.eq.mockReturnValue(accountQuery);
  accountQuery.is.mockReturnValue(accountQuery);
  const transactionQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: { icon_image_path: null },
      error: null,
    }),
  };
  transactionQuery.select.mockReturnValue(transactionQuery);
  transactionQuery.eq.mockReturnValue(transactionQuery);
  const upload = vi.fn().mockResolvedValue({
    error: uploadError ? new Error("upload failed") : null,
  });
  const remove = vi.fn().mockResolvedValue({ error: null });
  const rpc = vi.fn().mockImplementation(async (name: string) => {
    if (name === "create_account_transfer")
      return { data: transferId, error: null };
    if (iconRpcThrows) throw new Error("icon RPC failed");
    return { data: true, error: null };
  });
  const supabase = {
    from: vi.fn((table: string) =>
      table === "accounts" ? accountQuery : transactionQuery,
    ),
    rpc,
    storage: { from: vi.fn(() => ({ upload, remove })) },
  };
  vi.mocked(createClient).mockResolvedValue(
    supabase as unknown as Awaited<ReturnType<typeof createClient>>,
  );
  return { rpc, upload, remove };
}

describe("transaction icons on financial actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireUser).mockResolvedValue({ id: ownerId } as Awaited<
      ReturnType<typeof requireUser>
    >);
  });

  it("keeps a successful transfer when its icon upload fails", async () => {
    const { rpc, upload } = fakeSupabase({ uploadError: true });
    const form = formData();
    form.set("iconImage", pngFile());

    await expect(createTransfer({}, form)).rejects.toThrow("NEXT_REDIRECT");

    expect(rpc).toHaveBeenCalledOnce();
    expect(rpc).toHaveBeenCalledWith(
      "create_account_transfer",
      expect.any(Object),
    );
    expect(upload).toHaveBeenCalledOnce();
    expect(redirect).toHaveBeenCalledWith("/app/transactions?icon=failed");
    expect(revalidatePath).toHaveBeenCalledWith("/app/transactions");
  });

  it("cleans up an uploaded image when saving its icon throws", async () => {
    const { rpc, upload, remove } = fakeSupabase({ iconRpcThrows: true });
    const form = formData();
    form.set("iconImage", pngFile());

    await expect(createTransfer({}, form)).rejects.toThrow("NEXT_REDIRECT");

    expect(rpc).toHaveBeenCalledTimes(2);
    expect(upload).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledOnce();
    expect(redirect).toHaveBeenCalledWith("/app/transactions?icon=failed");
  });

  it("rejects an invalid icon before creating a transfer", async () => {
    const { rpc } = fakeSupabase();
    const form = formData();
    form.set("iconImage", new File(["bad"], "icon.png", { type: "image/png" }));

    const result = await createTransfer({}, form);

    expect(result.errors?.iconImage).toBeDefined();
    expect(rpc).not.toHaveBeenCalled();
  });
});
