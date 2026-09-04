import { render, screen } from "@testing-library/react";
import { AccountForm } from "./account-form";

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
  });
});
