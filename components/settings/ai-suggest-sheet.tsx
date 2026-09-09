"use client";

import { useState, type ReactNode } from "react";
import { Check, Sparkle, WarningCircle } from "@phosphor-icons/react/ssr";
import { reconcileSuggestedRecipe, type AiSuggestedRecipe } from "@/lib/ai-suggest";
import { useAppStore, useIngredientPool, useRecipePool } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CuisineFilter = "any" | "lebanese" | "international";
type CourseFilter = "any" | "main" | "side";

export function AiSuggestSheet({
  trigger,
  initialQuery = "",
  initialCourse = "any",
}: {
  trigger: ReactNode;
  initialQuery?: string;
  initialCourse?: CourseFilter;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [cuisine, setCuisine] = useState<CuisineFilter>("any");
  const [course, setCourse] = useState<CourseFilter>(initialCourse);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AiSuggestedRecipe[]>([]);
  const [addedNames, setAddedNames] = useState<string[]>([]);

  const dietary = useAppStore((s) => s.dietary);
  const addCustomRecipe = useAppStore((s) => s.addCustomRecipe);
  const addCustomIngredient = useAppStore((s) => s.addCustomIngredient);
  const recipePool = useRecipePool();
  const ingredientPool = useIngredientPool();

  async function generate() {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/suggest-recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          cuisine,
          course,
          vegetarianOnly: dietary.vegetarianOnly,
          excludeSeafood: dietary.excludeSeafood,
          count: 3,
          knownIngredients: ingredientPool.map((i) => ({
            name: i.name,
            unit: i.unit,
            category: i.category,
          })),
          existingRecipeNames: recipePool.map((r) => r.name),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setResults(data.recipes ?? []);
      setAddedNames([]);
      setStatus("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStatus("error");
    }
  }

  function addSuggestion(suggested: AiSuggestedRecipe) {
    const { recipe, newIngredients } = reconcileSuggestedRecipe(suggested, ingredientPool);
    for (const ing of newIngredients) addCustomIngredient(ing);
    addCustomRecipe(recipe);
    setAddedNames((names) => [...names, suggested.name]);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-heading text-2xl">
            <Sparkle className="size-5 text-primary" />
            Suggest recipes with AI
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-8">
          <div className="space-y-1.5">
            <Label htmlFor="ai-query">What are you looking for? (optional)</Label>
            <Input
              id="ai-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. something with lentils, a quick weeknight dinner…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cuisine</Label>
              <Select value={cuisine} onValueChange={(v) => setCuisine(v as CuisineFilter)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="lebanese">Lebanese</SelectItem>
                  <SelectItem value="international">International</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Course</Label>
              <Select value={course} onValueChange={(v) => setCourse(v as CourseFilter)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="main">Main</SelectItem>
                  <SelectItem value="side">Side</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={generate} disabled={status === "loading"} className="w-full gap-1.5">
            <Sparkle className="size-4" />
            {status === "loading" ? "Thinking…" : "Generate suggestions"}
          </Button>

          {status === "error" && error && (
            <p className="flex items-start gap-1.5 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <WarningCircle className="mt-0.5 size-4 shrink-0" />
              {error}
            </p>
          )}

          {results.length > 0 && (
            <ul className="space-y-3">
              {results.map((r) => {
                const added = addedNames.includes(r.name);
                return (
                  <li key={r.name} className="rounded-lg border border-border p-3">
                    <p className="font-heading text-lg">{r.name}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="capitalize">
                        {r.cuisine}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {r.course}
                      </Badge>
                      <Badge variant="outline">{r.prepMinutes + r.cookMinutes} min</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {r.ingredients.map((i) => i.name).join(", ")}
                    </p>
                    <Button
                      size="sm"
                      variant={added ? "secondary" : "outline"}
                      className="mt-3 gap-1.5"
                      disabled={added}
                      onClick={() => addSuggestion(r)}
                    >
                      {added ? (
                        <>
                          <Check className="size-3.5" /> Added
                        </>
                      ) : (
                        "Add to my recipes"
                      )}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
