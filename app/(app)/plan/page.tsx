"use client";

import { ArrowsClockwise, CalendarBlank } from "@phosphor-icons/react/ssr";
import { BudgetMeter } from "@/components/plan/budget-meter";
import { FlexAlternativeCard } from "@/components/plan/flex-alternative-card";
import { NutritionSummary } from "@/components/plan/nutrition-summary";
import { WeekGrid } from "@/components/plan/week-grid";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { useAppStore } from "@/lib/store";

export default function PlanPage() {
  const plan = useAppStore((s) => s.plan);
  const budget = useAppStore((s) => s.budget);
  const regeneratePlan = useAppStore((s) => s.regeneratePlan);

  if (!plan) {
    return (
      <EmptyState
        icon={<CalendarBlank className="size-8" />}
        title="No plan yet"
        description="Generate a weekly plan from your saved preferences."
        action={<Button onClick={regeneratePlan}>Generate plan</Button>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl italic">This week</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cooking days, leftovers, and what to buy.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={regeneratePlan}>
          <ArrowsClockwise className="size-4" />
          New plan
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <BudgetMeter totalUsd={plan.totalCostUsd} budget={budget} overBudget={plan.overBudget} />
        <NutritionSummary plan={plan} />
      </div>

      {plan.flexAlternative && (
        <FlexAlternativeCard
          alternative={plan.flexAlternative}
          currentTotalUsd={plan.totalCostUsd}
          budget={budget}
        />
      )}

      <WeekGrid plan={plan} />
    </div>
  );
}
