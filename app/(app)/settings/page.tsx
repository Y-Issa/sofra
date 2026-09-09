"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BudgetStep } from "@/components/onboarding/budget-step";
import { CuisineStep } from "@/components/onboarding/cuisine-step";
import { HouseholdStep } from "@/components/onboarding/household-step";
import { LocationStoreStep } from "@/components/onboarding/location-store-step";
import { ScheduleStep } from "@/components/onboarding/schedule-step";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { CustomRecipeSheet } from "@/components/settings/custom-recipe-sheet";
import { CustomRecipesList } from "@/components/settings/custom-recipes-list";
import { useAppStore } from "@/lib/store";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border p-5">
      <h2 className="mb-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const regeneratePlan = useAppStore((s) => s.regeneratePlan);
  const resetAll = useAppStore((s) => s.resetAll);
  const [resetOpen, setResetOpen] = useState(false);

  function saveAndRegenerate() {
    regeneratePlan();
    toast.success("Plan updated with your new settings.");
  }

  function confirmReset() {
    resetAll();
    setResetOpen(false);
    router.push("/onboarding");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl italic">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Changes are saved as you go. Regenerate your plan to apply them to this week.
        </p>
      </div>

      <Section title="Household">
        <HouseholdStep />
      </Section>

      <Section title="Market">
        <LocationStoreStep />
      </Section>

      <Section title="Budget">
        <BudgetStep />
      </Section>

      <Section title="Schedule">
        <ScheduleStep />
      </Section>

      <Section title="Cuisine & diet">
        <CuisineStep />
      </Section>

      <div className="flex justify-end">
        <Button onClick={saveAndRegenerate}>Save &amp; regenerate plan</Button>
      </div>

      <Separator />

      <Section title="My recipes">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Add your own dishes to swap in or plan with, alongside the built-in recipes.
            </p>
            <CustomRecipeSheet />
          </div>
          <CustomRecipesList />
        </div>
      </Section>

      <Section title="Danger zone">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Erase your household, budget, schedule, and plan from this browser and start over.
          </p>
          <Dialog open={resetOpen} onOpenChange={setResetOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="shrink-0">
                Reset all data
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset everything?</DialogTitle>
                <DialogDescription>
                  This clears your saved household, market, budget, schedule and current plan from
                  this browser. It cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setResetOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirmReset}>
                  Reset everything
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Section>
    </div>
  );
}
