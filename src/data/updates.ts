// Checks GitHub Releases for a newer signed APK than the one installed.
import { RELEASES_API, RELEASES_PAGE } from '../config';

export interface AppUpdate {
  version: string;
  /** Direct APK download, or the release page if no APK is attached */
  url: string;
}

/** Compares "1.2.3"-style versions; a leading "v" is ignored. */
export function isNewer(candidate: string, current: string): boolean {
  const parse = (v: string) => v.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  const a = parse(candidate);
  const b = parse(current);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0);
  }
  return false;
}

interface Release {
  tag_name: string;
  draft?: boolean;
  prerelease?: boolean;
  html_url?: string;
  assets?: { name: string; browser_download_url: string }[];
}

export async function checkForUpdate(current: string, fetchFn: typeof fetch = fetch): Promise<AppUpdate | null> {
  const res = await fetchFn(RELEASES_API, { headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store' });
  if (res.status === 404) return null; // no releases yet
  if (!res.ok) throw new Error(`GitHub: HTTP ${res.status}`);
  const rel = (await res.json()) as Release;
  if (!rel.tag_name || rel.draft || rel.prerelease || !isNewer(rel.tag_name, current)) return null;
  const apk = rel.assets?.find(a => a.name.endsWith('.apk'));
  return { version: rel.tag_name.replace(/^v/, ''), url: apk?.browser_download_url ?? rel.html_url ?? RELEASES_PAGE };
}
