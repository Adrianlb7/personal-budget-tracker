import { decimal } from "@/lib/money/decimal";

export type AccountMovement = {
  amount: string;
  direction: "inflow" | "outflow";
};

export function calculateAccountBalance(
  openingBalance: string,
  movements: readonly AccountMovement[],
) {
  return movements
    .reduce(
      (balance, movement) =>
        movement.direction === "inflow"
          ? balance.plus(movement.amount)
          : balance.minus(movement.amount),
      decimal(openingBalance),
    )
    .toFixed();
}
