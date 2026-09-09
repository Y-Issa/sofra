"use client";

import { useState } from "react";
import { MagnifyingGlass, Plus } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fuzzyFilter } from "@/lib/search";
import { useAppStore, useIngredientPool } from "@/lib/store";
import type { Ingredient, IngredientCategory, Unit } from "@/lib/types";

const UNITS: Unit[] = ["g", "kg", "ml", "l", "piece", "bunch", "tbsp", "tsp"];
const CATEGORIES: IngredientCategory[] = [
  "produce",
  "protein",
  "dairy",
  "pantry",
  "grain",
  "spice",
  "bakery",
];

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `custom-${base || "ingredient"}-${Date.now().toString(36)}`;
}

export function IngredientCombobox({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [unit, setUnit] = useState<Unit>("kg");
  const [category, setCategory] = useState<IngredientCategory>("pantry");
  const [price, setPrice] = useState("1");
  const [packageQty, setPackageQty] = useState("0.5");
  const [kcal, setKcal] = useState("0");
  const [protein, setProtein] = useState("0");
  const [carbs, setCarbs] = useState("0");
  const [fat, setFat] = useState("0");

  const pool = useIngredientPool();
  const addCustomIngredient = useAppStore((s) => s.addCustomIngredient);
  const selected = pool.find((i) => i.id === value);

  const results = fuzzyFilter(query, pool, (i) => i.name).slice(0, 30);
  const exactMatch = pool.some((i) => i.name.toLowerCase() === query.trim().toLowerCase());

  function choose(id: string) {
    onChange(id);
    setOpen(false);
    setQuery("");
    setCreating(false);
  }

  function createNew() {
    const name = query.trim();
    if (!name) return;
    const ingredient: Ingredient = {
      id: slugify(name),
      name,
      unit,
      category,
      estPriceUsd: Number(price) || 0,
      packageQty: Number(packageQty) || 1,
      kcalPerUnit: Number(kcal) || 0,
      proteinGPerUnit: Number(protein) || 0,
      carbsGPerUnit: Number(carbs) || 0,
      fatGPerUnit: Number(fat) || 0,
    };
    addCustomIngredient(ingredient);
    choose(ingredient.id);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setCreating(false);
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="w-full justify-start font-normal">
          {selected ? selected.name : "Choose ingredient…"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose an ingredient</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCreating(false);
            }}
            placeholder="Search ingredients…"
            className="pl-9"
            aria-label="Search ingredients"
          />
        </div>
        {!creating && (
          <ul className="max-h-64 space-y-1 overflow-y-auto">
            {results.map((i) => (
              <li key={i.id}>
                <button
                  type="button"
                  onClick={() => choose(i.id)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                >
                  {i.name}
                  <span className="text-xs text-muted-foreground">{i.unit}</span>
                </button>
              </li>
            ))}
            {results.length === 0 && (
              <li className="px-3 py-2 text-sm text-muted-foreground">No matches.</li>
            )}
          </ul>
        )}
        {!creating && query.trim() && !exactMatch && (
          <Button type="button" variant="ghost" className="justify-start gap-1.5" onClick={() => setCreating(true)}>
            <Plus className="size-4" /> Create &ldquo;{query.trim()}&rdquo; as a new ingredient
          </Button>
        )}
        {creating && (
          <div className="space-y-3 rounded-lg border border-border p-3">
            <p className="text-sm font-medium">New ingredient: {query.trim()}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Select value={unit} onValueChange={(v) => setUnit(v as Unit)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as IngredientCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Est. price (USD per {unit})</Label>
                <Input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Package size ({unit})</Label>
                <Input
                  inputMode="decimal"
                  value={packageQty}
                  onChange={(e) => setPackageQty(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Nutrition per {unit} (optional, used for the app&apos;s macro estimates):
            </p>
            <div className="grid grid-cols-4 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">kcal</Label>
                <Input inputMode="decimal" value={kcal} onChange={(e) => setKcal(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">protein g</Label>
                <Input inputMode="decimal" value={protein} onChange={(e) => setProtein(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">carbs g</Label>
                <Input inputMode="decimal" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">fat g</Label>
                <Input inputMode="decimal" value={fat} onChange={(e) => setFat(e.target.value)} />
              </div>
            </div>
            <Button type="button" onClick={createNew} className="w-full">
              Add ingredient
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
