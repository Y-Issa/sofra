import type {
  BudgetSettings,
  DietaryFilters,
  GeneratedPlan,
  GeneratedPlanVariant,
  Household,
  Ingredient,
  PlanDayAssignment,
  Recipe,
  ScheduleDay,
  ShoppingListItem,
  Weekday,
} from "./types";

interface PlannerInput {
  recipes: Recipe[];
  ingredients: Ingredient[];
  schedule: ScheduleDay[];
  household: Household;
  budget: BudgetSettings;
  cuisineMix: number;
  dietary: DietaryFilters;
}

interface CookSlot {
  weekday: Weekday;
  leftoverWeekdays: Weekday[];
}

function ingredientMap(ingredients: Ingredient[]): Map<string, Ingredient> {
  return new Map(ingredients.map((i) => [i.id, i]));
}

function matchesDietary(recipe: Recipe, dietary: DietaryFilters, byId: Map<string, Ingredient>): boolean {
  if (dietary.vegetarianOnly && !recipe.tags.includes("vegetarian")) return false;
  if (dietary.excludeSeafood && recipe.ingredients.some((i) => byId.get(i.ingredientId)?.category === "protein" && i.ingredientId === "fish-fillet")) {
    return false;
  }
  return true;
}

function recipeCostPerServing(recipe: Recipe, byId: Map<string, Ingredient>): number {
  const total = recipe.ingredients.reduce((sum, ri) => {
    const ing = byId.get(ri.ingredientId);
    return sum + (ing ? ing.estPriceUsd * ri.qty : 0);
  }, 0);
  return total / recipe.baseServings;
}

function buildCookSlots(schedule: ScheduleDay[]): CookSlot[] {
  const sorted = [...schedule].sort((a, b) => a.weekday - b.weekday);
  const cookDays = sorted.filter((d) => d.cook);
  const slots: CookSlot[] = [];

  cookDays.forEach((day, idx) => {
    const nextCookWeekday = cookDays[idx + 1]?.weekday ?? 7;
    const maxAvailable = nextCookWeekday - day.weekday - 1;
    const span = Math.max(0, Math.min(day.leftoverSpan, maxAvailable));
    const leftoverWeekdays: Weekday[] = [];
    for (let d = day.weekday + 1; d <= day.weekday + span; d++) {
      leftoverWeekdays.push(d as Weekday);
    }
    slots.push({ weekday: day.weekday, leftoverWeekdays });
  });

  return slots;
}

/** Interleaves two counts (e.g. 4 lebanese, 2 international) evenly across N slots. */
function interleaveCuisines(nLebanese: number, nInternational: number): ("lebanese" | "international")[] {
  const total = nLebanese + nInternational;
  const result: ("lebanese" | "international")[] = [];
  let lebaneseUsed = 0;
  let internationalUsed = 0;
  for (let i = 0; i < total; i++) {
    const targetLebaneseRatio = nLebanese / total;
    const currentRatio = i === 0 ? 0 : lebaneseUsed / i;
    if (currentRatio <= targetLebaneseRatio && lebaneseUsed < nLebanese) {
      result.push("lebanese");
      lebaneseUsed++;
    } else if (internationalUsed < nInternational) {
      result.push("international");
      internationalUsed++;
    } else {
      result.push("lebanese");
      lebaneseUsed++;
    }
  }
  return result;
}

/** Recipes that don't keep for as many days as this slot needs are dropped, unless that would leave nothing. */
function eligibleForSlot(pool: Recipe[], daysCovered: number): Recipe[] {
  if (daysCovered <= 1) return pool;
  const fit = pool.filter((r) => r.leftoverDays >= daysCovered);
  return fit.length > 0 ? fit : pool;
}

function pickRecipe(pool: Recipe[], used: Set<string>, rotation: number): Recipe {
  const sorted = [...pool].sort((a, b) => a.id.localeCompare(b.id));
  const unused = sorted.filter((r) => !used.has(r.id));
  const candidates = unused.length > 0 ? unused : sorted;
  return candidates[((rotation % candidates.length) + candidates.length) % candidates.length];
}

function scaleIngredientsInto(
  recipe: Recipe,
  servingsNeeded: number,
  totals: Map<string, number>
) {
  const scale = servingsNeeded / recipe.baseServings;
  for (const ri of recipe.ingredients) {
    totals.set(ri.ingredientId, (totals.get(ri.ingredientId) ?? 0) + ri.qty * scale);
  }
}

/** Every day's attached sides, scaled to a single day's servings (no leftover-span multiplier). */
function addSideIngredients(
  days: PlanDayAssignment[],
  household: Household,
  recipeLookup: Map<string, Recipe>,
  totals: Map<string, number>
) {
  for (const day of days) {
    for (const sideId of day.sideRecipeIds ?? []) {
      const side = recipeLookup.get(sideId);
      if (side) scaleIngredientsInto(side, household.persons, totals);
    }
  }
}

/** Rounds a raw needed quantity up to whole packages, and prices it accordingly. */
function packageRound(ingredient: Ingredient, rawQty: number): { qty: number; costUsd: number } {
  const packageQty = ingredient.packageQty > 0 ? ingredient.packageQty : 1;
  const packages = Math.max(1, Math.ceil(rawQty / packageQty));
  const qty = packages * packageQty;
  return { qty, costUsd: qty * ingredient.estPriceUsd };
}

function buildShoppingList(
  totals: Map<string, number>,
  byId: Map<string, Ingredient>
): ShoppingListItem[] {
  return Array.from(totals.entries()).map(([ingredientId, rawQty]) => {
    const ing = byId.get(ingredientId);
    if (!ing) return { ingredientId, qty: rawQty, unit: "piece", estCostUsd: 0 };
    const { qty, costUsd } = packageRound(ing, rawQty);
    return { ingredientId, qty, unit: ing.unit, estCostUsd: costUsd };
  });
}

function buildVariant(
  slots: CookSlot[],
  assignments: Map<Weekday, { recipeId: string; servingsNeeded: number }>,
  household: Household,
  byId: Map<string, Ingredient>,
  recipeLookup: Map<string, Recipe>
): GeneratedPlanVariant {
  const days: PlanDayAssignment[] = [];
  const totals = new Map<string, number>();

  for (const slot of slots) {
    const a = assignments.get(slot.weekday);
    if (!a) continue;
    days.push({
      weekday: slot.weekday,
      type: "cook",
      recipeId: a.recipeId,
      servings: household.persons,
    });
    for (const lw of slot.leftoverWeekdays) {
      days.push({
        weekday: lw,
        type: "leftover",
        recipeId: a.recipeId,
        sourceWeekday: slot.weekday,
        servings: household.persons,
      });
    }
  }

  for (const slot of slots) {
    const a = assignments.get(slot.weekday);
    if (!a) continue;
    const recipe = recipeLookup.get(a.recipeId);
    if (recipe) scaleIngredientsInto(recipe, a.servingsNeeded, totals);
  }
  addSideIngredients(days, household, recipeLookup, totals);

  const shoppingList = buildShoppingList(totals, byId);
  const totalCostUsd = shoppingList.reduce((s, i) => s + i.estCostUsd, 0);

  return { days, shoppingList, totalCostUsd };
}

export function generatePlan(input: PlannerInput): GeneratedPlan {
  const byId = ingredientMap(input.ingredients);
  const recipeLookup = new Map(input.recipes.map((r) => [r.id, r]));

  const eligible = input.recipes.filter(
    (r) => r.course === "main" && matchesDietary(r, input.dietary, byId)
  );
  const lebanesePool = eligible.filter((r) => r.cuisine === "lebanese");
  const internationalPool = eligible.filter((r) => r.cuisine === "international");

  const slots = buildCookSlots(input.schedule);
  const slotByWeekday = new Map(slots.map((s) => [s.weekday, s]));
  const nLebanese = Math.round((slots.length * input.cuisineMix) / 100);
  const cuisineSequence = interleaveCuisines(
    Math.min(nLebanese, slots.length),
    slots.length - Math.min(nLebanese, slots.length)
  );

  const used = new Set<string>();
  const assignments = new Map<Weekday, { recipeId: string; servingsNeeded: number }>();
  const rotationSeed = Date.now();

  slots.forEach((slot, i) => {
    const wantLebanese = cuisineSequence[i] === "lebanese";
    let pool = wantLebanese ? lebanesePool : internationalPool;
    if (pool.length === 0) pool = wantLebanese ? internationalPool : lebanesePool;
    if (pool.length === 0) return;
    const daysCovered = 1 + slot.leftoverWeekdays.length;
    const candidates = eligibleForSlot(pool, daysCovered);
    const recipe = pickRecipe(candidates, used, rotationSeed + i);
    used.add(recipe.id);
    assignments.set(slot.weekday, {
      recipeId: recipe.id,
      servingsNeeded: input.household.persons * daysCovered,
    });
  });

  let variant = buildVariant(slots, assignments, input.household, byId, recipeLookup);
  let overBudget = variant.totalCostUsd > input.budget.amountUsd;

  if (overBudget) {
    for (let attempt = 0; attempt < slots.length; attempt++) {
      const costPerSlot = slots.map((slot) => {
        const a = assignments.get(slot.weekday);
        const recipe = a ? recipeLookup.get(a.recipeId) : undefined;
        return recipe && a ? recipeCostPerServing(recipe, byId) * a.servingsNeeded : 0;
      });
      const maxIdx = costPerSlot.indexOf(Math.max(...costPerSlot));
      const slot = slots[maxIdx];
      const a = assignments.get(slot.weekday);
      if (!a) break;
      const currentRecipe = recipeLookup.get(a.recipeId);
      if (!currentRecipe) break;
      const daysCovered = 1 + slot.leftoverWeekdays.length;
      const pool = eligibleForSlot(
        currentRecipe.cuisine === "lebanese" ? lebanesePool : internationalPool,
        daysCovered
      );
      const cheaper = [...pool]
        .filter((r) => r.id !== a.recipeId)
        .sort((x, y) => recipeCostPerServing(x, byId) - recipeCostPerServing(y, byId))
        .find((r) => recipeCostPerServing(r, byId) < recipeCostPerServing(currentRecipe, byId));
      if (!cheaper) break;
      used.delete(a.recipeId);
      used.add(cheaper.id);
      assignments.set(slot.weekday, { recipeId: cheaper.id, servingsNeeded: a.servingsNeeded });
      variant = buildVariant(slots, assignments, input.household, byId, recipeLookup);
      if (variant.totalCostUsd <= input.budget.amountUsd) break;
    }
    overBudget = variant.totalCostUsd > input.budget.amountUsd;
  }

  const flexAssignments = new Map(assignments);
  const upgradeCandidates = slots
    .map((slot) => slot.weekday)
    .sort((wA, wB) => {
      const a = assignments.get(wA);
      const b = assignments.get(wB);
      const rA = a ? recipeLookup.get(a.recipeId) : undefined;
      const rB = b ? recipeLookup.get(b.recipeId) : undefined;
      return (rA ? recipeCostPerServing(rA, byId) : 0) - (rB ? recipeCostPerServing(rB, byId) : 0);
    });

  let upgraded = 0;
  for (const weekday of upgradeCandidates) {
    if (upgraded >= 2) break;
    const a = flexAssignments.get(weekday);
    if (!a) continue;
    const currentRecipe = recipeLookup.get(a.recipeId);
    if (!currentRecipe) continue;
    const slot = slotByWeekday.get(weekday);
    const daysCovered = slot ? 1 + slot.leftoverWeekdays.length : 1;
    const pool = eligibleForSlot(
      currentRecipe.cuisine === "lebanese" ? lebanesePool : internationalPool,
      daysCovered
    );
    const pricier = [...pool]
      .filter((r) => r.id !== a.recipeId && !usedInAssignments(flexAssignments, r.id))
      .sort((x, y) => recipeCostPerServing(y, byId) - recipeCostPerServing(x, byId))
      .find((r) => recipeCostPerServing(r, byId) > recipeCostPerServing(currentRecipe, byId));
    if (!pricier) continue;
    flexAssignments.set(weekday, { recipeId: pricier.id, servingsNeeded: a.servingsNeeded });
    upgraded++;
  }

  const flexVariant =
    upgraded > 0 ? buildVariant(slots, flexAssignments, input.household, byId, recipeLookup) : undefined;

  return {
    ...variant,
    budgetUsd: input.budget.amountUsd,
    overBudget,
    flexAlternative: flexVariant,
  };
}

/**
 * Recomputes the shopping list and cost for a `days` array that was edited directly
 * (e.g. a manual recipe swap), without re-running the assignment/optimization pass.
 */
export function recomputeVariant(
  days: PlanDayAssignment[],
  recipes: Recipe[],
  ingredients: Ingredient[],
  household: Household
): GeneratedPlanVariant {
  const byId = ingredientMap(ingredients);
  const recipeLookup = new Map(recipes.map((r) => [r.id, r]));
  const totals = new Map<string, number>();

  const cookDays = days.filter((d) => d.type === "cook");
  for (const cd of cookDays) {
    const recipe = recipeLookup.get(cd.recipeId);
    if (!recipe) continue;
    const leftoverCount = days.filter(
      (d) => d.type === "leftover" && d.sourceWeekday === cd.weekday
    ).length;
    scaleIngredientsInto(recipe, household.persons * (1 + leftoverCount), totals);
  }
  addSideIngredients(days, household, recipeLookup, totals);

  const shoppingList = buildShoppingList(totals, byId);

  return {
    days,
    shoppingList,
    totalCostUsd: shoppingList.reduce((s, i) => s + i.estCostUsd, 0),
  };
}

function usedInAssignments(
  assignments: Map<Weekday, { recipeId: string; servingsNeeded: number }>,
  recipeId: string
): boolean {
  for (const a of assignments.values()) {
    if (a.recipeId === recipeId) return true;
  }
  return false;
}
