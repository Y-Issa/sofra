"use client";

import { useState } from "react";
import { Plus, TrashSimple } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/store";
import type { Course, Cuisine, Recipe, RecipeIngredient } from "@/lib/types";
import { IngredientCombobox } from "./ingredient-combobox";

interface Row {
  key: string;
  ingredientId: string | null;
  qty: string;
}

function emptyRow(): Row {
  return { key: Math.random().toString(36).slice(2), ingredientId: null, qty: "" };
}

const TAG_OPTIONS = ["vegetarian", "quick", "batch-friendly"];

export function CustomRecipeSheet() {
  const [open, setOpen] = useState(false);
  const addCustomRecipe = useAppStore((s) => s.addCustomRecipe);

  const [name, setName] = useState("");
  const [cuisine, setCuisine] = useState<Cuisine>("lebanese");
  const [course, setCourse] = useState<Course>("main");
  const [baseServings, setBaseServings] = useState("4");
  const [prepMinutes, setPrepMinutes] = useState("15");
  const [cookMinutes, setCookMinutes] = useState("20");
  const [leftoverDays, setLeftoverDays] = useState("1");
  const [tags, setTags] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [steps, setSteps] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName("");
    setCuisine("lebanese");
    setCourse("main");
    setBaseServings("4");
    setPrepMinutes("15");
    setCookMinutes("20");
    setLeftoverDays("1");
    setTags([]);
    setRows([emptyRow()]);
    setSteps("");
    setError(null);
  }

  function toggleTag(tag: string) {
    setTags((t) => (t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]));
  }

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((r) => r.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function removeRow(key: string) {
    setRows((r) => (r.length > 1 ? r.filter((row) => row.key !== key) : r));
  }

  function save() {
    const trimmedName = name.trim();
    const ingredients: RecipeIngredient[] = rows
      .filter((r) => r.ingredientId && Number(r.qty) > 0)
      .map((r) => ({ ingredientId: r.ingredientId as string, qty: Number(r.qty) }));

    if (!trimmedName) {
      setError("Give the recipe a name.");
      return;
    }
    if (ingredients.length === 0) {
      setError("Add at least one ingredient with a quantity.");
      return;
    }

    const recipe: Recipe = {
      id: `custom-${trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`,
      name: trimmedName,
      cuisine,
      course,
      baseServings: Number(baseServings) || 4,
      prepMinutes: Number(prepMinutes) || 0,
      cookMinutes: Number(cookMinutes) || 0,
      leftoverDays: Math.max(1, Number(leftoverDays) || 1),
      tags,
      ingredients,
      steps: steps
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    addCustomRecipe(recipe);
    setOpen(false);
    reset();
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <SheetTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-4" /> Add recipe
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-heading text-2xl">New recipe</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-8">
          <div className="space-y-1.5">
            <Label htmlFor="recipe-name">Name</Label>
            <Input id="recipe-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cuisine</Label>
              <Select value={cuisine} onValueChange={(v) => setCuisine(v as Cuisine)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lebanese">Lebanese</SelectItem>
                  <SelectItem value="international">International</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Course</Label>
              <Select value={course} onValueChange={(v) => setCourse(v as Course)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">Main (a day&apos;s dish)</SelectItem>
                  <SelectItem value="side">Side (added alongside)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Servings</Label>
              <Input inputMode="numeric" value={baseServings} onChange={(e) => setBaseServings(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Prep + cook, min</Label>
              <div className="flex gap-1">
                <Input inputMode="numeric" value={prepMinutes} onChange={(e) => setPrepMinutes(e.target.value)} />
                <Input inputMode="numeric" value={cookMinutes} onChange={(e) => setCookMinutes(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Keeps, days</Label>
              <Input inputMode="numeric" value={leftoverDays} onChange={(e) => setLeftoverDays(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {TAG_OPTIONS.map((tag) => (
              <label key={tag} className="flex items-center gap-1.5 text-sm capitalize">
                <Checkbox checked={tags.includes(tag)} onCheckedChange={() => toggleTag(tag)} />
                {tag.replace(/-/g, " ")}
              </label>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Ingredients</Label>
            <div className="space-y-2">
              {rows.map((row) => (
                <div key={row.key} className="flex gap-2">
                  <div className="flex-1">
                    <IngredientCombobox
                      value={row.ingredientId}
                      onChange={(id) => updateRow(row.key, { ingredientId: id })}
                    />
                  </div>
                  <Input
                    inputMode="decimal"
                    placeholder="Qty"
                    className="w-20"
                    value={row.qty}
                    onChange={(e) => updateRow(row.key, { qty: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRow(row.key)}
                    aria-label="Remove ingredient row"
                  >
                    <TrashSimple className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setRows((r) => [...r, emptyRow()])}
            >
              <Plus className="size-3.5" /> Add ingredient
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="recipe-steps">Steps (one per line)</Label>
            <Textarea
              id="recipe-steps"
              rows={6}
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              placeholder={"Soften the onion in oil.\nAdd the rice and stock, simmer 20 minutes."}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={save} className="w-full">
            Save recipe
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
