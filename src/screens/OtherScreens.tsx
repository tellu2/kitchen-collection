// Meal, Saved, Ideas and Settings.
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { Recipe } from '../types';
import { type Theme, useApp } from '../data/store';
import { APP_VERSION, BUILD_TIME } from '../data/bundle';
import { niceDate } from '../lib/misc';
import { DEFAULT_SOURCE } from '../config';
import { addItems, itemsFor } from '../lib/shopping';
import { Empty, RecipeCard, ScreenHeader, SectionHead } from '../ui/components';
import { useToast } from '../ui/feedback';
import { go, href } from '../ui/router';

export function MealScreen() {
  const { prefs, byId, updatePrefs, lookups, factorFor } = useApp();
  const toast = useToast();
  const dishes = prefs.meal.map(id => byId[id]).filter(Boolean) as Recipe[];

  const send = () => {
    let list = prefs.shop;
    let added = 0;
    for (const r of dishes) {
      const res = addItems(list, itemsFor(r, factorFor(r.id), lookups));
      list = res.list;
      added += res.added;
    }
    updatePrefs(p => ({ ...p, shop: list }));
    toast(added ? `${added} items added.` : 'Already on the list.');
    go('list');
  };

  return (
    <div className="screen">
      <ScreenHeader title="Meal" sub={dishes.length ? `${dishes.length} ${dishes.length === 1 ? 'dish' : 'dishes'}` : undefined} />
      {dishes.length ? (
        <>
          <div className="grid">{dishes.map(r => <RecipeCard key={r.id} recipe={r} />)}</div>
          <div className="action-row">
            <button type="button" className="btn btn-primary" onClick={send}>Send ingredients to the list</button>
            <button type="button" className="btn btn-quiet" onClick={() => updatePrefs(p => ({ ...p, meal: [] }))}>Clear the meal</button>
          </div>
        </>
      ) : (
        <Empty>No dishes yet. Open a recipe, look under Goes with on the Ingredients tab, and tap Build a meal from these.</Empty>
      )}
    </div>
  );
}

export function SavedScreen() {
  const { prefs, byId } = useApp();
  const saved = prefs.fav.map(id => byId[id]).filter(Boolean) as Recipe[];
  return (
    <div className="screen">
      <ScreenHeader title="Saved" sub={`${saved.length} ${saved.length === 1 ? 'recipe' : 'recipes'}`} />
      {saved.length ? (
        <div className="grid">{saved.map(r => <RecipeCard key={r.id} recipe={r} />)}</div>
      ) : (
        <Empty>Nothing saved yet. Tap the heart on any recipe to keep it here.</Empty>
      )}
    </div>
  );
}

export function IdeasScreen() {
  const { ideas } = useApp();
  const groups: string[] = [];
  for (const i of ideas.ideas) if (!groups.includes(i.group ?? 'Ideas')) groups.push(i.group ?? 'Ideas');
  return (
    <div className="screen">
      <ScreenHeader title="Ideas to write up" sub={ideas.description} backTo={() => go()} />
      {groups.map(g => (
        <section key={g}>
          <SectionHead title={g} />
          <div className="idea-list">
            {ideas.ideas.filter(i => (i.group ?? 'Ideas') === g).map(i => (
              <div key={i.title} className="idea">
                <b>{i.title}</b>
                {i.note && <p className="muted">{i.note}</p>}
              </div>
            ))}
          </div>
        </section>
      ))}
      <p className="muted small">Pick one and ask Claude to write it up as a full recipe.</p>
    </div>
  );
}

function Segmented<T extends string | number>({ value, options, onChange, label }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map(o => (
        <button key={String(o.v)} type="button" role="radio" aria-checked={value === o.v} className={value === o.v ? 'on' : ''} onClick={() => onChange(o.v)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SettingsScreen() {
  const { prefs, updatePrefs, sync, refresh, source, update, checkUpdates } = useApp();
  const [url, setUrl] = useState(prefs.sourceUrl);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const toast = useToast();

  return (
    <div className="screen settings">
      <ScreenHeader title="Settings" backTo={() => go()} />

      <section className="setting-block">
        <h2>Theme</h2>
        <Segmented<Theme>
          label="Theme"
          value={prefs.theme}
          onChange={v => updatePrefs(p => ({ ...p, theme: v }))}
          options={[{ v: 'light', label: 'Light' }, { v: 'dark', label: 'Dark' }, { v: 'system', label: 'Match phone' }]}
        />
      </section>

      <section className="setting-block">
        <h2>Tablespoon size</h2>
        <Segmented<15 | 20>
          label="Tablespoon size"
          value={prefs.tbsp}
          onChange={v => updatePrefs(p => ({ ...p, tbsp: v }))}
          options={[{ v: 20, label: 'Australian 20ml' }, { v: 15, label: 'International 15ml' }]}
        />
        <p className="muted small">Conversions show under any ingredient measured in spoons. The Australian tablespoon is 20ml, so recipes written for 15ml spoons need the second setting.</p>
      </section>

      <section className="setting-block">
        <h2>Recipes</h2>
        <p>Last synced: <b>{sync.lastSynced ? new Date(sync.lastSynced).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not yet'}</b></p>
        <button type="button" className="btn btn-outline" disabled={sync.syncing} onClick={() => void refresh()}>
          <RefreshCw size={18} aria-hidden="true" className={sync.syncing ? 'spin' : ''} /> {sync.syncing ? 'Refreshing' : 'Refresh recipes now'}
        </button>
        {sync.message && <p className="muted small" role="status">{sync.message}</p>}
        <p className="muted small">New and changed recipes come from <span className="break">{source}</span>. Pull down on the Recipes screen to check at any time.</p>
        <details className="advanced">
          <summary>Use a different recipe address</summary>
          <label className="field">
            <span>Recipe source address</span>
            <input type="url" inputMode="url" placeholder={DEFAULT_SOURCE} value={url} onChange={e => setUrl(e.target.value)} />
          </label>
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() => {
              updatePrefs(p => ({ ...p, sourceUrl: url.trim() }));
              toast(url.trim() ? 'Address saved. Tap Refresh recipes now.' : 'Back to the default address.');
            }}
          >
            Save address
          </button>
          <p className="muted small">Leave it empty to use the default.</p>
        </details>
      </section>

      <section className="setting-block">
        <h2>App updates</h2>
        <p>Installed: <b>version {APP_VERSION}</b></p>
        {update ? (
          <a className="btn btn-primary" href={update.url} target="_blank" rel="noopener noreferrer">Download version {update.version}</a>
        ) : (
          <button
            type="button"
            className="btn btn-outline"
            disabled={checking}
            onClick={async () => {
              setChecking(true);
              setUpdateMsg(await checkUpdates());
              setChecking(false);
            }}
          >
            {checking ? 'Checking' : 'Check for updates'}
          </button>
        )}
        {updateMsg && <p className="muted small" role="status">{updateMsg}</p>}
        <p className="muted small">After downloading, open the file and tap Update. Never uninstall first: that deletes your lists, favourites and photos.</p>
      </section>

      <section className="setting-block">
        <h2>About</h2>
        <p>Kitchen Collection {APP_VERSION}</p>
        <p className="muted small">Built {niceDate(BUILD_TIME)}. Stock photos from Pexels, credited on each recipe. Your own photos, lists and favourites stay on this phone.</p>
        <a className="link" href={href('ideas')}>Ideas to write up</a>
      </section>
    </div>
  );
}
