import { useEffect, useMemo, useRef } from 'react';
import { RotateCcw, Thermometer, Timer, Gauge, Wrench, X } from 'lucide-react';
import { useApp } from '../data/store';
import { renderStep, ingredientMap, tokenIds } from '../lib/tokens';
import { Empty, catVar } from '../ui/components';
import { useTimers, useToast } from '../ui/feedback';
import { StepText } from '../ui/StepText';
import { go, replace } from '../ui/router';
import { keepAwake } from '../ui/keepAwake';

export function CookingScreen({ id, step }: { id: string; step: number }) {
  const { byId, factorFor, updatePrefs } = useApp();
  const recipe = byId[id];
  const { start } = useTimers();
  const toast = useToast();
  const touchX = useRef<number | null>(null);
  const ingMap = useMemo(() => (recipe ? ingredientMap(recipe) : new Map()), [recipe]);

  useEffect(() => {
    let release: () => void = () => {};
    let cancelled = false;
    void keepAwake.on().then(r => (cancelled ? r() : (release = r)));
    return () => {
      cancelled = true;
      release();
    };
  }, []);

  if (!recipe || !recipe.steps.length) {
    return <div className="screen"><Empty>Nothing to cook here.</Empty></div>;
  }

  const n = recipe.steps.length;
  const i = Math.min(step, n - 1);
  const s = recipe.steps[i];
  const factor = factorFor(id);
  const parts = renderStep(s.text, ingMap, factor);
  const needs = tokenIds(s.text)
    .map(tid => {
      const ing = ingMap.get(tid);
      const amount = parts.find(p => p.kind === 'amount' && p.ingredientId === tid)?.text;
      return ing && amount ? { id: tid, amount, item: ing.item } : null;
    })
    .filter(Boolean) as { id: string; amount: string; item: string }[];
  const set = s.settings;
  const label = `${recipe.title}, step ${i + 1}`;

  const goStep = (k: number) => replace('cook', id, Math.max(0, Math.min(n - 1, k)));
  const finish = () => {
    updatePrefs(p => ({ ...p, cooked: { ...p.cooked, [id]: new Date().toISOString().slice(0, 10) } }));
    toast('Logged as cooked today.');
    go('recipe', id);
  };

  return (
    <div
      className="cook"
      style={{ ['--c' as string]: catVar(recipe.category) }}
      onTouchStart={e => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={e => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (dx < -70 && i < n - 1) goStep(i + 1);
        if (dx > 70 && i > 0) goStep(i - 1);
      }}
    >
      <header className="cook-top">
        <button type="button" className="icon-btn" aria-label="Close cooking mode" onClick={() => go('recipe', id)}><X size={26} /></button>
        <b className="cook-name">{recipe.title}</b>
        <span className="cook-count">Step {i + 1} of {n}</span>
      </header>
      <div className="cook-progress" role="progressbar" aria-valuemin={1} aria-valuemax={n} aria-valuenow={i + 1}>
        <i style={{ width: `${((i + 1) / n) * 100}%` }} />
      </div>

      <main className="cook-body">
        {s.title && <h2 className="cook-step-title">{s.title}</h2>}
        {needs.length > 0 && (
          <div className="needs" aria-label="You'll need">
            {needs.map(x => <span key={x.id} className="need"><b>{x.amount}</b> {x.item}</span>)}
          </div>
        )}
        <p className="cook-text"><StepText text={s.text} ingredients={ingMap} factor={factor} /></p>

        {set && (set.time || set.temp || set.speed || set.reverse || set.accessory) && (
          <div className="cook-settings">
            {set.time && (
              set.timerSeconds ? (
                <button type="button" className="setting setting-time" onClick={() => start(set.timerSeconds!, label)}>
                  <small><Timer size={16} aria-hidden="true" /> Time · tap to start</small>
                  <b>{set.time}</b>
                </button>
              ) : (
                <div className="setting"><small><Timer size={16} aria-hidden="true" /> Time</small><b>{set.time}</b></div>
              )
            )}
            {set.temp && <div className="setting"><small><Thermometer size={16} aria-hidden="true" /> Temperature</small><b>{set.temp}</b></div>}
            {set.speed && <div className="setting"><small><Gauge size={16} aria-hidden="true" /> Speed</small><b>{set.speed}</b></div>}
            {set.reverse && <div className="setting"><small><RotateCcw size={16} aria-hidden="true" /> Direction</small><b>Reverse</b></div>}
            {set.accessory && <div className="setting setting-wide"><small><Wrench size={16} aria-hidden="true" /> Accessory</small><b className="small-b">{set.accessory}</b></div>}
          </div>
        )}
        {factor !== 1 && <p className="muted small">Amounts scaled. Times, temperatures and settings are as written.</p>}
      </main>

      <footer className="cook-nav">
        <button type="button" className="btn btn-outline big" disabled={i === 0} onClick={() => goStep(i - 1)}>Previous</button>
        {i < n - 1 ? (
          <button type="button" className="btn btn-primary big" onClick={() => goStep(i + 1)}>Next step</button>
        ) : (
          <button type="button" className="btn btn-primary big" onClick={finish}>Finish and log</button>
        )}
      </footer>
    </div>
  );
}
