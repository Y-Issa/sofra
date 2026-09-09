import type { Unit } from "./types";

export function formatQty(qty: number, unit: Unit): string {
  switch (unit) {
    case "kg":
      return qty < 1 ? `${Math.round(qty * 1000)} g` : `${trim(qty)} kg`;
    case "l":
      return qty < 1 ? `${Math.round(qty * 1000)} ml` : `${trim(qty)} l`;
    case "g":
      return `${trim(qty)} g`;
    case "ml":
      return `${trim(qty)} ml`;
    case "tbsp":
      return `${trim(qty)} tbsp`;
    case "tsp":
      return `${trim(qty)} tsp`;
    case "piece":
      return `${Math.ceil(qty)} ${Math.ceil(qty) === 1 ? "piece" : "pieces"}`;
    case "bunch":
      return `${Math.ceil(qty)} ${Math.ceil(qty) === 1 ? "bunch" : "bunches"}`;
    default:
      return `${trim(qty)} ${unit}`;
  }
}

function trim(n: number): string {
  return (Math.round(n * 100) / 100).toString();
}

/** Rounds a raw recipe quantity up to a sensible shoppable amount for the given unit. */
export function toShoppableQty(qty: number, unit: Unit): number {
  if (unit === "piece" || unit === "bunch") return Math.ceil(qty);
  if (unit === "kg" || unit === "l") return Math.round(qty * 20) / 20;
  return Math.round(qty * 100) / 100;
}
