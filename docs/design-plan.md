# Design plan

Status: revision 3 for review, 2026-10-25. Nothing is built yet.

Revision 3 changes (your feedback):
- **Real photos instead of illustrations.** These are free Pexels stock photos, picked by you in `docs/photo-review.html`, then your own photos as you take them.
- **Home shows every category**, as two-column photo tiles, then **all recipes A to Z** in rows with letter headings. Tonight's pick stays at the top.
- **Add to list** stays on the recipe page, beside Start cooking, as do Meal's and Have's list buttons.

`docs/design-preview.html` still shows the revision 2 drawings and the old Home. The colours, type, recipe page and cooking mode in it are unchanged.

## Direction

Light, airy and image-led, following the reference shots you supplied: a warm off-white page, white cards with soft rounded corners, food imagery leading every card, a featured recipe at the top of Home, round category icons, and one clear primary button per screen.

Confirmed choices:
- **Real photos**: free stock photos first, then your own (revision 3)
- **Light default**, with dark available
- **Terracotta accent**
- **Home: featured card, then category icons, then a photo grid**

What stays original: the name and logo, the icons, the typefaces, the palette and the illustrations. There is no Cookidoo or Thermomix green, and none of their marks, fonts or photos.

The preview is `docs/design-preview.html`.

### Patterns taken from the references

| Pattern | From |
|---|---|
| Two-column photo cards, white with 16px radius; image on top; a small overlay chip top-left and a heart top-right; time above the title | Reference 1 (search results and dessert grid) |
| Featured card with a large image and the title, tags and primary button in one row underneath | Reference 1 (risotto card) |
| Round, softly tinted category icons in a row, the selected one highlighted and filtering the grid below | Reference 1 (Categories) |
| Search bar at the top of Home, then category tiles with images | Reference 2 (Explore) |
| Recipe page: full-bleed hero photo with a back button over it, an appliance label chip, a large title, then a strong primary button beside a lighter secondary one | Reference 3 (salmon recipe) |
| Bottom navigation with icons and short labels, active tab in the accent | References 1 and 2 |

## Principles

1. **Food first.** Every recipe shows a photo: yours, or a stock photo of a similar dish. Text sits on calm white cards.
2. **Light and warm by default.** Dark is a full theme, chosen in Settings or by following the phone.
3. **Readable at arm's length.** Body text is 17px, and cooking mode starts at 22px.
4. **One hand, wet hands.** Primary actions sit in the bottom third, and every tap target is at least 48px.
5. **Amounts are sacred.** Amounts are always shown in full and marked when scaled. What isn't scaled is stated.
6. **Honest labels.** The confidence flag shows on every card and recipe, credits always appear, and nutrition is labelled "From the source, not checked".
7. **Calm motion.** Gentle fades and lifts only, with all motion off when the phone asks for reduced motion.
8. **Offline is normal.** No spinners over cached content, and sync happens quietly.

## Navigation

A bottom bar with five tabs: **Recipes, Have, Saved, Meal, List**. The active tab shows in terracotta, and List shows a count badge.

- **Settings:** the gear on Home.
- **Ideas:** a row on Home.
- **Cooking mode:** full screen.
- **Timers:** a floating tray above the bottom bar.

## Screens

**Home**
1. Greeting line ("Good evening") above the wordmark, plus the Settings gear.
2. Search bar with a magnifier icon.
3. **Featured card:**
   - a large image with the title underneath
   - "Asian · 2 hr 15 min · Serves 4"
   - a terracotta **Start cooking** button
   - a different non-draft recipe each day, chosen deterministically from the date
4. **Categories:** all 10 shown at once, as two-column photo tiles. Each tile has a photo with a soft dark gradient at the bottom, the category name in white Fraunces, the recipe count and a thin category-colour bar. Tapping a tile opens the category page.
5. **All recipes, A to Z:** compact rows grouped under letter headings (A, B, C…). Each row has a 64px rounded photo, the title, the time and yield, and the confidence flag, plus New or Updated where relevant. Drafts are listed too, marked Draft.
6. **Last cooked** (horizontal row of small cards), the **Ideas** row and the flag legend.
7. **Recently added** at the bottom, only when there are recipes with an `added` date.

Pull down to refresh.

**Category page**: a large title with a tinted header band in the category colour, sort options (A to Z, quickest, and most protein for Easy & Healthy), and the same two-column grid.

**Recipe**
1. A full-bleed hero image, about 45% of the screen, with round white buttons over it for back, heart and photo.
2. A white content sheet with rounded top corners, overlapping the hero by 24px. On it:
   - a category chip, then the appliance chips
   - the title
   - an icon row of time, yield and difficulty-free meta
   - the flag chip (tap for the confidence note and credit)
   - the description and credit, then nutrition if present
3. Buttons: **Start cooking** (terracotta, filled) and **Add to list** (light, outlined), side by side; Save and Mark as cooked as icons.
4. The servings stepper and scale note.
5. A sticky tab bar: **Ingredients | Method | Notes**.
   - **Ingredients**: grouped rows, tickable, with spoon hints and recipe links, then "Goes with" as small cards and "Build a meal".
   - **Method**: numbered steps with inline setting chips and timer buttons.
   - **Notes**: the note cards.

**Cooking mode** (light, or dark if chosen)
1. A slim top bar: close, the recipe name, and "Step 5 of 8" with a terracotta progress bar.
2. "You'll need" chips with the scaled amounts for this step.
3. The step text at 22–24px.
4. Settings as large rounded tiles with icons: time (tap to start the timer), temperature, speed, reverse and accessory.
5. Large Previous and Next buttons at the bottom, plus swipe. The screen stays awake.

**Have**: the presence-not-quantity note, then a filter box, then grouped chips (filled terracotta when ticked). A sticky summary bar at the bottom, and results as cards in the three groups, each with "Add missing to list".

**List**: aisle sections on white cards; a grouped item shows per-recipe amounts and a total. Then:
- Ticked off (newest first, crossed out)
- Recipes on this list with tap-again Remove
- Copy, Save and Clear
- Saved lists

**Meal, Saved, Ideas** use the same card grid and rows.

**Settings** holds:
- Theme: Light (default), Dark or System
- Tablespoon size: 20ml or 15ml
- Last synced, and Refresh
- Recipe source address
- Version

## Palette

### Light (default)

| Role | Hex | Use |
|---|---|---|
| Page | `#F7F4EF` | warm off-white background |
| Surface | `#FFFFFF` | cards, sheets, nav |
| Sunk | `#EFE9E0` | inputs, inactive chips, image wells |
| Line | `#E6DFD5` | hairlines |
| Text | `#211D18` | titles, body (15.3:1 on page) |
| Muted | `#6B6359` | meta (5.4:1) |
| Accent (terracotta) | `#B9482F` | primary buttons (white label 5.2:1), active tab, links (4.7:1 on page) |

### Dark

| Role | Hex |
|---|---|
| Page | `#171512` |
| Surface | `#211E1A` |
| Sunk | `#2A2621` |
| Line | `#3A352F` |
| Text | `#F2EDE6` |
| Muted | `#AAA196` |
| Accent | `#E2775C` (dark label 6.1:1) |

Both themes are warm-tinted rather than grey, so they sit well with food imagery.

### Category colours

The category colours are kept from revision 1 (legacy hues, adjusted for contrast; Easy & Healthy is dusty rose). They are now used for icon circles, image tints, card chips and the category header band, rather than as the main button colour. As text they measure 4.8:1 or better on the light page and 4.9:1 or better on dark surfaces.

| Category | Light | Dark |
|---|---|---|
| Asian | `#A84C37` | `#D27B64` |
| Mexican | `#9A5C0F` | `#D99136` |
| Mediterranean & Middle Eastern | `#A8402A` | `#DC6B4F` |
| Fish & Seafood | `#2B6CA6` | `#62A0D6` |
| Salads & Sides | `#4E7428` | `#86B25B` |
| Light Meals | `#7354A3` | `#A38AC9` |
| Easy & Healthy | `#A8466A` | `#D98BA6` |
| Baking & Sweets | `#8F620D` | `#E5A845` |
| Basics & Blends | `#37766A` | `#7FB3A8` |
| Drafts to finish | `#646D78` | `#8A929C` |

## Typefaces

All are open-licence and bundled in the app:

| Face | Role |
|---|---|
| **Fraunces** (variable serif, soft) | Wordmark, recipe and screen titles, featured title. It plays the part of the serif headings in reference 1. |
| **Atkinson Hyperlegible Next** | Body, ingredients, steps, buttons, labels. |
| **Atkinson Hyperlegible Mono** | Timers and settings readouts only (tabular figures). |

Sizes:

| Use | Size |
|---|---|
| Body | 17px |
| Card title | 16px Fraunces |
| Meta | 14px |
| Recipe title | 30px |
| Cooking step | 22–24px |

## Shape, depth and motion

- **Radii:** cards 16px, images inside cards 12px, buttons 14px, chips fully rounded, sheet tops 24px.
- **Shadows:** soft only: `0 1px 2px rgba(33,29,24,.06), 0 6px 20px rgba(33,29,24,.06)`. In dark, a 1px line replaces the shadow.
- **Spacing:** 16px page gutters, 12px between grid cards, generous section headings (20px Fraunces with a "See all" link).
- **Motion:** cards lift 2px on press, sheets slide up 200ms, and the tab underline glides. All motion is off under reduced motion.

## Photos

**Stock photos.** One free Pexels photo per recipe, chosen by you in `docs/photo-review.html`.
- The Pexels licence allows use in a personal app, with no attribution required. The app credits the photographer anyway.
- Each photo is saved in `data/images/<id>.jpg`, resized to 1200px wide and compressed (about 120–200KB each, roughly 6MB for all of them).
- Like the recipes, the photos are bundled into the app for offline use and will sync from GitHub Pages later, so adding a photo never needs a rebuild once GitHub is connected.
- The recipe's `image` field points to the file. A new optional `imageCredit` field (`{ name, url, source }`) holds the credit. This is a small schema addition.

**Labelling.** On the recipe page a small caption reads "Stock photo of a similar dish · Photographer / Pexels". Cards show no caption.

**Your photos.** "Add photo" on the recipe page stores your own photo on the phone and replaces the stock photo for you. It never leaves the phone. Removing your photo brings the stock photo back.

**No photo.** For drafts, or a recipe you leave without one, the image area shows a soft tile in the category colour with the category icon. There are no illustrations.

**Category tiles** reuse one recipe photo each (for example Asian uses the Massaman photo), except Drafts, which gets its own.

## Icons and logo

- **Icons:** Lucide (open licence), 24px with a 1.75px stroke.
- **Category icons** use the closest Lucide glyph:

| Category | Icon |
|---|---|
| Asian | soup bowl |
| Mexican | flame |
| Mediterranean & Middle Eastern | olive branch / leaf |
| Fish & Seafood | fish |
| Salads & Sides | salad |
| Light Meals | egg |
| Easy & Healthy | apple |
| Baking & Sweets | cake slice |
| Basics & Blends | jar / package |
| Drafts | pencil |

- **Appliances** are generic glyphs, with no brand marks.
- **Logo:** a terracotta plate-and-leaf mark with the "Kitchen Collection" wordmark in Fraunces. The app icon is the mark on cream.
