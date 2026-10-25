import { describe, expect, it } from 'vitest';
import { addItems, arrange, groupList, itemsFor, listAsText, removeSource, setGroupDone, sources } from './shopping';
import { allRecipes, byId, lookups } from '../test/fixtures';

describe('shopping list lines', () => {
  it('produces lines for every non-draft recipe and none for drafts', () => {
    for (const r of allRecipes) {
      const items = itemsFor(r, 1, lookups);
      if (r.confidence.level === 'draft') expect(items).toHaveLength(0);
      else expect(items.length, r.id).toBeGreaterThan(0);
      for (const it of items) {
        expect(lookups.aisleOrder).toContain(it.aisle);
        expect(it.t).not.toMatch(/\{\{|NaN|undefined/);
      }
    }
  });

  it('leaves out water of any kind', () => {
    for (const r of allRecipes) {
      for (const it of itemsFor(r, 1, lookups)) expect(it.t, r.id).not.toMatch(/^[\d½¼¾.–\s]*(cups?|ml|g|tbsp)?\s*(warm )?water\b/i);
    }
    expect(itemsFor(byId('sesame-noodles'), 1, lookups).some(i => /^150ml water/.test(i.t))).toBe(false);
    // "water" inside another ingredient's prep stays (cornflour, slurried with a splash of water)
    expect(itemsFor(byId('sesame-noodles'), 1, lookups).some(i => /^1–2 tsp cornflour/.test(i.t))).toBe(true);
  });

  it('leaves out "To serve" groups but keeps trailing "to serve" lines, as legacy did', () => {
    expect(itemsFor(byId('mexican-beef'), 1, lookups).some(i => /Mexican rice/.test(i.t))).toBe(false);
    expect(itemsFor(byId('massaman'), 1, lookups).some(i => /jasmine rice/.test(i.t))).toBe(true);
  });

  it('scales lines and labels the source with the scale', () => {
    const items = itemsFor(byId('massaman'), 1.5, lookups);
    expect(items[0].t).toBe('1050g beef chuck or gravy beef, 4cm cubes');
    expect(items[0].from).toBe('Massaman Beef Curry (serves 6)');
  });

  it('uses Woolworths and Coles aisle rules, first match wins', () => {
    const find = (id: string, text: RegExp) => itemsFor(byId(id), 1, lookups).find(i => text.test(i.t))!;
    expect(find('massaman', /beef chuck/).aisle).toBe('Meat & seafood');
    expect(find('massaman', /coconut cream/).aisle).toBe('Pantry');
    expect(find('massaman', /cinnamon stick/).aisle).toBe('Spices & baking');
    expect(find('souvlaki', /Greek yoghurt/).aisle).toBe('Dairy & eggs');
    expect(find('sesame-noodles', /^200g noodles/).aisle).toBe('Fridge & deli');
  });
});

describe('grouping and totals', () => {
  const list = () => {
    let l = addItems([], itemsFor(byId('massaman'), 1, lookups)).list;
    l = addItems(l, itemsFor(byId('riojana'), 1, lookups)).list;
    l = addItems(l, itemsFor(byId('sumac-traybake'), 1, lookups)).list;
    return l;
  };

  it('groups the same ingredient from different recipes under one heading', () => {
    const groups = groupList(list());
    const garlic = groups.find(g => g.label === 'Garlic')!;
    expect(garlic.items.map(i => i.from).sort()).toEqual(['Patatas a la Riojana', 'Sumac Chicken Traybake with Tahini Yoghurt']);
  });

  it('totals compatible units and lists others separately', () => {
    const groups = groupList(list());
    const potatoes = groups.find(g => g.label === 'Potatoes')!;
    expect(potatoes.items).toHaveLength(3);
    expect(potatoes.total).toBe('1.6kg'); // 400g + 800g + 400g
    const bay = groups.find(g => g.items.length > 1 && /bay/i.test(g.label));
    if (bay) expect(bay.total).toBe(''); // counted items are not totalled
  });

  it('does not add the same line from the same recipe twice', () => {
    const first = addItems([], itemsFor(byId('massaman'), 1, lookups));
    const again = addItems(first.list, itemsFor(byId('massaman'), 1, lookups));
    expect(again.added).toBe(0);
  });

  it('moves ticked groups to Ticked off, most recently ticked first', () => {
    let l = list();
    const groups = groupList(l);
    l = setGroupDone(l, groups[0].key, true, 1000);
    l = setGroupDone(l, groups[1].key, true, 2000);
    const { ticked, open } = arrange(groupList(l), lookups.aisleOrder);
    expect(ticked.map(g => g.key)).toEqual([groups[1].key, groups[0].key]);
    expect(open.flatMap(s => s.groups).some(g => g.key === groups[0].key)).toBe(false);
  });

  it('removes one recipe cleanly', () => {
    const l = removeSource(list(), 'Patatas a la Riojana');
    expect(sources(l).map(s => s.from)).not.toContain('Patatas a la Riojana');
    expect(sources(l)).toHaveLength(2);
  });

  it('copies as text in aisle order', () => {
    const text = listAsText(list(), lookups.aisleOrder);
    expect(text.startsWith('Kitchen Collection: shopping list')).toBe(true);
    expect(text.indexOf('FRUIT & VEG')).toBeLessThan(text.indexOf('MEAT & SEAFOOD'));
    expect(text).toMatch(/Potatoes \(1\.6kg total\)/);
  });
});
