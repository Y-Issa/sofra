"use client";

import { useState, type ReactNode } from "react";
import { MagnifyingGlass, Repeat, Sparkle } from "@phosphor-icons/react/ssr";
import { AiSuggestSheet } from "@/components/settings/ai-suggest-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/currency";
import { fuzzyFilter } from "@/lib/search";
import { useAppStore, useIngredientLookup, useRecipePool } from "@/lib/store";
import type { Ingredient, Recipe, Weekday } from "@/lib/types";

function recipeCostUsd(recipe: Recipe, servings: number, byId: Map<string, Ingredient>): number {
  const scale = servings / recipe.baseServings;
  return recipe.ingredients.reduce((sum, ri) => {
    const ing = byId.get(ri.ingredientId);
    return sum + (ing ? ing.estPriceUsd * ri.qty * scale : 0);
  }, 0);
}

export function SwapDialog({
  weekday,
  currentRecipeId,
  servings,
  daysCovered,
  trigger,
}: {
  weekday: Weekday;
  currentRecipeId: string;
  servings: number;
  daysCovered: number;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const budget = useAppStore((s) => s.budget);
  const dietary = useAppStore((s) => s.dietary);
  const swapRecipe = useAppStore((s) => s.swapRecipe);
  const recipePool = useRecipePool();
  const ingredientLookup = useIngredientLookup();

  const filtered = recipePool
    .filter((r) => r.course === "main")
    .filter((r) => r.id !== currentRecipeId)
    .filter((r) => !dietary.vegetarianOnly || r.tags.includes("vegetarian"))
    .filter(
      (r) => !dietary.excludeSeafood || !r.ingredients.some((i) => i.ingredientId === "fish-fillet")
    );

  const keepsWell = filtered.filter((r) => r.leftoverDays >= daysCovered);
  const base = daysCovered > 1 && keepsWell.length > 0 ? keepsWell : filtered;

  // A search expresses explicit intent, so it looks across everything (not just the keeps-well subset) —
  // the "Keeps Nd" badge on each row still lets the user judge fit for a multi-day slot.
  const candidates = query.trim()
    ? fuzzyFilter(query, filtered, (r) => r.name)
    : [...base].sort(
        (a, b) => recipeCostUsd(a, servings, ingredientLookup) - recipeCostUsd(b, servings, ingredientLookup)
      );

  function choose(id: string) {
    swapRecipe(weekday, id);
    setOpen(false);
    setQuery("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Swap this day&apos;s dish</DialogTitle>
          {daysCovered > 1 && (
            <p className="text-sm text-muted-foreground">
              This slot covers {daysCovered} days, so dishes that keep well are listed first.
            </p>
          )}
        </DialogHeader>
        <div className="relative">
          <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search dishes…"
            className="pl-9"
            aria-label="Search dishes to swap in"
          />
        </div>
        {candidates.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm text-muted-foreground">No dishes match &ldquo;{query}&rdquo;.</p>
            <AiSuggestSheet
              initialQuery={query}
              trigger={
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Sparkle className="size-4" /> Suggest one with AI
                </Button>
              }
            />
          </div>
        )}
        <ul className="space-y-1.5">
          {candidates.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => choose(r.id)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 text-left transition-colors hover:bg-muted"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{r.name}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="capitalize">
                      {r.cuisine === "lebanese" ? "Lebanese" : "International"}
                    </Badge>
                    {r.leftoverDays > 1 && (
                      <Badge variant="outline" className="gap-1">
                        <Repeat className="size-3" /> Keeps {r.leftoverDays}d
                      </Badge>
                    )}
                  </span>
                </span>
                <span className="tabular shrink-0 text-sm text-muted-foreground">
                  {formatMoney(recipeCostUsd(r, servings, ingredientLookup), budget)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
