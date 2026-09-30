import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { spawnOwned, stopOwned, cleanupResources } from './lifecycle.mjs';

test('ignored initial shutdown escalates within deadline and leaves unrelated process alive', async () => {
  const code =
    "process.on('SIGTERM',()=>{});process.on('message',()=>{});setInterval(()=>{},1000);process.send('ready');";
  const options = { stdio: ['ignore', 'ignore', 'ignore', 'ipc'] };
  const child = spawnOwned(process.execPath, ['-e', code], options);
  const unrelated = spawn(process.execPath, ['-e', code], options);
  await Promise.all([once(child, 'message'), once(unrelated, 'message')]);
  try {
    await assert.rejects(stopOwned(unrelated), /unowned/);
    const started = Date.now();
    const result = await stopOwned(child, { graceMs: 200, forceMs: 1500 });
    assert.equal(result.forced, true);
    assert.ok(Date.now() - started < 2500);
    assert.equal(unrelated.exitCode, null);
    assert.equal(unrelated.signalCode, null);
    console.log(`Forced owned child in ${Date.now() - started}ms; unrelated PID still alive`);
  } finally {
    unrelated.kill('SIGKILL');
  }
});

test('Docker removal attempted despite cleanup failure and original error preserved', async () => {
  const original = new Error('original test failure');
  let dockerRemoved = false;
  const unrelated = spawn(process.execPath, ['-e', 'setInterval(()=>{},1000)']);
  try {
    await assert.rejects(
      cleanupResources(
        [{ child: unrelated }],
        async () => {
          dockerRemoved = true;
        },
        original,
      ),
      (error) => error === original && error.cleanupErrors.length === 1,
    );
    assert.equal(dockerRemoved, true);
    assert.equal(unrelated.exitCode, null);
  } finally {
    unrelated.kill('SIGKILL');
  }
});

test('forced cleanup stops owned descendants and flushes the final log chunk', async () => {
  const { PassThrough } = await import('node:stream');
  const log = new PassThrough();
  let output = '';
  log.on('data', (chunk) => {
    output += chunk.toString();
  });
  const grandchildCode =
    "process.on('SIGTERM',()=>{});setInterval(()=>{},1000);process.send('ready');";
  const parentCode = `const {spawn}=require('node:child_process');process.on('SIGTERM',()=>{});process.on('message',()=>{});const c=spawn(process.execPath,['-e',${JSON.stringify(grandchildCode)}],{stdio:['ignore','ignore','ignore','ipc']});c.once('message',()=>{process.stdout.write('last log chunk\\n');process.send(c.pid);});setInterval(()=>{},1000);`;
  const child = spawnOwned(process.execPath, ['-e', parentCode], {
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  });
  child.stdout.pipe(log, { end: false });
  child.stderr.pipe(log, { end: false });
  const [pid] = await once(child, 'message');
  await cleanupResources([{ child, log }], async () => {});
  // A terminated Linux orphan may remain a zombie until PID 1 reaps it.
  let terminated = false;
  try {
    process.kill(pid, 0);
    if (process.platform === 'linux') {
      const { readFileSync } = await import('node:fs');
      terminated = /^State:\s+Z/m.test(readFileSync(`/proc/${pid}/status`, 'utf8'));
    }
  } catch (error) {
    if (error.code !== 'ESRCH' && error.code !== 'ENOENT') throw error;
    terminated = true;
  }
  assert.equal(terminated, true, 'owned descendant no longer executes');
  assert.match(output, /last log chunk/);
  assert.equal(log.writableFinished, true);
});
