// npm run publish:recipes [-- "commit message"]
// Validates data/, rebuilds the index, commits data/ and pushes. GitHub Actions
// then publishes to GitHub Pages and phones pick it up on the next refresh.
import { execFileSync } from 'node:child_process';

// Only npm needs a shell on Windows (it is npm.cmd); git runs directly so
// arguments with spaces, such as the commit message, stay intact.
const shell = cmd => process.platform === 'win32' && cmd === 'npm';
const run = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit', shell: shell(cmd) });
const out = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', shell: shell(cmd) }).trim();

run('npm', ['run', 'validate']);
run('npm', ['run', 'build:index']);

const changed = out('git', ['status', '--porcelain', '--', 'data']);
if (!changed) {
  console.log('No recipe changes to publish.');
  process.exit(0);
}
const message = process.argv.slice(2).join(' ') || 'Update recipes';
run('git', ['add', 'data']);
run('git', ['commit', '-m', message]);
run('git', ['push']);
console.log('\nPushed. GitHub publishes the recipes in about a minute; pull down on the Recipes screen to fetch them.');
