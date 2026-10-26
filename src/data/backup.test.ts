import { describe, expect, it } from 'vitest';
import { backupFileName, blobToDataUrl, buildBackup, dataUrlToBlob, parseBackup, summarise } from './backup';
import { defaultPrefs, type Prefs } from './store';

const prefs = (): Prefs => ({
  ...defaultPrefs(),
  fav: ['massaman', 'souvlaki'],
  cooked: { massaman: '2026-10-20' },
  today: ['riojana'],
  lists: [{ name: 'Shop 20 Oct', date: '2026-10-20T00:00:00Z', items: [] }],
  tbsp: 15,
  theme: 'dark',
  seen: { massaman: 1 }
});

describe('backup', () => {
  it('round-trips prefs and photos through a JSON file', async () => {
    const photo = new Blob([new Uint8Array([255, 216, 255, 0, 1, 2, 3])], { type: 'image/jpeg' });
    const file = await buildBackup(prefs(), { massaman: photo }, '1.2.0', new Date('2026-10-26T01:00:00Z'));
    const parsed = parseBackup(JSON.stringify(file));
    expect(parsed.prefs.fav).toEqual(['massaman', 'souvlaki']);
    expect(parsed.prefs.today).toEqual(['riojana']);
    expect(parsed.prefs.tbsp).toBe(15);
    expect('seen' in parsed.prefs).toBe(false);
    const back = dataUrlToBlob(parsed.photos.massaman);
    expect(back.type).toBe('image/jpeg');
    expect([...new Uint8Array(await back.arrayBuffer())]).toEqual([255, 216, 255, 0, 1, 2, 3]);
    expect(summarise(parsed)).toEqual({
      exportedAt: '2026-10-26T01:00:00.000Z', favourites: 2, shopItems: 0, savedLists: 1, cooked: 1, photos: 1
    });
  });

  it('handles photos larger than one encoding chunk', async () => {
    const big = new Uint8Array(200_000).map((_, i) => i % 251);
    const url = await blobToDataUrl(new Blob([big], { type: 'image/jpeg' }));
    expect(new Uint8Array(await dataUrlToBlob(url).arrayBuffer())).toEqual(big);
  });

  it('rejects files that are not backups, damaged or from a newer app', () => {
    expect(() => parseBackup('not json')).toThrow(/not a Kitchen Collection backup/);
    expect(() => parseBackup('{"app":"something-else","prefs":{}}')).toThrow(/not a Kitchen Collection backup/);
    expect(() => parseBackup('{"app":"kitchen-collection","format":99,"prefs":{}}')).toThrow(/newer version/);
    expect(() => parseBackup('{"app":"kitchen-collection","format":1,"prefs":{"fav":"x"}}')).toThrow(/damaged/);
  });

  it('names the file by date', () => {
    expect(backupFileName(new Date('2026-10-26T01:00:00'))).toBe('kitchen-collection-backup-2026-10-26.json');
  });
});
