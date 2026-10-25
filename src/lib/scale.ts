// Servings scaler. Dinner recipes ("serves") step by whole servings;
// everything else steps through ×0.5 … ×4, as legacy MULTS did.
// Times, temperatures and settings are never scaled.
import type { Recipe } from '../types';
import { fraction } from './format';

export const MULTS = [0.5, 1, 1.5, 2, 3, 4];
export const MAX_SERVES = 24;
export const BOWL_LITRES = 2.2;

export type ScaleKind = 'serves' | 'mult';

export function scaleKind(r: Recipe): ScaleKind | null {
  if (r.confidence.level === 'draft') return null;
  return r.yield.unit === 'serves' ? 'serves' : 'mult';
}

export function stepFactor(r: Recipe, factor: number, dir: 1 | -1): number {
  const kind = scaleKind(r);
  if (!kind) return 1;
  if (kind === 'serves') {
    const n = Math.max(1, Math.min(MAX_SERVES, Math.round(r.yield.qty * factor) + dir));
    return n / r.yield.qty;
  }
  let i = MULTS.findIndex(m => Math.abs(m - factor) < 1e-6);
  if (i < 0) i = 1;
  return MULTS[Math.max(0, Math.min(MULTS.length - 1, i + dir))];
}

export function scaleLimits(r: Recipe, factor: number): { min: boolean; max: boolean } {
  if (scaleKind(r) === 'serves') {
    const n = Math.round(r.yield.qty * factor);
    return { min: n <= 1, max: n >= MAX_SERVES };
  }
  return { min: factor <= MULTS[0] + 1e-6, max: factor >= MULTS[MULTS.length - 1] - 1e-6 };
}

const PLURALS: Record<string, string> = { loaf: 'loaves' };

/** "Serves 4", "Serves 2–3", "Makes ~45 gyoza", "Makes 2 loaves", "×1.5 batch" */
export function yieldText(r: Recipe, factor = 1): string {
  const y = r.yield;
  if (scaleKind(r) === 'serves') {
    if (factor === 1 && y.note?.startsWith('Serves')) return y.note;
    return `Serves ${fraction(Math.round(y.qty * factor))}`;
  }
  if (y.unit === 'batch') return factor === 1 ? '1 batch' : `×${fraction(factor)} batch`;
  if (factor === 1 && y.note?.startsWith('Makes')) return y.note;
  const n = y.qty * factor;
  const approx = y.note?.startsWith('Approx') ? '~' : '';
  const unit = n > 1 + 1e-6 ? (PLURALS[y.unit] ?? y.unit) : y.unit;
  return `Makes ${approx}${fraction(n)} ${unit}`;
}

export function isThermomix(r: Recipe): boolean {
  return r.appliances.includes('thermomix');
}

/** The note shown under the scaler when the recipe is scaled. */
export function scaleNote(r: Recipe, factor: number): string | null {
  if (factor === 1) return null;
  let note = `Scaled ×${fraction(factor)}. Ingredient amounts and amounts in the method are scaled. Times, temperatures and Thermomix settings are not, and bigger batches can need longer.`;
  if (factor > 1 && isThermomix(r)) {
    note += ` The Thermomix bowl holds ${BOWL_LITRES}L. Check any capacity note, or cook in two batches.`;
  }
  return note;
}
