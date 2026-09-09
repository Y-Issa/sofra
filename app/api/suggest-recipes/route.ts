import { ApiError, GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const MODEL = "gemini-3.5-flash-lite";

const UNITS = ["g", "kg", "ml", "l", "piece", "bunch", "tbsp", "tsp"];
const CATEGORIES = ["produce", "protein", "dairy", "pantry", "grain", "spice", "bakery"];

const RECIPE_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    recipes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Recipe name, Title Case, no em dashes." },
          cuisine: { type: "string", enum: ["lebanese", "international"] },
          course: {
            type: "string",
            enum: ["main", "side"],
            description:
              "'main' if this can be a whole day's dinner on its own; 'side' if it's a salad, dip, or bread meant to accompany a main.",
          },
          baseServings: { type: "integer" },
          prepMinutes: { type: "integer" },
          cookMinutes: { type: "integer" },
          leftoverDays: {
            type: "integer",
            description:
              "How many days this dish keeps well in the fridge, including the cook day itself. 1 if best eaten fresh.",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Choose from: vegetarian, quick, batch-friendly, comfort.",
          },
          ingredients: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                qty: { type: "number", description: "Quantity in `unit`, scaled for baseServings." },
                unit: { type: "string", enum: UNITS },
                category: { type: "string", enum: CATEGORIES },
                estPriceUsd: { type: "number", description: "Estimated USD price per 1 unit." },
                packageQty: {
                  type: "number",
                  description:
                    "Smallest realistic purchase quantity, in `unit` (e.g. 0.2 for a 200g butter stick).",
                },
                kcalPerUnit: { type: "number" },
                proteinGPerUnit: { type: "number" },
                carbsGPerUnit: { type: "number" },
                fatGPerUnit: { type: "number" },
              },
              required: [
                "name",
                "qty",
                "unit",
                "category",
                "estPriceUsd",
                "packageQty",
                "kcalPerUnit",
                "proteinGPerUnit",
                "carbsGPerUnit",
                "fatGPerUnit",
              ],
            },
          },
          steps: {
            type: "array",
            items: { type: "string" },
            description: "Concise imperative steps, no em dashes.",
          },
        },
        required: [
          "name",
          "cuisine",
          "course",
          "baseServings",
          "prepMinutes",
          "cookMinutes",
          "leftoverDays",
          "tags",
          "ingredients",
          "steps",
        ],
      },
    },
  },
  required: ["recipes"],
};

interface RequestBody {
  query?: string;
  cuisine?: "lebanese" | "international" | "any";
  course?: "main" | "side" | "any";
  vegetarianOnly?: boolean;
  excludeSeafood?: boolean;
  count?: number;
  knownIngredients: { name: string; unit: string; category: string }[];
  existingRecipeNames: string[];
}

export async function POST(request: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      {
        error: "AI suggestions aren't set up yet. Add GEMINI_API_KEY to your environment and restart the server.",
      },
      { status: 501 }
    );
  }

  const body: RequestBody = await request.json();
  const count = Math.min(Math.max(1, body.count ?? 3), 6);

  const constraints: string[] = [];
  if (body.cuisine && body.cuisine !== "any") constraints.push(`Cuisine must be "${body.cuisine}".`);
  if (body.course && body.course !== "any") constraints.push(`Course must be "${body.course}".`);
  if (body.vegetarianOnly) constraints.push('Every recipe must be tagged "vegetarian" and contain no meat, poultry, or fish.');
  if (body.excludeSeafood) constraints.push("Do not use fish or seafood.");
  if (body.query?.trim()) constraints.push(`The user asked for: "${body.query.trim()}"`);

  const systemInstruction = `You suggest home-cooking recipes for Sofra, a weekly meal planner focused on Lebanese home cooking (tabeekh-style stews, mezze, grilled dishes) plus international dishes commonly eaten in Lebanon. Every recipe must be realistic, home-cookable, and distinct from the existing recipes listed below.

Known ingredients already in the app's catalog (reuse these exact names and units whenever an ingredient matches one, so the app doesn't create duplicates):
${body.knownIngredients.map((i) => `- ${i.name} (unit: ${i.unit}, category: ${i.category})`).join("\n")}

Existing recipe names, do not repeat or trivially rename these:
${body.existingRecipeNames.join(", ")}

For any ingredient NOT in the known list, invent a new one with your best-estimate realistic USD price, purchase package size, and nutrition per unit (as-purchased/raw weight, consistent with how the known ingredients are quantified). Prices and nutrition are approximate estimates shown to the user as such, not authoritative data - reasonable, honest estimates are fine.

Generate exactly ${count} recipe${count === 1 ? "" : "s"}.${constraints.length ? "\n\n" + constraints.join("\n") : ""}`;

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `Suggest ${count} new recipe${count === 1 ? "" : "s"} for this app.`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: RECIPE_RESPONSE_SCHEMA,
      },
    });

    if (!response.text) {
      return NextResponse.json({ error: "The model didn't return any recipes. Try again." }, { status: 502 });
    }

    const data = JSON.parse(response.text) as { recipes: unknown[] };
    return NextResponse.json(data);
  } catch (error) {
    console.error("suggest-recipes error:", error);
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status || 502 });
    }
    return NextResponse.json({ error: "Couldn't reach the AI provider. Try again in a moment." }, { status: 502 });
  }
}
