// Background sync against the published data/ folder (GitHub Pages).
// Fetches index.json, downloads only new or changed recipes, refreshes the
// lookups and ideas, and fetches any photo the app does not already have.
import type { IdeasFile, IndexEntry, LookupFiles, Recipe, RecipeIndex } from '../types';

export interface CachedData {
  syncedAt: string;
  remoteIds: string[];
  recipes: Record<string, Recipe>;
  lookups: LookupFiles;
  ideas: IdeasFile;
}

export interface SyncDeps {
  fetch: typeof fetch;
  hasImage: (path: string) => Promise<boolean>;
  saveImage: (path: string, blob: Blob) => Promise<void>;
}

export interface SyncResult {
  data: CachedData;
  changed: string[];
  removed: string[];
}

const LOOKUP_FILES: [keyof LookupFiles, string][] = [
  ['aisles', 'lookups/aisles.json'],
  ['haveKeys', 'lookups/have-keys.json'],
  ['pantryBasics', 'lookups/pantry-basics.json'],
  ['categories', 'lookups/categories.json']
];

export function normaliseBase(url: string): string {
  const u = url.trim();
  if (!u) return '';
  return u.endsWith('/') ? u : u + '/';
}

function looksLikeRecipe(r: unknown, id: string): r is Recipe {
  const x = r as Recipe;
  return !!x && x.id === id && typeof x.title === 'string' && Array.isArray(x.ingredientGroups) &&
    Array.isArray(x.steps) && typeof x.version === 'number';
}

function isNewer(entry: IndexEntry, local: Recipe | undefined): boolean {
  if (!local) return true;
  return entry.version > local.version || (entry.version === local.version && entry.updated !== local.updated);
}

export async function syncData(
  baseUrl: string,
  current: Record<string, Recipe>,
  currentLookups: LookupFiles,
  currentIdeas: IdeasFile,
  deps: SyncDeps
): Promise<SyncResult> {
  const base = normaliseBase(baseUrl);
  if (!base) throw new Error('No recipe source address is set.');
  const getJson = async <T,>(path: string): Promise<T> => {
    const res = await deps.fetch(base + path, { cache: 'no-store' });
    if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
    return (await res.json()) as T;
  };

  const index = await getJson<RecipeIndex>('index.json');
  if (!index || !Array.isArray(index.recipes)) throw new Error('index.json is not in the expected shape.');

  const recipes: Record<string, Recipe> = {};
  const changed: string[] = [];
  await Promise.all(
    index.recipes.map(async entry => {
      const local = current[entry.id];
      if (!isNewer(entry, local)) {
        recipes[entry.id] = local!;
        return;
      }
      try {
        const r = await getJson<unknown>(`recipes/${entry.id}.json`);
        if (looksLikeRecipe(r, entry.id)) {
          recipes[entry.id] = r;
          changed.push(entry.id);
        } else if (local) recipes[entry.id] = local;
      } catch {
        if (local) recipes[entry.id] = local;
      }
    })
  );
  const remoteIds = index.recipes.map(e => e.id);
  const removed = Object.keys(current).filter(id => !remoteIds.includes(id));

  const lookups = { ...currentLookups };
  for (const [key, path] of LOOKUP_FILES) {
    try {
      (lookups as Record<string, unknown>)[key] = await getJson(path);
    } catch {
      /* keep the current copy */
    }
  }
  let ideas = currentIdeas;
  try {
    ideas = await getJson<IdeasFile>('ideas.json');
  } catch {
    /* keep the current copy */
  }

  // Photos the app does not already hold
  const paths = new Set<string>();
  for (const r of Object.values(recipes)) if (r.image && !/^https?:/.test(r.image)) paths.add(r.image);
  for (const c of Object.values(lookups.categories.covers)) if (c.image) paths.add(c.image);
  for (const path of paths) {
    if (await deps.hasImage(path)) continue;
    try {
      const res = await deps.fetch(base + path);
      if (res.ok) await deps.saveImage(path, await res.blob());
    } catch {
      /* try again next sync */
    }
  }

  return {
    data: { syncedAt: new Date().toISOString(), remoteIds, recipes, lookups, ideas },
    changed,
    removed
  };
}

/**
 * Starting data on launch: the bundle, with any newer synced recipes laid
 * over it. Recipes removed from the published data are dropped once a sync
 * newer than this build has seen the removal.
 */
export function mergeBundleAndCache(
  bundle: Recipe[],
  cache: CachedData | undefined,
  buildTime: string
): Record<string, Recipe> {
  const out: Record<string, Recipe> = {};
  for (const r of bundle) out[r.id] = r;
  if (!cache) return out;
  for (const r of Object.values(cache.recipes)) {
    const b = out[r.id];
    if (!b || r.version > b.version || (r.version === b.version && r.updated > b.updated)) out[r.id] = r;
  }
  if (cache.syncedAt > buildTime) {
    for (const id of Object.keys(out)) if (!cache.remoteIds.includes(id)) delete out[id];
  }
  return out;
}
