"use client";

import { Sparkle } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/currency";
import { useAppStore } from "@/lib/store";
import type { BudgetSettings, GeneratedPlanVariant } from "@/lib/types";

export function FlexAlternativeCard({
  alternative,
  currentTotalUsd,
  budget,
}: {
  alternative: GeneratedPlanVariant;
  currentTotalUsd: number;
  budget: BudgetSettings;
}) {
  const applyFlexAlternative = useAppStore((s) => s.applyFlexAlternative);
  const delta = alternative.totalCostUsd - currentTotalUsd;

  return (
    <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 sm:flex-row sm:items-center">
      <div className="flex items-start gap-2.5">
        <Sparkle className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-sm">
          Add <span className="tabular font-medium">{formatMoney(delta, budget)}</span> to upgrade a
          couple of this week&apos;s dishes.
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={applyFlexAlternative} className="shrink-0">
        Use this instead
      </Button>
    </div>
  );
}
