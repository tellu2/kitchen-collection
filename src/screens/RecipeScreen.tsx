import { useMemo, useRef, useState } from 'react';
import { Camera, CalendarCheck, CalendarPlus, Check, ChevronLeft, Clock, ListPlus, Minus, Plus, Timer, Users, UtensilsCrossed } from 'lucide-react';
import type { Recipe } from '../types';
import { useApp } from '../data/store';
import { formatAmount } from '../lib/format';
import { niceDate, spoonHint } from '../lib/misc';
import { scaleKind, scaleLimits, scaleNote, stepFactor, yieldText } from '../lib/scale';
import { addItems, itemsFor } from '../lib/shopping';
import { ingredientMap } from '../lib/tokens';
import { BadgeChip, CATEGORY_META, Empty, FavButton, Flag, Photo, RecipeCard, Sheet, Tick, catVar } from '../ui/components';
import { useTimers, useToast } from '../ui/feedback';
import { NoteText, StepText } from '../ui/StepText';
import { back, go, href } from '../ui/router';
import { shrinkImage } from '../ui/photos';

const APPLIANCE_LABEL: Record<string, string> = {
  'thermomix': 'Thermomix', 'air-fryer': 'Air fryer', 'oven': 'Oven', 'stovetop': 'Stovetop', 'none': 'No cooking'
};

type Tab = 'ingredients' | 'method' | 'notes';

// Ticks are kept per recipe for the session only, as legacy did
const sessionTicks = new Map<string, { ing: Set<string>; step: Set<number> }>();

export function RecipeScreen({ id }: { id: string }) {
  const { byId, prefs, updatePrefs, imageFor, factorFor, lookups, badges, setPhoto } = useApp();
  const recipe = byId[id];
  const toast = useToast();
  const { start } = useTimers();
  const [tab, setTab] = useState<Tab>('ingredients');
  const [flagOpen, setFlagOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [, force] = useState(0);
  const ingMap = useMemo(() => (recipe ? ingredientMap(recipe) : new Map()), [recipe]);

  if (!recipe) {
    return (
      <div className="screen">
        <Empty>That recipe is not in the collection. It may have been removed in the latest update.</Empty>
        <a className="btn btn-quiet" href={href()}>Back to recipes</a>
      </div>
    );
  }

  if (!sessionTicks.has(id)) sessionTicks.set(id, { ing: new Set(), step: new Set() });
  const ticks = sessionTicks.get(id)!;
  const toggleTick = <T,>(set: Set<T>, v: T) => {
    if (set.has(v)) set.delete(v);
    else set.add(v);
    force(x => x + 1);
  };

  const factor = factorFor(id);
  const kind = scaleKind(recipe);
  const limits = scaleLimits(recipe, factor);
  const img = imageFor(recipe);
  const cooked = prefs.cooked[id];
  const pairings = (recipe.pairings ?? []).map(p => byId[p]).filter(Boolean) as Recipe[];
  const plainCount = recipe.ingredientGroups.reduce((n, g) => n + g.items.length, 0);
  const isDraft = recipe.confidence.level === 'draft';

  const setFactor = (f: number) =>
    updatePrefs(p => {
      const serves = { ...p.serves };
      if (Math.abs(f - 1) < 1e-9) delete serves[id];
      else serves[id] = f;
      return { ...p, serves };
    });

  const addToList = () => {
    const items = itemsFor(recipe, factor, lookups);
    const { list, added } = addItems(prefs.shop, items);
    updatePrefs(p => ({ ...p, shop: list }));
    toast(added ? `${added} items added to the list.` : 'Already on the list.');
  };

  const markCooked = () => {
    updatePrefs(p => ({
      ...p,
      cooked: { ...p.cooked, [id]: new Date().toISOString().slice(0, 10) },
      today: p.today.filter(x => x !== id)
    }));
    toast('Logged as cooked today.');
  };

  const planned = prefs.today.includes(id);
  const toggleToday = () => {
    updatePrefs(p => ({ ...p, today: planned ? p.today.filter(x => x !== id) : [...p.today, id] }));
    toast(planned ? 'Taken off Cooking today.' : 'Added to Cooking today on Home.');
  };

  const buildMeal = () => {
    updatePrefs(p => ({ ...p, meal: [...new Set([...p.meal, id, ...pairings.map(r => r.id)])] }));
    toast('Meal built. Send the ingredients to the list when ready.');
    go('meal');
  };

  const onPhoto = async (file?: File) => {
    if (!file) return;
    try {
      await setPhoto(id, await shrinkImage(file));
      toast('Photo saved on this phone.');
    } catch {
      toast('That image could not be read. Try a JPEG or PNG.');
    }
  };

  return (
    <div className="screen recipe" style={{ ['--c' as string]: catVar(recipe.category) }}>
      <div className="hero">
        <Photo url={img.url} category={recipe.category} alt="" />
        <button type="button" className="icon-btn raised hero-back" aria-label="Back" onClick={() => back(() => go('category', recipe.category))}>
          <ChevronLeft size={24} />
        </button>
        <div className="hero-actions">
          <button type="button" className="icon-btn raised" aria-label={img.mine ? 'Change or remove your photo' : 'Add your own photo'} onClick={() => (img.mine ? setPhotoOpen(true) : fileRef.current?.click())}>
            <Camera size={20} />
          </button>
          <FavButton id={id} className="icon-btn raised" />
        </div>
        {img.credit && !img.mine && (
          <p className="hero-credit">
            Stock photo of a similar dish ·{' '}
            {img.credit.url ? <a href={img.credit.url} target="_blank" rel="noopener noreferrer">{img.credit.name}</a> : img.credit.name} / {img.credit.source}
          </p>
        )}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => { void onPhoto(e.target.files?.[0]); e.target.value = ''; }} />
      </div>

      <div className="recipe-sheet">
        {/* Kept short so the ingredients and method start high on the screen */}
        <h1 className="recipe-title">{recipe.title}</h1>
        <div className="meta">
          {recipe.time.label !== 'Not recorded' && <span><Clock size={16} aria-hidden="true" /> {recipe.time.label}</span>}
          {!isDraft && <span><Users size={16} aria-hidden="true" /> {yieldText(recipe, factor)}</span>}
          <Flag level={recipe.confidence.level} small onClick={() => setFlagOpen(true)} />
          <BadgeChip badge={badges[id]} />
        </div>

        <div className="recipe-actions">
          <button type="button" className="btn btn-primary act-main" disabled={!recipe.steps.length} onClick={() => go('cook', id, 0)}>
            <UtensilsCrossed size={20} aria-hidden="true" /> Start cooking
          </button>
          <button type="button" className="btn btn-quiet act" disabled={isDraft} onClick={addToList} aria-label="Add to shopping list">
            <ListPlus size={20} aria-hidden="true" /><span>List</span>
          </button>
          <button type="button" className={`btn act ${planned ? 'btn-on' : 'btn-quiet'}`} aria-pressed={planned} disabled={isDraft} onClick={toggleToday} aria-label={planned ? 'Cooking today, tap to remove' : 'Cook today'}>
            {planned ? <CalendarCheck size={20} aria-hidden="true" /> : <CalendarPlus size={20} aria-hidden="true" />}<span>Today</span>
          </button>
          <button type="button" className={`btn act ${cooked === new Date().toISOString().slice(0, 10) ? 'btn-on' : 'btn-quiet'}`} onClick={markCooked} aria-label="Mark as cooked today">
            <Check size={20} aria-hidden="true" /><span>Cooked</span>
          </button>
        </div>

        <div className="tabs" role="tablist">
          {(['ingredients', 'method', 'notes'] as Tab[]).map(t => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
              {t === 'ingredients' ? 'Ingredients' : t === 'method' ? 'Method' : 'About'}
            </button>
          ))}
        </div>

        {tab === 'ingredients' && (
          <section className="tab-body">
            {kind && (
              <div className="scaler">
                <span className="stepper">
                  <button type="button" aria-label="Fewer" disabled={limits.min} onClick={() => setFactor(stepFactor(recipe, factor, -1))}><Minus size={20} /></button>
                  <output aria-live="polite">{yieldText(recipe, factor)}</output>
                  <button type="button" aria-label="More" disabled={limits.max} onClick={() => setFactor(stepFactor(recipe, factor, 1))}><Plus size={20} /></button>
                </span>
                {factor !== 1 && <button type="button" className="link" onClick={() => setFactor(1)}>Reset</button>}
              </div>
            )}
            {scaleNote(recipe, factor) && <p className="scale-note">{scaleNote(recipe, factor)}</p>}
            {plainCount ? <p className="muted small">{ticks.ing.size} of {plainCount} gathered</p> : <Empty>No ingredients recorded yet.</Empty>}
            {recipe.ingredientGroups.map((g, gi) => (
              <div key={gi}>
                {g.title && <h3 className="group-title">{g.title}</h3>}
                <ul className="ing-list">
                  {g.items.map(ing => {
                    const on = ticks.ing.has(ing.id);
                    const amount = formatAmount(ing, factor);
                    const hint = spoonHint(ing, factor, prefs.tbsp);
                    return (
                      <li key={ing.id}>
                        <button type="button" className={`ing ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => toggleTick(ticks.ing, ing.id)}>
                          <Tick on={on} />
                          <span className="ing-text">
                            {amount && <b className="amt">{amount}</b>} {ing.item}
                            {ing.prep && <>, {ing.prep}</>}
                            {ing.optional && <span className="muted"> (optional)</span>}
                            {ing.note && <span className="ing-note">{ing.note}</span>}
                            {hint && <span className="ing-hint">{hint}</span>}
                          </span>
                        </button>
                        {ing.recipeRef && byId[ing.recipeRef] && (
                          <a className="ing-ref" href={href('recipe', ing.recipeRef)}>See the {byId[ing.recipeRef].title} recipe</a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            {ticks.ing.size > 0 && (
              <button type="button" className="btn btn-quiet" onClick={() => { ticks.ing.clear(); force(x => x + 1); }}>Clear the ticks</button>
            )}
            {pairings.length > 0 && (
              <div className="pairings">
                <h3 className="group-title">Goes with</h3>
                <div className="card-strip">{pairings.map(p => <RecipeCard key={p.id} recipe={p} />)}</div>
                <button type="button" className="btn btn-outline full" onClick={buildMeal}>Build a meal from these</button>
              </div>
            )}
          </section>
        )}

        {tab === 'method' && (
          <section className="tab-body">
            {recipe.methodLabel && <p className="method-label">{recipe.methodLabel}</p>}
            {!recipe.steps.length && <Empty>No method recorded yet.</Empty>}
            <ol className="steps">
              {recipe.steps.map((s, i) => {
                const on = ticks.step.has(i);
                const secs = s.settings?.timerSeconds;
                return (
                  <li key={i}>
                    <button type="button" className={`step ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => toggleTick(ticks.step, i)}>
                      <span className="step-n" aria-hidden="true">{on ? '✓' : i + 1}</span>
                      <span className="step-text">
                        {s.title && <b className="step-title">{s.title}. </b>}
                        <StepText text={s.text} ingredients={ingMap} factor={factor} />
                      </span>
                    </button>
                    {secs ? (
                      <button type="button" className="timer-start" onClick={() => start(secs, `${recipe.title}, step ${i + 1}`)}>
                        <Timer size={18} aria-hidden="true" /> Start {Math.round(secs / 60)} min timer
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ol>
            {ticks.step.size > 0 && (
              <button type="button" className="btn btn-quiet" onClick={() => { ticks.step.clear(); force(x => x + 1); }}>Clear the ticks</button>
            )}
          </section>
        )}

        {tab === 'notes' && (
          <section className="tab-body">
            <div className="pills">
              <a className="pill pill-cat" href={href('category', recipe.category)}>{CATEGORY_META[recipe.category].short}</a>
              {recipe.appliances.map(a => <span key={a} className="pill">{APPLIANCE_LABEL[a]}</span>)}
            </div>
            {recipe.description && <p className="description">{recipe.description}</p>}
            {cooked && <p className="muted small"><CalendarCheck size={16} aria-hidden="true" /> Last cooked {niceDate(cooked)}</p>}
            <button type="button" className="link" onClick={() => setFlagOpen(true)}>How sure is this recipe?</button>
            {recipe.source && (
              <p className="credit">
                Source: {recipe.source.url ? <a href={recipe.source.url} target="_blank" rel="noopener noreferrer">{recipe.source.name}</a> : recipe.source.name}
                {recipe.source.note ? ` · ${recipe.source.note}` : ''}
              </p>
            )}
            {recipe.nutrition && (
              <div className="nutrition">
                <p className="muted small">{recipe.nutrition.basis} · From the source, not checked</p>
                <div className="nutri-row">
                  {(['calories', 'protein', 'carbs', 'fat', 'fibre'] as const).map(k =>
                    recipe.nutrition![k] != null ? (
                      <span key={k}><b>{recipe.nutrition![k]}{k === 'calories' ? '' : 'g'}</b><small>{k === 'calories' ? 'Cal' : k[0].toUpperCase() + k.slice(1)}</small></span>
                    ) : null
                  )}
                </div>
              </div>
            )}
            {recipe.notes?.length ? (
              <>
                <h3 className="group-title">Notes</h3>
                {recipe.notes.map((n, i) => (
                  <div key={i} className="note">
                    <b>{n.title}</b>
                    {n.text && <p><NoteText text={n.text} /></p>}
                    {n.items && <ul>{n.items.map((x, j) => <li key={j}>{x}</li>)}</ul>}
                  </div>
                ))}
              </>
            ) : null}
          </section>
        )}
      </div>

      <Sheet open={flagOpen} onClose={() => setFlagOpen(false)} title="How sure is this recipe?">
        <Flag level={recipe.confidence.level} />
        <p>{recipe.confidence.note}</p>
        {recipe.source && <p className="muted">Source: {recipe.source.name}{recipe.source.note ? ` · ${recipe.source.note}` : ''}</p>}
        {img.credit && !img.mine && <p className="muted small">Photo: {img.credit.name} / {img.credit.source}. A stock photo of a similar dish, not this exact recipe.</p>}
      </Sheet>

      <Sheet open={photoOpen} onClose={() => setPhotoOpen(false)} title="Your photo">
        <p className="muted">Your photo stays on this phone.</p>
        <div className="sheet-actions">
          <button type="button" className="btn btn-primary" onClick={() => { setPhotoOpen(false); fileRef.current?.click(); }}>Choose a different photo</button>
          <button type="button" className="btn btn-outline" onClick={() => { setPhotoOpen(false); void setPhoto(id, null); toast('Your photo was removed.'); }}>Remove my photo</button>
        </div>
      </Sheet>
    </div>
  );
}
