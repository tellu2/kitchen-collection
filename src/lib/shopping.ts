// Shopping list. Lines are stored one per recipe ingredient so a recipe can
// be removed cleanly, then grouped at display time: the same item from
// different recipes shows once, with each recipe's amount underneath and a
// total when the units are compatible (g/kg, ml/L). Water is excluded, as
// are "To serve" sentences. Aisle order follows data/lookups/aisles.json.
import type { Ingredient, Recipe } from '../types';
import { fraction, ingredientLine, scaledValue } from './format';
import { type CompiledLookups, aisleFor, haveKeyFor, isServingGroup, lineText } from './lookups';
import { yieldText } from './scale';

export interface ShopItem {
  /** Display text, scaled, e.g. "1.05kg beef chuck, 4cm cubes" */
  t: string;
  /** Source label, e.g. "Massaman Beef Curry (serves 6)" */
  from: string;
  recipeId: string;
  aisle: string;
  key: string;
  label: string;
  total: { v: number; d: 'g' | 'ml' } | null;
  done: boolean;
  doneAt?: number;
}

export interface SavedList {
  name: string;
  date: string;
  items: ShopItem[];
}

const GENERIC = /\bground\b|powder|\bdried\b|peanut butter|almond butter|\bflakes?\b/i;

export function singular(x: string): string {
  if (/leaves$/.test(x)) return x.slice(0, -6) + 'leaf';
  if (/oes$/.test(x)) return x.slice(0, -2);
  if (x.length > 3 && /[^su]s$/.test(x)) return x.slice(0, -1);
  return x;
}

/** Grouping key: matched on the item name only, as legacy did. */
export function groupOf(ing: Ingredient, lk: CompiledLookups): { key: string; label: string } {
  let name = ing.item.split(/[,(]/)[0].trim().toLowerCase() || ing.item.toLowerCase();
  const key = GENERIC.test(name) ? null : haveKeyFor(name, lk);
  if (key) return { key: 'k:' + key, label: key };
  name = singular(name);
  return { key: 'n:' + name, label: name.charAt(0).toUpperCase() + name.slice(1) };
}

function totalOf(ing: Ingredient, factor: number): ShopItem['total'] {
  if (ing.qty == null || ing.qtyMax != null || !ing.unit) return null;
  const v = scaledValue(ing.qty, ing.unit, factor);
  switch (ing.unit) {
    case 'g': return { v, d: 'g' };
    case 'kg': return { v: v * 1000, d: 'g' };
    case 'ml': return { v, d: 'ml' };
    case 'L': return { v: v * 1000, d: 'ml' };
    default: return null;
  }
}

export function sourceLabel(r: Recipe, factor: number): string {
  return factor === 1 ? r.title : `${r.title} (${yieldText(r, factor).toLowerCase()})`;
}

export function isShoppable(ing: Ingredient, groupTitle: string | undefined, lk: CompiledLookups): boolean {
  if (isServingGroup(groupTitle, lk)) return false;
  const text = lineText(ing);
  return !lk.notShoppable.some(re => re.test(text));
}

/** Shopping lines for a recipe, optionally limited to certain ingredients. */
export function itemsFor(r: Recipe, factor: number, lk: CompiledLookups, only?: Set<string>): ShopItem[] {
  if (r.confidence.level === 'draft') return [];
  const from = sourceLabel(r, factor);
  const out: ShopItem[] = [];
  for (const group of r.ingredientGroups) {
    for (const ing of group.items) {
      if (only && !only.has(ing.id)) continue;
      if (!isShoppable(ing, group.title, lk)) continue;
      const g = groupOf(ing, lk);
      out.push({
        t: ingredientLine(ing, factor),
        from,
        recipeId: r.id,
        aisle: aisleFor(lineText(ing), lk),
        key: g.key,
        label: g.label,
        total: totalOf(ing, factor),
        done: false
      });
    }
  }
  return out;
}

/** Adds items, skipping any line already on the list from the same source. */
export function addItems(list: ShopItem[], items: ShopItem[]): { list: ShopItem[]; added: number } {
  const have = new Set(list.map(x => x.t + '|' + x.from));
  const next = list.slice();
  let added = 0;
  for (const it of items) {
    const k = it.t + '|' + it.from;
    if (have.has(k)) continue;
    have.add(k);
    next.push(it);
    added++;
  }
  return { list: next, added };
}

export interface ShopGroup {
  key: string;
  label: string;
  items: ShopItem[];
  aisle: string;
  done: boolean;
  doneAt: number;
  total: string;
}

export function formatTotal(v: number, d: 'g' | 'ml'): string {
  if (v >= 1000) return fraction(Math.round(v / 100) / 10) + (d === 'g' ? 'kg' : 'L');
  return Math.round(v) + d;
}

export function groupList(list: ShopItem[]): ShopGroup[] {
  const map = new Map<string, ShopItem[]>();
  for (const it of list) {
    if (!map.has(it.key)) map.set(it.key, []);
    map.get(it.key)!.push(it);
  }
  return [...map.entries()].map(([key, items]) => {
    const live = items.find(i => !i.done) ?? items[0];
    const totals = items.map(i => i.total);
    const sameUnit = items.length > 1 && totals.every(t => t && t.d === totals[0]!.d);
    return {
      key,
      label: items[0].label,
      items,
      aisle: live.aisle,
      done: items.every(i => i.done),
      doneAt: Math.max(...items.map(i => i.doneAt ?? 0)),
      total: sameUnit ? formatTotal(totals.reduce((a, t) => a + t!.v, 0), totals[0]!.d) : ''
    };
  });
}

/** Open groups by aisle (in store order), then ticked groups newest first. */
export function arrange(groups: ShopGroup[], aisleOrder: string[]) {
  const open = aisleOrder
    .map(aisle => ({ aisle, groups: groups.filter(g => !g.done && g.aisle === aisle) }))
    .filter(s => s.groups.length);
  const known = new Set(aisleOrder);
  const stray = groups.filter(g => !g.done && !known.has(g.aisle));
  if (stray.length) open.push({ aisle: 'Other', groups: stray });
  const ticked = groups.filter(g => g.done).sort((a, b) => b.doneAt - a.doneAt);
  return { open, ticked };
}

export function setGroupDone(list: ShopItem[], key: string, done: boolean, now = Date.now()): ShopItem[] {
  return list.map(it => {
    if (it.key !== key) return it;
    const next = { ...it, done };
    if (done) next.doneAt = now;
    else delete next.doneAt;
    return next;
  });
}

export function sources(list: ShopItem[]) {
  const out: { from: string; recipeId: string; n: number; done: number }[] = [];
  for (const it of list) {
    let s = out.find(x => x.from === it.from);
    if (!s) out.push((s = { from: it.from, recipeId: it.recipeId, n: 0, done: 0 }));
    s.n++;
    if (it.done) s.done++;
  }
  return out;
}

export function removeSource(list: ShopItem[], from: string): ShopItem[] {
  return list.filter(it => it.from !== from);
}

export function listAsText(list: ShopItem[], aisleOrder: string[]): string {
  const { open, ticked } = arrange(groupList(list), aisleOrder);
  const line = (g: ShopGroup) =>
    g.items.length === 1
      ? g.items[0].t
      : `${g.label}${g.total ? ` (${g.total} total)` : ''}: ${g.items.map(i => `${i.t} [${i.from}]`).join('; ')}`;
  let out = 'Kitchen Collection: shopping list\n';
  for (const s of open) {
    out += `\n${s.aisle.toUpperCase()}\n`;
    for (const g of s.groups) out += `[ ] ${line(g)}\n`;
  }
  if (ticked.length) {
    out += '\nTICKED OFF\n';
    for (const g of ticked) out += `[x] ${line(g)}\n`;
  }
  return out;
}
