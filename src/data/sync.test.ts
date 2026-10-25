import { describe, expect, it } from 'vitest';
import { mergeBundleAndCache, normaliseBase, syncData, type CachedData } from './sync';
import type { Recipe } from '../types';
import { allRecipes, byId, lookupFiles } from '../test/fixtures';

const ideas = { ideas: [] };
const asMap = (rs: Recipe[]) => Object.fromEntries(rs.map(r => [r.id, r]));

function fakeRemote(files: Record<string, unknown>) {
  const calls: string[] = [];
  const fetchFn = (async (url: string) => {
    calls.push(url);
    const path = url.replace('https://example.test/data/', '');
    if (!(path in files)) return new Response('missing', { status: 404 });
    const body = files[path];
    return body instanceof Blob ? new Response(body) : new Response(JSON.stringify(body));
  }) as unknown as typeof fetch;
  return { fetchFn, calls };
}

describe('sync', () => {
  const base = 'https://example.test/data';
  const massaman = byId('massaman');
  const souvlaki = byId('souvlaki');

  it('normalises the source address', () => {
    expect(normaliseBase(' https://a.test/x ')).toBe('https://a.test/x/');
    expect(normaliseBase('')).toBe('');
  });

  it('downloads only new or changed recipes, and drops removed ones', async () => {
    const updated = { ...massaman, version: 2, updated: '2026-11-01', title: 'Massaman Beef Curry v2' };
    const added = { ...souvlaki, id: 'new-dish', title: 'New dish', image: 'images/new-dish.jpg', added: '2026-11-01' };
    const index = {
      schemaVersion: 1, generated: 'x',
      recipes: [
        { id: 'massaman', title: '', category: 'Asian', version: 2, updated: '2026-11-01' },
        { id: 'souvlaki', title: '', category: 'Asian', version: souvlaki.version, updated: souvlaki.updated },
        { id: 'new-dish', title: '', category: 'Asian', version: 1, updated: '2026-11-01' }
      ]
    };
    const { fetchFn, calls } = fakeRemote({
      'index.json': index,
      'recipes/massaman.json': updated,
      'recipes/new-dish.json': added,
      'images/new-dish.jpg': new Blob(['jpg'])
    });
    const saved: string[] = [];
    const current = asMap([massaman, souvlaki, byId('bolognese')]);
    const result = await syncData(base, current, lookupFiles, ideas, {
      fetch: fetchFn,
      hasImage: async p => p !== 'images/new-dish.jpg',
      saveImage: async p => void saved.push(p)
    });
    expect(result.changed.sort()).toEqual(['massaman', 'new-dish']);
    expect(result.removed).toEqual(['bolognese']);
    expect(result.data.recipes.massaman.title).toBe('Massaman Beef Curry v2');
    expect(result.data.recipes.souvlaki).toBe(souvlaki);
    expect(calls.some(u => u.endsWith('recipes/souvlaki.json'))).toBe(false);
    expect(saved).toEqual(['images/new-dish.jpg']);
    // Lookups that failed to download keep the current copy
    expect(result.data.lookups.aisles).toBe(lookupFiles.aisles);
  });

  it('keeps the local copy when a recipe download is malformed', async () => {
    const { fetchFn } = fakeRemote({
      'index.json': { schemaVersion: 1, generated: 'x', recipes: [{ id: 'massaman', title: '', category: 'Asian', version: 9, updated: 'z' }] },
      'recipes/massaman.json': { id: 'massaman' }
    });
    const result = await syncData(base, asMap([massaman]), lookupFiles, ideas, {
      fetch: fetchFn, hasImage: async () => true, saveImage: async () => {}
    });
    expect(result.data.recipes.massaman).toBe(massaman);
    expect(result.changed).toEqual([]);
  });

  it('fails cleanly with no address or no index', async () => {
    await expect(syncData('', {}, lookupFiles, ideas, { fetch, hasImage: async () => true, saveImage: async () => {} })).rejects.toThrow();
    const { fetchFn } = fakeRemote({});
    await expect(syncData(base, {}, lookupFiles, ideas, { fetch: fetchFn, hasImage: async () => true, saveImage: async () => {} })).rejects.toThrow(/index\.json/);
  });

  it('lays newer cached recipes over the bundle on launch', () => {
    const cache: CachedData = {
      syncedAt: '2027-01-01T00:00:00Z',
      remoteIds: allRecipes.map(r => r.id).filter(id => id !== 'bolognese'),
      recipes: { massaman: { ...massaman, version: 5 } },
      lookups: lookupFiles,
      ideas
    };
    const merged = mergeBundleAndCache(allRecipes, cache, '2026-10-25T00:00:00Z');
    expect(merged.massaman.version).toBe(5);
    expect(merged.bolognese).toBeUndefined();
    expect(Object.keys(merged)).toHaveLength(allRecipes.length - 1);
    // A build newer than the last sync keeps everything it bundles
    const older = mergeBundleAndCache(allRecipes, cache, '2027-02-01T00:00:00Z');
    expect(older.bolognese).toBeDefined();
  });
});
