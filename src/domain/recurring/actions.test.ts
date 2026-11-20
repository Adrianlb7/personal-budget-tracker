import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { vi } from "vitest";
import { requireUser } from "@/lib/auth/require-user";
import { createClient } from "@/lib/supabase/server";
import {
  createRecurringCommitment,
  updateRecurringCommitment,
} from "./actions";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));
vi.mock("@/lib/auth/require-user", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const ownerId = "b5d1c67d-6a18-4a4a-9289-f76789d682bc";
const commitmentId = "c9195d37-8dfd-475f-b459-6ecf10465d4d";
const oldImagePath = `${ownerId}/${commitmentId}/04fbfa62-f9a2-4ec5-a212-651bd83c0a80.png`;
const onePixelPng = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAXpeqz8AAAAASUVORK5CYII=",
  ),
  (character) => character.charCodeAt(0),
);

function recurringFormData() {
  const formData = new FormData();
  formData.set("kind", "subscription");
  formData.set("name", "Gym membership");
  formData.set("amount", "30.00");
  formData.set("frequency", "monthly");
  formData.set("startsOn", "2026-11-01");
  formData.set("nextDueOn", "2026-12-01");
  formData.set("endsOn", "");
  formData.set("installmentCount", "");
  formData.set("installmentsCompleted", "");
  formData.set("accountId", "");
  formData.set("destinationAccountId", "");
  formData.set("paymentMethod", "external_expense");
  return formData;
}

function pngFile() {
  const buffer = new Uint8Array(onePixelPng).buffer;
  const file = new File([buffer], "gym.png", { type: "image/png" });
  Object.defineProperty(file, "arrayBuffer", { value: async () => buffer });
  return file;
}

function fakeSupabase({
  uploadError = false,
  saveError = false,
  existingImagePath = null,
}: {
  uploadError?: boolean;
  saveError?: boolean;
  existingImagePath?: string | null;
} = {}) {
  const insert = vi.fn().mockResolvedValue({ error: null });
  const updateResult = saveError
    ? { data: null, error: new Error("save failed") }
    : { data: { id: commitmentId }, error: null };
  const updateQuery = {
    eq: vi.fn(),
    is: vi.fn(),
    select: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue(updateResult),
  };
  updateQuery.eq.mockReturnValue(updateQuery);
  updateQuery.is.mockReturnValue(updateQuery);
  updateQuery.select.mockReturnValue(updateQuery);
  const loadQuery = {
    eq: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: {
        kind: "subscription",
        status: "active",
        icon_image_path: existingImagePath,
      },
      error: null,
    }),
  };
  loadQuery.eq.mockReturnValue(loadQuery);
  const update = vi.fn().mockReturnValue(updateQuery);
  const select = vi.fn().mockReturnValue(loadQuery);
  const deleteResult = { error: null };
  const deleteQuery = {
    eq: vi.fn(),
    then: (resolve: (value: typeof deleteResult) => void) =>
      Promise.resolve(deleteResult).then(resolve),
  };
  deleteQuery.eq.mockReturnValue(deleteQuery);
  const deleteCommitment = vi.fn().mockReturnValue(deleteQuery);
  const from = vi.fn().mockReturnValue({
    delete: deleteCommitment,
    insert,
    select,
    update,
  });
  const upload = vi.fn().mockResolvedValue({
    error: uploadError ? new Error("upload failed") : null,
  });
  const remove = vi.fn().mockResolvedValue({ error: null });
  const storageFrom = vi.fn().mockReturnValue({ upload, remove });
  vi.mocked(createClient).mockResolvedValue({
    from,
    storage: { from: storageFrom },
  } as never);
  return {
    deleteCommitment,
    from,
    insert,
    loadQuery,
    remove,
    storageFrom,
    update,
    updateQuery,
    upload,
  };
}

describe("recurring item icons", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireUser).mockResolvedValue({ id: ownerId } as never);
  });

  it("creates an item with its selected emoji", async () => {
    const fake = fakeSupabase();
    const formData = recurringFormData();
    formData.set("iconEmoji", "💪");

    await expect(createRecurringCommitment({}, formData)).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    expect(fake.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        icon_emoji: "💪",
        name: "Gym membership",
        user_id: ownerId,
      }),
    );
    expect(fake.storageFrom).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/app/recurring");
    expect(redirect).toHaveBeenCalledWith("/app/recurring");
  });

  it("uploads an image under its new item and saves the private path", async () => {
    const fake = fakeSupabase();
    const formData = recurringFormData();
    formData.set("iconImage", pngFile());

    await expect(createRecurringCommitment({}, formData)).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    const newId = fake.insert.mock.calls[0][0].id as string;
    const imagePath = fake.upload.mock.calls[0][0] as string;
    expect(imagePath).toMatch(
      new RegExp(`^${ownerId}/${newId}/[0-9a-f-]{36}\\.png$`),
    );
    expect(fake.storageFrom).toHaveBeenCalledWith("recurring-icons");
    expect(fake.upload).toHaveBeenCalledWith(
      imagePath,
      expect.any(ArrayBuffer),
      { contentType: "image/png", upsert: false },
    );
    expect(fake.update).toHaveBeenCalledWith({ icon_image_path: imagePath });
    expect(fake.remove).not.toHaveBeenCalled();
  });

  it("rejects invalid image bytes before creating a recurring item", async () => {
    const fake = fakeSupabase();
    const formData = recurringFormData();
    const invalidBytes = new TextEncoder().encode("not a PNG").buffer;
    const invalidFile = new File([invalidBytes], "fake.png", {
      type: "image/png",
    });
    Object.defineProperty(invalidFile, "arrayBuffer", {
      value: async () => invalidBytes,
    });
    formData.set("iconImage", invalidFile);

    const result = await createRecurringCommitment({}, formData);

    expect(result.errors?.iconImage?.[0]).toMatch(/square PNG/i);
    expect(fake.insert).not.toHaveBeenCalled();
    expect(fake.upload).not.toHaveBeenCalled();
  });

  it("removes the incomplete item when its icon upload fails", async () => {
    const fake = fakeSupabase({ uploadError: true });
    const formData = recurringFormData();
    formData.set("iconImage", pngFile());

    const result = await createRecurringCommitment({}, formData);

    expect(result.message).toMatch(/icon could not be saved/i);
    expect(fake.update).not.toHaveBeenCalled();
    expect(fake.deleteCommitment).toHaveBeenCalledOnce();
    expect(fake.remove).toHaveBeenCalledWith([fake.upload.mock.calls[0][0]]);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("cleans up the uploaded image and item if saving the path fails", async () => {
    const fake = fakeSupabase({ saveError: true });
    const formData = recurringFormData();
    formData.set("iconImage", pngFile());

    const result = await createRecurringCommitment({}, formData);

    expect(result.message).toMatch(/icon could not be saved/i);
    expect(fake.update).toHaveBeenCalledWith({
      icon_image_path: fake.upload.mock.calls[0][0],
    });
    expect(fake.remove).toHaveBeenCalledWith([fake.upload.mock.calls[0][0]]);
    expect(fake.deleteCommitment).toHaveBeenCalledOnce();
  });

  it("can clear an existing image while editing an item", async () => {
    const fake = fakeSupabase({ existingImagePath: oldImagePath });
    const formData = recurringFormData();
    formData.set("removeIcon", "true");

    await expect(
      updateRecurringCommitment(commitmentId, {}, formData),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(fake.update).toHaveBeenCalledWith(
      expect.objectContaining({ icon_emoji: null, icon_image_path: null }),
    );
    expect(fake.updateQuery.eq).toHaveBeenCalledWith(
      "icon_image_path",
      oldImagePath,
    );
    expect(fake.remove).toHaveBeenCalledWith([oldImagePath]);
  });

  it("keeps an existing image when an unrelated field changes", async () => {
    const fake = fakeSupabase({ existingImagePath: oldImagePath });
    const formData = recurringFormData();
    formData.set("amount", "32.00");

    await expect(
      updateRecurringCommitment(commitmentId, {}, formData),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(fake.update.mock.calls[0][0]).not.toHaveProperty("icon_image_path");
    expect(fake.remove).not.toHaveBeenCalled();
    expect(fake.upload).not.toHaveBeenCalled();
  });

  it("replaces an existing image and deletes its old object after saving", async () => {
    const fake = fakeSupabase({ existingImagePath: oldImagePath });
    const formData = recurringFormData();
    formData.set("iconImage", pngFile());

    await expect(
      updateRecurringCommitment(commitmentId, {}, formData),
    ).rejects.toThrow("NEXT_REDIRECT");

    const imagePath = fake.upload.mock.calls[0][0] as string;
    expect(imagePath).toMatch(new RegExp(`^${ownerId}/${commitmentId}/`));
    expect(fake.update).toHaveBeenCalledWith(
      expect.objectContaining({ icon_emoji: null, icon_image_path: imagePath }),
    );
    expect(fake.remove).toHaveBeenCalledWith([oldImagePath]);
  });
});
