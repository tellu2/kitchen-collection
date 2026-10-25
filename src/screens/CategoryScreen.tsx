import { useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { CATEGORIES, type Category } from '../types';
import { useApp } from '../data/store';
import { byTitle, minutes } from '../lib/misc';
import { Empty, Photo, RecipeCard, catVar } from '../ui/components';
import { back } from '../ui/router';

type Sort = 'az' | 'quick' | 'protein';

export function CategoryScreen({ name }: { name: string }) {
  const { recipes, coverFor } = useApp();
  const category = (CATEGORIES as readonly string[]).includes(name) ? (name as Category) : null;
  const hasProtein = useMemo(() => recipes.some(r => r.category === category && r.nutrition?.protein != null), [recipes, category]);
  const [sort, setSort] = useState<Sort>('az');

  const list = useMemo(() => {
    const rs = recipes.filter(r => r.category === category);
    if (sort === 'quick') return rs.sort((a, b) => minutes(a) - minutes(b) || byTitle(a, b));
    if (sort === 'protein') return rs.sort((a, b) => (b.nutrition?.protein ?? -1) - (a.nutrition?.protein ?? -1) || byTitle(a, b));
    return rs.sort(byTitle);
  }, [recipes, category, sort]);

  if (!category) return <div className="screen"><Empty>That category was not found.</Empty></div>;
  const cover = coverFor(category);
  const sorts: { id: Sort; label: string }[] = [
    { id: 'az', label: 'A to Z' },
    { id: 'quick', label: 'Quickest' },
    ...(hasProtein ? [{ id: 'protein' as Sort, label: 'Most protein' }] : [])
  ];

  return (
    <div className="screen category" style={{ ['--c' as string]: catVar(category) }}>
      <div className="cat-hero">
        <Photo url={cover.url} category={category} />
        <button type="button" className="icon-btn raised hero-back" aria-label="Back" onClick={() => back()}>
          <ChevronLeft size={24} />
        </button>
        <div className="cat-hero-text">
          <h1>{category}</h1>
          <p>{list.length} {list.length === 1 ? 'recipe' : 'recipes'}</p>
        </div>
      </div>
      <div className="chips" role="group" aria-label="Sort">
        {sorts.map(s => (
          <button key={s.id} type="button" className={`chip ${sort === s.id ? 'on' : ''}`} aria-pressed={sort === s.id} onClick={() => setSort(s.id)}>
            {s.label}
          </button>
        ))}
      </div>
      {list.length ? (
        <div className="grid">
          {list.map(r => (
            <RecipeCard
              key={r.id}
              recipe={r}
              sub={sort === 'protein' && r.nutrition?.protein != null ? `${r.nutrition.protein}g protein · ${r.time.label}` : undefined}
            />
          ))}
        </div>
      ) : (
        <Empty>No recipes here yet.</Empty>
      )}
    </div>
  );
}
