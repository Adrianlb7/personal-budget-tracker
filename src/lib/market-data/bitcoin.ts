import { z } from "zod";

const responseSchema = z.object({
  data: z.object({
    amount: z.string().regex(/^\d+(?:\.\d+)?$/),
    currency: z.literal("USD"),
  }),
});

export async function getBtcUsdPrice() {
  try {
    const response = await fetch(
      "https://api.coinbase.com/v2/prices/BTC-USD/spot",
      { next: { revalidate: 86_400 }, signal: AbortSignal.timeout(4_000) },
    );
    if (!response.ok) return null;
    const result = responseSchema.safeParse(await response.json());
    return result.success ? result.data.data.amount : null;
  } catch {
    return null;
  }
}
