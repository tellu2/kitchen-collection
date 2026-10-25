// Validates everything under data/. Exits 1 if anything fails.
// Checks: schema, filename = id, unique ids, {{token}} resolution,
// recipeRef and pairings targets, lookup patterns, no em dashes.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = fileURLToPath(new URL('..', import.meta.url));
const dataDir = join(root, 'data');
const recipesDir = join(dataDir, 'recipes');
const errors = [];
const fail = (file, msg) => errors.push(`${file}: ${msg}`);

const TOKEN = /\{\{([^{}]*)\}\}/g;
const TOKEN_BODY = /^([a-z0-9]+(?:-[a-z0-9]+)*)(?:\*(\d+(?:\.\d+)?))?$/;
const EM_DASH = '—';

function walk(dir) {
  return readdirSync(dir).flatMap(name => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

function readJson(path) {
  const rel = relative(root, path);
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    fail(rel, `not valid JSON (${e.message})`);
    return null;
  }
}

// No em dashes anywhere in data/ (text files only)
for (const path of walk(dataDir).filter(p => /\.(json|md|txt)$/i.test(p))) {
  const text = readFileSync(path, 'utf8');
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    if (line.includes(EM_DASH)) fail(relative(root, path).replaceAll('\\', '/'), `em dash on line ${i + 1}`);
  });
}

// Schema
// strictTypes off: the schema's draft-only if/then blocks omit "type" by design
const ajv = new Ajv2020({ allErrors: true, allowUnionTypes: true, strictTypes: false });
addFormats(ajv);
const schema = readJson(join(dataDir, 'recipe.schema.json'));
const validate = ajv.compile(schema);

// Recipes
const files = readdirSync(recipesDir).filter(f => f.endsWith('.json')).sort();
const recipes = new Map();
for (const file of files) {
  const rel = `data/recipes/${file}`;
  const r = readJson(join(recipesDir, file));
  if (!r) continue;
  if (!validate(r)) {
    for (const e of validate.errors) fail(rel, `schema: ${e.instancePath || '(root)'} ${e.message}`);
  }
  if (typeof r.id !== 'string') continue;
  if (basename(file, '.json') !== r.id) fail(rel, `filename does not match id "${r.id}"`);
  if (recipes.has(r.id)) fail(rel, `duplicate id "${r.id}"`);
  recipes.set(r.id, { r, rel });
}

for (const { r, rel } of recipes.values()) {
  const ingredients = new Map();
  for (const group of r.ingredientGroups ?? []) {
    for (const ing of group.items ?? []) {
      if (ingredients.has(ing.id)) fail(rel, `duplicate ingredient id "${ing.id}"`);
      ingredients.set(ing.id, ing);
      if (ing.recipeRef && !recipes.has(ing.recipeRef)) {
        fail(rel, `ingredient "${ing.id}" recipeRef "${ing.recipeRef}" does not exist`);
      }
      if (ing.qtyMax != null && !(typeof ing.qty === 'number' && ing.qtyMax > ing.qty)) {
        fail(rel, `ingredient "${ing.id}" qtyMax must be greater than a numeric qty`);
      }
    }
  }
  (r.steps ?? []).forEach((step, i) => {
    const text = step.text ?? '';
    for (const m of text.matchAll(TOKEN)) {
      const body = m[1].match(TOKEN_BODY);
      if (!body) { fail(rel, `step ${i + 1}: malformed token ${m[0]}`); continue; }
      const ing = ingredients.get(body[1]);
      if (!ing) fail(rel, `step ${i + 1}: token ${m[0]} has no matching ingredient`);
      else if (typeof ing.qty !== 'number') fail(rel, `step ${i + 1}: token ${m[0]} points to an ingredient with no numeric qty`);
    }
    const stray = text.replace(TOKEN, '');
    if (stray.includes('{{') || stray.includes('}}')) fail(rel, `step ${i + 1}: unmatched braces`);
  });
  if (r.image && !/^https?:\/\//.test(r.image) && !existsSync(join(dataDir, r.image))) {
    fail(rel, `image "${r.image}" not found under data/`);
  }
  for (const p of r.pairings ?? []) {
    if (!recipes.has(p)) fail(rel, `pairing "${p}" does not exist`);
    if (p === r.id) fail(rel, 'pairs with itself');
  }
}

// Ideas
const ideas = readJson(join(dataDir, 'ideas.json'));
if (ideas && !Array.isArray(ideas.ideas)) fail('data/ideas.json', '"ideas" must be an array');

// Lookups: every pattern must compile
function checkPattern(rel, label, p) {
  if (!p || typeof p.pattern !== 'string') { fail(rel, `${label}: missing pattern`); return; }
  try { new RegExp(p.pattern, p.flags ?? ''); }
  catch (e) { fail(rel, `${label}: bad pattern (${e.message})`); }
}
const lookupsDir = join(dataDir, 'lookups');
const aisles = readJson(join(lookupsDir, 'aisles.json'));
if (aisles) {
  const rel = 'data/lookups/aisles.json';
  aisles.rules.forEach((rule, i) => {
    checkPattern(rel, `rule ${i + 1}`, rule);
    if (!aisles.order.includes(rule.aisle)) fail(rel, `rule ${i + 1}: aisle "${rule.aisle}" not in order`);
  });
  aisles.notShoppable.forEach((p, i) => checkPattern(rel, `notShoppable ${i + 1}`, p));
  checkPattern(rel, 'notShoppableGroups', aisles.notShoppableGroups);
}
const keys = readJson(join(lookupsDir, 'have-keys.json'));
if (keys) {
  const rel = 'data/lookups/have-keys.json';
  const labels = new Set();
  keys.keys.forEach((k, i) => {
    checkPattern(rel, `key "${k.label}"`, k);
    if (!keys.groups.includes(k.group)) fail(rel, `key "${k.label}": group "${k.group}" not in groups`);
    if (labels.has(k.label)) fail(rel, `duplicate key "${k.label}"`);
    labels.add(k.label);
  });
}
const basics = readJson(join(lookupsDir, 'pantry-basics.json'));
if (basics) {
  checkPattern('data/lookups/pantry-basics.json', 'assumedPattern', basics.assumedPattern);
  checkPattern('data/lookups/pantry-basics.json', 'optionalLinePattern', basics.optionalLinePattern);
}

const categories = readJson(join(lookupsDir, 'categories.json'));
if (categories) {
  const rel = 'data/lookups/categories.json';
  const names = schema.properties.category.enum;
  for (const name of names) {
    const cover = categories.covers?.[name];
    if (!cover) { fail(rel, `no cover for "${name}"`); continue; }
    if (cover.recipe && !recipes.get(cover.recipe)?.r.image) fail(rel, `"${name}": recipe "${cover.recipe}" missing or has no image`);
    if (cover.image && !existsSync(join(dataDir, cover.image))) fail(rel, `"${name}": image "${cover.image}" not found`);
  }
  for (const name of Object.keys(categories.covers ?? {})) {
    if (!names.includes(name)) fail(rel, `unknown category "${name}"`);
  }
}

if (errors.length) {
  console.error(`Validation failed with ${errors.length} problem${errors.length === 1 ? '' : 's'}:\n`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log(`Validation passed: ${recipes.size} recipes, ideas and lookups checked.`);
