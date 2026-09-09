import type { BudgetSettings } from "./types";

/** Converts a USD amount into the budget's target currency using its manual rate, if set. */
export function convertFromUsd(amountUsd: number, budget: BudgetSettings): number {
  if (budget.currency === "USD" || !budget.ratePerUsd) return amountUsd;
  return amountUsd * budget.ratePerUsd;
}

/** Converts an amount in the budget's currency back to USD, if a rate is set. */
export function convertToUsd(amount: number, budget: BudgetSettings): number {
  if (budget.currency === "USD" || !budget.ratePerUsd) return amount;
  return amount / budget.ratePerUsd;
}

export function formatMoney(amountUsd: number, budget: BudgetSettings): string {
  const currency = budget.currency === "USD" || budget.ratePerUsd ? budget.currency : "USD";
  const value = currency === "USD" ? amountUsd : convertFromUsd(amountUsd, budget);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "LBP" ? 0 : 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

/** Whether the budget's currency needs a manual rate that hasn't been set yet. */
export function needsRate(budget: BudgetSettings): boolean {
  return budget.currency !== "USD" && !budget.ratePerUsd;
}
