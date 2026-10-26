# Exporting recipes for the Kitchen Collection app

Add this file and recipe.schema.json to the Cooking project in Claude so every chat in the project knows the format.

## How app updates work

Every couple of weeks I ask this project for one **batch file** and give it to Claude Code, which updates the app through GitHub. My phone then picks the changes up. Two commands make that work.

### 1. "Finalise" (in each recipe chat, when the recipe is done)

When I say "Finalise" (or "finalise for the app"):

1. Write this marker line, exactly, so the batch chat can find it later:

   `KC-FINAL: <id> | <title> | new` (or `| changed` if the recipe is already in the app)
2. Under it, output the recipe as app JSON in one code block, following "Recipe rules" below.

Other markers to use in any chat when I ask for them:
- "Remove X from the app" → `KC-REMOVE: <id> | <title>`
- "Add an idea" → `KC-IDEA: <title> | <group> | <short note>`
- "Drop the idea X" → `KC-IDEA-DROP: <title>`
- "App change: …" → `KC-REQUEST: <plain-English change to the app>`

If I finalise the same recipe twice, the later one wins.

### 2. "Build the app batch" (in a new chat, every couple of weeks)

When I say "Build the app batch" (optionally "since <date>"):

1. Search this project's past chats using your past-chat tools (conversation search and recent chats). Search for `KC-FINAL`, `KC-REMOVE`, `KC-IDEA`, `KC-IDEA-DROP` and `KC-REQUEST`. Also list the recent chats since the date, and search for recipe names you see there. Read the latest marker and JSON in each matching chat.
2. If you can read a chat but can't get the whole JSON, rebuild the recipe JSON from the final recipe in that chat, following the recipe rules. Never invent amounts, times or settings that aren't in the chat. Say which recipes you rebuilt.
3. Never refuse because something is missing. Build the batch from what you found, and list anything you couldn't read so I can paste it in and you can rebuild the file.
4. Before the file, list what's in it, one line each:
   - "New: Chicken Laksa (3 Nov)"
   - "Changed: Massaman"
   - "Remove: egg-muffin"
   - "Idea: Shakshuka"
   - "Request: louder timer"
5. **Create the batch as a file**, the same way you'd create an artifact or a downloadable file. Name it `kitchen-collection-batch-YYYY-MM-DD.json` (today's date). It contains one JSON object and nothing else:

```json
{
  "kitchenCollectionBatch": 1,
  "recipes": [ /* full recipe objects, new or changed, each following the recipe rules */ ],
  "remove": [ /* ids of recipes to delete */ ],
  "ideas": { "add": [ { "title": "", "group": "", "note": "" } ], "remove": [ /* idea titles */ ] },
  "requests": [ /* plain-English changes to the app itself */ ]
}
```

   Leave out any section that has nothing in it. For a changed recipe, include the whole recipe with the same `id`. Version numbers and dates are set on import.
6. After the file, list anything you were unsure how to map.

I give that file to Claude Code with "import this batch", attaching the file or pasting its contents. Claude Code adds photos, checks everything, publishes the recipes to GitHub and releases any app changes.

## Recipe rules

These apply to every recipe JSON, whether from "Finalise", the batch, or "Export as app JSON" (a single recipe on its own, with the filename `<id>.json` on the line above the code block).

1. Output the recipe as one JSON object that conforms to recipe.schema.json (schemaVersion 1), in a single code block, with the filename (`<id>.json`) on the line above it. Nothing else in the code block.
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
