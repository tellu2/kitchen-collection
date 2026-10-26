import { useMemo, useState } from 'react';
import { ChevronRight, Copy, Save } from 'lucide-react';
import { useApp } from '../data/store';
import { niceDate } from '../lib/misc';
import { arrange, groupList, listAsText, removeSource, setGroupDone, sources, type ShopGroup } from '../lib/shopping';
import { ConfirmButton, Empty, ScreenHeader, SectionHead, Sheet, Tick } from '../ui/components';
import { useToast } from '../ui/feedback';
import { href } from '../ui/router';

const MAX_LISTS = 12;

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

function RecipeLink({ id, label }: { id: string; label: string }) {
  return (
    <a className="shop-from" href={href('recipe', id)}>
      {label} <ChevronRight size={14} aria-hidden="true" />
    </a>
  );
}

/** Tap the item to tick it; tap the recipe name under it to open that recipe. */
function GroupItem({ g, onToggle }: { g: ShopGroup; onToggle: () => void }) {
  const single = g.items.length === 1;
  return (
    <div className={`shop-item ${g.done ? 'on' : ''}`}>
      <button type="button" className="shop-toggle" aria-pressed={g.done} onClick={onToggle}>
        <Tick on={g.done} />
        <span className="shop-main">
          {single ? g.items[0].t : <><b>{g.label}</b>{g.total && <span className="shop-total">{g.total} total</span>}</>}
        </span>
      </button>
      <div className="shop-subs">
        {g.items.map((it, i) => (
          <div key={i} className="shop-sub">
            {!single && <span className="shop-amount">{it.t}</span>}
            <RecipeLink id={it.recipeId} label={it.from} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ListScreen() {
  const { prefs, updatePrefs, lookups } = useApp();
  const toast = useToast();
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState('');
  const groups = useMemo(() => groupList(prefs.shop), [prefs.shop]);
  const { open, ticked } = useMemo(() => arrange(groups, lookups.aisleOrder), [groups, lookups.aisleOrder]);
  const srcs = sources(prefs.shop);

  const toggle = (g: ShopGroup) => updatePrefs(p => ({ ...p, shop: setGroupDone(p.shop, g.key, !g.done) }));

  const save = () => {
    const n = name.trim() || `Shop ${niceDate(new Date().toISOString())}`;
    updatePrefs(p => ({ ...p, lists: [{ name: n, date: new Date().toISOString(), items: p.shop }, ...p.lists].slice(0, MAX_LISTS) }));
    setSaveOpen(false);
    toast('List saved.');
  };

  return (
    <div className="screen list">
      <ScreenHeader
        title="Shopping list"
        sub={prefs.shop.length ? `${groups.length} ${groups.length === 1 ? 'item' : 'items'}${ticked.length ? ` · ${ticked.length} ticked` : ''} · aisle order` : undefined}
      />

      {!prefs.shop.length ? (
        <Empty>Empty. Open a recipe and tap Add to list, or build a meal and send the lot across.</Empty>
      ) : (
        <>
          {open.map(s => (
            <section key={s.aisle} className="aisle">
              <h3 className="aisle-title">{s.aisle}</h3>
              <div className="aisle-card">{s.groups.map(g => <GroupItem key={g.key} g={g} onToggle={() => toggle(g)} />)}</div>
            </section>
          ))}
          {ticked.length > 0 && (
            <section className="aisle ticked">
              <h3 className="aisle-title">Ticked off</h3>
              <div className="aisle-card">{ticked.map(g => <GroupItem key={g.key} g={g} onToggle={() => toggle(g)} />)}</div>
            </section>
          )}

          <div className="action-row">
            <button type="button" className="btn btn-outline" onClick={async () => toast((await copy(listAsText(prefs.shop, lookups.aisleOrder))) ? 'List copied.' : 'Copy failed. Select and copy by hand.')}>
              <Copy size={18} aria-hidden="true" /> Copy as text
            </button>
            <button type="button" className="btn btn-outline" onClick={() => { setName(`Shop ${niceDate(new Date().toISOString())}`); setSaveOpen(true); }}>
              <Save size={18} aria-hidden="true" /> Save this list
            </button>
            <ConfirmButton label="Clear the list" confirmLabel="Tap again to clear" onConfirm={() => updatePrefs(p => ({ ...p, shop: [] }))} />
          </div>

          <SectionHead title="Recipes on this list" />
          <div className="source-list">
            {srcs.map(s => (
              <div key={s.from} className="source-row">
                <a className="source-link" href={href('recipe', s.recipeId)}>
                  <span className="source-name">{s.from}</span>
                  <small className="muted">{s.n} {s.n === 1 ? 'line' : 'lines'}{s.done ? ` · ${s.done} ticked` : ''} · Open recipe</small>
                </a>
                <ConfirmButton
                  label="Remove"
                  confirmLabel="Tap again to remove"
                  onConfirm={() => {
                    updatePrefs(p => ({ ...p, shop: removeSource(p.shop, s.from) }));
                    toast(`Removed ${s.n} lines from ${s.from}.`);
                  }}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {prefs.lists.length > 0 && (
        <>
          <SectionHead title="Saved lists" />
          <div className="source-list">
            {prefs.lists.map((l, i) => (
              <div key={i} className="source-row">
                <span>
                  <span className="source-name">{l.name}</span>
                  <small className="muted">{l.items.length} items · {niceDate(l.date)}</small>
                </span>
                <button
                  type="button"
                  className="btn btn-quiet"
                  onClick={() => {
                    updatePrefs(p => ({ ...p, shop: l.items.map(x => ({ ...x })) }));
                    toast(`Loaded ${l.name}.`);
                  }}
                >
                  Load
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <Sheet open={saveOpen} onClose={() => setSaveOpen(false)} title="Save this list">
        <label className="field">
          <span>List name</span>
          <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()} autoFocus />
        </label>
        <p className="muted small">Keeps the 12 most recent saved lists.</p>
        <button type="button" className="btn btn-primary full" onClick={save}>Save list</button>
      </Sheet>
    </div>
  );
}
