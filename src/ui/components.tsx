// Shared building blocks: photos, flags, cards, rows, sheets, steppers.
import { useEffect, useState, type ReactNode } from 'react';
import {
  Apple, CakeSlice, Check, ChevronLeft, Egg, Fish, Flame, Heart, Leaf, Package, PencilLine, Salad, Soup, X,
  type LucideIcon
} from 'lucide-react';
import type { Category, ConfidenceLevel, Recipe } from '../types';
import { type Badge, useApp } from '../data/store';
import { yieldText } from '../lib/scale';
import { back, go, href } from './router';

/* ---------------- Categories ---------------- */

export const CATEGORY_META: Record<Category, { slug: string; icon: LucideIcon; short: string }> = {
  'Asian': { slug: 'asian', icon: Soup, short: 'Asian' },
  'Mexican': { slug: 'mex', icon: Flame, short: 'Mexican' },
  'Mediterranean & Middle Eastern': { slug: 'med', icon: Leaf, short: 'Mediterranean' },
  'Fish & Seafood': { slug: 'fish', icon: Fish, short: 'Fish & Seafood' },
  'Salads & Sides': { slug: 'salad', icon: Salad, short: 'Salads & Sides' },
  'Light Meals': { slug: 'light', icon: Egg, short: 'Light Meals' },
  'Easy & Healthy': { slug: 'easy', icon: Apple, short: 'Easy & Healthy' },
  'Baking & Sweets': { slug: 'sweet', icon: CakeSlice, short: 'Baking & Sweets' },
  'Basics & Blends': { slug: 'basic', icon: Package, short: 'Basics & Blends' },
  'Drafts to finish': { slug: 'draft', icon: PencilLine, short: 'Drafts' }
};

export const catVar = (c: Category) => `var(--cat-${CATEGORY_META[c].slug})`;

/* ---------------- Flags ---------------- */

export const FLAGS: Record<ConfidenceLevel, { label: string; legend: string }> = {
  tested: { label: 'Tested', legend: 'Cooked and confirmed in your kitchen.' },
  sourced: { label: 'Source-verified', legend: 'Amounts came from a named source or a cross-referenced blend.' },
  estimated: { label: 'Estimated', legend: 'Method is sourced or standard technique, but some quantities or timings are a best estimate.' },
  gated: { label: 'Source method gated', legend: 'Ingredients are verified, but the official steps sit behind a subscription.' },
  guidance: { label: 'Guidance-based', legend: 'Built live or from general guidance, so amounts are a starting point.' },
  draft: { label: 'Draft', legend: 'Not finished. Some amounts were never written down.' }
};

export function Flag({ level, onClick, small }: { level: ConfidenceLevel; onClick?: () => void; small?: boolean }) {
  const cls = `flag flag-${level}${small ? ' small' : ''}`;
  if (!onClick) return <span className={cls}>{FLAGS[level].label}</span>;
  return (
    <button type="button" className={cls} onClick={onClick} aria-label={`${FLAGS[level].label}. Show details`}>
      {FLAGS[level].label}
      <span className="flag-more" aria-hidden="true">Details</span>
    </button>
  );
}

export function BadgeChip({ badge }: { badge?: Badge }) {
  if (!badge) return null;
  return <span className={`badge badge-${badge}`}>{badge === 'new' ? 'New' : 'Updated'}</span>;
}

/* ---------------- Photos ---------------- */

export function Photo({ url, category, alt = '', className = '' }: { url: string | null; category: Category; alt?: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  const Icon = CATEGORY_META[category].icon;
  if (!url || failed) {
    return (
      <div className={`photo photo-empty ${className}`} style={{ ['--c' as string]: catVar(category) }} aria-hidden="true">
        <Icon size={32} strokeWidth={1.5} />
      </div>
    );
  }
  return <img className={`photo ${className}`} src={url} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}

/* ---------------- Recipe card (grid) and row (list) ---------------- */

export function FavButton({ id, className = '' }: { id: string; className?: string }) {
  const { prefs, updatePrefs } = useApp();
  const on = prefs.fav.includes(id);
  return (
    <button
      type="button"
      className={`fav ${on ? 'on' : ''} ${className}`}
      aria-pressed={on}
      aria-label={on ? 'Remove from saved' : 'Save recipe'}
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        updatePrefs(p => ({ ...p, fav: on ? p.fav.filter(x => x !== id) : [...p.fav, id] }));
      }}
    >
      <Heart size={18} fill={on ? 'currentColor' : 'none'} />
    </button>
  );
}

export function RecipeCard({ recipe, sub }: { recipe: Recipe; sub?: string }) {
  const { imageFor, badges } = useApp();
  const img = imageFor(recipe);
  return (
    <a className="card" href={href('recipe', recipe.id)}>
      <div className="card-img">
        <Photo url={img.url} category={recipe.category} />
        <span className="card-flag"><Flag level={recipe.confidence.level} small /></span>
        <FavButton id={recipe.id} className="card-fav" />
      </div>
      <div className="card-body">
        <small className="muted">{sub ?? recipe.time.label}</small>
        <b className="card-title">{recipe.title}</b>
        <BadgeChip badge={badges[recipe.id]} />
      </div>
    </a>
  );
}

export function RecipeRow({ recipe, sub, children }: { recipe: Recipe; sub?: string; children?: ReactNode }) {
  const { imageFor, badges, factorFor } = useApp();
  const img = imageFor(recipe);
  return (
    <div className="row-wrap">
      <a className="row" href={href('recipe', recipe.id)}>
        <Photo url={img.url} category={recipe.category} className="row-img" />
        <span className="row-body">
          <b className="row-title">{recipe.title}</b>
          <small className="muted">
            {sub ?? [recipe.time.label !== 'Not recorded' ? recipe.time.label : null, recipe.confidence.level === 'draft' ? null : yieldText(recipe, factorFor(recipe.id))].filter(Boolean).join(' · ')}
          </small>
          <span className="row-tags">
            <Flag level={recipe.confidence.level} small />
            <BadgeChip badge={badges[recipe.id]} />
          </span>
        </span>
      </a>
      {children}
    </div>
  );
}

/* ---------------- Layout pieces ---------------- */

export function ScreenHeader({ title, sub, backTo }: { title: string; sub?: string; backTo?: () => void }) {
  return (
    <header className="screen-head">
      {backTo !== undefined && (
        <button type="button" className="icon-btn" aria-label="Back" onClick={() => back(backTo)}>
          <ChevronLeft size={24} />
        </button>
      )}
      <div>
        <h1 className="screen-title">{title}</h1>
        {sub && <p className="muted screen-sub">{sub}</p>}
      </div>
    </header>
  );
}

export function SectionHead({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      {action}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><X size={22} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** A button that needs a second tap within 4 seconds to act. */
export function ConfirmButton({ label, confirmLabel, onConfirm, className = '' }: { label: string; confirmLabel: string; onConfirm: () => void; className?: string }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      type="button"
      className={`btn ${armed ? 'btn-warn' : 'btn-quiet'} ${className}`}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else setArmed(true);
      }}
    >
      {armed ? confirmLabel : label}
    </button>
  );
}

export function Tick({ on }: { on: boolean }) {
  return <span className={`tick ${on ? 'on' : ''}`} aria-hidden="true">{on && <Check size={16} strokeWidth={3} />}</span>;
}

export function goHome() {
  go();
}
