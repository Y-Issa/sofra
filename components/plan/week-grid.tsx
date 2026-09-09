import type { GeneratedPlan, Weekday } from "@/lib/types";
import { DayCard } from "./day-card";

const WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

export function WeekGrid({ plan }: { plan: GeneratedPlan }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {WEEKDAYS.map((w) => {
        const daysCovered = plan.days.filter((d) => d.type === "leftover" && d.sourceWeekday === w).length + 1;
        return (
          <DayCard
            key={w}
            weekday={w}
            assignment={plan.days.find((d) => d.weekday === w)}
            daysCovered={daysCovered}
          />
        );
      })}
    </div>
  );
}
