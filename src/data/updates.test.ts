import { describe, expect, it } from 'vitest';
import { checkForUpdate, isNewer } from './updates';

const respond = (status: number, body?: unknown) =>
  (async () => new Response(body ? JSON.stringify(body) : null, { status })) as unknown as typeof fetch;

describe('update check', () => {
  it('compares versions numerically', () => {
    expect(isNewer('v1.1.0', '1.0.2')).toBe(true);
    expect(isNewer('1.0.10', '1.0.9')).toBe(true);
    expect(isNewer('v1.0.2', '1.0.2')).toBe(false);
    expect(isNewer('1.0.1', '1.0.2')).toBe(false);
  });

  it('offers the APK from a newer release', async () => {
    const found = await checkForUpdate('1.0.2', respond(200, {
      tag_name: 'v1.1.0',
      assets: [{ name: 'kitchen-collection-v1.1.0.apk', browser_download_url: 'https://example.test/app.apk' }]
    }));
    expect(found).toEqual({ version: '1.1.0', url: 'https://example.test/app.apk' });
  });

  it('stays quiet when up to date, when there are no releases, or for drafts', async () => {
    expect(await checkForUpdate('1.1.0', respond(200, { tag_name: 'v1.1.0', assets: [] }))).toBeNull();
    expect(await checkForUpdate('1.0.0', respond(404))).toBeNull();
    expect(await checkForUpdate('1.0.0', respond(200, { tag_name: 'v2.0.0', draft: true }))).toBeNull();
  });
});
