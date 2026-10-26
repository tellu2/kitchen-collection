// npm run release [-- patch|minor|major]   (default: patch)
// Tests, bumps the version, commits, tags vX.Y.Z and pushes. The tag starts
// .github/workflows/release.yml, which builds the signed APK and publishes a
// GitHub Release; the app then shows "Update available".
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const level = process.argv[2] ?? 'patch';
if (!['patch', 'minor', 'major'].includes(level)) {
  console.error('Use patch, minor or major.');
  process.exit(1);
}
// Only npm needs a shell on Windows (it is npm.cmd); git runs directly.
const shell = cmd => process.platform === 'win32' && cmd === 'npm';
const run = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit', shell: shell(cmd) });
const out = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', shell: shell(cmd) }).trim();

if (out('git', ['status', '--porcelain'])) {
  console.error('Commit or discard your changes first, so the release matches what is in git.');
  process.exit(1);
}
run('npm', ['test']);
run('npm', ['run', 'validate']);
// npm version updates package.json and package-lock.json, commits and tags vX.Y.Z
// On Windows npm runs through cmd, so the message needs its own quotes
run('npm', ['version', level, '-m', process.platform === 'win32' ? '"Release %s"' : 'Release %s']);
run('git', ['push', '--follow-tags']);
const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
console.log(`\nReleased v${version}. GitHub builds the signed APK in about 5 minutes:`);
console.log('https://github.com/tellu2/kitchen-collection/actions');
