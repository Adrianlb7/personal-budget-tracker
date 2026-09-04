import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmActionButton } from "./confirm-action-button";

describe("ConfirmActionButton", () => {
  it("opens a minimal confirmation modal and can cancel", async () => {
    const user = userEvent.setup();
    render(
      <ConfirmActionButton
        action={async () => undefined}
        className=""
        confirmation="Permanently delete this item?"
      >
        Remove
      </ConfirmActionButton>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "Permanently delete this item?",
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
