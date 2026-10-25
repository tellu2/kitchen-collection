// "What can I make" matcher, ported from legacy. Each ingredient maps to
// one have-key (first match wins). Pantry basics have no key, so they are
// assumed. Optional and serving lines never count against a recipe.
// Matching is by presence, not quantity.
import type { Ingredient, Recipe } from '../types';
import { type CompiledLookups, haveKeyFor, isServingGroup, lineText } from './lookups';

export interface KeyedLine {
  ingredient: Ingredient;
  key: string;
  optional: boolean;
}

export interface RecipeKeys {
  required: string[];
  lines: KeyedLine[];
}

export function recipeKeys(r: Recipe, lk: CompiledLookups): RecipeKeys {
  const lines: KeyedLine[] = [];
  const required: string[] = [];
  for (const group of r.ingredientGroups) {
    const serving = isServingGroup(group.title, lk);
    for (const ing of group.items) {
      const text = lineText(ing);
      const key = haveKeyFor(text, lk);
      if (!key) continue;
      const optional = !!ing.optional || serving || lk.optionalLine.test(text);
      lines.push({ ingredient: ing, key, optional });
      if (!optional && !required.includes(key)) required.push(key);
    }
  }
  return { required, lines };
}

/** Keys that at least one non-draft recipe needs, sorted A to Z. */
export function chipKeys(recipes: Recipe[], lk: CompiledLookups) {
  const used = new Set<string>();
  for (const r of recipes) {
    if (r.confidence.level === 'draft') continue;
    for (const k of recipeKeys(r, lk).required) used.add(k);
  }
  return lk.haveKeys
    .filter(k => used.has(k.label))
    .sort((a, b) => a.label.localeCompare(b.label, 'en-AU'));
}

export interface Match {
  recipe: Recipe;
  required: string[];
  matched: string[];
  missing: string[];
}

export function matchRecipes(recipes: Recipe[], have: Set<string>, lk: CompiledLookups): Match[] {
  if (!have.size) return [];
  const out: Match[] = [];
  for (const recipe of recipes) {
    if (recipe.confidence.level === 'draft') continue;
    const { required } = recipeKeys(recipe, lk);
    if (!required.length) continue;
    const matched = required.filter(k => have.has(k));
    if (!matched.length) continue;
    const missing = required.filter(k => !have.has(k));
    // Legacy threshold: skip recipes that are far off
    if (missing.length > 2 && matched.length / required.length < 0.3) continue;
    out.push({ recipe, required, matched, missing });
  }
  return out.sort(
    (a, b) =>
      a.missing.length - b.missing.length ||
      b.matched.length - a.matched.length ||
      a.recipe.title.localeCompare(b.recipe.title, 'en-AU')
  );
}

export type MatchBand = 'ready' | 'close' | 'shop';

export function band(m: Match): MatchBand {
  if (!m.missing.length) return 'ready';
  return m.missing.length <= 2 ? 'close' : 'shop';
}

/** Ingredients behind the missing keys, for "Add missing to list". */
export function missingIngredients(r: Recipe, have: Set<string>, lk: CompiledLookups): Ingredient[] {
  return recipeKeys(r, lk)
    .lines.filter(l => !l.optional && !have.has(l.key))
    .map(l => l.ingredient);
}
