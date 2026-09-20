# Sofra

A weekly home-cooking planner built around Lebanese and Middle Eastern food, with the international dishes commonly eaten in Lebanon mixed in. Tell it your budget, household size and cooking days, and it lays out a week of dinners, works out leftovers, and hands you a shopping list you can actually buy from.

Everything runs locally in your browser. There are no accounts and no backend database.

## What it does

- **Fits a week to your budget.** The planner picks dishes for your cooking days, respects your cuisine mix and dietary filters (vegetarian, no seafood), and shows how the total compares to your budget. If a week can't fit, it says so and gives you the closest plan it could make. It can also offer an optional upgrade of a couple of dishes, with the extra cost shown up front.
- **Plans leftovers.** Dishes that keep well cover more than one day, so you cook once and eat twice. For multi-day slots the planner prefers dishes that keep well.
- **Mains and sides are different things.** The plan assigns mains only. You add sides (fattoush, laban, pickles) per day yourself, and cost and nutrition update immediately.
- **Shopping list you can shop from.** Quantities round up to real package sizes (a 200 g butter block, not 30 g), grouped by aisle, priced per package.
- **Nutrition per serving.** Calories, protein, carbs and fat for each dish, each day, and the weekly average. These are estimates from ingredient data, not medical advice.
- **Find nearby markets.** Uses OpenStreetMap to list grocery stores and markets around you.
- **Swap and search.** Swap any day's dish with fuzzy search across the whole recipe library.
- **Your own recipes.** Add custom recipes and ingredients from Settings. They take part in planning like built-in ones.
- **Suggest with AI (optional).** Ask Gemini for new recipes ("a vegetarian Lebanese dinner with eggplant"). Suggestions are matched against the ingredient catalog and saved to your recipes when you accept them.
- **Light and dark themes.**

The planner itself is deterministic code, not AI. AI is only used for the optional recipe suggestions.

## Getting started

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). First launch walks you through location, household, budget, schedule and cuisine preferences.

### Enabling AI recipe suggestions (optional)

The rest of the app works without this. To turn on "Suggest with AI":

1. Create a free key at [Google AI Studio](https://aistudio.google.com/apikey).
2. Copy the example env file and paste your key in:

   ```bash
   cp .env.example .env.local
   ```

   ```
   GEMINI_API_KEY=your-key-here
   ```

3. Restart the dev server.

The key is read only in a server route (`app/api/suggest-recipes/route.ts`) and never sent to the browser. `.env.local` is gitignored.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type check |

## Where your data goes

Your plan, preferences and custom recipes live in your browser's `localStorage`. Clearing site data resets the app.

Network calls the app makes:

| Call | Used for | Sends |
| --- | --- | --- |
| OpenStreetMap Overpass | Finding nearby markets | Your coordinates |
| OpenStreetMap Nominatim | Turning coordinates into a place name | Your coordinates |
| Google Gemini (optional) | Recipe suggestions | Your request text, plus ingredient and recipe names from the catalog |

Overpass and Nominatim are free and need no key. They are proxied through the app's own API routes.

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router, Turbopack), React 19, TypeScript
- [Tailwind CSS](https://tailwindcss.com) v4 with [shadcn/ui](https://ui.shadcn.com) components
- [Zustand](https://zustand.docs.pmnd.rs) with `persist` for local state
- [`@google/genai`](https://www.npmjs.com/package/@google/genai) for recipe suggestions
- Newsreader and Plus Jakarta Sans via `next/font`, Phosphor icons

## Project layout

```
app/
  onboarding/          First-run setup flow
  (app)/plan/          Weekly plan (home)
  (app)/shopping-list/ Package-aware shopping list
  (app)/settings/      Preferences and custom recipes
  api/
    stores/nearby/     Overpass market lookup
    geocode/           Nominatim reverse geocoding
    suggest-recipes/   Gemini recipe suggestions
components/            UI, grouped by feature (plan, onboarding, settings, ...)
lib/
  planner.ts           Budget-fitting plan and shopping-list generation
  nutrition.ts         Per-serving and per-day nutrition
  search.ts            Small fuzzy matcher for swap, sides and ingredients
  ai-suggest.ts        Maps AI output onto the ingredient catalog
  store.ts             Zustand store
data/
  recipes.json         38 recipes (31 mains, 7 sides; 26 Lebanese, 12 international)
  ingredients.json     93 ingredients with price, package size and nutrition
```

## About the data

Prices are rough USD estimates and vary a lot by store and season. You can set a manual exchange rate for other currencies such as LBP. Nutrition values use raw, as-purchased weights. Treat both as planning aids, not exact figures.

## Contributing notes

This project uses a version of Next.js with breaking changes from older releases. Before writing framework code, read the relevant guide in `node_modules/next/dist/docs/` (see `AGENTS.md`).
