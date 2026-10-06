import { createClient } from "@/lib/supabase/server";
import { GET } from "./route";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

function mockDatabase(
  rows: Record<string, Record<string, unknown>[]>,
  userId: string | null,
) {
  const ownerFilters: { column: string; value: string }[] = [];
  const selections: string[] = [];
  const from = vi.fn((table: string) => {
    const query = {
      select(columns: string) {
        selections.push(columns);
        return query;
      },
      eq(column: string, value: string) {
        ownerFilters.push({ column, value });
        return query;
      },
      order() {
        return query;
      },
      range(start: number, end: number) {
        return Promise.resolve({
          data: (rows[table] ?? []).slice(start, end + 1),
          error: null,
        });
      },
    };
    return query;
  });
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getClaims: vi.fn().mockResolvedValue({
        data: { claims: userId ? { sub: userId } : null },
        error: null,
      }),
    },
    from,
  } as never);
  return { from, ownerFilters, selections };
}

describe("financial export route", () => {
  it("rejects an unauthenticated request before querying financial tables", async () => {
    const { from } = mockDatabase({}, null);
    const response = await GET();
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(from).not.toHaveBeenCalled();
  });

  it("downloads the owner's original-currency data and recent expenses", async () => {
    const userId = "owner-1";
    const { ownerFilters, selections } = mockDatabase(
      {
        account_details: [
          {
            id: "account-1",
            name: "Cash",
            currency: "USD",
            current_balance: "130.00",
          },
        ],
        transaction_details: [
          {
            id: "expense-1",
            type: "expense",
            amount: "128.02",
            currency: "USD",
          },
          {
            id: "transfer-1",
            type: "transfer",
            amount: "1000",
            currency: "CLP",
          },
        ],
        recurring_commitments: [
          {
            id: "plan-1",
            account_id: "account-1",
            destination_account_id: null,
          },
        ],
        monthly_budgets: [
          { id: "budget-1", category_id: "category-1", amount: "200" },
        ],
        categories: [{ id: "category-1", name: "Gifts", kind: "expense" }],
      },
      userId,
    );

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toMatch(
      /attachment; filename="orba-data-.*\.json"/,
    );
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(payload.accounts[0].current_balance).toBe("130.00");
    expect(payload.transactions[1]).toMatchObject({
      type: "transfer",
      currency: "CLP",
    });
    expect(payload.recent_expenses).toHaveLength(1);
    expect(payload.recurring_commitments[0].account_name).toBe("Cash");
    expect(payload.monthly_budgets[0].category_name).toBe("Gifts");
    expect(ownerFilters).toHaveLength(5);
    expect(
      ownerFilters.every(
        ({ column, value }) => column === "user_id" && value === userId,
      ),
    ).toBe(true);
    expect(
      selections.every((columns) => !columns.split(",").includes("user_id")),
    ).toBe(true);
  });
});
