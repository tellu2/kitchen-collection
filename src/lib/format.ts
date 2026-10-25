// Amount formatting and rounding (CLAUDE.md, Rendering rules).
// At ×1 with no multiplier, amounts show exactly as written. Once scaled:
// g and ml to the nearest 5 (nearest 1 below 20); tsp, tbsp and cup to the
// nearest ¼; counted items to the nearest ½; pinch is never scaled.
import type { Ingredient, Unit } from '../types';

const GLYPHS: [number, string][] = [
  [0.125, '⅛'], [0.25, '¼'], [1 / 3, '⅓'], [0.5, '½'], [2 / 3, '⅔'], [0.75, '¾']
];
const NO_SPACE = new Set<Unit>(['g', 'kg', 'ml', 'L']);

/** 1.5 → "1½", 0.25 → "¼", 2 → "2", 2.4 → "2.4" */
export function fraction(v: number): string {
  const whole = Math.floor(v + 1e-9);
  const frac = v - whole;
  if (frac < 1e-6) return String(whole);
  for (const [value, glyph] of GLYPHS) {
    if (Math.abs(frac - value) < 1e-6) return (whole ? String(whole) : '') + glyph;
  }
  return String(Math.round(v * 100) / 100);
}

const roundTo = (v: number, step: number) => Math.round(v / step) * step;

export function roundQty(v: number, unit?: Unit): number {
  switch (unit) {
    case 'g':
    case 'ml':
      return Math.max(1, v < 20 ? Math.round(v) : roundTo(v, 5));
    case 'kg':
    case 'L':
      return Math.max(0.05, Math.round(roundTo(v, 0.05) * 100) / 100);
    case 'tsp':
    case 'tbsp':
    case 'cup':
      return Math.max(0.25, roundTo(v, 0.25));
    case 'pinch':
      return v;
    default:
      return Math.max(0.5, roundTo(v, 0.5));
  }
}

export function unitSuffix(unit: Unit | undefined, value: number): string {
  if (!unit) return '';
  if (NO_SPACE.has(unit)) return unit;
  if (unit === 'cup') return value > 1 ? ' cups' : ' cup';
  if (unit === 'pinch') return value > 1 ? ' pinches' : ' pinch';
  return ' ' + unit;
}

/** Scaled numeric value of an ingredient bound, as displayed. */
export function scaledValue(v: number, unit: Unit | undefined, factor: number, mult = 1): number {
  if (unit === 'pinch') return v;
  if (factor === 1 && mult === 1) return v;
  return roundQty(v * factor * mult, unit);
}

/**
 * "150g", "2 tsp", "1½", "80–100g". Returns null when the ingredient has no amount.
 * `mult` comes from a step token such as {{oil*0.5}}.
 */
export function formatAmount(
  ing: Pick<Ingredient, 'qty' | 'qtyMax' | 'unit'>,
  factor = 1,
  mult = 1
): string | null {
  if (ing.qty == null) return null;
  const a = scaledValue(ing.qty, ing.unit, factor, mult);
  let text = fraction(a);
  let top = a;
  if (ing.qtyMax != null) {
    const b = scaledValue(ing.qtyMax, ing.unit, factor, mult);
    if (b > a) {
      text += '–' + fraction(b);
      top = b;
    }
  }
  return text + unitSuffix(ing.unit, top);
}

/** Full ingredient line as shown in the list, e.g. "700g beef chuck, 4cm cubes". */
export function ingredientLine(ing: Ingredient, factor = 1): string {
  const amount = formatAmount(ing, factor);
  let line = amount ? `${amount} ${ing.item}` : ing.item;
  if (ing.prep) line += `, ${ing.prep}`;
  return line;
}

/** Duration in seconds as m:ss or h:mm:ss. */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return (h ? `${h}:${String(m).padStart(2, '0')}` : String(m)) + ':' + String(sec).padStart(2, '0');
}
