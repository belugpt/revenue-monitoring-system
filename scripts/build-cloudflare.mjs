import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

// Cloudflare Builds uses the same verified bundle, with account-owned bindings.
for (const args of [
  ['--experimental-strip-types', '--test', 'tests/*.test.mjs'],
  ['node_modules/typescript/bin/tsc', '--noEmit'],
  ['scripts/run-framework.mjs', 'build'],
]) {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
const config = JSON.parse(readFileSync('dist/server/wrangler.json', 'utf8'));
const deployment = JSON.parse(readFileSync('wrangler.cloudflare.json', 'utf8'));
Object.assign(config, { name: deployment.name, vars: deployment.vars, workers_dev: true,
  d1_databases: deployment.d1_databases.map(db => ({ ...db, migrations_dir: '../../cloudflare-migrations' })) });
writeFileSync('dist/server/wrangler.json', JSON.stringify(config, null, 2));
