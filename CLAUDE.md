# Kitchen Collection app

A personal Android recipe app for one user, built around a Thermomix and an air fryer. It replaces an existing single-file web app (a Claude artifact) and must keep all of its recipes and features. Layout follows Cookidoo. The app is sideloaded as an APK, not published on the Play Store.

## Sources of truth

1. `legacy/kitchen-collection-artifact.html` is the current app. It holds the full recipe collection (the `RECIPES` array) and every feature the new app must keep. Read it in full before planning anything.
2. `data/recipes/` holds recipes already converted to the schema (five Easy & Healthy recipes so far). After migration, it holds every recipe.
3. `reference/cookidoo/` holds Cookidoo screenshots for layout (local only, gitignored).

## The golden rule

Adding or changing a recipe must never require an app rebuild. Recipes live in `data/recipes/`, are published to GitHub Pages, and the app fetches them at runtime and caches them for offline use. Only changes to app code require a new APK.

## Migration from the legacy app

Convert every entry in the legacy `RECIPES` array to `data/recipes/<id>.json`, except `ideas-queue`, which becomes `data/ideas.json` (already written; check it matches).

Rules:
- Keep each legacy `id`.
- Never change an amount, time, temperature, speed or Thermomix setting. If a line cannot be mapped cleanly, keep its wording in `item` or `note` and list it in the migration report.
- `cat` maps to category: asian → Asian, mex → Mexican, med → Mediterranean & Middle Eastern, fish → Fish & Seafood, salad → Salads & Sides, light → Light Meals, sweet → Baking & Sweets, basic → Basics & Blends, draft → Drafts to finish.
- `flag` maps one-to-one to `confidence.level` (tested, sourced, estimated, gated, guidance, draft). Write `confidence.note` from the recipe's own `meta` and `tag` text; do not invent claims.
- `meta` (for example "Serves 4 · ~2 hr 15 min · Cross-checked against Thai and Thermomix sources") splits into `yield`, `time` and `source`.
- `tag` becomes `description`.
- `ing` lines starting `## ` become ingredient group titles. Parse each line into `qty`, `qtyMax`, `unit`, `item`, `prep`, `note`, `optional`. Ranges such as "80–100g" use `qty` and `qtyMax`. Lines with no amount use `qty: null`. Lines marked optional or "to serve" set `optional` or a note.
- In `steps`, replace bracketed amounts that match an ingredient, such as "Cinnamon stick (1)" or "beef (700g)", with tokens: "Cinnamon stick ({{cinnamon}})". Partial amounts become multipliers ("2 tbsp of the 400ml cream" stays as text unless it maps exactly). Leave bracketed text that is not an ingredient amount untouched.
- Extract Thermomix settings written as "5 min / 100°C / Speed 1", "Reverse", "Soft stir", "MC off", "Varoma" into `settings`, keeping the full instruction in `text` as well. Extract air fryer and oven temperatures and times the same way. Steps with several timed parts keep the first as the timer and leave the rest in the text.
- `notes` objects `{b, t}` become `{title, text}`.
- `PAIRS` becomes each recipe's `pairings`.
- Recipes in `NEW_IDS` get `updated` set to the migration date; all others get `version: 1` and the same date.
- Draft recipes may have empty ingredients or steps; the schema allows this only for drafts.

Write `docs/migration-report.md`: the number of legacy entries and the number of files written (they must reconcile), each recipe's id and category, and every line that needed a judgement call or could not be mapped cleanly. Stop for the user's review before building UI.

## Stack

- Vite + React + TypeScript
- Capacitor for the Android wrapper
- Plain CSS with custom properties; no UI component framework
- ajv (draft 2020-12, with ajv-formats) for schema validation
- Vitest for unit tests

Check current versions of Capacitor, the Android Gradle tooling and any GitHub Actions against their official docs. Do not rely on remembered version numbers.

## Repo layout

```
legacy/                 the old app (read-only reference, committed)
data/
  recipe.schema.json    source of truth for recipe shape
  recipes/<id>.json     one recipe per file; filename = id
  ideas.json            recipe ideas not yet written up
  index.json            GENERATED; never edit by hand
  lookups/              GENERATED from legacy: aisles, have-keys (see Features)
scripts/
  validate.mjs          schema + content checks
  build-index.mjs       writes data/index.json
docs/migration-report.md
src/  android/  .github/workflows/
```

## Data pipeline

`npm run validate` must pass before any commit that touches `data/`. It checks:
- every recipe validates against the schema
- filename equals `id` + `.json`; ids unique; ingredient ids unique within a recipe
- every `{{token}}` resolves to an ingredient with a numeric `qty`
- every `recipeRef` and every `pairings` entry points to an existing recipe
- no em dashes (U+2014) in any data file

`npm run build:index` writes `data/index.json`: `schemaVersion`, `generated`, and a `recipes` array of `{ id, title, category, tags, appliances, time, yield, confidenceLevel, version, updated, added, image }` (`added` and `image` only when present).

Recipe photos live in `data/images/<id>.jpg` (about 1200px wide), referenced by the recipe's `image` field with an `imageCredit`. Category tile covers are set in `data/lookups/categories.json`.

GitHub Action on push to `main`: validate, build the index, deploy `data/` to GitHub Pages. If validation fails, the deploy does not run.

## Offline and sync

- Bundle the current `data/` into the app at build time as a first-launch fallback.
- On launch, render cached data immediately, then fetch `index.json` in the background and download only new or changed recipes. Store in IndexedDB.
- Pull to refresh on Home. "Last synced" in Settings. Never block the UI on the network.
- Badge recipes added or changed since the last visit as "New" or "Updated".

## Features (parity with the legacy app)

Before planning, list every feature you find in the legacy file and confirm each is covered below or flag it. Known features:

- **Categories by food type**, never by equipment. This was a deliberate correction by the user; do not reintroduce equipment categories. Filter chips by appliance are fine.
- **Confidence flags** with a legend: Tested, Source-verified, Estimated, Source method gated, Guidance-based, Draft. Tap a flag to see the recipe's confidence note and source.
- **Servings scaler.** Dinner recipes step by whole servings; baking and batch recipes step through ×0.5, ×1, ×1.5, ×2, ×3, ×4 (as in legacy `MULTS`). Scales ingredient amounts and step tokens; never scales times, temperatures or Thermomix settings, and says so on the card. Warn when a Thermomix recipe scaled up may exceed the 2.2L bowl.
- **Tablespoon toggle.** Australian 20ml (default) or international 15ml, with conversion hints under tablespoon lines, as in legacy.
- **"Have" tab.** The user ticks ingredients they have from grouped lists (legacy `HAVE_GROUPS` and `KEYS`); recipes appear as "Ready to cook", "One or two things short" and "Worth a shop". Pantry basics (salt, pepper, oil, sugar, water, everyday dried spices) are assumed present; optional and serving lines don't count. Can add only the missing items to the shopping list. Matching is by presence, not quantity, and the UI says so.
- **Shopping list.** Woolworths/Coles aisle order (legacy `AISLES` rules, first match wins). Identical ingredients from different recipes grouped under one heading with per-recipe amounts, totalled when units are compatible (g/kg, ml/L) and listed separately otherwise. "Recipes on this list" section with a double-tap-to-confirm Remove per recipe (confirmation resets after 4 seconds). Ticked items move to a "Ticked off" section, crossed out, most recently ticked first. Named saved lists. Copy as text. Water of any kind excluded.
- **Meal builder and pairings.** From a recipe, add its pairings to build a meal and push the combined ingredients to the shopping list.
- **Favourites, cook log and user photos.** Photos stay on the device.
- **Timers.** Tap a timed step to start a timer; several can run at once.
- **Recently added** shown at the bottom of Home, not the top. Only recipes with an `added` date (added after the migration) appear; migrated and the original Easy & Healthy recipes never do.
- **Placeholder artwork.** Deterministic per-recipe artwork in the category colour when there is no photo (legacy uses SVG plates).

Move the legacy lookup data (aisle rules, have-keys, pantry basics) into `data/lookups/` as JSON so they can be updated without a rebuild too.

## Rendering rules

**Amount tokens.** `{{ingredientId}}` or `{{ingredientId*0.5}}` render the scaled amount with unit, e.g. "150g", "2 tsp", "1½". Never show raw braces; an unresolved token renders nothing and logs a warning. Unit-test the formatter against every recipe.

**Rounding.** g and ml to nearest 5 (nearest 1 below 20); tsp, tbsp, cup to nearest ¼ as fractions; counted items to nearest ½; never scale `pinch`. No space for g, kg, ml, L ("150g"); a space for others ("2 tsp").

**Nutrition.** When present, show a compact row with its `basis` and the label "From the source, not checked". Not scaled. Easy & Healthy can be sorted by protein.

**Credits.** Always show `source.name` and `source.note`, with `source.url` as a link. Creator recipes stay visibly credited.

**Other.** Ranges use an en dash. Optional ingredients show "(optional)". `qty: null` shows the item only. `recipeRef` links to that recipe. Group titles show as subheadings. `methodLabel` shows above the method.

## UI direction

**Cookidoo is the layout reference.** Follow its layout closely: screen structure, information order, navigation, recipe cards, the recipe page, and how cooking mode presents each step and its Thermomix settings. Study `reference/cookidoo/` before the design plan and say which patterns come from which screenshot. Where a screenshot and the screen list disagree on layout, follow the screenshot and keep the features.

What stays original: name (Kitchen Collection), logo, icons, typefaces, palette and imagery. No Cookidoo or Thermomix names, logos, icons, fonts, photos or green brand colour. The legacy app's per-category colours are part of its identity; propose whether to keep them in the design plan.

Before building UI, write a short design plan (layout patterns from the references, palette of 4–6 hex values plus category colours, typefaces and roles, principles) and show it to the user.

Screens: Home, Recipe (Ingredients, Method, Notes tabs; scaler; Start cooking), Cooking mode (one step per screen, setting chips for time, temperature, speed, reverse and accessory, tap-to-start timers, screen kept awake), Have, Shopping list, Meal, Favourites, Ideas, Settings (last synced, refresh, tablespoon size, theme, app version).

Accessibility: body at least 16px, cooking mode 20px or more, strong contrast, light and dark themes (the legacy app is dark; dark is the default), tap targets at least 48px, reduced motion respected.

`reference/` must be in `.gitignore`.

## Language

Australian English in all UI copy. Metric. No em dashes anywhere. Measured, plain tone, sentence case, no exclamation marks. Buttons say what they do.

## Workflows

### Adding or updating a recipe (no rebuild)

1. Save to `data/recipes/<id>.json`.
2. Run `npm run validate`. Fix failures and report exactly what changed. Never change quantities, times or temperatures to pass validation; ask instead.
3. For a new recipe, set `added` and `updated` to today. For an update, increment `version` and set `updated` to today; leave `added` alone.
4. A photo goes in `data/images/<id>.jpg` (about 1200px wide, under 300KB) with `image` and `imageCredit` set. Only use photos the user supplies or that are free to use (Pexels or Unsplash licence), and credit them.
5. Run `npm run publish:recipes -- "Add recipe: <title>"` (or "Update recipe: <title>"). It validates, rebuilds the index, commits `data/` and pushes. The Pages workflow publishes it; the phone fetches it on pull-to-refresh or next launch.

Repository: https://github.com/tellu2/kitchen-collection (public). Recipes publish to https://tellu2.github.io/kitchen-collection/, which is the app's built-in source (`src/config.ts`).

### Changing the app

1. Make the change, run `npm test` and check it in the browser (`npm run dev`) at phone width. Commit.
2. Run `npm run release` (or `npm run release -- minor` for new features). It tests, bumps the version in `package.json`, commits, tags `vX.Y.Z` and pushes.
3. The release workflow builds and signs the APK and publishes a GitHub Release. The installed app shows "Version X is ready" on Home with a Download button.

`versionName` and `versionCode` come from `package.json` in `android/app/build.gradle`. Changes under `android/` need `npm run android:sync` locally before committing if they depend on web assets.

### Signing

Actions secrets `KC_KEYSTORE_BASE64`, `KC_KEYSTORE_PASSWORD`, `KC_KEY_ALIAS`, `KC_KEY_PASSWORD` sign releases. For a local build, `android/keystore.properties` (gitignored) points at the keystore in `%USERPROFILE%\KitchenCollection-signing\`; then `npm run android:sync` and `gradlew assembleRelease` with JDK 21. Keystore and passwords never go in git. Phone install and update steps: `docs/install-android.md`.

## Working style

The user gives brief directives and expects context to carry over. Plan briefly, ask only when a decision is genuinely ambiguous, then proceed. Distinguish what you verified (ran, tested, checked in docs) from what you assumed.
