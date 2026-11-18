import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { vi } from "vitest";
import type { Account } from "@/domain/accounts/types";
import type { AccountFormState } from "@/domain/accounts/validation";
import { AccountForm } from "./account-form";

vi.mock("./account-icon-picker", () => ({
  AccountIconPicker: ({
    initialEmoji,
    initialImageUrl,
    onImageFileChange,
  }: {
    initialEmoji?: string | null;
    initialImageUrl: string | null;
    onImageFileChange: (file: File | null) => void;
  }) => {
    const [emoji, setEmoji] = useState(initialEmoji ?? "");
    return (
      <div>
        <span>{initialImageUrl}</span>
        <input name="iconEmoji" type="hidden" value={emoji} />
        <button
          onClick={() => {
            setEmoji("🎧");
            onImageFileChange(null);
          }}
          type="button"
        >
          Use headphones emoji
        </button>
        <button
          onClick={() => {
            setEmoji("");
            onImageFileChange(
              new File(["cropped png"], "icon.png", { type: "image/png" }),
            );
          }}
          type="button"
        >
          Use cropped icon
        </button>
      </div>
    );
  },
}));

const account: Account = {
  archived_at: null,
  created_at: "2026-11-18T00:00:00Z",
  currency: "USD",
  id: "b8e69e52-77d1-4e72-8403-17e8f7d7a2f9",
  icon_emoji: null,
  icon_image_path: "owner/account/icon.png",
  name: "Headphones",
  opening_balance: "100",
  type: "savings",
  updated_at: "2026-11-18T00:00:00Z",
  user_id: "owner",
};

describe("AccountForm", () => {
  it("renders account fields with safe money guidance", () => {
    const action = async () => ({});
    render(<AccountForm action={action} />);

    expect(screen.getByLabelText("Account name")).not.toBeRequired();
    expect(screen.getByLabelText("Account name")).toHaveAttribute(
      "placeholder",
      "Main checking",
    );
    expect(screen.getByLabelText("Account type")).toHaveValue("checking");
    expect(screen.getByLabelText("Currency")).toHaveValue("USD");
    expect(screen.getByLabelText("Opening balance")).toHaveValue("");
    expect(screen.getByLabelText("Opening balance")).toHaveAttribute(
      "placeholder",
      "0",
    );
    expect(
      screen.getByText(/liabilities as negative amounts/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Use headphones emoji" }),
    ).toBeInTheDocument();
  });

  it("submits a chosen emoji when creating an account", async () => {
    const user = userEvent.setup();
    const action = vi.fn(
      async (...args: [AccountFormState, FormData]) => args[0],
    );
    render(<AccountForm action={action} />);

    await user.type(screen.getByLabelText("Opening balance"), "0");
    await user.click(
      screen.getByRole("button", { name: "Use headphones emoji" }),
    );
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    const formData = action.mock.calls[0][1];
    expect(formData.get("iconEmoji")).toBe("🎧");
    expect(formData.get("iconImage")).toBeNull();
  });

  it("submits a cropped PNG when creating an account", async () => {
    const user = userEvent.setup();
    const action = vi.fn(
      async (...args: [AccountFormState, FormData]) => args[0],
    );
    render(<AccountForm action={action} />);

    await user.type(screen.getByLabelText("Opening balance"), "0");
    await user.click(screen.getByRole("button", { name: "Use cropped icon" }));
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    const formData = action.mock.calls[0][1];
    expect(formData.get("iconImage")).toBeInstanceOf(File);
    expect((formData.get("iconImage") as File).type).toBe("image/png");
    expect(formData.get("iconEmoji")).toBe("");
  });

  it("shows an existing image and sends the cropped PNG with the edit form", async () => {
    const user = userEvent.setup();
    const action = vi.fn(
      async (...args: [AccountFormState, FormData]) => args[0],
    );
    render(<AccountForm account={account} action={action} />);

    expect(
      screen.getByText(`/api/account-icons/${account.id}`),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Use cropped icon" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(action).toHaveBeenCalledOnce());
    const formData = action.mock.calls[0][1];
    expect(formData.get("iconImage")).toBeInstanceOf(File);
    expect((formData.get("iconImage") as File).type).toBe("image/png");
  });
});
