import { describe, expect, it } from 'vitest';
import { scaleKind, scaleLimits, scaleNote, stepFactor, yieldText } from './scale';
import { allRecipes, byId } from '../test/fixtures';

describe('scaler', () => {
  it('steps dinner recipes by whole servings', () => {
    const r = byId('massaman'); // serves 4
    expect(scaleKind(r)).toBe('serves');
    expect(stepFactor(r, 1, 1)).toBeCloseTo(5 / 4);
    expect(stepFactor(r, 1, -1)).toBeCloseTo(3 / 4);
    expect(yieldText(r, 1.5)).toBe('Serves 6');
    expect(scaleLimits(r, 1 / 4).min).toBe(true);
    expect(scaleLimits(r, 24 / 4).max).toBe(true);
  });

  it('steps baking and batch recipes through the multipliers', () => {
    const bread = byId('banana-bread'); // 1 loaf
    expect(scaleKind(bread)).toBe('mult');
    expect(stepFactor(bread, 1, 1)).toBe(1.5);
    expect(stepFactor(bread, 4, 1)).toBe(4);
    expect(stepFactor(bread, 0.5, -1)).toBe(0.5);
    expect(yieldText(bread, 2)).toBe('Makes 2 loaves');
    expect(yieldText(byId('pork-gyoza'), 1.5)).toBe('Makes ~45 gyoza');
    expect(yieldText(byId('taco-seasoning'), 2)).toBe('×2 batch');
  });

  it('keeps written yield ranges at ×1', () => {
    expect(yieldText(byId('sesame-noodles'), 1)).toBe('Serves 2–3');
    expect(yieldText(byId('sushi-rice'), 1)).toBe('Makes 4–5 rolls');
  });

  it('does not scale drafts', () => {
    for (const r of allRecipes.filter(x => x.confidence.level === 'draft')) expect(scaleKind(r)).toBeNull();
  });

  it('says what is not scaled and warns about the bowl only for Thermomix recipes scaled up', () => {
    expect(scaleNote(byId('massaman'), 1)).toBeNull();
    expect(scaleNote(byId('massaman'), 1.5)).toMatch(/2\.2L/);
    expect(scaleNote(byId('massaman'), 0.5)).not.toMatch(/2\.2L/);
    expect(scaleNote(byId('souvlaki'), 2)).not.toMatch(/2\.2L/);
    expect(scaleNote(byId('souvlaki'), 2)).toMatch(/Times, temperatures and Thermomix settings are not/);
  });

  it('gives every non-draft recipe a yield label at every step', () => {
    for (const r of allRecipes) {
      if (!scaleKind(r)) continue;
      let f = 1;
      for (let i = 0; i < 6; i++) {
        f = stepFactor(r, f, 1);
        expect(yieldText(r, f)).not.toMatch(/NaN|undefined/);
      }
    }
  });
});
