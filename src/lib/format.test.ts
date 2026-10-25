import { describe, expect, it, vi } from 'vitest';
import { formatAmount, fraction, roundQty } from './format';
import { ingredientMap, renderStep } from './tokens';
import { MULTS, scaleKind } from './scale';
import { allRecipes } from '../test/fixtures';

describe('fraction', () => {
  it('uses glyphs for common fractions', () => {
    expect(fraction(0.5)).toBe('½');
    expect(fraction(1.25)).toBe('1¼');
    expect(fraction(0.75)).toBe('¾');
    expect(fraction(3)).toBe('3');
  });
});

describe('roundQty', () => {
  it('rounds g and ml to the nearest 5, or 1 below 20', () => {
    expect(roundQty(1050, 'g')).toBe(1050);
    expect(roundQty(1052, 'g')).toBe(1050);
    expect(roundQty(17.6, 'ml')).toBe(18);
    expect(roundQty(22.4, 'g')).toBe(20);
  });
  it('rounds spoons and cups to the nearest quarter', () => {
    expect(roundQty(1.6, 'tbsp')).toBe(1.5);
    expect(roundQty(0.1, 'tsp')).toBe(0.25);
    expect(roundQty(2.9, 'cup')).toBe(3);
  });
  it('rounds counted items to the nearest half', () => {
    expect(roundQty(1.3)).toBe(1.5);
    expect(roundQty(0.1)).toBe(0.5);
  });
});

describe('formatAmount', () => {
  it('shows amounts exactly as written at ×1', () => {
    expect(formatAmount({ qty: 0.25 })).toBe('¼');
    expect(formatAmount({ qty: 1.25, unit: 'tsp' })).toBe('1¼ tsp');
    expect(formatAmount({ qty: 80, qtyMax: 100, unit: 'g' })).toBe('80–100g');
    expect(formatAmount({ qty: 2, unit: 'cup' })).toBe('2 cups');
    expect(formatAmount({ qty: 1, unit: 'cup' })).toBe('1 cup');
    expect(formatAmount({ qty: 750, unit: 'ml' })).toBe('750ml');
    expect(formatAmount({ qty: null })).toBeNull();
  });
  it('scales and rounds', () => {
    expect(formatAmount({ qty: 700, unit: 'g' }, 1.5)).toBe('1050g');
    expect(formatAmount({ qty: 3, unit: 'tbsp' }, 0.5)).toBe('1½ tbsp');
    expect(formatAmount({ qty: 3 }, 0.5)).toBe('1½');
    expect(formatAmount({ qty: 15, unit: 'ml' }, 1.5)).toBe('25ml'); // 22.5 → nearest 5
    expect(formatAmount({ qty: 10, unit: 'ml' }, 1.5)).toBe('15ml'); // below 20 → nearest 1
  });
  it('never scales a pinch', () => {
    expect(formatAmount({ qty: 1, unit: 'pinch' }, 4)).toBe('1 pinch');
  });
  it('applies token multipliers', () => {
    expect(formatAmount({ qty: 20, unit: 'g' }, 1, 0.5)).toBe('10g');
    expect(formatAmount({ qty: 2 }, 2, 0.5)).toBe('2');
  });
});

/** Every factor the scaler can reach for a recipe (capped for speed). */
function factorsFor(r: (typeof allRecipes)[number]): number[] {
  const kind = scaleKind(r);
  if (kind === 'serves') return Array.from({ length: 12 }, (_, i) => (i + 1) / r.yield.qty);
  if (kind === 'mult') return MULTS;
  return [1];
}

describe('formatter against every recipe', () => {
  for (const r of allRecipes) {
    it(`${r.id}: every amount and step renders cleanly at every scale`, () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const ings = ingredientMap(r);
      for (const f of factorsFor(r)) {
        for (const ing of ings.values()) {
          const a = formatAmount(ing, f);
          if (typeof ing.qty === 'number') {
            expect(a, `${ing.id} at ×${f}`).toBeTruthy();
            expect(a).not.toMatch(/NaN|undefined|Infinity|^0(?![.\d])/);
          } else {
            expect(a).toBeNull();
          }
        }
        for (const s of r.steps) {
          const parts = renderStep(s.text, ings, f);
          const text = parts.map(p => p.text).join('');
          expect(text).not.toMatch(/\{\{|\}\}/);
          expect(text).not.toMatch(/NaN|undefined/);
          const tokenCount = (s.text.match(/\{\{/g) ?? []).length;
          expect(parts.filter(p => p.kind === 'amount')).toHaveLength(tokenCount);
        }
      }
      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });
  }

  it('drops an unresolved token without showing braces', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const text = renderStep('Add the {{nothing}} now {{bad token}}.', new Map()).map(p => p.text).join('');
    expect(text).toBe('Add the  now .');
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});
