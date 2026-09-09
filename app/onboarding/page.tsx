"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BudgetStep } from "@/components/onboarding/budget-step";
import { CuisineStep } from "@/components/onboarding/cuisine-step";
import { HouseholdStep } from "@/components/onboarding/household-step";
import { LocationStoreStep } from "@/components/onboarding/location-store-step";
import { ScheduleStep } from "@/components/onboarding/schedule-step";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const STEP_LABELS = ["Market", "Household", "Budget", "Schedule", "Cuisine"] as const;

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const regeneratePlan = useAppStore((s) => s.regeneratePlan);
  const finishOnboarding = useAppStore((s) => s.finishOnboarding);

  function next() {
    if (step < STEP_LABELS.length - 1) {
      setStep(step + 1);
      return;
    }
    regeneratePlan();
    finishOnboarding();
    router.push("/plan");
  }

  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-xl flex-1 flex-col px-4 py-10 sm:px-6">
      <header className="mb-8">
        <p className="font-heading text-3xl italic">Sofra</p>
        <p className="mt-1 text-sm text-muted-foreground">
          A few questions, then we&apos;ll plan your week.
        </p>
      </header>

      <div
        className="mb-8 flex gap-1.5"
        role="progressbar"
        aria-valuenow={step + 1}
        aria-valuemin={1}
        aria-valuemax={STEP_LABELS.length}
        aria-label={`Step ${step + 1} of ${STEP_LABELS.length}: ${STEP_LABELS[step]}`}
      >
        {STEP_LABELS.map((label, i) => (
          <div
            key={label}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i <= step ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>

      <div className="flex-1">
        {step === 0 && <LocationStoreStep onNext={next} />}
        {step === 1 && <HouseholdStep onNext={next} onBack={back} />}
        {step === 2 && <BudgetStep onNext={next} onBack={back} />}
        {step === 3 && <ScheduleStep onNext={next} onBack={back} />}
        {step === 4 && <CuisineStep onNext={next} onBack={back} />}
      </div>
    </div>
  );
}
