import { spawn } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createRequire } from 'node:module';
import { spawnOwned, cleanupResources } from './lifecycle.mjs';

const require = createRequire(import.meta.url);
const root = resolve('.');
const backend = process.env.E2E_BACKEND_DIR && resolve(process.env.E2E_BACKEND_DIR);
if (!backend || !existsSync(join(backend, 'requirements.txt')))
  throw new Error('E2E_BACKEND_DIR must point to the separate backend checkout');
const python =
  process.env.E2E_PYTHON ??
  join(backend, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
const api = 'http://127.0.0.1:59002/api/v1';
const front = 'http://127.0.0.1:59000';
const env = {
  ...process.env,
  APP_ENV: 'test',
  SECRET_KEY: 'e2e-only-secret-key-never-use-outside-tests',
  REFRESH_SECRET_KEY: 'e2e-only-refresh-key-never-use-outside-tests',
  DATABASE_URL: 'postgresql+psycopg://app:app@127.0.0.1:55434/ecommerce',
  ASYNC_DATABASE_URL: 'postgresql+asyncpg://app:app@127.0.0.1:55434/ecommerce',
  REDIS_URL: 'redis://127.0.0.1:56380/0',
  TEST_REDIS_URL: 'redis://127.0.0.1:56380/0',
  EMAILS_ENABLED: 'false',
  MERCADO_PAGO_ACCESS_TOKEN: 'local-provider-token',
  MERCADO_PAGO_API_BASE_URL: 'http://127.0.0.1:59001',
  MERCADO_PAGO_WEBHOOK_SECRET: 'e2e-webhook-secret-only',
  MERCADO_PAGO_SUCCESS_URL: `${front}/payment-return`,
  MERCADO_PAGO_FAILURE_URL: `${front}/payment-return`,
  MERCADO_PAGO_PENDING_URL: `${front}/payment-return`,
  E2E_PROVIDER_MODE: 'local',
  E2E_CONTROL_SECRET: 'e2e-control-only',
  CONTRACT_API_BASE_URL: api,
  NEXT_PUBLIC_API_BASE_URL: api,
  NEXT_PUBLIC_PAYMENTS_ENABLED: 'true',
  E2E_BUILD: 'true',
  PYTHONPATH: backend,
};
mkdirSync('output/playwright', { recursive: true });
async function run(command, args, cwd = root, capture = false, timeoutMs = undefined) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      timeout: timeoutMs,
      stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    });
    let output = '';
    child.stdout?.on('data', (data) => {
      output += data;
    });
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0
        ? resolveRun(output.trim())
        : reject(new Error(`${command} ${args.join(' ')} exited ${code}`)),
    );
  });
}
const expected = JSON.parse(readFileSync('scripts/e2e/backend-ref.json', 'utf8')).sha;
const observed = await run('git', ['rev-parse', 'HEAD'], backend, true);
if (expected !== observed)
  throw new Error(`Backend SHA mismatch: expected ${expected}, observed ${observed}`);
console.log(`Pinned backend ${observed}`);
await run(process.execPath, [require.resolve('next/dist/bin/next'), 'build', '--turbopack']);
const repeats = Number(process.env.E2E_REPEAT ?? 1);
if (![1, 2].includes(repeats)) throw new Error('E2E_REPEAT must be 1 or 2');
for (let iteration = 1; iteration <= repeats; iteration++) {
  env.E2E_ITERATION = String(iteration);
  const project = `efast-stage2-${process.pid}-${iteration}`;
  const composeArgs = ['compose', '-f', 'scripts/e2e/compose.yml', '-p', project];
  const children = [];
  function start(command, args, label, cwd = root) {
    const log = createWriteStream(`output/playwright/${iteration}-${label}.log`);
    const child = spawnOwned(command, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.pipe(log, { end: false });
    child.stderr.pipe(log, { end: false });
    child.on('error', (error) => log.write(String(error)));
    children.push({ child, log });
    return child;
  }
  async function ready(url, child) {
    const deadline = Date.now() + 60000;
    while (Date.now() < deadline) {
      if (child.exitCode !== null) throw new Error(`Service exited before ready: ${url}`);
      try {
        if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok) return;
      } catch {}
      await new Promise((done) => setTimeout(done, 250));
    }
    throw new Error(`Readiness timeout: ${url}`);
  }
  let originalError = null;
  try {
    await run('docker', [...composeArgs, 'up', '-d', '--wait', '--wait-timeout', '60']);
    await run(python, ['-m', 'alembic', 'upgrade', 'head'], backend);
    for (const seed of ['seed_dev_users', 'seed_dev_products', 'seed_product_relationships'])
      await run(python, [`scripts/${seed}.py`], backend);
    await run(python, [resolve('scripts/e2e/prepare-fixtures.py')], backend);
    const provider = start(process.execPath, ['scripts/e2e/provider.mjs'], 'provider');
    await ready('http://127.0.0.1:59001/health', provider);
    const apiProcess = start(
      python,
      ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '59002'],
      'api',
      backend,
    );
    await ready('http://127.0.0.1:59002/health/ready', apiProcess);
    const frontend = start(
      process.execPath,
      [
        require.resolve('next/dist/bin/next'),
        'start',
        '--hostname',
        '127.0.0.1',
        '--port',
        '59000',
      ],
      'frontend',
    );
    await ready(`${front}/login`, frontend);
    await run(process.execPath, [
      require.resolve('@playwright/test/cli'),
      'test',
      ...process.argv.slice(2),
    ]);
    await run(process.execPath, ['--test', 'scripts/contract/live-api.test.mjs']);
    console.log(`Clean full-stack iteration ${iteration}/${repeats} passed`);
  } catch (error) {
    originalError = error;
  } finally {
    await cleanupResources(
      children,
      () => run('docker', [...composeArgs, 'down', '--remove-orphans'], root, false, 30000),
      originalError,
    );
  }
}
