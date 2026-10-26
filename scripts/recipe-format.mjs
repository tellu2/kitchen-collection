// Writes recipe JSON in the repo's house layout: one line per top-level field,
// one line per ingredient, step and note. Keeps diffs small and lets
// scripts/add-photo.mjs edit the image lines in place.

const ORDER = ['schemaVersion', 'id', 'title', 'description', 'category', 'tags', 'yield', 'time', 'appliances', 'source',
  'confidence', 'methodLabel', 'nutrition', 'image', 'imageCredit', 'ingredientGroups', 'steps', 'notes', 'pairings',
  'version', 'updated', 'added'];

const line = v => JSON.stringify(v);

export function formatRecipe(r) {
  const keys = [...ORDER.filter(k => k in r), ...Object.keys(r).filter(k => !ORDER.includes(k))];
  const parts = keys.map(k => {
    const v = r[k];
    if (k === 'ingredientGroups') {
      const groups = v.map(g => {
        const head = g.title !== undefined ? `      "title": ${line(g.title)},\n` : '';
        const items = g.items.map(i => `        ${line(i)}`).join(',\n');
        return `    {\n${head}      "items": [\n${items}\n      ]\n    }`;
      });
      return `  "ingredientGroups": [${groups.length ? `\n${groups.join(',\n')}\n  ` : ''}]`;
    }
    if ((k === 'steps' || k === 'notes') && Array.isArray(v)) {
      return `  ${line(k)}: [${v.length ? `\n${v.map(x => `    ${line(x)}`).join(',\n')}\n  ` : ''}]`;
    }
    return `  ${line(k)}: ${line(v)}`;
  });
  return `{\n${parts.join(',\n')}\n}\n`;
}
