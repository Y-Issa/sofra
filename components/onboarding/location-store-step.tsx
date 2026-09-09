"use client";

import { useState } from "react";
import { MapPin, SpinnerGap, Storefront, WarningCircle } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentPosition } from "@/lib/geo";
import { useAppStore } from "@/lib/store";
import type { StoreKind } from "@/lib/types";
import { cn } from "@/lib/utils";

interface NearbyStore {
  id: string;
  name: string;
  lat: number;
  lon: number;
  kind: StoreKind;
  distanceMeters: number;
}

const KIND_LABEL: Record<StoreKind, string> = {
  supermarket: "Supermarket",
  grocery: "Grocery",
  greengrocer: "Greengrocer",
  market: "Market",
};

export function LocationStoreStep({ onNext }: { onNext?: () => void }) {
  const store = useAppStore((s) => s.store);
  const setStore = useAppStore((s) => s.setStore);

  const [status, setStatus] = useState<"idle" | "locating" | "searching" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [stores, setStores] = useState<NearbyStore[]>([]);
  const [manualName, setManualName] = useState("");

  async function locate() {
    setStatus("locating");
    setError(null);
    try {
      const { lat, lon } = await getCurrentPosition();
      setStatus("searching");
      const res = await fetch(`/api/stores/nearby?lat=${lat}&lon=${lon}`);
      if (!res.ok) throw new Error("lookup-failed");
      const data = await res.json();
      setStores(data.stores ?? []);
      setStatus("done");
    } catch {
      setError(
        "We couldn't get your location or reach the map service. You can enter a market name below instead."
      );
      setStatus("error");
    }
  }

  function selectStore(s: NearbyStore) {
    setStore({
      id: s.id,
      name: s.name,
      lat: s.lat,
      lon: s.lon,
      kind: s.kind,
      distanceMeters: s.distanceMeters,
    });
  }

  function useManual() {
    const name = manualName.trim();
    if (!name) return;
    setStore({ id: `manual-${name.toLowerCase()}`, name, kind: "market" });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl">Where do you shop?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We&apos;ll look up markets near you using OpenStreetMap. Only your coordinates are sent for
          this one lookup, nothing is stored anywhere but this browser.
        </p>
      </div>

      {status === "idle" && (
        <Button onClick={locate} className="gap-2">
          <MapPin className="size-4" /> Use my location
        </Button>
      )}

      {(status === "locating" || status === "searching") && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <SpinnerGap className="size-4 animate-spin" />
          {status === "locating" ? "Finding your location…" : "Looking up nearby markets…"}
        </p>
      )}

      {error && (
        <p className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <WarningCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}

      {status === "done" && stores.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No markets turned up nearby. Enter one manually below.
        </p>
      )}

      {stores.length > 0 && (
        <ul className="space-y-2">
          {stores.slice(0, 8).map((s) => {
            const selected = store?.id === s.id;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => selectStore(s)}
                  aria-pressed={selected}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                    selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                  )}
                >
                  <Storefront className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{s.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {KIND_LABEL[s.kind]} · {(s.distanceMeters / 1000).toFixed(1)} km away
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="space-y-2 border-t border-border pt-4">
        <Label htmlFor="manual-store">Or type a market name</Label>
        <div className="flex gap-2">
          <Input
            id="manual-store"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            placeholder="e.g. Spinneys, Hamra…"
          />
          <Button type="button" variant="secondary" onClick={useManual}>
            Use this
          </Button>
        </div>
      </div>

      {store && (
        <p className="tabular text-sm text-muted-foreground">
          Selected: <span className="font-medium text-foreground">{store.name}</span>
        </p>
      )}

      {onNext && (
        <div className="flex justify-end pt-2">
          <Button onClick={onNext} disabled={!store}>
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}
