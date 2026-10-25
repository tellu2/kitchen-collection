// Test helpers: every recipe from data/, the lookups, and the legacy app's
// own data and rules (pulled straight from legacy/kitchen-collection-artifact.html).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { LookupFiles, Recipe } from '../types';
import { compileLookups } from '../lib/lookups';

const root = join(__dirname, '..', '..');
const read = (p: string) => JSON.parse(readFileSync(join(root, p), 'utf8'));

export const allRecipes: Recipe[] = readdirSync(join(root, 'data', 'recipes'))
  .filter(f => f.endsWith('.json'))
  .map(f => read(`data/recipes/${f}`));

export const lookupFiles: LookupFiles = {
  aisles: read('data/lookups/aisles.json'),
  haveKeys: read('data/lookups/have-keys.json'),
  pantryBasics: read('data/lookups/pantry-basics.json'),
  categories: read('data/lookups/categories.json')
};
export const lookups = compileLookups(lookupFiles);

export const byId = (id: string) => {
  const r = allRecipes.find(x => x.id === id);
  if (!r) throw new Error(`No recipe ${id}`);
  return r;
};

interface LegacyRecipe { id: string; cat: string; ing: string[]; steps: string[] }
export interface Legacy {
  recipes: LegacyRecipe[];
  keys: { label: string; group: string; re: RegExp }[];
  isOptionalLine: (l: string) => boolean;
}

export function loadLegacy(): Legacy {
  const html = readFileSync(join(root, 'legacy', 'kitchen-collection-artifact.html'), 'utf8');
  const slice = (from: string, to: string) => html.slice(html.indexOf(from), html.indexOf(to));
  const recipesSrc = slice('const RECIPES = [', '/* Pairings drawn');
  const keysSrc = slice('const KEYS = [', 'const BASICS');
  const optSrc = slice('const isOptionalLine', 'const RINFO');
  // The legacy file is a committed, read-only reference in this repo
  const fn = new Function(`${recipesSrc}\n${keysSrc}\n${optSrc}\nreturn { recipes: RECIPES, keys: KEYS, isOptionalLine };`);
  return fn() as Legacy;
}
