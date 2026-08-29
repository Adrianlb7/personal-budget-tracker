import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

describe("HomePage", () => {
  it("renders the product identity and app-shell link", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: /clearer view/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /preview the app shell/i }),
    ).toHaveAttribute("href", "/app");
  });
});
