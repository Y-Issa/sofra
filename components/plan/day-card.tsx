"use client";

import { CalendarBlank, Flame, Plus, Repeat, X } from "@phosphor-icons/react/ssr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dayNutrition } from "@/lib/nutrition";
import { useAppStore, useIngredientLookup, useRecipeLookup } from "@/lib/store";
import { WEEKDAY_LABELS, WEEKDAY_SHORT, type PlanDayAssignment, type Weekday } from "@/lib/types";
import { RecipeSheet } from "./recipe-sheet";
import { SidePickerDialog } from "./side-picker-dialog";
import { SwapDialog } from "./swap-dialog";

export function DayCard({
  weekday,
  assignment,
  daysCovered,
}: {
  weekday: Weekday;
  assignment?: PlanDayAssignment;
  daysCovered: number;
}) {
  const recipeLookup = useRecipeLookup();
  const ingredientLookup = useIngredientLookup();
  const removeSide = useAppStore((s) => s.removeSide);

  if (!assignment) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-4">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {WEEKDAY_SHORT[weekday]}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">Not planned</p>
      </div>
    );
  }

  const recipe = recipeLookup.get(assignment.recipeId);
  if (!recipe) return null;
  const isLeftover = assignment.type === "leftover";
  const sideIds = assignment.sideRecipeIds ?? [];
  const nutrition = dayNutrition(assignment, recipeLookup, ingredientLookup);

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {WEEKDAY_LABELS[weekday]}
      </p>
      <p className="mt-1 truncate font-heading text-lg">{recipe.name}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <Badge variant={isLeftover ? "outline" : "secondary"} className="gap-1">
          {isLeftover ? <Repeat className="size-3" /> : <CalendarBlank className="size-3" />}
          {isLeftover && assignment.sourceWeekday !== undefined
            ? `Leftovers from ${WEEKDAY_LABELS[assignment.sourceWeekday]}`
            : "Cooking today"}
        </Badge>
        <Badge variant="outline" className="tabular gap-1">
          <Flame className="size-3" /> ~{Math.round(nutrition.kcal)} kcal
        </Badge>
      </div>

      {sideIds.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {sideIds.map((sideId) => {
            const side = recipeLookup.get(sideId);
            if (!side) return null;
            return (
              <li key={sideId}>
                <button
                  type="button"
                  onClick={() => removeSide(weekday, sideId)}
                  className="flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
                  aria-label={`Remove ${side.name}`}
                >
                  {side.name}
                  <X className="size-3" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <RecipeSheet
          recipeId={recipe.id}
          servings={assignment.servings}
          trigger={
            <Button size="sm" variant="outline">
              View recipe
            </Button>
          }
        />
        {!isLeftover && (
          <SwapDialog
            weekday={weekday}
            currentRecipeId={recipe.id}
            servings={assignment.servings}
            daysCovered={daysCovered}
            trigger={
              <Button size="sm" variant="ghost">
                Swap
              </Button>
            }
          />
        )}
        <SidePickerDialog
          weekday={weekday}
          attachedSideIds={sideIds}
          trigger={
            <Button size="sm" variant="ghost" className="gap-1">
              <Plus className="size-3.5" /> Add side
            </Button>
          }
        />
      </div>
    </div>
  );
}
