"use client";

import { useState, type ReactNode } from "react";
import { Check, MagnifyingGlass, Plus, Sparkle } from "@phosphor-icons/react/ssr";
import { AiSuggestSheet } from "@/components/settings/ai-suggest-sheet";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/currency";
import { fuzzyFilter } from "@/lib/search";
import { useAppStore, useIngredientLookup, useRecipePool } from "@/lib/store";
import type { Weekday } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SidePickerDialog({
  weekday,
  attachedSideIds,
  trigger,
}: {
  weekday: Weekday;
  attachedSideIds: string[];
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const budget = useAppStore((s) => s.budget);
  const dietary = useAppStore((s) => s.dietary);
  const addSide = useAppStore((s) => s.addSide);
  const removeSide = useAppStore((s) => s.removeSide);
  const recipePool = useRecipePool();
  const ingredientLookup = useIngredientLookup();

  const sides = recipePool
    .filter((r) => r.course === "side")
    .filter((r) => !dietary.vegetarianOnly || r.tags.includes("vegetarian"))
    .filter(
      (r) => !dietary.excludeSeafood || !r.ingredients.some((i) => i.ingredientId === "fish-fillet")
    );

  const candidates = query.trim() ? fuzzyFilter(query, sides, (r) => r.name) : sides;

  function toggle(id: string) {
    if (attachedSideIds.includes(id)) removeSide(weekday, id);
    else addSide(weekday, id);
  }

  function sideCostUsd(recipeId: string): number {
    const recipe = recipePool.find((r) => r.id === recipeId);
    if (!recipe) return 0;
    return recipe.ingredients.reduce((sum, ri) => {
      const ing = ingredientLookup.get(ri.ingredientId);
      return sum + (ing ? ing.estPriceUsd * ri.qty : 0);
    }, 0);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a side</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Salads, dips and bread to go with today&apos;s dish. Add as many as you like.
          </p>
        </DialogHeader>
        <div className="relative">
          <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sides…"
            className="pl-9"
            aria-label="Search side dishes"
          />
        </div>
        {candidates.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm text-muted-foreground">No sides match &ldquo;{query}&rdquo;.</p>
            <AiSuggestSheet
              initialQuery={query}
              initialCourse="side"
              trigger={
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Sparkle className="size-4" /> Suggest one with AI
                </Button>
              }
            />
          </div>
        )}
        <ul className="space-y-1.5">
          {candidates.map((r) => {
            const attached = attachedSideIds.includes(r.id);
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => toggle(r.id)}
                  aria-pressed={attached}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                    attached ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full border",
                        attached ? "border-primary bg-primary text-primary-foreground" : "border-border"
                      )}
                    >
                      {attached ? <Check className="size-3" /> : <Plus className="size-3" />}
                    </span>
                    <span className="truncate text-sm font-medium">{r.name}</span>
                  </span>
                  <span className="tabular shrink-0 text-sm text-muted-foreground">
                    {formatMoney(sideCostUsd(r.id), budget)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
