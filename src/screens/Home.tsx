import { useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Download, Lightbulb, RefreshCw, Search, Settings, UtensilsCrossed, X } from 'lucide-react';
import { CATEGORIES, type Appliance, type Recipe } from '../types';
import { useApp } from '../data/store';
import { alphabetical, byTitle, featuredFor, greeting, niceDate } from '../lib/misc';
import { yieldText } from '../lib/scale';
import { lineText } from '../lib/lookups';
import { addItems, itemsFor } from '../lib/shopping';
import { useToast } from '../ui/feedback';
import { CATEGORY_META, FLAGS, Flag, Photo, RecipeCard, RecipeRow, SectionHead, catVar } from '../ui/components';
import { go, href } from '../ui/router';

const APPLIANCES: { id: Appliance | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'thermomix', label: 'Thermomix' },
  { id: 'air-fryer', label: 'Air fryer' },
  { id: 'oven', label: 'Oven' },
  { id: 'stovetop', label: 'Stovetop' }
];

function matchesQuery(r: Recipe, q: string): boolean {
  if (r.title.toLowerCase().includes(q)) return true;
  if ((r.description ?? '').toLowerCase().includes(q)) return true;
  return r.ingredientGroups.some(g => g.items.some(i => lineText(i).toLowerCase().includes(q)));
}

export function Home() {
  const { recipes, ideas, prefs, byId, coverFor, imageFor, refresh, sync, factorFor, updatePrefs, lookups, update } = useApp();
  const toast = useToast();
  const today = prefs.today.map(id => byId[id]).filter(Boolean) as Recipe[];
  const addTodayToList = () => {
    let list = prefs.shop;
    let added = 0;
    for (const r of today) {
      const res = addItems(list, itemsFor(r, factorFor(r.id), lookups));
      list = res.list;
      added += res.added;
    }
    updatePrefs(p => ({ ...p, shop: list }));
    toast(added ? `${added} items added to the list.` : 'Already on the list.');
  };
  const [query, setQuery] = useState('');
  const [appliance, setAppliance] = useState<Appliance | 'all'>('all');
  // The A to Z list starts folded; the choice is remembered on this phone
  const [showAll, setShowAllState] = useState(() => {
    try {
      return localStorage.getItem('kc-show-all') === '1';
    } catch {
      return false;
    }
  });
  const setShowAll = (v: boolean) => {
    setShowAllState(v);
    try {
      localStorage.setItem('kc-show-all', v ? '1' : '0');
    } catch {
      /* not stored */
    }
  };
  const [pull, setPull] = useState(0);
  const touchStart = useRef<number | null>(null);

  const q = query.trim().toLowerCase();
  const results = useMemo(() => (q.length >= 2 ? recipes.filter(r => matchesQuery(r, q)).sort(byTitle) : []), [recipes, q]);
  const featured = useMemo(() => featuredFor(recipes), [recipes]);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of recipes) c[r.category] = (c[r.category] ?? 0) + 1;
    return c;
  }, [recipes]);
  const az = useMemo(
    () => alphabetical(appliance === 'all' ? recipes : recipes.filter(r => r.appliances.includes(appliance))),
    [recipes, appliance]
  );
  const lastCooked = Object.entries(prefs.cooked)
    .sort((a, b) => b[1].localeCompare(a[1]))
    .slice(0, 3)
    .map(([id, date]) => ({ r: byId[id], date }))
    .filter(x => x.r);
  const recent = recipes
    .filter(r => r.added)
    .sort((a, b) => b.added!.localeCompare(a.added!))
    .slice(0, 6);
  const cookingCount = recipes.filter(r => r.confidence.level !== 'draft').length;

  // Pull down at the top of the page to refresh
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = window.scrollY <= 0 ? e.touches[0].clientY : null;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStart.current == null) return;
    setPull(Math.max(0, Math.min(90, e.touches[0].clientY - touchStart.current)));
  };
  const onTouchEnd = () => {
    if (pull > 70) void refresh();
    setPull(0);
    touchStart.current = null;
  };

  const featuredImg = featured ? imageFor(featured) : null;

  return (
    <div className="screen home" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div className="pull" style={{ height: pull ? pull * 0.6 : 0 }} aria-hidden="true">
        <RefreshCw size={20} className={pull > 70 ? 'spin' : ''} />
      </div>
      {sync.syncing && <div className="sync-bar" role="status">Checking for new recipes</div>}

      <header className="home-head">
        <div>
          <p className="muted hello">{greeting()}</p>
          <h1 className="wordmark">Kitchen Collection</h1>
          <p className="muted sync-line">
            {cookingCount} recipes{sync.lastSynced ? ` · synced ${niceDate(sync.lastSynced)}` : ''}
          </p>
        </div>
        <a className="icon-btn raised" href={href('settings')} aria-label="Settings"><Settings size={22} /></a>
      </header>

      <label className="search">
        <Search size={20} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search recipes or ingredients"
          aria-label="Search recipes or ingredients"
        />
        {query && (
          <button type="button" className="icon-btn small" aria-label="Clear search" onClick={() => setQuery('')}>
            <X size={18} />
          </button>
        )}
      </label>

      {q.length >= 2 ? (
        <section>
          <SectionHead title={`${results.length} ${results.length === 1 ? 'match' : 'matches'}`} />
          {results.length ? (
            <div className="rows">{results.map(r => <RecipeRow key={r.id} recipe={r} />)}</div>
          ) : (
            <p className="empty">Nothing matches that. Try an ingredient, like gochujang or chorizo.</p>
          )}
        </section>
      ) : (
        <>
          {update && (
            <section className="update-card" aria-label="App update">
              <Download size={22} aria-hidden="true" />
              <div>
                <b>Version {update.version} is ready</b>
                <small>Download it, open the file, then tap Update. Your lists and favourites stay.</small>
              </div>
              <a className="btn btn-primary small-btn" href={update.url} target="_blank" rel="noopener noreferrer">Download</a>
            </section>
          )}

          {today.length > 0 && (
            <section className="today" aria-label="Cooking today">
              <SectionHead
                title="Cooking today"
                action={<button type="button" className="link" onClick={addTodayToList}>Add all to list</button>}
              />
              <div className="rows">
                {today.map(r => (
                  <RecipeRow key={r.id} recipe={r}>
                    <div className="row-actions">
                      <button type="button" className="btn btn-primary small-btn" onClick={() => go('cook', r.id, 0)}>
                        <UtensilsCrossed size={16} aria-hidden="true" /> Start cooking
                      </button>
                      <button
                        type="button"
                        className="btn btn-quiet small-btn"
                        onClick={() => updatePrefs(p => ({ ...p, today: p.today.filter(x => x !== r.id) }))}
                      >
                        Remove
                      </button>
                    </div>
                  </RecipeRow>
                ))}
              </div>
            </section>
          )}

          {featured && (
            <div className="featured" style={{ ['--c' as string]: catVar(featured.category) }}>
              <Photo url={featuredImg!.url} category={featured.category} />
              <a className="featured-link" href={href('recipe', featured.id)} aria-label={`Open ${featured.title}`} />
              <span className="overlay-chip">Tonight's pick</span>
              <div className="featured-body">
                <b className="featured-title">{featured.title}</b>
                <small className="featured-meta">
                  {CATEGORY_META[featured.category].short} · {featured.time.label} · {yieldText(featured, factorFor(featured.id))}
                </small>
                <button type="button" className="btn btn-primary featured-btn" onClick={() => go('cook', featured.id, 0)}>
                  <UtensilsCrossed size={18} aria-hidden="true" /> Start cooking
                </button>
              </div>
            </div>
          )}

          <SectionHead title="Categories" />
          <div className="cat-grid">
            {CATEGORIES.map(c => {
              const cover = coverFor(c);
              const n = counts[c] ?? 0;
              return (
                <a key={c} className="cat-tile" href={href('category', c)} style={{ ['--c' as string]: catVar(c) }}>
                  <Photo url={cover.url} category={c} />
                  <span className="cat-tile-text">
                    <b>{c}</b>
                    <small>{n} {n === 1 ? 'recipe' : 'recipes'}</small>
                  </span>
                </a>
              );
            })}
          </div>

          <button
            type="button"
            className="az-toggle"
            aria-expanded={showAll}
            aria-controls="all-recipes"
            onClick={() => setShowAll(!showAll)}
          >
            <span>
              <b>All recipes, A to Z</b>
              <small className="muted">{recipes.length} recipes</small>
            </span>
            <span className="az-toggle-action">{showAll ? 'Hide' : 'Show'} <ChevronDown size={20} aria-hidden="true" className={showAll ? 'flip' : ''} /></span>
          </button>
          {showAll && (
            <div id="all-recipes">
              <div className="chips scroll-x" role="group" aria-label="Filter by appliance">
                {APPLIANCES.map(a => (
                  <button
                    key={a.id}
                    type="button"
                    className={`chip ${appliance === a.id ? 'on' : ''}`}
                    aria-pressed={appliance === a.id}
                    onClick={() => setAppliance(a.id)}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
              <div className="az">
                {az.map(g => (
                  <section key={g.letter} aria-label={g.letter}>
                    <h3 className="letter">{g.letter}</h3>
                    <div className="rows">{g.recipes.map(r => <RecipeRow key={r.id} recipe={r} />)}</div>
                  </section>
                ))}
                {!az.length && <p className="empty">No recipes use that appliance yet.</p>}
              </div>
            </div>
          )}

          {lastCooked.length > 0 && (
            <>
              <SectionHead title="Last cooked" />
              <div className="card-strip">
                {lastCooked.map(({ r, date }) => <RecipeCard key={r.id} recipe={r} sub={`Cooked ${niceDate(date)}`} />)}
              </div>
            </>
          )}

          <a className="link-row" href={href('ideas')}>
            <Lightbulb size={22} aria-hidden="true" />
            <span><b>Ideas to write up</b><small className="muted">{ideas.ideas.length} ideas</small></span>
            <ChevronRight size={20} aria-hidden="true" />
          </a>

          <details className="legend">
            <summary>How the confidence flags work</summary>
            {Object.entries(FLAGS).map(([level, f]) => (
              <p key={level}><Flag level={level as keyof typeof FLAGS} small /> {f.legend}</p>
            ))}
            <p className="muted">Thermomix speeds, times and temperatures are written for a TM5 or TM6. Steps of a minute or more have a timer button.</p>
          </details>

          {recent.length > 0 && (
            <>
              <SectionHead title="Recently added" />
              <div className="rows">{recent.map(r => <RecipeRow key={r.id} recipe={r} sub={`Added ${niceDate(r.added!)}`} />)}</div>
            </>
          )}
        </>
      )}
    </div>
  );
}
