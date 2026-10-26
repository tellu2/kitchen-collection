// Settings > Backup: export everything personal to a file, or restore from one.
import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { useApp } from '../data/store';
import { type BackupFile, backupFileName, parseBackup, summarise } from '../data/backup';
import { saveTextFile } from '../data/saveFile';
import { niceDate } from '../lib/misc';
import { Sheet } from '../ui/components';
import { useToast } from '../ui/feedback';

const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`;

export function BackupSection() {
  const { exportBackup, importBackup } = useApp();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<BackupFile | null>(null);

  const doExport = async () => {
    setBusy(true);
    try {
      const backup = await exportBackup();
      const saved = await saveTextFile(backupFileName(), JSON.stringify(backup));
      if (saved) toast('Backup ready. Keep it somewhere safe, such as Google Drive.');
    } catch (e) {
      toast(`Could not make the backup: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    try {
      setPending(parseBackup(await file.text()));
    } catch (e) {
      toast((e as Error).message);
    }
  };

  const doImport = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await importBackup(pending);
      toast('Backup restored.');
      setPending(null);
    } catch (e) {
      toast(`Could not restore: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const s = pending ? summarise(pending) : null;

  return (
    <section className="setting-block">
      <h2>Backup</h2>
      <p className="muted small">
        Your favourites, shopping and saved lists, cook log, Cooking today, Have ticks, settings and your own photos live only on this phone. Export a backup now and then, and keep the file in Google Drive.
      </p>
      <div className="action-row tight">
        <button type="button" className="btn btn-primary" disabled={busy} onClick={doExport}>
          <Upload size={18} aria-hidden="true" /> Export backup
        </button>
        <button type="button" className="btn btn-outline" disabled={busy} onClick={() => fileRef.current?.click()}>
          <Download size={18} aria-hidden="true" /> Import backup
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={e => {
          void onFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      <Sheet open={!!pending} onClose={() => setPending(null)} title="Restore this backup?">
        {s && (
          <>
            <p>Backup from <b>{niceDate(s.exportedAt)}</b>:</p>
            <ul className="backup-summary">
              <li>{plural(s.favourites, 'saved recipe')}</li>
              <li>{plural(s.shopItems, 'shopping list line')}, {plural(s.savedLists, 'saved list')}</li>
              <li>{plural(s.cooked, 'recipe')} in the cook log</li>
              <li>{plural(s.photos, 'photo')} of your own</li>
            </ul>
            <p className="muted small">This replaces what's on this phone now. Recipes aren't affected.</p>
            <div className="sheet-actions">
              <button type="button" className="btn btn-primary" disabled={busy} onClick={doImport}>Replace with this backup</button>
              <button type="button" className="btn btn-quiet" onClick={() => setPending(null)}>Cancel</button>
            </div>
          </>
        )}
      </Sheet>
    </section>
  );
}
