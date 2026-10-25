import { useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useApp } from '../data/store';
import { band, chipKeys, matchRecipes, missingIngredients, type Match } from '../lib/have';
import { addItems, itemsFor } from '../lib/shopping';
import { Empty, RecipeRow, ScreenHeader, SectionHead } from '../ui/components';
import { useToast } from '../ui/feedback';

export function HaveScreen() {
  const { recipes, lookups, prefs, updatePrefs, factorFor } = useApp();
  const toast = useToast();
  const [filter, setFilter] = useState('');
  const matchesRef = useRef<HTMLDivElement>(null);
  const have = useMemo(() => new Set(prefs.have), [prefs.have]);
  const keys = useMemo(() => chipKeys(recipes, lookups), [recipes, lookups]);
  const matches = useMemo(() => matchRecipes(recipes, have, lookups), [recipes, have, lookups]);
  const f = filter.trim().toLowerCase();

  const toggle = (label: string) =>
    updatePrefs(p => ({ ...p, have: p.have.includes(label) ? p.have.filter(x => x !== label) : [...p.have, label] }));

  const addMissing = (m: Match) => {
    const ids = new Set(missingIngredients(m.recipe, have, lookups).map(i => i.id));
    const { list, added } = addItems(prefs.shop, itemsFor(m.recipe, factorFor(m.recipe.id), lookups, ids));
    updatePrefs(p => ({ ...p, shop: list }));
    toast(added ? `${added} missing items added to the list.` : 'Already on the list.');
  };

  const bands = (['ready', 'close', 'shop'] as const).map(b => ({
    b,
    title: b === 'ready' ? 'Ready to cook' : b === 'close' ? 'One or two things short' : 'Worth a shop',
    list: matches.filter(m => band(m) === b)
  }));
  const ready = bands[0].list.length;

  return (
    <div className="screen have">
      <ScreenHeader title="What can I make?" />
      <p className="intro">
        Tick what you have. Matching is by what you have, not how much. Salt, pepper, oil, sugar, water and everyday dried spices are assumed, and optional or serving ingredients don't count against a recipe.
      </p>
      <label className="search">
        <Search size={20} aria-hidden="true" />
        <input type="search" value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter ingredients" aria-label="Filter ingredients" />
      </label>

      {lookups.haveGroups.map(g => {
        const chips = keys.filter(k => k.group === g && (!f || k.label.toLowerCase().includes(f)));
        if (!chips.length) return null;
        return (
          <section key={g} className="have-group">
            <h3 className="group-title">{g}</h3>
            <div className="chips wrap">
              {chips.map(k => {
                const on = have.has(k.label);
                return (
                  <button key={k.label} type="button" className={`chip ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => toggle(k.label)}>
                    {k.label}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      <div ref={matchesRef} className="matches">
        {!have.size ? (
          <>
            <SectionHead title="Matches" />
            <Empty>Tick a few ingredients above and matching recipes appear here, with what you're missing.</Empty>
          </>
        ) : !matches.length ? (
          <>
            <SectionHead title="Matches" />
            <Empty>Nothing in the collection uses enough of that yet. Tick a protein or a couple of vegetables to widen it.</Empty>
          </>
        ) : (
          bands.map(({ b, title, list }) =>
            list.length ? (
              <section key={b}>
                <SectionHead title={title} />
                <div className="rows">
                  {list.map(m => (
                    <RecipeRow
                      key={m.recipe.id}
                      recipe={m.recipe}
                      sub={`Have ${m.matched.length} of ${m.required.length}${m.missing.length ? ` · Missing: ${m.missing.join(', ').toLowerCase()}` : ''}`}
                    >
                      {m.missing.length > 0 && (
                        <button type="button" className="btn btn-outline small-btn" onClick={() => addMissing(m)}>Add missing to list</button>
                      )}
                    </RecipeRow>
                  ))}
                </div>
              </section>
            ) : null
          )
        )}
      </div>

      {have.size > 0 && (
        <div className="summary-bar">
          <span>{have.size} ticked · {ready} ready to cook</span>
          <button type="button" className="btn btn-primary small-btn" onClick={() => matchesRef.current?.scrollIntoView({ behavior: 'smooth' })}>See matches</button>
          <button type="button" className="btn btn-quiet small-btn" onClick={() => updatePrefs(p => ({ ...p, have: [] }))}>Clear</button>
        </div>
      )}
    </div>
  );
}
