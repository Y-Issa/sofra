"use client";

import { Warning } from "@phosphor-icons/react/ssr";
import { Progress } from "@/components/ui/progress";
import { formatMoney } from "@/lib/currency";
import type { BudgetSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

export function BudgetMeter({
  totalUsd,
  budget,
  overBudget,
}: {
  totalUsd: number;
  budget: BudgetSettings;
  overBudget: boolean;
}) {
  const pct = budget.amountUsd > 0 ? Math.min(100, (totalUsd / budget.amountUsd) * 100) : 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm text-muted-foreground">This week&apos;s grocery estimate</p>
        <p className={cn("tabular text-lg font-semibold", overBudget && "text-destructive")}>
          {formatMoney(totalUsd, budget)}{" "}
          <span className="text-sm font-normal text-muted-foreground">
            / {formatMoney(budget.amountUsd, budget)}
          </span>
        </p>
      </div>
      <Progress
        value={pct}
        className={cn("mt-3", overBudget && "[&_[data-slot=progress-indicator]]:bg-destructive")}
        aria-label="Budget used"
      />
      {overBudget && (
        <p className="mt-2 flex items-start gap-1.5 text-sm text-destructive">
          <Warning className="mt-0.5 size-4 shrink-0" />
          This is the closest plan we could fit. It runs over your budget, mainly on the pricier
          ingredients below.
        </p>
      )}
    </div>
  );
}
