"use client";

import { Flame } from "@phosphor-icons/react/ssr";
import { addNutrition, dayNutrition, scaleNutrition, zeroNutrition } from "@/lib/nutrition";
import { useIngredientLookup, useRecipeLookup } from "@/lib/store";
import type { GeneratedPlan } from "@/lib/types";

export function NutritionSummary({ plan }: { plan: GeneratedPlan }) {
  const recipeLookup = useRecipeLookup();
  const ingredientLookup = useIngredientLookup();

  if (plan.days.length === 0) return null;

  const summed = plan.days.reduce(
    (acc, day) => addNutrition(acc, dayNutrition(day, recipeLookup, ingredientLookup)),
    zeroNutrition()
  );
  const avg = scaleNutrition(summed, 1 / plan.days.length);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Flame className="size-4" />
        Average per day, per person
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 text-center">
        <div>
          <p className="tabular text-lg font-semibold">{Math.round(avg.kcal)}</p>
          <p className="text-xs text-muted-foreground">kcal</p>
        </div>
        <div>
          <p className="tabular text-lg font-semibold">{Math.round(avg.proteinG)}g</p>
          <p className="text-xs text-muted-foreground">protein</p>
        </div>
        <div>
          <p className="tabular text-lg font-semibold">{Math.round(avg.carbsG)}g</p>
          <p className="text-xs text-muted-foreground">carbs</p>
        </div>
        <div>
          <p className="tabular text-lg font-semibold">{Math.round(avg.fatG)}g</p>
          <p className="text-xs text-muted-foreground">fat</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Estimated from ingredient data, not medical advice.
      </p>
    </div>
  );
}
