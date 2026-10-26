// npm run photo:add -- <recipe-id> <pexels-photo-id> "<photographer name>" [pexels page url]
// Downloads a free Pexels photo (1200px wide, compressed by Pexels' CDN) to
// data/images/<recipe-id>.jpg and sets the recipe's image and imageCredit.
// Only for photos chosen by the user from Pexels (free to use, credited).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const [id, photoId, name, pageUrl] = process.argv.slice(2);
if (!id || !/^\d+$/.test(photoId ?? '') || !name) {
  console.error('Usage: npm run photo:add -- <recipe-id> <pexels-photo-id> "<photographer name>" [pexels page url]');
  process.exit(1);
}

const root = fileURLToPath(new URL('..', import.meta.url));
const recipePath = join(root, 'data', 'recipes', `${id}.json`);
if (!existsSync(recipePath)) {
  console.error(`No recipe file data/recipes/${id}.json`);
  process.exit(1);
}

const url = `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=1200`;
const res = await fetch(url);
const type = res.headers.get('content-type') ?? '';
if (!res.ok || !type.startsWith('image/jpeg')) {
  console.error(`Could not download Pexels photo ${photoId} (HTTP ${res.status}, ${type || 'no type'}).`);
  process.exit(1);
}
const bytes = Buffer.from(await res.arrayBuffer());
const imagePath = `images/${id}.jpg`;
writeFileSync(join(root, 'data', imagePath), bytes);

// Insert or replace the two fields without reformatting the rest of the file
let text = readFileSync(recipePath, 'utf8');
const credit = { name, url: pageUrl || `https://www.pexels.com/photo/${photoId}/`, source: 'Pexels' };
const lines = `  "image": "${imagePath}",\n  "imageCredit": ${JSON.stringify(credit)},\n`;
text = text.replace(/^ {2}"image": .*\n/m, '').replace(/^ {2}"imageCredit": .*\n/m, '');
const at = text.indexOf('  "ingredientGroups"');
if (at < 0) {
  console.error('Could not find "ingredientGroups" in the recipe file.');
  process.exit(1);
}
writeFileSync(recipePath, text.slice(0, at) + lines + text.slice(at));
console.log(`Saved data/${imagePath} (${Math.round(bytes.length / 1024)} KB) and credited ${name} / Pexels on ${id}.`);
