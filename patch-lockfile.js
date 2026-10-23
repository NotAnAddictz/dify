const fs = require('fs');

const pkgPath = process.argv[2] || '/app/package.json';
const lockPath = process.argv[3] || '/app/pnpm-lock.yaml';

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
delete pkg.devEngines;
delete pkg.engines;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

let lock = fs.readFileSync(lockPath, 'utf8');

// Remove importer references to node runtime
lock = lock.replace(/      node:\n        specifier: runtime:\^22\.22\.1\n        version: runtime:22\.23\.1\n/g, '');

// Remove the full node@runtime package block
const marker = '  node@runtime:22.23.1:\n';
let idx = lock.indexOf(marker);
while (idx !== -1) {
  const nextIdx = idx + marker.length;
  let end = nextIdx;
  while (end < lock.length) {
    const nl = lock.indexOf('\n', end);
    if (nl === -1) break;
    const line = lock.slice(end, nl + 1);
    if (/^  [^ \n].*:\n$/.test(line) && end > nextIdx) {
      break;
    }
    end = nl + 1;
  }
  lock = lock.slice(0, idx) + lock.slice(end);
  idx = lock.indexOf(marker);
}

// Remove short references
lock = lock.replace(/  node@runtime:22\.23\.1: \{\}\n/g, '');

fs.writeFileSync(lockPath, lock);
console.log('Patched lockfile, remaining node@runtime refs:', (lock.match(/node@runtime/g) || []).length);
console.log('remaining specifier runtime refs:', (lock.match(/specifier: runtime:/g) || []).length);
