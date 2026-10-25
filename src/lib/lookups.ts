// Compiles the lookup JSON (data/lookups/) into regular expressions, and
// builds the "line text" the legacy rules were written against:
// "<amount> <item>, <prep>, <note> (optional)", amounts as written (×1).
import type { Ingredient, LookupFiles, Pattern } from '../types';
import { formatAmount } from './format';

export interface CompiledLookups {
  aisleOrder: string[];
  aisleFallback: string;
  aisleRules: { aisle: string; re: RegExp }[];
  notShoppable: RegExp[];
  notShoppableGroup: RegExp;
  haveGroups: string[];
  haveKeys: { label: string; group: string; re: RegExp }[];
  assumedBasics: string[];
  optionalLine: RegExp;
}

const re = (p: Pattern) => new RegExp(p.pattern, p.flags ?? '');

export function compileLookups(files: LookupFiles): CompiledLookups {
  return {
    aisleOrder: files.aisles.order,
    aisleFallback: files.aisles.fallback,
    aisleRules: files.aisles.rules.map(r => ({ aisle: r.aisle, re: re(r) })),
    notShoppable: files.aisles.notShoppable.map(re),
    notShoppableGroup: re(files.aisles.notShoppableGroups),
    haveGroups: files.haveKeys.groups,
    haveKeys: files.haveKeys.keys.map(k => ({ label: k.label, group: k.group, re: re(k) })),
    assumedBasics: files.pantryBasics.assumed,
    optionalLine: re(files.pantryBasics.optionalLinePattern)
  };
}

export function lineText(ing: Ingredient): string {
  const amount = formatAmount(ing);
  let line = amount ? `${amount} ${ing.item}` : ing.item;
  if (ing.prep) line += `, ${ing.prep}`;
  if (ing.note) line += `, ${ing.note}`;
  if (ing.optional) line += ' (optional)';
  return line;
}

export function aisleFor(text: string, lk: CompiledLookups): string {
  for (const r of lk.aisleRules) if (r.re.test(text)) return r.aisle;
  return lk.aisleFallback;
}

export function haveKeyFor(text: string, lk: CompiledLookups): string | null {
  for (const k of lk.haveKeys) if (k.re.test(text)) return k.label;
  return null;
}

export function isServingGroup(title: string | undefined, lk: CompiledLookups): boolean {
  return !!title && lk.notShoppableGroup.test(title.trim());
}
