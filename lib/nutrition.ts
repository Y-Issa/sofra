import type { Ingredient, PlanDayAssignment, Recipe } from "./types";

export interface Nutrition {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export function zeroNutrition(): Nutrition {
  return { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 };
}

export function addNutrition(a: Nutrition, b: Nutrition): Nutrition {
  return {
    kcal: a.kcal + b.kcal,
    proteinG: a.proteinG + b.proteinG,
    carbsG: a.carbsG + b.carbsG,
    fatG: a.fatG + b.fatG,
  };
}

export function scaleNutrition(n: Nutrition, factor: number): Nutrition {
  return {
    kcal: n.kcal * factor,
    proteinG: n.proteinG * factor,
    carbsG: n.carbsG * factor,
    fatG: n.fatG * factor,
  };
}

/** Approximate, as-purchased-weight nutrition per serving. An estimate, not medical advice. */
export function recipeNutritionPerServing(
  recipe: Recipe,
  byId: Map<string, Ingredient>
): Nutrition {
  const total = recipe.ingredients.reduce((acc, ri) => {
    const ing = byId.get(ri.ingredientId);
    if (!ing) return acc;
    return addNutrition(
      acc,
      scaleNutrition(
        {
          kcal: ing.kcalPerUnit,
          proteinG: ing.proteinGPerUnit,
          carbsG: ing.carbsGPerUnit,
          fatG: ing.fatGPerUnit,
        },
        ri.qty
      )
    );
  }, zeroNutrition());
  return scaleNutrition(total, 1 / recipe.baseServings);
}

/** A day's total per-person nutrition: the main plus every attached side, each counted per its own serving. */
export function dayNutrition(
  assignment: PlanDayAssignment,
  recipeLookup: Map<string, Recipe>,
  byId: Map<string, Ingredient>
): Nutrition {
  let total = zeroNutrition();
  const main = recipeLookup.get(assignment.recipeId);
  if (main) total = addNutrition(total, recipeNutritionPerServing(main, byId));
  for (const sideId of assignment.sideRecipeIds ?? []) {
    const side = recipeLookup.get(sideId);
    if (side) total = addNutrition(total, recipeNutritionPerServing(side, byId));
  }
  return total;
}
