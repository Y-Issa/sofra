"use client";

import type { ReactNode } from "react";
import { Clock, Repeat, Users } from "@phosphor-icons/react/ssr";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { recipeNutritionPerServing } from "@/lib/nutrition";
import { useIngredientLookup, useRecipeLookup } from "@/lib/store";
import { formatQty } from "@/lib/units";

export function RecipeSheet({
  recipeId,
  servings,
  trigger,
}: {
  recipeId: string;
  servings: number;
  trigger: ReactNode;
}) {
  const recipeLookup = useRecipeLookup();
  const ingredientLookup = useIngredientLookup();
  const recipe = recipeLookup.get(recipeId);
  if (!recipe) return null;
  const scale = servings / recipe.baseServings;
  const nutrition = recipeNutritionPerServing(recipe, ingredientLookup);

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-heading text-2xl">{recipe.name}</SheetTitle>
          <SheetDescription className="tabular flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" /> {recipe.prepMinutes + recipe.cookMinutes} min
            </span>
            <span className="flex items-center gap-1">
              <Users className="size-3.5" /> {servings} servings
            </span>
            {recipe.leftoverDays > 1 && (
              <span className="flex items-center gap-1">
                <Repeat className="size-3.5" /> Keeps {recipe.leftoverDays} days
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-8">
          <div className="flex flex-wrap gap-1.5">
            {recipe.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="capitalize">
                {tag.replace(/-/g, " ")}
              </Badge>
            ))}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Nutrition per serving</h3>
            <div className="grid grid-cols-4 gap-2 rounded-lg border border-border p-3 text-center">
              <div>
                <p className="tabular text-base font-semibold">{Math.round(nutrition.kcal)}</p>
                <p className="text-xs text-muted-foreground">kcal</p>
              </div>
              <div>
                <p className="tabular text-base font-semibold">{Math.round(nutrition.proteinG)}g</p>
                <p className="text-xs text-muted-foreground">protein</p>
              </div>
              <div>
                <p className="tabular text-base font-semibold">{Math.round(nutrition.carbsG)}g</p>
                <p className="text-xs text-muted-foreground">carbs</p>
              </div>
              <div>
                <p className="tabular text-base font-semibold">{Math.round(nutrition.fatG)}g</p>
                <p className="text-xs text-muted-foreground">fat</p>
              </div>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Estimated from ingredient data, not medical advice.
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Ingredients</h3>
            <ul className="space-y-1.5 text-sm">
              {recipe.ingredients.map((ri) => {
                const ing = ingredientLookup.get(ri.ingredientId);
                if (!ing) return null;
                return (
                  <li key={ri.ingredientId} className="flex justify-between gap-3">
                    <span>{ing.name}</span>
                    <span className="tabular text-muted-foreground">
                      {formatQty(ri.qty * scale, ing.unit)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Steps</h3>
            <ol className="space-y-3 text-sm">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="tabular flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
