// Small helpers: spoon conversions, featured pick, A to Z grouping.
import type { Ingredient, Recipe } from '../types';
import { scaledValue } from './format';

/** "40ml · 1 tbsp = 20ml (AU)" under spoon-measured lines. */
export function spoonHint(ing: Ingredient, factor: number, tbspMl: 15 | 20): string | null {
  if (ing.qty == null || (ing.unit !== 'tsp' && ing.unit !== 'tbsp')) return null;
  const per = ing.unit === 'tsp' ? 5 : tbspMl;
  const ml = (v: number) => String(Math.round(scaledValue(v, ing.unit, factor) * per * 10) / 10);
  const amount = ml(ing.qty) + (ing.qtyMax != null ? '–' + ml(ing.qtyMax) : '') + 'ml';
  const label = ing.unit === 'tsp' ? '1 tsp = 5ml' : `1 tbsp = ${tbspMl}ml (${tbspMl === 20 ? 'AU' : 'intl'})`;
  return `${amount} · ${label}`;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Tonight's pick: a different non-draft recipe with a photo each day. */
export function featuredFor(recipes: Recipe[], date = new Date()): Recipe | null {
  const pool = recipes
    .filter(r => r.confidence.level !== 'draft' && r.image)
    .sort((a, b) => a.id.localeCompare(b.id));
  if (!pool.length) return null;
  const day = date.toLocaleDateString('en-CA');
  return pool[hash(day) % pool.length];
}

export function byTitle(a: Recipe, b: Recipe): number {
  return a.title.localeCompare(b.title, 'en-AU', { sensitivity: 'base' });
}

/** Groups recipes under first-letter headings (digits under "#"). */
export function alphabetical(recipes: Recipe[]): { letter: string; recipes: Recipe[] }[] {
  const out: { letter: string; recipes: Recipe[] }[] = [];
  for (const r of recipes.slice().sort(byTitle)) {
    const c = r.title.charAt(0).toUpperCase();
    const letter = /[A-Z]/.test(c) ? c : '#';
    let g = out.find(x => x.letter === letter);
    if (!g) out.push((g = { letter, recipes: [] }));
    g.recipes.push(r);
  }
  return out;
}

export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function niceDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

/** Minutes from a recipe time label for sorting; falls back to totalMinutes. */
export function minutes(r: Recipe): number {
  return r.time.totalMinutes ?? Number.MAX_SAFE_INTEGER;
}
