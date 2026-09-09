"use client";

import { TrashSimple } from "@phosphor-icons/react/ssr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";

export function CustomRecipesList() {
  const customRecipes = useAppStore((s) => s.customRecipes);
  const deleteCustomRecipe = useAppStore((s) => s.deleteCustomRecipe);

  if (customRecipes.length === 0) {
    return <p className="text-sm text-muted-foreground">You haven&apos;t added any recipes yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {customRecipes.map((recipe) => (
        <li
          key={recipe.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-medium">{recipe.name}</span>
            <Badge variant="outline" className="capitalize">
              {recipe.course}
            </Badge>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => deleteCustomRecipe(recipe.id)}
            aria-label={`Delete ${recipe.name}`}
          >
            <TrashSimple className="size-4" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
