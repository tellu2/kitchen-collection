import { describe, expect, it } from 'vitest';
import type { Ingredient } from '../types';
import { allRecipes } from '../test/fixtures';
import { ingredientMap, renderStep, stepMentionsPrep } from './tokens';

const ings = new Map<string, Ingredient>([
  ['beef', { id: 'beef', qty: 700, unit: 'g', item: 'beef chuck', prep: '4cm cubes' }],
  ['garlic', { id: 'garlic', qty: 3, item: 'garlic cloves', prep: 'minced' }],
  ['zucchini', { id: 'zucchini', qty: 600, unit: 'g', item: 'zucchini', prep: 'grated' }],
  ['parmesan', { id: 'parmesan', qty: 60, unit: 'g', item: 'parmesan', prep: 'in pieces' }],
  ['salt', { id: 'salt', qty: 1, unit: 'tsp', item: 'salt' }]
]);
const show = (text: string, earlier = '') => renderStep(text, ings, 1, earlier).map(p => p.text).join('');

describe('method shows each ingredient’s amount and form', () => {
  it('adds the form inside the amount’s brackets', () => {
    expect(show('Add the beef ({{beef}}) and salt ({{salt}}).')).toBe('Add the beef (700g, 4cm cubes) and salt (1 tsp).');
  });

  it('keeps the counted noun before the form', () => {
    expect(show('Add the garlic ({{garlic}} cloves).')).toBe('Add the garlic (3 cloves, minced).');
  });

  it('skips the form when the step already says it', () => {
    expect(show('Grate the zucchini ({{zucchini}}) 5 sec / Speed 5.')).toBe('Grate the zucchini (600g) 5 sec / Speed 5.');
    expect(stepMentionsPrep('Tear the potatoes', 'torn into 3cm pieces')).toBe(true);
    expect(stepMentionsPrep('Add the potatoes', 'torn into 3cm pieces')).toBe(false);
  });

  it('skips the form for the rest of an ingredient an earlier step used', () => {
    expect(show('Stir through half the parmesan ({{parmesan*0.5}}).', 'Grate the parmesan ({{parmesan}}) 10 sec / Speed 9.'))
      .toBe('Stir through half the parmesan (30g).');
  });

  it('leaves amounts outside brackets alone', () => {
    expect(show('Use {{beef}} of beef.')).toBe('Use 700g of beef.');
  });

  it('never shows braces or doubled punctuation in any recipe', () => {
    for (const r of allRecipes) {
      const m = ingredientMap(r);
      r.steps.forEach((s, i) => {
        const text = renderStep(s.text, m, 1, r.steps.slice(0, i).map(x => x.text).join(' ')).map(p => p.text).join('');
        expect(text, `${r.id} step ${i + 1}`).not.toMatch(/\{\{|\}\}|,,|\(,|, \)/);
      });
    }
  });
});
