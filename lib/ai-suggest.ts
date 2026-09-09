import { fuzzyScore } from "./search";
import type { Course, Cuisine, Ingredient, IngredientCategory, Recipe, Unit } from "./types";

export interface AiSuggestedIngredient {
  name: string;
  qty: number;
  unit: Unit;
  category: IngredientCategory;
  estPriceUsd: number;
  packageQty: number;
  kcalPerUnit: number;
  proteinGPerUnit: number;
  carbsGPerUnit: number;
  fatGPerUnit: number;
}

export interface AiSuggestedRecipe {
  name: string;
  cuisine: Cuisine;
  course: Course;
  baseServings: number;
  prepMinutes: number;
  cookMinutes: number;
  leftoverDays: number;
  tags: string[];
  ingredients: AiSuggestedIngredient[];
  steps: string[];
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `ai-${base || "ingredient"}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Maps an AI-suggested recipe's ingredients onto the real catalog by name (best fuzzy match,
 * matching unit required), creating a new custom ingredient for anything that doesn't match.
 * Returns the finished Recipe plus any newly created ingredients (caller persists both).
 */
export function reconcileSuggestedRecipe(
  suggested: AiSuggestedRecipe,
  ingredientPool: Ingredient[]
): { recipe: Recipe; newIngredients: Ingredient[] } {
  const newIngredients: Ingredient[] = [];

  const recipeIngredients = suggested.ingredients.map((si) => {
    const scored = ingredientPool
      .map((ing) => ({ ing, score: fuzzyScore(si.name, ing.name) }))
      .filter(({ score, ing }) => score >= 60 && ing.unit === si.unit)
      .sort((a, b) => b.score - a.score);

    const matched = scored[0]?.ing;
    if (matched) {
      return { ingredientId: matched.id, qty: si.qty };
    }

    const newIngredient: Ingredient = {
      id: slugify(si.name),
      name: si.name,
      unit: si.unit,
      category: si.category,
      estPriceUsd: si.estPriceUsd,
      packageQty: si.packageQty > 0 ? si.packageQty : 1,
      kcalPerUnit: si.kcalPerUnit,
      proteinGPerUnit: si.proteinGPerUnit,
      carbsGPerUnit: si.carbsGPerUnit,
      fatGPerUnit: si.fatGPerUnit,
    };
    newIngredients.push(newIngredient);
    return { ingredientId: newIngredient.id, qty: si.qty };
  });

  const recipe: Recipe = {
    id: `ai-${suggested.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`,
    name: suggested.name,
    cuisine: suggested.cuisine,
    course: suggested.course,
    baseServings: suggested.baseServings > 0 ? suggested.baseServings : 4,
    prepMinutes: suggested.prepMinutes,
    cookMinutes: suggested.cookMinutes,
    leftoverDays: Math.max(1, suggested.leftoverDays),
    tags: suggested.tags,
    ingredients: recipeIngredients,
    steps: suggested.steps,
  };

  return { recipe, newIngredients };
}
