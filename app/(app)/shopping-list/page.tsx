"use client";

import { ArrowSquareOut, ShoppingCart, Storefront } from "@phosphor-icons/react/ssr";
import { BudgetMeter } from "@/components/plan/budget-meter";
import { EmptyState } from "@/components/shared/empty-state";
import { CategoryGroup } from "@/components/shopping-list/category-group";
import { Button } from "@/components/ui/button";
import { useAppStore, useIngredientLookup } from "@/lib/store";
import type { IngredientCategory, ShoppingListItem } from "@/lib/types";

const CATEGORY_ORDER: IngredientCategory[] = [
  "produce",
  "protein",
  "dairy",
  "grain",
  "bakery",
  "pantry",
  "spice",
];

export default function ShoppingListPage() {
  const plan = useAppStore((s) => s.plan);
  const budget = useAppStore((s) => s.budget);
  const store = useAppStore((s) => s.store);
  const regeneratePlan = useAppStore((s) => s.regeneratePlan);
  const ingredientLookup = useIngredientLookup();

  if (!plan || plan.shoppingList.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingCart className="size-8" />}
        title="No shopping list yet"
        description="Generate a weekly plan first, and your grocery list will show up here."
        action={<Button onClick={regeneratePlan}>Generate plan</Button>}
      />
    );
  }

  const grouped = new Map<IngredientCategory, ShoppingListItem[]>();
  for (const item of plan.shoppingList) {
    const ing = ingredientLookup.get(item.ingredientId);
    if (!ing) continue;
    const list = grouped.get(ing.category) ?? [];
    list.push(item);
    grouped.set(ing.category, list);
  }

  const mapsHref =
    store?.lat != null && store?.lon != null
      ? `https://www.google.com/maps?q=${store.lat},${store.lon}`
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl italic">Shopping list</h1>
        {store && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Storefront className="size-4" />
            {store.name}
            {mapsHref && (
              <a
                href={mapsHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                Open in Maps <ArrowSquareOut className="size-3.5" />
              </a>
            )}
          </p>
        )}
      </div>

      <BudgetMeter totalUsd={plan.totalCostUsd} budget={budget} overBudget={plan.overBudget} />

      <div className="space-y-5">
        {CATEGORY_ORDER.filter((c) => grouped.has(c)).map((category) => (
          <CategoryGroup key={category} category={category} items={grouped.get(category)!} budget={budget} />
        ))}
      </div>
    </div>
  );
}
