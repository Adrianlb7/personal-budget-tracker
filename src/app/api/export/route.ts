import { readAllPages } from "@/lib/export/read-all-pages";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (error || !userId) {
    return Response.json(
      { error: "Sign in to export your data." },
      { status: 401, headers: privateHeaders },
    );
  }

  try {
    const [accounts, transactions, recurring, budgets, categories] =
      await Promise.all([
        readAllPages((from, to) =>
          supabase
            .from("account_details")
            .select(
              "id,name,type,currency,opening_balance,current_balance,archived_at,created_at,updated_at",
            )
            .eq("user_id", userId)
            .order("created_at")
            .range(from, to),
        ),
        readAllPages((from, to) =>
          supabase
            .from("transaction_details")
            .select(
              "id,type,date,description,notes,metadata,created_at,account_id,account_name,category_id,category_name,direction,amount,currency,destination_account_id,destination_account_name,destination_amount,destination_currency",
            )
            .eq("user_id", userId)
            .order("date", { ascending: false })
            .order("created_at", { ascending: false })
            .order("id", { ascending: false })
            .range(from, to),
        ),
        readAllPages((from, to) =>
          supabase
            .from("recurring_commitments")
            .select(
              "id,kind,name,account_id,destination_account_id,payment_method,amount,currency,frequency,starts_on,next_due_on,ends_on,installment_count,installments_completed,status,created_at,updated_at",
            )
            .eq("user_id", userId)
            .order("created_at")
            .range(from, to),
        ),
        readAllPages((from, to) =>
          supabase
            .from("monthly_budgets")
            .select(
              "id,category_id,amount,currency,month,created_at,updated_at",
            )
            .eq("user_id", userId)
            .order("month", { ascending: false })
            .range(from, to),
        ),
        readAllPages((from, to) =>
          supabase
            .from("categories")
            .select(
              "id,name,kind,parent_category_id,archived_at,created_at,updated_at",
            )
            .eq("user_id", userId)
            .order("name")
            .range(from, to),
        ),
      ]);

    const accountNames = new Map(accounts.map((item) => [item.id, item.name]));
    const categoryNames = new Map(
      categories.map((item) => [item.id, item.name]),
    );
    const exportedAt = new Date().toISOString();
    const payload = {
      format: "orba-financial-export-v1",
      exported_at: exportedAt,
      notes: [
        "Amounts and currencies are preserved as recorded; no currency conversion is applied in this file.",
        "Transfers are internal movements, not income or expenses.",
        "Account current_balance values are authoritative at export time; recurring commitments are plans, not automatic payments.",
      ],
      accounts,
      recurring_commitments: recurring.map((item) => ({
        ...item,
        account_name: item.account_id
          ? (accountNames.get(item.account_id) ?? null)
          : null,
        destination_account_name: item.destination_account_id
          ? (accountNames.get(item.destination_account_id) ?? null)
          : null,
      })),
      recent_expenses: transactions
        .filter((item) => item.type === "expense")
        .slice(0, 25),
      transactions,
      monthly_budgets: budgets.map((item) => ({
        ...item,
        category_name: categoryNames.get(item.category_id) ?? null,
      })),
      categories,
    };

    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        ...privateHeaders,
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="orba-data-${exportedAt.slice(0, 10)}.json"`,
      },
    });
  } catch {
    return Response.json(
      { error: "The export could not be completed. Please try again." },
      { status: 500, headers: privateHeaders },
    );
  }
}
