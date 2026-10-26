# Exporting recipes for the Kitchen Collection app

Add this file and recipe.schema.json to the Cooking project in Claude so every chat in the project knows the format.

## The fortnightly batch (the usual way)

When I say "Export the app batch" (optionally "since <date>"):

1. Gather everything to change in the app since the last batch:
   - every recipe we finalised in this project
   - every recipe we changed
   - any recipe I want removed
   - any idea to add to or drop from the ideas list

   Use the past chats in this project. If I give a date, include only chats since then.
2. Before the block, list what you found in one line each, for example:
   - "New: Chicken Laksa (chat of 3 Nov)"
   - "Changed: Massaman (less palm sugar)"
   - "Remove: Egg Muffin draft"

   Then list any chat you couldn't read, so I can paste it.
3. Output **one** code block containing one JSON object:

```json
{
  "kitchenCollectionBatch": 1,
  "recipes": [ /* full recipe objects, new or changed, each following the rules below */ ],
  "remove": [ /* ids of recipes to delete */ ],
  "ideas": { "add": [ { "title": "", "group": "", "note": "" } ], "remove": [ /* idea titles */ ] },
  "requests": [ /* plain-English changes I want to the app itself, if I mention any */ ]
}
```

   Leave out any section that has nothing in it.
4. For a changed recipe, output the whole recipe with the same `id`. Version numbers and dates are handled on import, so don't worry about them in a batch.
5. After the block, list anything you were unsure how to map.

I paste that block into Claude Code with "import this batch". It adds the photos, checks everything and publishes.

## A single recipe

When I say "Export as app JSON", "export for the app" or "export":

1. Output the finalised recipe as one JSON object that conforms to recipe.schema.json (schemaVersion 1), in a single code block, with the filename (`<id>.json`) on the line above it. Nothing else in the code block.
2. `id`: lowercase, hyphenated, stable. For a new recipe, set `version` to 1 and both `added` and `updated` to today's date. When updating an existing recipe, keep its id and `added`, increment `version` and set `updated` to today's date.
   Leave out `image` and `imageCredit`; photos are added in Claude Code.
3. `category`: use one of the schema's categories, which are by food type, never by equipment. If none fits, say so rather than inventing one. Add `pairings` only for recipes actually cooked together.
4. `confidence`: carry over the recipe's flag.
   - tested: cooked and confirmed by me
   - sourced: amounts from a named source or a cross-referenced blend
   - estimated: some quantities estimated, or gaps in the source method filled; say which in `note`
   - gated: ingredients sourced, official method subscription-gated; also set `methodLabel` to "General method (not the official Cookidoo steps)"
   - guidance: built live during a cook; amounts approximate
   - draft: incomplete
   Never reproduce subscription-gated method text verbatim.
5. Ingredients: every ingredient gets a short, unique `id`. Numbers as numbers (0.5, not "½"). Ranges use `qty` and `qtyMax`. Counted items omit `unit`. "To serve" and similar items with no amount use `"qty": null`. Use `optional`, `prep` and `note` rather than cramming detail into `item`. Link sub-recipes with `recipeRef`.
6. Steps: repeat quantities inline using tokens, e.g. "Add the sugar ({{sugar}})". Use `{{id*0.5}}` for partial uses such as "half the garlic". Only token ingredients that have a numeric qty.
7. Settings: put Thermomix, oven and air fryer settings in `settings`, not just in the text. Use `time` for display and `timerSeconds` for the timer (lower bound of any range). Thermomix speed as a string ("4"), `reverse: true` where reverse is used, accessories named in `accessory`. Leave out any setting the recipe does not actually state; do not fill gaps with guesses.
8. Nutrition: if the source gives macros, add `nutrition` with `basis` (for example "per serve") and the figures as given. Never calculate or estimate macros yourself.
9. Creator credit: for recipes from social media, set `source.name` to the creator and platform, `source.url` to their profile or post, and put the series, episode and their rating in `source.note`. Credit any original creator they name.
10. Measures: convert US and UK tablespoons (15ml) to teaspoons, since Australian tablespoons are 20ml; note the original in the ingredient `note`. Use Australian names (capsicum, mince, coriander for leaves, ground coriander for seed).
11. Notes: tips, swaps and storage go in `notes`, using `text` for a paragraph or `items` for a list.
12. Language: Australian English, metric, no em dashes, measured tone.
13. After the code block, list anything you were unsure how to map, so I can check it before it goes in the app.
