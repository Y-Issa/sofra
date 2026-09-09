"use client";

import { CategoryIcon } from "@/components/shared/category-icon";
import { Checkbox } from "@/components/ui/checkbox";
import { formatMoney } from "@/lib/currency";
import { useAppStore, useIngredientLookup } from "@/lib/store";
import type { BudgetSettings, IngredientCategory, ShoppingListItem } from "@/lib/types";
import { formatQty } from "@/lib/units";
import { cn } from "@/lib/utils";

export const CATEGORY_LABEL: Record<IngredientCategory, string> = {
  produce: "Produce",
  protein: "Protein",
  dairy: "Dairy",
  grain: "Grains",
  bakery: "Bakery",
  pantry: "Pantry",
  spice: "Spices",
};

export function CategoryGroup({
  category,
  items,
  budget,
}: {
  category: IngredientCategory;
  items: ShoppingListItem[];
  budget: BudgetSettings;
}) {
  const checkedItems = useAppStore((s) => s.checkedItems);
  const toggleChecked = useAppStore((s) => s.toggleChecked);
  const ingredientLookup = useIngredientLookup();

  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <CategoryIcon category={category} className="size-4" />
        {CATEGORY_LABEL[category]}
      </div>
      <ul className="divide-y divide-border rounded-lg border border-border">
        {items.map((item) => {
          const ing = ingredientLookup.get(item.ingredientId);
          if (!ing) return null;
          const checked = checkedItems.includes(item.ingredientId);
          return (
            <li key={item.ingredientId} className="flex items-center gap-3 px-3 py-2.5">
              <Checkbox
                checked={checked}
                onCheckedChange={() => toggleChecked(item.ingredientId)}
                aria-label={`Mark ${ing.name} as bought`}
              />
              <span
                className={cn(
                  "min-w-0 flex-1 text-sm break-words",
                  checked && "text-muted-foreground line-through"
                )}
              >
                {ing.name}
              </span>
              <span className="tabular w-16 shrink-0 text-right text-sm text-muted-foreground sm:w-20">
                {formatQty(item.qty, item.unit)}
              </span>
              <span className="tabular w-14 shrink-0 text-right text-sm text-muted-foreground sm:w-16">
                {formatMoney(item.estCostUsd, budget)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
