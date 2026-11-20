import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RecurringIcon } from "@/components/recurring/recurring-icon";
import { TransactionIcon } from "@/components/transactions/transaction-icon";

const id = "b8e69e52-77d1-4e72-8403-17e8f7d7a2f9";

describe("optional item icons", () => {
  it("keeps the recurring kind symbol when no icon was chosen", () => {
    const { container, rerender } = render(
      <RecurringIcon
        item={{
          id,
          kind: "subscription",
          icon_emoji: null,
          icon_image_path: null,
        }}
      />,
    );
    expect(container.querySelector(".lucide-credit-card")).not.toBeNull();

    rerender(
      <RecurringIcon
        item={{
          id,
          kind: "external_installment",
          icon_emoji: null,
          icon_image_path: null,
        }}
      />,
    );
    expect(container.querySelector(".lucide-receipt-text")).not.toBeNull();
  });

  it("keeps the transaction type symbol when no icon was chosen", () => {
    const { container } = render(
      <TransactionIcon
        transaction={{
          id,
          type: "transfer",
          icon_emoji: null,
          icon_image_path: null,
        }}
      />,
    );
    expect(container.querySelector(".lucide-arrow-right-left")).not.toBeNull();
  });
});
