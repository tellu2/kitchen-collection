// npm run import:batch -- <batch.json> [--dry-run]
// Applies a Kitchen Collection batch exported from the Cooking project:
//   {
//     "kitchenCollectionBatch": 1,
//     "recipes": [ <full recipe objects: new or changed> ],
//     "remove":  [ "<recipe id>", ... ],
//     "ideas":   { "add": [ {title, group, note} ], "remove": [ "<idea title>" ] },
//     "requests": [ "free-text app change requests" ]
//   }
// A bare recipe object or an array of recipes is also accepted.
// New recipes get version 1 and added/updated = today. Changed recipes keep
// their added date and photo, and get version + 1 and updated = today.
// Prints a summary; photos and publishing are the next steps (see CLAUDE.md).
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatRecipe } from './recipe-format.mjs';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const file = args.find(a => !a.startsWith('--'));
if (!file) {
  console.error('Usage: npm run import:batch -- <batch.json> [--dry-run]');
  process.exit(1);
}

const root = fileURLToPath(new URL('..', import.meta.url));
const dataDir = join(root, 'data');
const today = new Date().toLocaleDateString('en-CA');

// Pasted text sometimes arrives wrapped in a ```json fence
const raw = readFileSync(file, 'utf8').replace(/^﻿/, '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
let input;
try {
  input = JSON.parse(raw);
} catch (e) {
  console.error(`The batch is not valid JSON: ${e.message}`);
  process.exit(1);
}

const batch = Array.isArray(input)
  ? { recipes: input }
  : input.kitchenCollectionBatch
    ? input
    : input.id && input.ingredientGroups
      ? { recipes: [input] }
      : null;
if (!batch) {
  console.error('That is not a Kitchen Collection batch or recipe.');
  process.exit(1);
}

const summary = { added: [], updated: [], removed: [], needsPhoto: [], ideasAdded: [], ideasRemoved: [], requests: batch.requests ?? [], problems: [] };
const recipePath = id => join(dataDir, 'recipes', `${id}.json`);

for (const incoming of batch.recipes ?? []) {
  if (!incoming || typeof incoming.id !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(incoming.id)) {
    summary.problems.push(`Skipped a recipe with a missing or invalid id (${incoming?.title ?? 'untitled'}).`);
    continue;
  }
  const path = recipePath(incoming.id);
  const r = { ...incoming };
  if (existsSync(path)) {
    const current = JSON.parse(readFileSync(path, 'utf8'));
    r.version = Math.max((current.version ?? 1) + 1, incoming.version ?? 0);
    r.updated = today;
    if (current.added) r.added = current.added;
    else delete r.added;
    // Keep the existing photo unless the batch supplies one
    if (!r.image && current.image) {
      r.image = current.image;
      if (current.imageCredit) r.imageCredit = current.imageCredit;
    }
    summary.updated.push(`${r.id} (${r.title}) v${current.version} -> v${r.version}`);
  } else {
    r.version = 1;
    r.added = today;
    r.updated = today;
    summary.added.push(`${r.id} (${r.title})`);
  }
  if (!r.image && r.confidence?.level !== 'draft') summary.needsPhoto.push(r.id);
  if (!dryRun) writeFileSync(path, formatRecipe(r));
}

for (const id of batch.remove ?? []) {
  const path = recipePath(id);
  if (!existsSync(path)) {
    summary.problems.push(`Asked to remove "${id}", but there is no such recipe.`);
    continue;
  }
  const current = JSON.parse(readFileSync(path, 'utf8'));
  if (!dryRun) {
    unlinkSync(path);
    if (current.image && !/^https?:/.test(current.image) && existsSync(join(dataDir, current.image))) unlinkSync(join(dataDir, current.image));
  }
  summary.removed.push(`${id} (${current.title})`);
}

if (batch.ideas) {
  const ideasPath = join(dataDir, 'ideas.json');
  const ideas = JSON.parse(readFileSync(ideasPath, 'utf8'));
  const norm = t => t.trim().toLowerCase();
  for (const title of batch.ideas.remove ?? []) {
    const before = ideas.ideas.length;
    ideas.ideas = ideas.ideas.filter(i => norm(i.title) !== norm(title));
    if (ideas.ideas.length < before) summary.ideasRemoved.push(title);
    else summary.problems.push(`Idea "${title}" was not in the ideas list.`);
  }
  for (const idea of batch.ideas.add ?? []) {
    if (!idea?.title) continue;
    if (ideas.ideas.some(i => norm(i.title) === norm(idea.title))) continue;
    ideas.ideas.push({ title: idea.title, ...(idea.group ? { group: idea.group } : {}), ...(idea.note ? { note: idea.note } : {}) });
    summary.ideasAdded.push(idea.title);
  }
  if (!dryRun) writeFileSync(ideasPath, JSON.stringify(ideas, null, 2) + '\n');
}

console.log(JSON.stringify({ dryRun, ...summary }, null, 2));
