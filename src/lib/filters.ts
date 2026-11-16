// Filters and sorting for the All recipes list on Home.
import type { Appliance, Recipe } from '../types';
import { byTitle, minutes } from './misc';

export type Sort = 'az' | 'quick' | 'protein';

export interface Filters {
  appliance: Appliance | 'all';
  /** A recipe must carry every chosen tag */
  tags: string[];
  under30: boolean;
  testedOnly: boolean;
}

export const NO_FILTERS: Filters = { appliance: 'all', tags: [], under30: false, testedOnly: false };

export function filtersOn(f: Filters): boolean {
  return f.appliance !== 'all' || f.tags.length > 0 || f.under30 || f.testedOnly;
}

/** Tags worth offering as chips: used by at least `min` recipes, most-used first, then A to Z. */
export function popularTags(recipes: Recipe[], limit = 12, min = 2): string[] {
  const counts = new Map<string, number>();
  for (const r of recipes) for (const t of new Set(r.tags ?? [])) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()]
    .filter(([, n]) => n >= min)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([t]) => t);
}

/** "high-protein" -> "High protein" */
export function tagLabel(tag: string): string {
  const s = tag.replace(/-/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function matchesFilters(r: Recipe, f: Filters): boolean {
  if (f.appliance !== 'all' && !r.appliances.includes(f.appliance)) return false;
  if (f.tags.length && !f.tags.every(t => r.tags?.includes(t))) return false;
  if (f.under30 && !(r.time.totalMinutes != null && r.time.totalMinutes <= 30)) return false;
  if (f.testedOnly && r.confidence.level !== 'tested') return false;
  return true;
}

export function sortRecipes(recipes: Recipe[], sort: Sort): Recipe[] {
  const rs = recipes.slice();
  if (sort === 'quick') return rs.sort((a, b) => minutes(a) - minutes(b) || byTitle(a, b));
  if (sort === 'protein') return rs.sort((a, b) => (b.nutrition?.protein ?? -1) - (a.nutrition?.protein ?? -1) || byTitle(a, b));
  return rs.sort(byTitle);
}

export function filterAndSort(recipes: Recipe[], f: Filters, sort: Sort): Recipe[] {
  return sortRecipes(recipes.filter(r => matchesFilters(r, f)), sort);
}
