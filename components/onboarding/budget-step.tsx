"use client";

import { useState } from "react";
import { Info } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { convertFromUsd } from "@/lib/currency";
import { useAppStore } from "@/lib/store";
import { CURRENCIES, type Currency } from "@/lib/types";

export function BudgetStep({
  onNext,
  onBack,
}: {
  onNext?: () => void;
  onBack?: () => void;
}) {
  const budget = useAppStore((s) => s.budget);
  const setBudget = useAppStore((s) => s.setBudget);

  const [amount, setAmount] = useState(() =>
    (budget.currency === "USD" ? budget.amountUsd : convertFromUsd(budget.amountUsd, budget)).toString()
  );
  const [rate, setRate] = useState(budget.ratePerUsd ? budget.ratePerUsd.toString() : "");

  function commit(currency: Currency, amountStr: string, rateStr: string) {
    const amountNum = Number(amountStr) || 0;
    const rateNum = Number(rateStr) || undefined;
    if (currency === "USD") {
      setBudget({ amountUsd: amountNum, currency: "USD" });
    } else if (rateNum) {
      setBudget({ amountUsd: amountNum / rateNum, currency, ratePerUsd: rateNum });
    } else {
      setBudget({ amountUsd: budget.amountUsd, currency, ratePerUsd: undefined });
    }
  }

  const needsRate = budget.currency !== "USD";
  const canContinue = Number(amount) > 0 && (!needsRate || Number(rate) > 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl">What&apos;s your weekly grocery budget?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We&apos;ll plan meals to fit this, and always show you a slightly pricier alternative too.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">Currency</Label>
        <Select
          value={budget.currency}
          onValueChange={(v) => {
            const currency = v as Currency;
            commit(currency, amount, rate);
          }}
        >
          <SelectTrigger id="currency" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.code} — {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {needsRate && (
        <div className="space-y-2">
          <Label htmlFor="rate">Exchange rate: 1 USD equals how many {budget.currency}?</Label>
          <Input
            id="rate"
            inputMode="decimal"
            placeholder="e.g. 89500"
            value={rate}
            onChange={(e) => {
              setRate(e.target.value);
              commit(budget.currency, amount, e.target.value);
            }}
          />
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            Rates move often, so this is set by you and stays fixed until you change it in Settings.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="amount">Weekly budget, in {budget.currency}</Label>
        <Input
          id="amount"
          inputMode="decimal"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            commit(budget.currency, e.target.value, rate);
          }}
        />
        {budget.currency !== "USD" && Number(rate) > 0 && (
          <p className="tabular text-xs text-muted-foreground">
            ≈ ${(Number(amount) / Number(rate)).toFixed(2)} USD
          </p>
        )}
      </div>

      {onNext && (
        <div className="flex justify-between pt-2">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onNext} disabled={!canContinue}>
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}
