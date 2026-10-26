// Backup file: everything personal that lives only on the phone (favourites,
// lists, cook log, plans, Have ticks, settings) plus the user's own photos.
// Recipes themselves are not included; they come from the app and GitHub.
import type { Prefs } from './store';

export const BACKUP_APP = 'kitchen-collection';
export const BACKUP_FORMAT = 1;

export interface BackupFile {
  app: typeof BACKUP_APP;
  format: number;
  exportedAt: string;
  appVersion: string;
  /** Prefs without "seen", which is per-install bookkeeping */
  prefs: Omit<Prefs, 'seen'>;
  /** recipe id -> data URL (image/jpeg) */
  photos: Record<string, string>;
}

export interface BackupSummary {
  exportedAt: string;
  favourites: number;
  shopItems: number;
  savedLists: number;
  cooked: number;
  photos: number;
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:${blob.type || 'image/jpeg'};base64,${btoa(binary)}`;
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const m = /^data:([^;,]+);base64,(.*)$/s.exec(dataUrl);
  if (!m) throw new Error('A photo in the backup is not in the expected format.');
  const binary = atob(m[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: m[1] });
}

export async function buildBackup(prefs: Prefs, photos: Record<string, Blob>, appVersion: string, now = new Date()): Promise<BackupFile> {
  const { seen: _seen, ...rest } = prefs;
  const encoded: Record<string, string> = {};
  for (const [id, blob] of Object.entries(photos)) encoded[id] = await blobToDataUrl(blob);
  return { app: BACKUP_APP, format: BACKUP_FORMAT, exportedAt: now.toISOString(), appVersion, prefs: rest, photos: encoded };
}

export function backupFileName(now = new Date()): string {
  return `kitchen-collection-backup-${now.toLocaleDateString('en-CA')}.json`;
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Parses and checks a backup file. Throws a plain-English error if it isn't one. */
export function parseBackup(text: string): BackupFile {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('That file is not a Kitchen Collection backup.');
  }
  if (!isObj(data) || data.app !== BACKUP_APP || !isObj(data.prefs)) {
    throw new Error('That file is not a Kitchen Collection backup.');
  }
  if (typeof data.format !== 'number' || data.format > BACKUP_FORMAT) {
    throw new Error('That backup was made by a newer version of the app. Update the app first.');
  }
  const p = data.prefs;
  const arrays = ['fav', 'shop', 'lists', 'meal', 'have'] as const;
  for (const k of arrays) if (k in p && !Array.isArray(p[k])) throw new Error('The backup is damaged and cannot be read.');
  if (data.photos !== undefined && !isObj(data.photos)) throw new Error('The backup is damaged and cannot be read.');
  return data as unknown as BackupFile;
}

export function summarise(b: BackupFile): BackupSummary {
  const p = b.prefs;
  return {
    exportedAt: b.exportedAt,
    favourites: p.fav?.length ?? 0,
    shopItems: p.shop?.length ?? 0,
    savedLists: p.lists?.length ?? 0,
    cooked: Object.keys(p.cooked ?? {}).length,
    photos: Object.keys(b.photos ?? {}).length
  };
}
