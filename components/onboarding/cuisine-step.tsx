"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { useAppStore } from "@/lib/store";

export function CuisineStep({
  onNext,
  onBack,
  nextLabel = "Generate my week",
}: {
  onNext?: () => void;
  onBack?: () => void;
  nextLabel?: string;
}) {
  const cuisineMix = useAppStore((s) => s.cuisineMix);
  const setCuisineMix = useAppStore((s) => s.setCuisineMix);
  const dietary = useAppStore((s) => s.dietary);
  const setDietary = useAppStore((s) => s.setDietary);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl">One last thing</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tune the mix of dishes, and anything to leave out.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>International</span>
          <span>Lebanese</span>
        </div>
        <Slider
          value={[cuisineMix]}
          min={0}
          max={100}
          step={10}
          onValueChange={([v]) => setCuisineMix(v)}
          aria-label="Balance of Lebanese to international dishes"
        />
        <p className="tabular text-center text-sm font-medium">{cuisineMix}% Lebanese dishes</p>
      </div>

      <div className="space-y-3 rounded-lg border border-border p-4">
        <label className="flex items-center gap-2.5 text-sm">
          <Checkbox
            checked={dietary.vegetarianOnly}
            onCheckedChange={(v) => setDietary({ ...dietary, vegetarianOnly: v === true })}
          />
          Vegetarian only
        </label>
        <label className="flex items-center gap-2.5 text-sm">
          <Checkbox
            checked={dietary.excludeSeafood}
            onCheckedChange={(v) => setDietary({ ...dietary, excludeSeafood: v === true })}
          />
          No seafood
        </label>
      </div>

      {onNext && (
        <div className="flex justify-between pt-2">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onNext}>{nextLabel}</Button>
        </div>
      )}
    </div>
  );
}
