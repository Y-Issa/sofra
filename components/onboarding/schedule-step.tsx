"use client";

import { Minus, Plus } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/lib/store";
import { WEEKDAY_LABELS, type Weekday } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ScheduleStep({
  onNext,
  onBack,
}: {
  onNext?: () => void;
  onBack?: () => void;
}) {
  const schedule = useAppStore((s) => s.schedule);
  const setSchedule = useAppStore((s) => s.setSchedule);

  const cookCount = schedule.filter((d) => d.cook).length;

  function toggleCook(weekday: Weekday) {
    setSchedule(
      schedule.map((d) =>
        d.weekday === weekday ? { ...d, cook: !d.cook, leftoverSpan: d.cook ? 0 : d.leftoverSpan } : d
      )
    );
  }

  function changeSpan(weekday: Weekday, delta: number) {
    setSchedule(
      schedule.map((d) =>
        d.weekday === weekday
          ? { ...d, leftoverSpan: Math.min(3, Math.max(0, d.leftoverSpan + delta)) }
          : d
      )
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl">Which days do you want to cook?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          For a dish that keeps well, like a tabeekh, set how many extra days it should cover as
          leftovers.
        </p>
      </div>

      <ul className="space-y-2">
        {schedule.map((day) => (
          <li
            key={day.weekday}
            className={cn(
              "rounded-lg border px-4 py-3 transition-colors",
              day.cook ? "border-primary/40 bg-primary/5" : "border-border"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor={`cook-${day.weekday}`} className="text-sm font-medium">
                {WEEKDAY_LABELS[day.weekday]}
              </Label>
              <Switch
                id={`cook-${day.weekday}`}
                checked={day.cook}
                onCheckedChange={() => toggleCook(day.weekday)}
              />
            </div>
            {day.cook && (
              <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                <span className="text-xs text-muted-foreground">Leftovers cover extra day(s)</span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() => changeSpan(day.weekday, -1)}
                    disabled={day.leftoverSpan <= 0}
                    aria-label={`Fewer leftover days for ${WEEKDAY_LABELS[day.weekday]}`}
                  >
                    <Minus className="size-3.5" />
                  </Button>
                  <span className="w-4 text-center tabular text-sm">{day.leftoverSpan}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() => changeSpan(day.weekday, 1)}
                    disabled={day.leftoverSpan >= 3}
                    aria-label={`More leftover days for ${WEEKDAY_LABELS[day.weekday]}`}
                  >
                    <Plus className="size-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {onNext && (
        <div className="flex justify-between pt-2">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onNext} disabled={cookCount === 0}>
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}
