export type Unit = "g" | "kg" | "ml" | "l" | "piece" | "bunch" | "tbsp" | "tsp";

export type IngredientCategory =
  | "produce"
  | "protein"
  | "dairy"
  | "pantry"
  | "grain"
  | "spice"
  | "bakery";

export interface Ingredient {
  id: string;
  name: string;
  unit: Unit;
  category: IngredientCategory;
  /** Estimated USD price per unit above. User-editable estimate, not authoritative. */
  estPriceUsd: number;
  /** Smallest realistic purchase quantity, in the same unit. Shopping lists round up to whole packages. */
  packageQty: number;
  /** Approximate nutrition per 1 unit above (as-purchased/raw weight). Estimates, not medical advice. */
  kcalPerUnit: number;
  proteinGPerUnit: number;
  carbsGPerUnit: number;
  fatGPerUnit: number;
}

export type Cuisine = "lebanese" | "international";

export interface RecipeIngredient {
  ingredientId: string;
  qty: number;
}

export type Course = "main" | "side";

export interface Recipe {
  id: string;
  name: string;
  cuisine: Cuisine;
  /** Whether this can anchor a day's meal on its own, or is only ever added alongside a main. */
  course: Course;
  baseServings: number;
  prepMinutes: number;
  cookMinutes: number;
  /** How many days this dish keeps well, including the cook day itself. */
  leftoverDays: number;
  tags: string[];
  ingredients: RecipeIngredient[];
  steps: string[];
}

/** 0 = Monday .. 6 = Sunday. This is a recurring weekly pattern, not a calendar date. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: "Monday",
  1: "Tuesday",
  2: "Wednesday",
  3: "Thursday",
  4: "Friday",
  5: "Saturday",
  6: "Sunday",
};

export const WEEKDAY_SHORT: Record<Weekday, string> = {
  0: "Mon",
  1: "Tue",
  2: "Wed",
  3: "Thu",
  4: "Fri",
  5: "Sat",
  6: "Sun",
};

export interface ScheduleDay {
  weekday: Weekday;
  cook: boolean;
  /** Extra days beyond the cook day itself that this dish should cover, e.g. 2 for a tabeekh eaten over 3 days. */
  leftoverSpan: number;
}

export type Currency = "USD" | "LBP" | "EUR" | "GBP" | "SAR" | "AED" | "EGP";

export const CURRENCIES: { code: Currency; label: string }[] = [
  { code: "USD", label: "US Dollar" },
  { code: "LBP", label: "Lebanese Pound" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "British Pound" },
  { code: "SAR", label: "Saudi Riyal" },
  { code: "AED", label: "UAE Dirham" },
  { code: "EGP", label: "Egyptian Pound" },
];

export interface BudgetSettings {
  amountUsd: number;
  currency: Currency;
  /** Manual FX rate: 1 USD = ratePerUsd units of `currency`. Left undefined until the user sets it. */
  ratePerUsd?: number;
}

export interface Household {
  persons: number;
}

export interface DietaryFilters {
  vegetarianOnly: boolean;
  excludeSeafood: boolean;
}

export type StoreKind = "supermarket" | "grocery" | "greengrocer" | "market";

export interface StoreSelection {
  id: string;
  name: string;
  lat?: number;
  lon?: number;
  kind: StoreKind;
  distanceMeters?: number;
  address?: string;
}

export interface PlanDayAssignment {
  weekday: Weekday;
  type: "cook" | "leftover";
  recipeId: string;
  /** For a leftover day, the weekday whose cooking produced it. */
  sourceWeekday?: Weekday;
  servings: number;
  /** Side dishes attached to this specific day, independent of any other day sharing the same main. */
  sideRecipeIds?: string[];
}

export interface ShoppingListItem {
  ingredientId: string;
  qty: number;
  unit: Unit;
  estCostUsd: number;
}

export interface GeneratedPlanVariant {
  days: PlanDayAssignment[];
  shoppingList: ShoppingListItem[];
  totalCostUsd: number;
}

export interface GeneratedPlan extends GeneratedPlanVariant {
  budgetUsd: number;
  overBudget: boolean;
  flexAlternative?: GeneratedPlanVariant;
}
