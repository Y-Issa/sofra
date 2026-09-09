import { create } from "zustand";
import { persist } from "zustand/middleware";
import recipesData from "@/data/recipes.json";
import ingredientsData from "@/data/ingredients.json";
import { generatePlan, recomputeVariant } from "./planner";
import type {
  BudgetSettings,
  DietaryFilters,
  GeneratedPlan,
  Household,
  Ingredient,
  Recipe,
  ScheduleDay,
  StoreSelection,
  Weekday,
} from "./types";

export const recipes = recipesData as Recipe[];
export const ingredients = ingredientsData as Ingredient[];
export const ingredientById = new Map(ingredients.map((i) => [i.id, i]));
export const recipeById = new Map(recipes.map((r) => [r.id, r]));

const defaultSchedule: ScheduleDay[] = ([0, 1, 2, 3, 4, 5, 6] as Weekday[]).map((weekday) => ({
  weekday,
  cook: false,
  leftoverSpan: 0,
}));

interface AppState {
  onboardingComplete: boolean;
  household: Household;
  budget: BudgetSettings;
  store: StoreSelection | null;
  schedule: ScheduleDay[];
  cuisineMix: number;
  dietary: DietaryFilters;
  plan: GeneratedPlan | null;
  checkedItems: string[];
  customRecipes: Recipe[];
  customIngredients: Ingredient[];

  setHousehold: (h: Household) => void;
  setBudget: (b: BudgetSettings) => void;
  setStore: (s: StoreSelection | null) => void;
  setSchedule: (s: ScheduleDay[]) => void;
  setCuisineMix: (n: number) => void;
  setDietary: (d: DietaryFilters) => void;
  finishOnboarding: () => void;
  regeneratePlan: () => void;
  swapRecipe: (weekday: Weekday, newRecipeId: string) => void;
  addSide: (weekday: Weekday, recipeId: string) => void;
  removeSide: (weekday: Weekday, recipeId: string) => void;
  applyFlexAlternative: () => void;
  toggleChecked: (ingredientId: string) => void;
  addCustomRecipe: (recipe: Recipe) => void;
  deleteCustomRecipe: (id: string) => void;
  addCustomIngredient: (ingredient: Ingredient) => void;
  resetAll: () => void;
}

const defaults = {
  onboardingComplete: false,
  household: { persons: 2 } as Household,
  budget: { amountUsd: 80, currency: "USD" } as BudgetSettings,
  store: null as StoreSelection | null,
  schedule: defaultSchedule,
  cuisineMix: 70,
  dietary: { vegetarianOnly: false, excludeSeafood: false } as DietaryFilters,
  plan: null as GeneratedPlan | null,
  checkedItems: [] as string[],
  customRecipes: [] as Recipe[],
  customIngredients: [] as Ingredient[],
};

/** Recomputes a day's side edit and writes the updated plan, mirroring swapRecipe's pattern. */
function applyDaysEdit(
  set: (partial: Partial<AppState>) => void,
  get: () => AppState,
  editDays: (days: GeneratedPlan["days"]) => GeneratedPlan["days"]
) {
  const { plan, household, customRecipes, customIngredients } = get();
  if (!plan) return;
  const days = editDays(plan.days);
  const variant = recomputeVariant(
    days,
    [...recipes, ...customRecipes],
    [...ingredients, ...customIngredients],
    household
  );
  set({
    plan: {
      ...variant,
      budgetUsd: plan.budgetUsd,
      overBudget: variant.totalCostUsd > plan.budgetUsd,
      flexAlternative: plan.flexAlternative,
    },
  });
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...defaults,

      setHousehold: (household) => set({ household }),
      setBudget: (budget) => set({ budget }),
      setStore: (store) => set({ store }),
      setSchedule: (schedule) => set({ schedule }),
      setCuisineMix: (cuisineMix) => set({ cuisineMix }),
      setDietary: (dietary) => set({ dietary }),
      finishOnboarding: () => set({ onboardingComplete: true }),

      regeneratePlan: () => {
        const { schedule, household, budget, cuisineMix, dietary, customRecipes, customIngredients } =
          get();
        const plan = generatePlan({
          recipes: [...recipes, ...customRecipes],
          ingredients: [...ingredients, ...customIngredients],
          schedule,
          household,
          budget,
          cuisineMix,
          dietary,
        });
        set({ plan, checkedItems: [] });
      },

      toggleChecked: (ingredientId) => {
        const { checkedItems } = get();
        set({
          checkedItems: checkedItems.includes(ingredientId)
            ? checkedItems.filter((id) => id !== ingredientId)
            : [...checkedItems, ingredientId],
        });
      },

      swapRecipe: (weekday, newRecipeId) => {
        applyDaysEdit(set, get, (days) =>
          days.map((d) => {
            if (d.weekday === weekday && d.type === "cook") return { ...d, recipeId: newRecipeId };
            if (d.type === "leftover" && d.sourceWeekday === weekday) {
              return { ...d, recipeId: newRecipeId };
            }
            return d;
          })
        );
      },

      addSide: (weekday, recipeId) => {
        applyDaysEdit(set, get, (days) =>
          days.map((d) =>
            d.weekday === weekday && !(d.sideRecipeIds ?? []).includes(recipeId)
              ? { ...d, sideRecipeIds: [...(d.sideRecipeIds ?? []), recipeId] }
              : d
          )
        );
      },

      removeSide: (weekday, recipeId) => {
        applyDaysEdit(set, get, (days) =>
          days.map((d) =>
            d.weekday === weekday
              ? { ...d, sideRecipeIds: (d.sideRecipeIds ?? []).filter((id) => id !== recipeId) }
              : d
          )
        );
      },

      applyFlexAlternative: () => {
        const { plan } = get();
        if (!plan?.flexAlternative) return;
        set({
          plan: {
            ...plan.flexAlternative,
            budgetUsd: plan.budgetUsd,
            overBudget: plan.flexAlternative.totalCostUsd > plan.budgetUsd,
            flexAlternative: undefined,
          },
        });
      },

      addCustomRecipe: (recipe) => {
        const { customRecipes } = get();
        set({ customRecipes: [...customRecipes, recipe] });
      },

      deleteCustomRecipe: (id) => {
        const { customRecipes } = get();
        set({ customRecipes: customRecipes.filter((r) => r.id !== id) });
      },

      addCustomIngredient: (ingredient) => {
        const { customIngredients } = get();
        set({ customIngredients: [...customIngredients, ingredient] });
      },

      resetAll: () => set({ ...defaults, schedule: defaultSchedule, checkedItems: [] }),
    }),
    { name: "sofra-planner" }
  )
);

export function useRecipePool(): Recipe[] {
  const customRecipes = useAppStore((s) => s.customRecipes);
  return customRecipes.length ? [...recipes, ...customRecipes] : recipes;
}

export function useIngredientPool(): Ingredient[] {
  const customIngredients = useAppStore((s) => s.customIngredients);
  return customIngredients.length ? [...ingredients, ...customIngredients] : ingredients;
}

export function useRecipeLookup(): Map<string, Recipe> {
  const customRecipes = useAppStore((s) => s.customRecipes);
  return customRecipes.length ? new Map([...recipeById, ...customRecipes.map((r) => [r.id, r] as const)]) : recipeById;
}

export function useIngredientLookup(): Map<string, Ingredient> {
  const customIngredients = useAppStore((s) => s.customIngredients);
  return customIngredients.length
    ? new Map([...ingredientById, ...customIngredients.map((i) => [i.id, i] as const)])
    : ingredientById;
}
