// Hands a text file to the user. On Android it writes to the app's cache and
// opens the share sheet (Google Drive, Files, email...). In a browser it downloads.
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { isNative } from '../native';

/** Returns false if the user closed the share sheet without choosing anywhere. */
export async function saveTextFile(name: string, text: string, mime = 'application/json'): Promise<boolean> {
  if (isNative) {
    const { uri } = await Filesystem.writeFile({ path: name, data: text, directory: Directory.Cache, encoding: Encoding.UTF8 });
    try {
      await Share.share({ title: name, url: uri, dialogTitle: 'Save your backup' });
      return true;
    } catch {
      return false; // share sheet dismissed
    }
  }
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
