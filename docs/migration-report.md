# Migration report

Migration date: 2026-10-25. Source: `legacy/kitchen-collection-artifact.html` (build dated 25 Oct 2026).

## Reconciliation

| | Count |
|---|---|
| Entries in the legacy `RECIPES` array | 34 |
| Converted to `data/recipes/<id>.json` | 33 |
| Converted to `data/ideas.json` (`ideas-queue`) | 1 (file already existed; checked, not changed) |
| **Accounted for** | **34** |
| Easy & Healthy recipes already in `data/recipes/` (not in legacy) | 5 |
| **Recipe files in `data/recipes/` now** | **38** |

Lookups written: `data/lookups/aisles.json`, `data/lookups/have-keys.json`, `data/lookups/pantry-basics.json`.

### Recipes by id and category

| id | Category | Confidence |
|---|---|---|
| massaman | Asian | estimated |
| sesame-noodles | Asian | estimated |
| gochujang-chicken | Asian | estimated |
| san-choy-bow | Asian | guidance |
| pork-gyoza | Asian | estimated |
| mexican-beef | Mexican | estimated |
| shredded-tacos | Mexican | estimated |
| sumac-traybake | Mediterranean & Middle Eastern | estimated |
| souvlaki | Mediterranean & Middle Eastern | estimated |
| greek-beef-bowls | Mediterranean & Middle Eastern | estimated |
| riojana | Mediterranean & Middle Eastern | estimated |
| tortilla-air-fryer | Mediterranean & Middle Eastern | estimated |
| beef-ragu | Mediterranean & Middle Eastern | estimated |
| bolognese | Mediterranean & Middle Eastern | estimated |
| prawn-gnocchi | Mediterranean & Middle Eastern | estimated |
| chorizo-chicken-pasta | Mediterranean & Middle Eastern | gated |
| risotto | Mediterranean & Middle Eastern | estimated |
| cast-iron-salmon | Fish & Seafood | estimated |
| air-fryer-salmon | Fish & Seafood | tested |
| pumpkin-salmon-bowl | Fish & Seafood | tested |
| sesame-cabbage | Salads & Sides | guidance |
| oi-muchim | Salads & Sides | sourced |
| sunomono | Salads & Sides | estimated |
| jacket-potato | Light Meals | estimated |
| zucchini-slice | Light Meals | estimated |
| bliss-balls | Baking & Sweets | estimated |
| banana-bread | Baking & Sweets | gated |
| honey-spice-cake | Baking & Sweets | estimated |
| taco-seasoning | Basics & Blends | sourced |
| sushi-rice | Basics & Blends | guidance |
| ginger-soy-braise | Drafts to finish | draft |
| egg-muffin | Drafts to finish | draft |
| lemon-olive-chicken | Drafts to finish | draft |
| ideas-queue | (became `data/ideas.json`) | |

Already present, not from legacy: baked-feta-chicken-sweet-potato, baked-pesto-chicken-gnocchi, high-protein-orzo-chicken-bake, high-protein-salmon-salad, mediterranean-chicken-poppers (all Easy & Healthy).

## What was checked, and how

Update (Phase 2): `npm run validate` (ajv, draft 2020-12, with formats) now passes for all 38 recipes, `ideas.json` and the lookups. The notes below describe the Phase 1 checks made before Node was installed.

The full ajv schema validation belongs to Phase 2 and needs Node 22 or later. This machine only has Node 6, so ajv has **not** run yet. In the meantime a Python check script, run against data pulled straight from the legacy file, checked the following:

- **Step text is unchanged.** Every step of every legacy recipe was rendered at ×1, with tokens replaced by their amounts, and compared character for character with the legacy step. All 33 recipes match exactly. A deliberate test change (a "(1)" altered to "(2)") was caught, so the check works.
- **Amounts survived.** Every number in every legacy ingredient line appears in the new ingredient data. Ingredient counts match the legacy line counts.
- **Fields carried over unchanged:** category, confidence level, description (legacy `tag`), notes (title and text, in order), pairings (legacy `PAIRS`), ingredient group titles and step counts.
- **Schema structure:**
  - all required keys are present and there are no unknown keys
  - categories, appliances and units are from the allowed lists
  - ids are valid slugs, ingredient ids are unique within each recipe and filenames equal the id
  - ranges are well formed
  - drafts are the only recipes with empty ingredients or steps
- **References:** every `{{token}}` resolves to an ingredient with a numeric `qty`, and every `pairings` and `recipeRef` entry points to an existing recipe.
- **No em dashes** in any file under `data/`.

## Feature map: legacy app against CLAUDE.md

✓ = covered by CLAUDE.md. **Flag** = not covered, or covered differently. These need a decision, or confirmation that I should build them as legacy did.

| Legacy feature | CLAUDE.md |
|---|---|
| Category tiles by food type, with recipe counts and plate art | ✓ Categories by food type |
| Confidence flags on cards and recipe; "How the flags work" legend | ✓ Confidence flags with legend. Tap-to-see-note is new in CLAUDE.md |
| Legend footnote: speeds and times written for a TM5 or TM6; steps of a minute or more get a timer button | **Flag**: not mentioned. I'd keep it in the legend |
| Servings scaler: whole servings for "Serves", ×0.5 to ×4 otherwise; limits 1 to 24 servings; "Back to serves 4" reset; note on what is not scaled; 2.2L bowl warning for Thermomix recipes scaled up | ✓ Servings scaler. **Flag**: the 1 to 24 limit and reset link aren't mentioned; I'd keep both |
| Spoon measure toggle (20ml AU / 15ml) with ml hints under tbsp *and* tsp lines | ✓ Tablespoon toggle (moves to Settings) |
| Search box on Home: title, ingredients and description, from 2 characters | **Flag**: not in CLAUDE.md. I'd keep it |
| Tick off ingredients ("3/12 gathered") and steps on the recipe page; "Clear the ticks" | **Flag**: not in CLAUDE.md. I'd keep both |
| Thermomix settings and temperatures highlighted inline as readouts in the method | **Flag**: CLAUDE.md has setting chips in cooking mode. I'd also keep the inline highlighting on the recipe page |
| Timers: several at once, countdown bar above the nav, Cancel and Dismiss, beep and vibrate when done | ✓ Timers. Phase 4 adds local notifications |
| Save to favourites; Saved tab | ✓ Favourites |
| Mark as cooked (date); "Last cooked" (3 most recent) on Home | ✓ Cook log. **Flag**: the "Last cooked" section on Home isn't mentioned; I'd keep it |
| Add or change a photo per recipe, resized to 900px JPEG, stored on device | ✓ User photos |
| Deterministic plate artwork in the category colour | ✓ Placeholder artwork |
| Recently added at the bottom of Home; new recipes last in each category; dot on new cards | ✓, changed: driven by the new `added` date, new recipes only, Home only (decision 1) |
| Have tab: grouped chips (only keys a non-draft recipe uses), filter box, summary line, "See matches", "Clear ticks", three result groups, "Add missing to list" | ✓ Have tab. **Flag**: the filter box, the summary and the hiding rule aren't mentioned; I'd keep them |
| Have matching rule: skip a recipe with more than 2 missing *and* under 30% matched; sort by fewest missing | **Flag**: not stated in CLAUDE.md. I'd keep the legacy rule |
| Shopping list: aisle order, grouping with totals, Recipes on this list with tap-again Remove (4s), Ticked off section, saved lists, Copy as text, water excluded | ✓ |
| Ticked off order: legacy lists **oldest first** | **Flag, conflict**: CLAUDE.md says most recently ticked first. I'll follow CLAUDE.md |
| Saved lists capped at 12; default name "Shop 25 Oct"; Load replaces the current list; Clear the list | **Flag**: details not in CLAUDE.md; I'd keep them |
| Scaled recipes added to the list carry the scale in their label, e.g. "Massaman (serves 6)"; the same line from the same recipe isn't added twice | **Flag**: not mentioned; I'd keep both |
| "To serve:" sentence lines left off the shopping list | **Flag**: not mentioned; kept through a group rule (see lookups) |
| Meal: "Build a meal from these" adds the recipe and its pairings; Meal tab; send all to the list; Clear the meal | ✓ Meal builder |
| "Goes with" pairings on the recipe page | ✓ |
| Drafts left out of the scaler, Have matching and the shopping list | **Flag**: not stated; I'd keep it |
| Bottom nav: Recipes, Have, Saved, Meal, List | ✓ (screens list adds Ideas and Settings) |
| Masthead line "N recipes · N drafts · updated date" | **Flag**: minor; I'd replace "updated" with the last-synced date |
| Development queue shown as a draft card | ✓ becomes the Ideas screen |
| Prefs synced through the Claude artifact database | **Flag**: not portable. Favourites, cook log, lists and photos don't move across (`SETUP.md` already says so) |
| "Storage unavailable" warning; toasts confirming actions | Not mentioned; implementation detail, I'll keep them |
| Light and dark themes following the system; reduced motion | ✓ (CLAUDE.md makes dark the default) |

New in CLAUDE.md with no legacy equivalent: cooking mode, Ideas screen, Settings, offline sync with "New" and "Updated" badges, nutrition row and protein sort, credits with links, the Easy & Healthy category.

## Decisions (confirmed by you)

1. **Recently added** covers only recipes added after the migration, shown at the bottom of Home. The schema gained an optional `added` date. Migrated recipes and the five Easy & Healthy recipes have none, so the legacy `NEW_IDS` list (tortilla-air-fryer, san-choy-bow, prawn-gnocchi) is not carried over. CLAUDE.md's add-a-recipe workflow and index fields now include `added`.
2. **Easy & Healthy colour** will be proposed in the design plan.
3. **Lid position** ("MC off", "MC on") stays in the step text only. No schema field.

## Judgement calls

### Applied to every recipe

- **Step text** is verbatim apart from tokens; the check confirms this. No step titles were added, so timer labels will read "Massaman Beef Curry, step 5", as in legacy. Titles can be added later.
- **Counted nouns stay outside the token**: "garlic ({{garlic}} cloves)" renders "garlic (3 cloves)". The formatter must therefore render a counted amount as the bare number.
- **Settings.** The first timed setting in a step becomes `settings`, and the full instruction stays in `text`.
  - `timerSeconds` is set only for durations of a minute or more, using the lower end of a range. This is the legacy timer-button rule.
  - Steps that only wait (rest, marinate, drain, chill) get `appliance: "none"` so their legacy timer survives. Pan steps get `stovetop`.
  - "Soft stir" and "Gentle stir" are stored as `speed`.
  - Accessories used: "simmering basket", "simmering basket on the lid", "butterfly whisk".
- **Source.** The third part of `meta` went into `source.name` word for word, even when it describes a method ("Built from technique", "Own recipe"). No URLs exist in legacy and none were added.
- **Confidence note.** Built from the `meta` source phrase plus any confidence wording in `tag`. Notes titled "Confidence" stay in `notes`.
- **Yield ranges.** The lower bound is `qty`, since that is the legacy scaler base, and the range goes in `yield.note` ("Serves 2–3").
- **Time.** `time.label` is the `meta` time word for word. `totalMinutes` is the lower bound, or the sum of prep and cook.
- **Tags** are new. I added protein and dish-type tags for search and filters; they aren't in the legacy data.
- **Appliances** were worked out from the method, main appliance first.
- **Approximate amounts.** "~" and "(approx. …)" became a note ("Approx.", "~500g", "Approx. 150g each"), because the schema has no approx flag.
- **"To serve:" lines.** Lines that began "To serve:" or "To finish:" became ingredient groups with that title (mexican-beef, risotto), so legacy's shopping-list exclusion still applies. Lines ending ", to serve" became a "To serve" note in the main group. Legacy still put those on the shopping list, and they still go on it; the Have tab treats them as optional.
- **Counted amounts at ×1.** ¼ red onion and ½ capsicum must render as written. The "counted items to nearest ½" rounding rule should apply only when scaled, or ¼ would display as ½. This is a Phase 3 formatter rule.
- **Cups** use unit `cup`. The formatter must pluralise ("2 cups").
- **Dates.** Every file has `version: 1` and `updated: 2026-10-25`.

### Per recipe

- **massaman**: carrot "(optional, not traditional)" became `optional` plus note "Not traditional". "2 tbsp of the thick cream" stays as text (a partial amount).
- **sesame-noodles**: "2–3cm ginger" has no schema unit, so it is `qty: null` with note "2–3cm piece". It will not scale, and the step's "(2–3cm)" stays as text. "~150g green beans" became 150g with note "Approx.".
- **pork-gyoza**: "Makes ~30" became yield 30 "gyoza", note "Approx.". The legacy had no noun; "gyoza" is mine. "Small knob of fresh ginger" and the five uncaptured seasonings are `qty: null`.
- **mexican-beef**, **risotto**: "To serve:" and "To finish:" lines became titled groups, as above.
- **sumac-traybake**: partial amounts became multipliers: `{{garlic*0.5}}` (1 clove), `{{salt*0.5}}` (½ tsp) and `{{sumac*0.5}}` (approx. 1 tsp). "1 bunch asparagus" is `qty: 1` with item "bunch asparagus". The preheat temperature "220°C (200°C fan-forced)" is the `temp` string.
- **souvlaki**: "2 cups cos lettuce" became unit `cup`. The flatbread step "30–60 seconds" has settings but no timer (under a minute, as legacy).
- **greek-beef-bowls**: "about half the olive oil (10g)" and "remaining olive oil (10g)" became `{{oil*0.5}}`. The stock stays in grams (600g), as written. Sear "60–90 seconds" gets a 1 min timer, as legacy did.
- **riojana**: "(optional but worth it)" became `optional` plus note "Worth it". The water range 500–600ml is kept, with the stock alternative as a note. "(1 tsp sweet plus a pinch of hot)" stays as text.
- **tortilla-air-fryer**: "75g eschalots (approx. 2) or brown onion (approx. ½)" became 75g "eschalots or brown onion", note "Approx. 2 eschalots or ½ brown onion".
- **beef-ragu**: "half the olive oil (1 tbsp)" ×2 became `{{oil*0.5}}`. Step 9 starts "Shred 5–10 sec", so that is its setting. **Legacy offered a 10 min timer here** for the optional tightening cook; under the first-setting rule that timer is lost. Say if you want it back.
- **bolognese**: "125ml red wine, or 125ml water plus 1 tbsp balsamic" became red wine with the alternative as a note.
- **prawn-gnocchi**: the `meta` third part "Cast iron, one pan" is not a source, so it became `methodLabel` and there is no `source`. Its `meta` and `tag` say nothing about confidence, so the note reads "No confidence note was recorded in the legacy card."
- **chorizo-chicken-pasta**: source "Cookidoo AU" with note "Rated 4.2★". `methodLabel` is "General method (not the official Cookidoo steps)", the schema's own example and in line with the tag. In steps 1 and 4, "(150g)", "(90g)" and "(160g)" are approximate weights of counted items (1 onion, ½ capsicum, 1 carrot), not ingredient amounts, so they stay as text and won't scale.
- **cast-iron-salmon**: "1 tsp olive oil, extra, for searing" is a separate ingredient, `oil-extra`. The cucumber is `optional`.
- **air-fryer-salmon**: the legacy `tag` is empty, so there is no `description`. The confidence note is "Own recipe.".
- **pumpkin-salmon-bowl**: "1 cup Japanese cabbage salad, to serve" was given `recipeRef: sesame-cabbage`. This is my link, based on the pairing.
- **sesame-cabbage**: "Pinch of salt" became 1 pinch. The spring onion or red onion line is `qty: null`, with the red onion option as a note.
- **jacket-potato**: "(sebago, russet or coliban), approx. 300g each" became a note.
- **bliss-balls**: "Makes ~20" became 20 "balls", note "Approx." ("balls" is mine).
- **banana-bread**: same `methodLabel` as chorizo-chicken-pasta. "(approx. 4), riper is better" became a note.
- **honey-spice-cake**: "Zest of 1 orange" became `qty: 1` "orange", prep "zested". Appliances are `oven` only, because the method has no Thermomix settings even though the tag mentions it.
- **taco-seasoning**: the `meta` has no time, so the label is "Not recorded". The yield is 1 batch, note "One batch seasons 500g mince". Appliances are "none" and "thermomix" (the optional milling step).
- **sushi-rice**: "Makes 4–5 rolls" became 4 "rolls", note "Makes 4–5 rolls". Unit `cup` is used for the rice and water.
- **ginger-soy-braise**, **egg-muffin**: the `meta` gives only status, so there is no source. The yield is 1 batch, "Not set", and time is "Not recorded". All ingredients are `qty: null`.
- **lemon-olive-chicken**: the only legacy line was "## Nothing recorded yet". A group needs at least one item, so `ingredientGroups` is empty (the schema allows that for drafts). The source is "A Bite to Eat with Alice", note "Recipe by Anisa Nanduala". Appliance "thermomix" is taken from the tag's stated intent.

### ideas.json

It has the same six ideas, groups and order as the legacy `ideas-queue`. The wording differs:

- the note texts are reworded, e.g. legacy "the easiest crowd-pleaser" versus "The easiest, most crowd-pleasing pick."
- the group "Braises and stews" is "Braises & stews"
- the file adds a description ("One-pot ideas to pair with naan or bread") and "great for mopping up with bread" on the Bourguignon

I left the file unchanged.

### Lookups

- **Patterns are copied verbatim** as JavaScript regex sources, in legacy order (first match wins). The duplicate "Fridge & deli" aisle rule is kept: it can never match, and it's harmless.
- **The app must match against a line text** built as `amount item, prep, note` plus "(optional)". Some legacy rules depend on the leading amount (for example `^\d+\s+cloves\b` for whole cloves), so the line must start with the amount.
- **One rule was added:** `notShoppableGroups` in `aisles.json`, for the "To serve" and "To finish" groups described above.
- **`BASICS` was never used in legacy.** Pantry basics were assumed only because `KEYS` has no key for them. `pantry-basics.json` records the list and pattern so the app can say so in the UI and apply them explicitly.
