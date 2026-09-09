"use client";

import { Minus, Plus, Users } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";

export function HouseholdStep({
  onNext,
  onBack,
}: {
  onNext?: () => void;
  onBack?: () => void;
}) {
  const persons = useAppStore((s) => s.household.persons);
  const setHousehold = useAppStore((s) => s.setHousehold);

  function change(delta: number) {
    setHousehold({ persons: Math.min(12, Math.max(1, persons + delta)) });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl">How many people are you cooking for?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We&apos;ll scale every recipe and the grocery list to this number.
        </p>
      </div>

      <div className="flex items-center justify-center gap-6 rounded-xl border border-border py-10">
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          onClick={() => change(-1)}
          disabled={persons <= 1}
          aria-label="Decrease number of people"
        >
          <Minus className="size-5" />
        </Button>
        <div className="flex flex-col items-center gap-1 tabular">
          <Users className="size-6 text-primary" />
          <span className="text-4xl font-semibold">{persons}</span>
          <span className="text-xs text-muted-foreground">{persons === 1 ? "person" : "people"}</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          onClick={() => change(1)}
          disabled={persons >= 12}
          aria-label="Increase number of people"
        >
          <Plus className="size-5" />
        </Button>
      </div>

      {onNext && (
        <div className="flex justify-between pt-2">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onNext}>Continue</Button>
        </div>
      )}
    </div>
  );
}
