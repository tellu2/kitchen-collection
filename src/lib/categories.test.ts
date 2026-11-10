import { describe, expect, it } from 'vitest';
import { CATEGORIES } from '../types';
import { categoriesFor, categoryCounts, isReassigned, primaryCategory, withCategories } from './categories';
import { allRecipes } from '../test/fixtures';

const salmon = { id: 'salmon-pasta', category: 'Easy & Healthy' as const };

describe('category assignment', () => {
  it('defaults to the recipe file’s own category', () => {
    expect(categoriesFor(salmon)).toEqual(['Easy & Healthy']);
    expect(isReassigned(salmon)).toBe(false);
  });

  it('files a recipe under several categories, in display order', () => {
    const o = withCategories({}, salmon, ['Easy & Healthy', 'Fish & Seafood']);
    expect(categoriesFor(salmon, o)).toEqual(['Fish & Seafood', 'Easy & Healthy']);
    expect(primaryCategory(salmon, o)).toBe('Easy & Healthy');
    expect(isReassigned(salmon, o)).toBe(true);
  });

  it('moves a recipe to another category entirely', () => {
    const o = withCategories({}, salmon, ['Fish & Seafood']);
    expect(categoriesFor(salmon, o)).toEqual(['Fish & Seafood']);
    expect(primaryCategory(salmon, o)).toBe('Fish & Seafood');
  });

  it('refuses to leave a recipe with no category', () => {
    const o = withCategories({}, salmon, ['Fish & Seafood']);
    expect(withCategories(o, salmon, [])).toBe(o);
    expect(categoriesFor(salmon, { [salmon.id]: [] })).toEqual(['Easy & Healthy']);
  });

  it('ignores categories that no longer exist', () => {
    expect(categoriesFor(salmon, { [salmon.id]: ['Soups', 'Fish & Seafood'] })).toEqual(['Fish & Seafood']);
    expect(categoriesFor(salmon, { [salmon.id]: ['Soups'] })).toEqual(['Easy & Healthy']);
  });

  it('clears the override when only the own category is chosen', () => {
    const o = withCategories({}, salmon, ['Fish & Seafood']);
    expect(withCategories(o, salmon, ['Easy & Healthy'])).toEqual({});
  });

  it('counts a recipe once under each of its categories', () => {
    const other = { id: 'tacos', category: 'Mexican' as const };
    const o = withCategories({}, salmon, ['Easy & Healthy', 'Fish & Seafood']);
    const c = categoryCounts([salmon, other], o);
    expect(c['Easy & Healthy']).toBe(1);
    expect(c['Fish & Seafood']).toBe(1);
    expect(c.Mexican).toBe(1);
  });
});

describe('every recipe has a category', () => {
  for (const r of allRecipes) {
    it(`${r.id} is filed under a known category`, () => {
      expect(CATEGORIES).toContain(r.category);
      expect(categoriesFor(r).length).toBeGreaterThan(0);
    });
  }

  it('every recipe appears under at least one category on Home', () => {
    const counts = categoryCounts(allRecipes);
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(allRecipes.length);
  });
});
