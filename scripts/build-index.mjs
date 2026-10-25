// Writes data/index.json from data/recipes/. Run validate first.
// The file is only rewritten when the recipe summaries change, so
// "generated" stays put and git sees no change on a no-op run.
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dataDir = join(root, 'data');
const recipesDir = join(dataDir, 'recipes');
const indexPath = join(dataDir, 'index.json');

const schema = JSON.parse(readFileSync(join(dataDir, 'recipe.schema.json'), 'utf8'));
const categoryOrder = schema.properties.category.enum;

const recipes = readdirSync(recipesDir)
  .filter(f => f.endsWith('.json'))
  .map(f => JSON.parse(readFileSync(join(recipesDir, f), 'utf8')))
  .map(r => {
    const entry = {
      id: r.id,
      title: r.title,
      category: r.category,
      tags: r.tags ?? [],
      appliances: r.appliances,
      time: r.time,
      yield: r.yield,
      confidenceLevel: r.confidence.level,
      version: r.version,
      updated: r.updated
    };
    if (r.added) entry.added = r.added;
    return entry;
  })
  .sort((a, b) =>
    categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category) ||
    a.title.localeCompare(b.title, 'en-AU'));

let previous = null;
if (existsSync(indexPath)) {
  try { previous = JSON.parse(readFileSync(indexPath, 'utf8')); } catch { previous = null; }
}
if (previous && JSON.stringify(previous.recipes) === JSON.stringify(recipes)) {
  console.log(`index.json unchanged (${recipes.length} recipes).`);
} else {
  const index = { schemaVersion: 1, generated: new Date().toISOString(), recipes };
  writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n');
  console.log(`Wrote data/index.json (${recipes.length} recipes).`);
}
