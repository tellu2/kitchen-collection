// Step text amount tokens: {{ingredientId}} or {{ingredientId*0.5}}.
import type { Ingredient, Recipe } from '../types';
import { formatAmount } from './format';

const TOKEN = /\{\{([a-z0-9]+(?:-[a-z0-9]+)*)(?:\*(\d+(?:\.\d+)?))?\}\}/g;
const ANY_BRACES = /\{\{[^{}]*\}\}/g;

export type Part =
  | { kind: 'text'; text: string }
  | { kind: 'amount'; text: string; ingredientId: string; partial?: boolean }
  /** The ingredient's form (cubed, sliced...), shown inside the amount's brackets */
  | { kind: 'prep'; text: string; ingredientId: string };

// Words too general to show that a step already describes the ingredient's form
const GENERIC = new Set(['about', 'large', 'small', 'medium', 'roughly', 'pieces', 'thinly', 'finely', 'drained']);

/**
 * True when the step text already says how the ingredient is cut or prepared,
 * for example "Grate the zucchini" for prep "grated". Compares word stems.
 */
export function stepMentionsPrep(stepText: string, prep: string): boolean {
  // Irregular verbs whose past form shares no stem with the instruction
  const text = stepText.toLowerCase().replace(/\btear\b/g, 'torn tear');
  const words = prep.toLowerCase().match(/[a-z]{5,}|\btorn\b/g) ?? [];
  const telling = words.filter(w => !GENERIC.has(w));
  if (!telling.length) return text.includes(prep.toLowerCase());
  return telling.some(w => text.includes(w.slice(0, 4)));
}

export function ingredientMap(recipe: Recipe): Map<string, Ingredient> {
  const map = new Map<string, Ingredient>();
  for (const g of recipe.ingredientGroups) for (const i of g.items) map.set(i.id, i);
  return map;
}

/**
 * Splits step text into plain text and scaled amounts. An unresolved token
 * renders nothing and logs a warning; raw braces never reach the screen.
 */
export function renderStep(text: string, ingredients: Map<string, Ingredient>, factor = 1, earlierSteps = ''): Part[] {
  const parts: Part[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    if (m.index! > last) parts.push({ kind: 'text', text: text.slice(last, m.index) });
    const ing = ingredients.get(m[1]);
    const amount = ing ? formatAmount(ing, factor, m[2] ? Number(m[2]) : 1) : null;
    if (amount) parts.push({ kind: 'amount', text: amount, ingredientId: m[1], partial: !!m[2] && Number(m[2]) < 1 });
    else console.warn(`Unresolved token ${m[0]}`);
    last = m.index! + m[0].length;
  }
  if (last < text.length) parts.push({ kind: 'text', text: text.slice(last) });
  // Strip anything brace-like that slipped through (malformed tokens)
  const clean = parts.map(p => (p.kind === 'text' ? { ...p, text: p.text.replace(ANY_BRACES, '') } : p));
  return withPrep(clean, text, ingredients, earlierSteps);
}

/**
 * Adds each ingredient's form inside the brackets that hold its amount:
 * "garlic (3 cloves)" becomes "garlic (3 cloves, minced)". Only for amounts in
 * brackets, and not when the step already says how it is prepared, nor for the
 * remainder of an ingredient an earlier step already used.
 */
function withPrep(parts: Part[], stepText: string, ingredients: Map<string, Ingredient>, earlierSteps: string): Part[] {
  const out: Part[] = [];
  for (let k = 0; k < parts.length; k++) {
    const p = parts[k];
    out.push(p);
    if (p.kind !== 'amount') continue;
    const prep = ingredients.get(p.ingredientId)?.prep;
    const before = out[out.length - 2];
    const inBrackets = before?.kind === 'text' && /\(\s*$/.test(before.text);
    const after = parts[k + 1];
    if (!prep || !inBrackets || after?.kind !== 'text' || stepMentionsPrep(stepText, prep)) continue;
    // The rest of an ingredient already worked on in an earlier step ("half the parmesan" after grating it)
    if (p.partial && earlierSteps.includes(`{{${p.ingredientId}`)) continue;
    // The closing bracket must come before any other bracket or sentence end
    const close = after.text.search(/[()]/);
    if (close < 0 || after.text[close] !== ')') continue;
    const noun = after.text.slice(0, close);
    if (/[.;:]/.test(noun) || noun.includes(',')) continue;
    out.push({ kind: 'text', text: noun });
    out.push({ kind: 'prep', text: ', ' + prep, ingredientId: p.ingredientId });
    parts[k + 1] = { kind: 'text', text: after.text.slice(close) };
  }
  return out.filter(p => p.text !== '');
}

export function stepPlainText(text: string, ingredients: Map<string, Ingredient>, factor = 1): string {
  return renderStep(text, ingredients, factor).map(p => p.text).join('');
}

/** Ingredient ids referenced by a step's tokens, in order, without repeats. */
export function tokenIds(text: string): string[] {
  const ids: string[] = [];
  for (const m of text.matchAll(TOKEN)) if (!ids.includes(m[1])) ids.push(m[1]);
  return ids;
}
