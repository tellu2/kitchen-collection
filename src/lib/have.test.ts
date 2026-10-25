import { describe, expect, it } from 'vitest';
import { band, chipKeys, matchRecipes, missingIngredients, recipeKeys } from './have';
import { allRecipes, byId, loadLegacy, lookups } from '../test/fixtures';

const legacy = loadLegacy();

/**
 * Known, deliberate differences from legacy. The legacy line "Sesame seeds,
 * sliced spring onion, chilli flakes to finish" missed its own optional test
 * (no comma before "to finish"), so legacy counted the garnish spring onion
 * as required. Migrated, it carries the note "To finish" and is optional.
 */
const LEGACY_EXCEPTIONS: Record<string, { notRequiredNow: string[] }> = {
  'sesame-noodles': { notRequiredNow: ['Spring onion'] }
};

/** The legacy app's required keys for a recipe, computed its own way. */
function legacyRequired(id: string): string[] {
  const r = legacy.recipes.find(x => x.id === id)!;
  const req: string[] = [];
  for (const line of r.ing) {
    if (line.startsWith('## ')) continue;
    const key = legacy.keys.find(k => k.re.test(line))?.label;
    if (!key || legacy.isOptionalLine(line)) continue;
    if (!req.includes(key)) req.push(key);
  }
  return req.sort();
}

describe('Have matcher against every recipe', () => {
  for (const r of allRecipes) {
    const inLegacy = legacy.recipes.some(x => x.id === r.id);
    it(`${r.id}: required ingredients ${inLegacy ? 'match the legacy app' : 'are found'}`, () => {
      const req = recipeKeys(r, lookups).required.slice().sort();
      const skip = LEGACY_EXCEPTIONS[r.id]?.notRequiredNow ?? [];
      if (inLegacy) expect(req).toEqual(legacyRequired(r.id).filter(k => !skip.includes(k)));
      else if (r.confidence.level !== 'draft') expect(req.length).toBeGreaterThan(0);
    });
  }

  it('assumes pantry basics: no salt, pepper, oil, sugar or water keys exist', () => {
    const labels = lookups.haveKeys.map(k => k.label.toLowerCase());
    for (const basic of ['salt', 'pepper', 'oil', 'sugar', 'water']) expect(labels).not.toContain(basic);
  });

  it('ignores optional and serving lines', () => {
    const keys = recipeKeys(byId('mexican-beef'), lookups);
    expect(keys.lines.find(l => /Mexican rice/.test(l.ingredient.item))?.optional ?? true).toBe(true);
    expect(keys.required).not.toContain('Rice');
  });

  it('offers chips only for keys a non-draft recipe needs', () => {
    const chips = chipKeys(allRecipes, lookups).map(k => k.label);
    expect(chips).toContain('Chicken breast');
    expect([...chips].sort((a, b) => a.localeCompare(b, 'en-AU'))).toEqual(chips);
  });

  it('bands matches as ready, close or worth a shop, fewest missing first', () => {
    const r = byId('gochujang-chicken');
    const have = new Set(recipeKeys(r, lookups).required);
    const matches = matchRecipes(allRecipes, have, lookups);
    expect(matches[0].recipe.id).toBe('gochujang-chicken');
    expect(band(matches[0])).toBe('ready');
    for (let i = 1; i < matches.length; i++) expect(matches[i].missing.length).toBeGreaterThanOrEqual(matches[i - 1].missing.length);
  });

  it('applies the legacy cut-off for recipes that are far off', () => {
    const matches = matchRecipes(allRecipes, new Set(['Garlic']), lookups);
    for (const m of matches) expect(!(m.missing.length > 2 && m.matched.length / m.required.length < 0.3)).toBe(true);
  });

  it('adds only the missing, non-optional ingredients', () => {
    const r = byId('gochujang-chicken');
    const missing = missingIngredients(r, new Set(['Chicken breast', 'Garlic']), lookups);
    expect(missing.some(i => i.id === 'chicken')).toBe(false);
    expect(missing.some(i => i.id === 'gochujang')).toBe(true);
    expect(missing.some(i => i.id === 'sesame-seeds')).toBe(false); // to serve
  });
});
