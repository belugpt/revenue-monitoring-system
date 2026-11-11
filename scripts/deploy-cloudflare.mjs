import { spawnSync } from 'node:child_process';
for (const args of [
  ['d1', 'migrations', 'apply', 'DB', '--remote', '--config', 'wrangler.cloudflare.json'],
  ['deploy', '--config', 'dist/server/wrangler.json'],
]) {
  const result = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', ...args], { stdio: 'inherit', env: { ...process.env, CI: 'true' } });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
