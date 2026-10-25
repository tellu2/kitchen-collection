// Step text amount tokens: {{ingredientId}} or {{ingredientId*0.5}}.
import type { Ingredient, Recipe } from '../types';
import { formatAmount } from './format';

const TOKEN = /\{\{([a-z0-9]+(?:-[a-z0-9]+)*)(?:\*(\d+(?:\.\d+)?))?\}\}/g;
const ANY_BRACES = /\{\{[^{}]*\}\}/g;

export type Part = { kind: 'text'; text: string } | { kind: 'amount'; text: string; ingredientId: string };

export function ingredientMap(recipe: Recipe): Map<string, Ingredient> {
  const map = new Map<string, Ingredient>();
  for (const g of recipe.ingredientGroups) for (const i of g.items) map.set(i.id, i);
  return map;
}

/**
 * Splits step text into plain text and scaled amounts. An unresolved token
 * renders nothing and logs a warning; raw braces never reach the screen.
 */
export function renderStep(text: string, ingredients: Map<string, Ingredient>, factor = 1): Part[] {
  const parts: Part[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    if (m.index! > last) parts.push({ kind: 'text', text: text.slice(last, m.index) });
    const ing = ingredients.get(m[1]);
    const amount = ing ? formatAmount(ing, factor, m[2] ? Number(m[2]) : 1) : null;
    if (amount) parts.push({ kind: 'amount', text: amount, ingredientId: m[1] });
    else console.warn(`Unresolved token ${m[0]}`);
    last = m.index! + m[0].length;
  }
  if (last < text.length) parts.push({ kind: 'text', text: text.slice(last) });
  // Strip anything brace-like that slipped through (malformed tokens)
  return parts.map(p => (p.kind === 'text' ? { ...p, text: p.text.replace(ANY_BRACES, '') } : p));
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
