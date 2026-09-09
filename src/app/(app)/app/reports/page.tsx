import type { Account } from "@/domain/accounts/types";
import { calculateBtcUsdValue } from "@/domain/fx/calculations";
import {
  calculateReport,
  reportRanges,
  type ReportRange,
  type ReportTransaction,
} from "@/domain/reports/calculations";
import { ReportsDashboard } from "@/components/reports/reports-dashboard";
import { requireUser } from "@/lib/auth/require-user";
import { getBtcUsdPrice } from "@/lib/market-data/bitcoin";
import { decimal } from "@/lib/money/decimal";
import { createClient } from "@/lib/supabase/server";

export default async function ReportsPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const [accountsResult, transactionsResult, btcPrice] = await Promise.all([
    supabase
      .from("account_details")
      .select(
        "id,user_id,name,type,currency,opening_balance,current_balance,archived_at,created_at,updated_at",
      )
      .eq("user_id", user.id)
      .is("archived_at", null),
    supabase
      .from("transaction_details")
      .select("type,date,amount,currency,category_name")
      .eq("user_id", user.id)
      .order("date"),
    getBtcUsdPrice(),
  ]);

  if (accountsResult.error || transactionsResult.error)
    throw new Error("Your reports could not be loaded.");
  const accounts = (accountsResult.data ?? []) as Account[];
  const transactions = (transactionsResult.data ?? []) as ReportTransaction[];
  const usdBalance = accounts
    .filter((account) => account.currency === "USD")
    .reduce(
      (sum, account) =>
        sum.plus(account.current_balance ?? account.opening_balance),
      decimal(0),
    );
  const btcAmount = accounts
    .filter((account) => account.currency === "BTC")
    .reduce(
      (sum, account) =>
        sum.plus(account.current_balance ?? account.opening_balance),
      decimal(0),
    );
  const btcValue = btcPrice
    ? calculateBtcUsdValue(btcAmount.toFixed(), btcPrice)
    : "0";
  const currentNetWorth = usdBalance.plus(btcValue).toFixed();
  const today = new Date();
  const reports = Object.fromEntries(
    reportRanges.map((range) => [
      range,
      calculateReport(transactions, range, currentNetWorth, today),
    ]),
  ) as Record<ReportRange, ReturnType<typeof calculateReport>>;

  return <ReportsDashboard reports={reports} />;
}
