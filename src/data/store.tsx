// App state: recipe data (bundle + cache + sync), user preferences,
// photos and theme. Prefs and photos stay on the device.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Category, Credit, IdeasFile, LookupFiles, Recipe } from '../types';
import { compileLookups, type CompiledLookups } from '../lib/lookups';
import type { SavedList, ShopItem } from '../lib/shopping';
import { APP_VERSION, BUILD_TIME, bundledIdeas, bundledImage, bundledLookups, bundledRecipes } from './bundle';
import { type AppUpdate, checkForUpdate } from './updates';
import { DEFAULT_SOURCE } from '../config';
import { dbDelete, dbEntries, dbGet, dbSet } from './db';
import { type CachedData, mergeBundleAndCache, normaliseBase, syncData } from './sync';
import { setNativeTheme } from '../native';

export type Theme = 'light' | 'dark' | 'system';

export interface Prefs {
  fav: string[];
  cooked: Record<string, string>;
  shop: ShopItem[];
  lists: SavedList[];
  meal: string[];
  /** Recipes planned for today ("Cook today"), in the order added */
  today: string[];
  tbsp: 15 | 20;
  serves: Record<string, number>;
  have: string[];
  theme: Theme;
  sourceUrl: string;
  /** Recipe versions as of the previous visit, for New / Updated badges */
  seen: Record<string, number> | null;
}

export const defaultPrefs = (): Prefs => ({
  fav: [], cooked: {}, shop: [], lists: [], meal: [], today: [], tbsp: 20, serves: {}, have: [],
  theme: 'light', sourceUrl: '', seen: null
});

export type Badge = 'new' | 'updated';

export interface SyncStatus {
  lastSynced: string | null;
  syncing: boolean;
  message: string | null;
}

export interface ImageInfo {
  url: string | null;
  credit: Credit | null;
  mine: boolean;
}

interface AppState {
  ready: boolean;
  recipes: Recipe[];
  byId: Record<string, Recipe>;
  lookupFiles: LookupFiles;
  lookups: CompiledLookups;
  ideas: IdeasFile;
  prefs: Prefs;
  updatePrefs: (fn: (p: Prefs) => Prefs) => void;
  badges: Record<string, Badge>;
  sync: SyncStatus;
  refresh: () => Promise<void>;
  imageFor: (r: Recipe) => ImageInfo;
  coverFor: (c: Category) => ImageInfo;
  setPhoto: (id: string, blob: Blob | null) => Promise<void>;
  factorFor: (id: string) => number;
  /** The recipe source actually in use (Settings address, or the default) */
  source: string;
  update: AppUpdate | null;
  checkUpdates: () => Promise<string>;
}

const Ctx = createContext<AppState | null>(null);

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside AppProvider');
  return v;
}

function computeBadges(recipes: Record<string, Recipe>, seen: Record<string, number> | null): Record<string, Badge> {
  if (!seen) return {};
  const out: Record<string, Badge> = {};
  for (const r of Object.values(recipes)) {
    if (!(r.id in seen)) out[r.id] = 'new';
    else if (r.version > seen[r.id]) out[r.id] = 'updated';
  }
  return out;
}

const versions = (recipes: Record<string, Recipe>) =>
  Object.fromEntries(Object.values(recipes).map(r => [r.id, r.version]));

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [byId, setById] = useState<Record<string, Recipe>>(() =>
    Object.fromEntries(bundledRecipes.map(r => [r.id, r]))
  );
  const [lookupFiles, setLookupFiles] = useState<LookupFiles>(bundledLookups);
  const [ideas, setIdeas] = useState<IdeasFile>(bundledIdeas);
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
  const [badges, setBadges] = useState<Record<string, Badge>>({});
  const [sync, setSync] = useState<SyncStatus>({ lastSynced: null, syncing: false, message: null });
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [cachedImages, setCachedImages] = useState<Record<string, string>>({});
  const [update, setUpdate] = useState<AppUpdate | null>(null);
  // An address typed in Settings wins; otherwise the published GitHub Pages copy
  const source = prefs.sourceUrl.trim() || DEFAULT_SOURCE;
  const sessionSeen = useRef<Record<string, number> | null>(null);
  const prefsLoaded = useRef(false);
  const syncing = useRef(false);

  // Load cache, prefs and photos, then render immediately
  useEffect(() => {
    (async () => {
      const [cache, storedPrefs, photoEntries, fileEntries] = await Promise.all([
        dbGet<CachedData>('kv', 'cache'),
        dbGet<Prefs>('kv', 'prefs'),
        dbEntries<Blob>('files', 'photo:'),
        dbEntries<Blob>('files', 'images/')
      ]);
      const merged = mergeBundleAndCache(bundledRecipes, cache, BUILD_TIME);
      setById(merged);
      if (cache && cache.syncedAt > BUILD_TIME) {
        setLookupFiles(cache.lookups);
        setIdeas(cache.ideas);
      }
      const p = { ...defaultPrefs(), ...(storedPrefs ?? {}) };
      sessionSeen.current = p.seen;
      setBadges(computeBadges(merged, p.seen));
      p.seen = versions(merged);
      setPrefs(p);
      prefsLoaded.current = true;
      setPhotos(Object.fromEntries(photoEntries.map(([k, b]) => [k.slice(6), URL.createObjectURL(b)])));
      setCachedImages(Object.fromEntries(fileEntries.map(([k, b]) => [k, URL.createObjectURL(b)])));
      setSync(s => ({ ...s, lastSynced: cache?.syncedAt ?? null }));
      setReady(true);
    })();
  }, []);

  // Persist prefs (debounced)
  useEffect(() => {
    if (!prefsLoaded.current) return;
    const t = setTimeout(() => void dbSet('kv', 'prefs', prefs), 200);
    return () => clearTimeout(t);
  }, [prefs]);

  // Theme
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = prefs.theme === 'dark' || (prefs.theme === 'system' && media.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#171512' : '#f7f4ef');
      setNativeTheme(dark);
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [prefs.theme]);

  const updatePrefs = useCallback((fn: (p: Prefs) => Prefs) => setPrefs(p => fn(p)), []);

  const refresh = useCallback(async () => {
    const base = normaliseBase(source);
    if (!base) {
      setSync(s => ({ ...s, message: 'No recipe source is set yet. Recipes come from the app itself.' }));
      return;
    }
    if (syncing.current) return;
    syncing.current = true;
    setSync(s => ({ ...s, syncing: true, message: null }));
    try {
      const result = await syncData(base, byId, lookupFiles, ideas, {
        fetch: (...a) => fetch(...a),
        hasImage: async path => !!bundledImage(path) || !!(await dbGet<Blob>('files', path)),
        saveImage: async (path, blob) => {
          await dbSet('files', path, blob);
          setCachedImages(c => ({ ...c, [path]: URL.createObjectURL(blob) }));
        }
      });
      await dbSet('kv', 'cache', result.data);
      setById(result.data.recipes);
      setLookupFiles(result.data.lookups);
      setIdeas(result.data.ideas);
      setBadges(b => ({ ...b, ...computeBadges(result.data.recipes, sessionSeen.current) }));
      setPrefs(p => ({ ...p, seen: { ...versions(result.data.recipes) } }));
      const n = result.changed.length;
      setSync({
        lastSynced: result.data.syncedAt,
        syncing: false,
        message: n ? `${n} recipe${n === 1 ? '' : 's'} added or updated.` : 'Recipes are up to date.'
      });
    } catch (e) {
      setSync(s => ({ ...s, syncing: false, message: `Could not refresh: ${(e as Error).message}` }));
    } finally {
      syncing.current = false;
    }
  }, [source, byId, lookupFiles, ideas]);

  // Background sync once on launch, without blocking anything
  const launched = useRef(false);
  useEffect(() => {
    if (!ready || launched.current) return;
    launched.current = true;
    if (normaliseBase(source)) void refresh();
  }, [ready, source, refresh]);

  const checkUpdates = useCallback(async (): Promise<string> => {
    try {
      const found = await checkForUpdate(APP_VERSION);
      setUpdate(found);
      return found ? `Version ${found.version} is ready to download.` : `You have the latest version (${APP_VERSION}).`;
    } catch (e) {
      return `Could not check for updates: ${(e as Error).message}`;
    }
  }, []);

  // Check GitHub Releases once per launch, quietly
  useEffect(() => {
    if (ready) void checkUpdates();
  }, [ready, checkUpdates]);

  const resolvePath = useCallback(
    (path?: string) => {
      if (!path) return null;
      if (/^https?:/.test(path)) return path;
      return cachedImages[path] ?? bundledImage(path) ?? (source ? normaliseBase(source) + path : null);
    },
    [cachedImages, source]
  );

  const imageFor = useCallback(
    (r: Recipe): ImageInfo => {
      if (photos[r.id]) return { url: photos[r.id], credit: null, mine: true };
      return { url: resolvePath(r.image), credit: r.imageCredit ?? null, mine: false };
    },
    [photos, resolvePath]
  );

  const coverFor = useCallback(
    (c: Category): ImageInfo => {
      const cover = lookupFiles.categories.covers[c];
      if (cover?.recipe && byId[cover.recipe]) return imageFor(byId[cover.recipe]);
      return { url: resolvePath(cover?.image), credit: cover?.imageCredit ?? null, mine: false };
    },
    [lookupFiles, byId, imageFor, resolvePath]
  );

  const setPhoto = useCallback(async (id: string, blob: Blob | null) => {
    if (blob) {
      await dbSet('files', 'photo:' + id, blob);
      setPhotos(p => ({ ...p, [id]: URL.createObjectURL(blob) }));
    } else {
      await dbDelete('files', 'photo:' + id);
      setPhotos(p => {
        const next = { ...p };
        delete next[id];
        return next;
      });
    }
  }, []);

  const factorFor = useCallback((id: string) => prefs.serves[id] ?? 1, [prefs.serves]);

  const lookups = useMemo(() => compileLookups(lookupFiles), [lookupFiles]);
  const recipes = useMemo(() => Object.values(byId), [byId]);

  const value = useMemo<AppState>(
    () => ({
      ready, recipes, byId, lookupFiles, lookups, ideas, prefs, updatePrefs,
      badges, sync, refresh, imageFor, coverFor, setPhoto, factorFor, source, update, checkUpdates
    }),
    [ready, recipes, byId, lookupFiles, lookups, ideas, prefs, updatePrefs, badges, sync, refresh, imageFor, coverFor, setPhoto, factorFor, source, update, checkUpdates]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
