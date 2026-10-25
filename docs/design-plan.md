# Design plan

Status: draft for review, 2026-10-25. Nothing is built yet.

There are no Cookidoo screenshots for this first build, at your request. The layout below builds on the legacy app's own structure and common phone-app conventions. If screenshots arrive later, the layout can be revisited without touching the features.

A visual preview is in `docs/design-preview.html`.

## Principles

1. **Dark first.** Dark is the default theme. A light theme matches it value for value, and the app follows the phone's setting unless overridden in Settings.
2. **Readable at arm's length.** Body text is 17px. Cooking mode starts at 22px, and its settings read like an appliance display.
3. **One hand, wet hands.** Primary actions sit in the bottom third of the screen. Every tap target is at least 48px, and nothing important depends on a long-press or a precise swipe.
4. **Amounts are sacred.** Amounts are always shown in full and never truncated. Scaled amounts are marked as scaled, and what is *not* scaled (times, temperatures, settings) is stated.
5. **Honest labels.** Confidence flags are visible on every card and on the recipe page. Credits are always shown. Nutrition is labelled "From the source, not checked".
6. **Category colour carries identity.** The interface itself stays neutral. Each recipe page takes on its category colour, as legacy does.
7. **Calm motion.** Short fades and slides only, with all motion off when the phone asks for reduced motion.
8. **Offline is normal.** The app never shows a spinner where cached content exists. Sync happens quietly, and its status sits in Settings and in a small line on Home.

## Navigation

A bottom bar with five tabs, as in legacy: **Recipes, Have, Saved, Meal, List**. Each has an icon and a label. The List tab shows a count badge of unticked items.

- **Settings** opens from a gear icon in the Home header.
- **Ideas** opens from a row under the categories on Home ("Ideas to write up · 6").
- **Cooking mode** is full screen and hides the bottom bar.
- **Running timers** float as a tray above the bottom bar on every screen, as in legacy.

## Screens

**Home (Recipes tab)**
1. Header: the Kitchen Collection wordmark, a sync line ("38 recipes · synced 25 Oct") and the Settings gear.
2. Search: title, ingredients and description, as legacy.
3. Appliance filter chips: Thermomix, Air fryer, Oven, Stovetop. These filter only; categories stay by food type.
4. "What can I make with what I have?" button, linking to the Have tab.
5. Categories: a two-column grid of tiles, each with its category colour bar, plate glyph, name and count.
6. Last cooked: horizontal cards, the three most recent.
7. Ideas row, then the "How the flags work" legend, collapsed.
8. Recently added, at the bottom: recipes with an `added` date, newest first. It is hidden when empty.

Pull down anywhere to refresh.

**Category**
- A back link, the title in the category colour and a count.
- A list of cards: thumbnail on the left; title, time and yield, and the flag on the right; a "New" or "Updated" badge when relevant.
- Sort options: A to Z (default) and quickest first. Easy & Healthy adds "Most protein".

**Recipe**
1. Hero: a photo, or the plate artwork, with an "Add photo" button.
2. Title, then a meta row of time, yield and appliance icons.
3. Flag chip. Tapping it opens a bottom sheet with the confidence note and the credit.
4. Description, credit line and the nutrition row if present.
5. Action row: Save, Add to list, Mark as cooked.
6. Servings stepper, with the scale note when scaled.
7. A sticky tab bar: **Ingredients | Method | Notes**.
   - **Ingredients**: groups, tickable lines, spoon conversion hints, recipe links, then "Goes with" with "Build a meal from these".
   - **Method**: the method label, then numbered steps. Inline settings appear as readout chips, and a timer button sits under any step of a minute or more.
   - **Notes**: the note cards.
8. A bar fixed at the bottom with **Start cooking** in the category colour.

**Cooking mode**
- Top: exit (×), the recipe name, "Step 3 of 8" and a progress bar.
- Middle: the step text at 22px+, with the ingredients this step uses listed above it in their scaled amounts.
- Settings chips at 24px+, each with an icon and a value: time, temperature, speed, reverse and accessory. Tapping the time chip starts its timer.
- Bottom: large Previous and Next buttons (Next becomes Finish on the last step); swiping also works.
- The screen stays awake. Timers keep running across steps and screens.

**Have**
- An intro line saying matching is by presence, not quantity.
- A filter box, then grouped chips.
- A sticky summary bar at the bottom: "9 ticked · 3 ready", with See matches and Clear.
- Results: Ready to cook / One or two things short / Worth a shop. Each card has "Add missing to list".

**List**
- Aisle sections in store order. A grouped item shows its per-recipe amounts and a total.
- A Ticked off section, newest first.
- Recipes on this list, with tap-again Remove.
- Actions: Copy as text, Save this list, Clear the list.
- Saved lists (up to 12), each with Load.

**Meal**: dish cards, Send ingredients to the list, Clear the meal.

**Saved**: favourite cards.

**Ideas**: grouped idea rows with their notes.

**Settings**:
- Theme (System, Dark, Light)
- Tablespoon size (Australian 20ml or International 15ml)
- Last synced, and Refresh recipes now
- Recipe source address (empty until GitHub is set up)
- App version

## Palette

Six core values per theme. Dark is the default.

| Role | Dark | Light | Use |
|---|---|---|---|
| Background | `#14161A` | `#ECEFF2` | Page |
| Surface | `#1B1E24` | `#FFFFFF` | Cards, sheets (raised: `#22262E` dark) |
| Line | `#2E343D` | `#D3D9E0` | Borders, dividers |
| Text | `#E9EBEE` | `#14181D` | Body and titles |
| Muted | `#98A1AC` | `#5B6470` | Meta, hints |
| Accent | `#F2E3C6` (cream) | `#14181D` (ink) | App-wide primary buttons and focus outside a recipe |

The legacy dark base is kept as it was. The accent is a neutral cream rather than a hue, so it never competes with a category colour, and it is well clear of any Thermomix-style green.

### Category colours

I propose keeping the legacy category colours, nudged where needed so text in the colour passes WCAG AA (4.5:1) on every surface it sits on. All values were measured.

| Category | Dark | Light | Change from legacy |
|---|---|---|---|
| Asian | `#D27B64` | `#A84C37` | slightly lighter (dark) and deeper (light) |
| Mexican | `#D99136` | `#9A5C0F` | light deepened |
| Mediterranean & Middle Eastern | `#DC6B4F` | `#A8402A` | dark lightened (legacy was 3.7:1) |
| Fish & Seafood | `#62A0D6` | `#2B6CA6` | light deepened slightly |
| Salads & Sides | `#86B25B` | `#4E7428` | light deepened slightly |
| Light Meals | `#A38AC9` | `#7354A3` | dark lightened slightly |
| **Easy & Healthy** | `#D98BA6` | `#A8466A` | **new**: a dusty rose, distinct from every other category |
| Baking & Sweets | `#E5A845` | `#8F620D` | light deepened |
| Basics & Blends | `#7FB3A8` | `#37766A` | light deepened slightly |
| Drafts to finish | `#8A929C` | `#646D78` | unchanged |

Text on a filled button in the category colour is `#12141A` in dark and `#FFFFFF` in light. Every pairing measures 4.5:1 or better.

Confidence flag colours carry over from legacy. They always show their word label, never colour alone.

## Typefaces

All are open-licence fonts bundled in the app (no network fetch):

| Face | Role |
|---|---|
| **Fraunces** (variable serif) | Wordmark, recipe titles, category names, screen titles. It carries the warmth of the legacy serif. |
| **Atkinson Hyperlegible Next** | Body, ingredients, steps, buttons. Designed for legibility, with very distinct 1/l/I and 0/O, which matters for amounts. |
| **Atkinson Hyperlegible Mono** | Settings readouts (5 min · 100°C · Speed 1), timers and amounts in the list totals. It has tabular figures, so countdowns don't jitter. |

Sizes:

| Use | Size |
|---|---|
| Body | 17px |
| Secondary meta | 14px (never for amounts or instructions) |
| Recipe title | 28–34px |
| Cooking step | 22–26px |
| Cooking settings chips | 24px |

## Icons, logo and imagery

- **Icons:** Lucide (open licence), drawn as line icons at 24px. Appliances get their own small set: a bowl-with-blade for the Thermomix, a basket for the air fryer, an oven door and a pan. All are generic, with no brand marks.
- **Logo:** a simple plate-and-fork mark in cream, plus the "Kitchen Collection" wordmark in Fraunces. The app icon is the mark on the dark background.
- **Imagery:** your own photos, where added. Otherwise the legacy deterministic plate artwork in the category colour, slightly refined (softer shapes, no hard rectangles), so each recipe always looks the same.

## Decisions for you

1. Keep the legacy category colours, with the small contrast nudges above? (Recommended.)
2. Dusty rose `#D98BA6` for Easy & Healthy.
3. Cream accent and the three typefaces.
4. Ideas reached from Home rather than its own tab, and Settings from the gear.
5. Atkinson Hyperlegible draws its zero with a slash (0 versus O). At a glance, "700g" in bold can look a little crossed out, and ticked shopping items are crossed out. I think the full-line strike on ticked items keeps them distinct, but have a look at the preview. The alternative is a different body face, such as Source Sans 3, which has a plain zero.
