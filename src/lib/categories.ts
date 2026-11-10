// Category assignment. Each recipe file has one category, which is the
// default. On the phone the user can file a recipe under other categories as
// well, or instead. Those choices live in prefs (so they survive syncs and go
// into backups) and never touch the recipe data itself.
import { CATEGORIES, type Category, type Recipe } from '../types';

/** recipe id -> the categories the user chose for it */
export type CategoryOverrides = Record<string, string[]>;

type HasCategory = Pick<Recipe, 'id' | 'category'>;

const isCategory = (c: string): c is Category => (CATEGORIES as readonly string[]).includes(c);

/**
 * The categories a recipe appears under, in display order. Never empty: a
 * missing, empty or out-of-date choice (for example a category that no longer
 * exists) falls back to the recipe's own category.
 */
export function categoriesFor(r: HasCategory, overrides: CategoryOverrides = {}): Category[] {
  const chosen = overrides[r.id];
  const valid = chosen ? CATEGORIES.filter(c => chosen.includes(c)) : [];
  if (valid.length) return valid;
  return isCategory(r.category) ? [r.category] : ['Drafts to finish'];
}

/** The category that sets the recipe's colour and its Back target: its own, if still chosen. */
export function primaryCategory(r: HasCategory, overrides: CategoryOverrides = {}): Category {
  const cats = categoriesFor(r, overrides);
  return cats.includes(r.category) ? r.category : cats[0];
}

/** True when the user has changed this recipe's categories from the default. */
export function isReassigned(r: HasCategory, overrides: CategoryOverrides = {}): boolean {
  const cats = categoriesFor(r, overrides);
  return !(cats.length === 1 && cats[0] === r.category);
}

/**
 * Returns new overrides with the recipe filed under `next`. An empty choice is
 * refused (the overrides come back unchanged), and choosing just the default
 * category clears the override.
 */
export function withCategories(overrides: CategoryOverrides, r: HasCategory, next: readonly string[]): CategoryOverrides {
  const valid = CATEGORIES.filter(c => next.includes(c));
  if (!valid.length) return overrides;
  const out = { ...overrides };
  if (valid.length === 1 && valid[0] === r.category) delete out[r.id];
  else out[r.id] = valid;
  return out;
}

/** How many recipes appear under each category, counting every assignment. */
export function categoryCounts(recipes: HasCategory[], overrides: CategoryOverrides = {}): Record<Category, number> {
  const counts = Object.fromEntries(CATEGORIES.map(c => [c, 0])) as Record<Category, number>;
  for (const r of recipes) for (const c of categoriesFor(r, overrides)) counts[c]++;
  return counts;
}
