import { describe, expect, it } from 'vitest';
import { allRecipes } from '../test/fixtures';
import { NO_FILTERS, filterAndSort, filtersOn, matchesFilters, popularTags, tagLabel } from './filters';

describe('Home filters', () => {
  it('shows every recipe with no filters on', () => {
    expect(filterAndSort(allRecipes, NO_FILTERS, 'az')).toHaveLength(allRecipes.length);
    expect(filtersOn(NO_FILTERS)).toBe(false);
  });

  it('needs every chosen tag', () => {
    const f = { ...NO_FILTERS, tags: ['chicken', 'high-protein'] };
    const rs = filterAndSort(allRecipes, f, 'az');
    expect(rs.length).toBeGreaterThan(0);
    for (const r of rs) expect(r.tags).toEqual(expect.arrayContaining(['chicken', 'high-protein']));
  });

  it('under 30 min excludes recipes with no total time', () => {
    const rs = filterAndSort(allRecipes, { ...NO_FILTERS, under30: true }, 'az');
    for (const r of rs) expect(r.time.totalMinutes).toBeLessThanOrEqual(30);
  });

  it('tested only keeps tested recipes', () => {
    const rs = filterAndSort(allRecipes, { ...NO_FILTERS, testedOnly: true }, 'az');
    expect(rs.length).toBeGreaterThan(0);
    for (const r of rs) expect(r.confidence.level).toBe('tested');
  });

  it('combines with the appliance filter', () => {
    const f = { ...NO_FILTERS, appliance: 'air-fryer' as const, tags: ['chicken'] };
    for (const r of allRecipes) {
      expect(matchesFilters(r, f)).toBe(r.appliances.includes('air-fryer') && !!r.tags?.includes('chicken'));
    }
  });

  it('sorts quickest first and most protein first', () => {
    const quick = filterAndSort(allRecipes, NO_FILTERS, 'quick');
    for (let i = 1; i < quick.length; i++) {
      expect(quick[i].time.totalMinutes ?? Infinity).toBeGreaterThanOrEqual(quick[i - 1].time.totalMinutes ?? Infinity);
    }
    const protein = filterAndSort(allRecipes, NO_FILTERS, 'protein');
    expect(protein[0].nutrition?.protein).toBe(Math.max(...allRecipes.map(r => r.nutrition?.protein ?? -1)));
    expect(protein.at(-1)!.nutrition?.protein).toBeUndefined();
  });

  it('offers only tags used by two or more recipes, most used first', () => {
    const tags = popularTags(allRecipes);
    expect(tags.length).toBeGreaterThan(0);
    expect(tags.length).toBeLessThanOrEqual(12);
    const count = (t: string) => allRecipes.filter(r => r.tags?.includes(t)).length;
    for (const t of tags) expect(count(t)).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < tags.length; i++) expect(count(tags[i])).toBeLessThanOrEqual(count(tags[i - 1]));
  });

  it('labels tags in sentence case', () => {
    expect(tagLabel('high-protein')).toBe('High protein');
    expect(tagLabel('freezer-friendly')).toBe('Freezer friendly');
  });
});
