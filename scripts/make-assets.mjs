// Renders assets/source/mark.svg into the PNGs @capacitor/assets expects,
// then run: npx capacitor-assets generate --android
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = join(root, 'assets');
mkdirSync(out, { recursive: true });
const mark = readFileSync(join(out, 'source', 'mark.svg'));
const CREAM = '#f7f4ef';
const DARK = '#171512';

const solid = (size, colour) => sharp({ create: { width: size, height: size, channels: 4, background: colour } });
const markAt = size => sharp(mark, { density: 300 }).resize(size, size).png().toBuffer();

// Adaptive icon: foreground keeps the mark inside the 66% safe zone
const fg = await markAt(600);
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: fg, gravity: 'center' }]).png().toFile(join(out, 'icon-foreground.png'));
await solid(1024, CREAM).png().toFile(join(out, 'icon-background.png'));
// Legacy square icon
await solid(1024, CREAM).composite([{ input: await markAt(880), gravity: 'center' }]).png().toFile(join(out, 'icon-only.png'));
// Splash (Android 12+ shows the icon only; older versions show this full image)
const splashMark = await markAt(760);
await solid(2732, CREAM).composite([{ input: splashMark, gravity: 'center' }]).png().toFile(join(out, 'splash.png'));
await solid(2732, DARK).composite([{ input: splashMark, gravity: 'center' }]).png().toFile(join(out, 'splash-dark.png'));
console.log('Wrote assets/icon-*.png and assets/splash*.png');
