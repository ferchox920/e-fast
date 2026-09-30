import { spawn } from 'node:child_process';
import { finished } from 'node:stream/promises';

const owned = new WeakSet();
export function spawnOwned(command, args, options = {}) {
  const child = spawn(command, args, { ...options, detached: process.platform !== 'win32' });
  owned.add(child);
  return child;
}

function waitExit(child, timeoutMs) {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve(true);
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      child.off('exit', exit);
      resolve(false);
    }, timeoutMs);
    function exit() {
      clearTimeout(timer);
      resolve(true);
    }
    child.once('exit', exit);
  });
}

async function taskkill(pid, force, timeoutMs) {
  const child = spawn('taskkill', ['/PID', String(pid), '/T', ...(force ? ['/F'] : [])], {
    stdio: 'ignore',
  });
  if (!(await waitExit(child, timeoutMs))) {
    child.kill();
    throw new Error('taskkill deadline exceeded');
  }
}

async function drain(child, log, timeoutMs = 2000) {
  let timer;
  try {
    await Promise.race([
      (async () => {
        if (child.stdout && !child.stdout.destroyed) await finished(child.stdout);
        if (child.stderr && !child.stderr.destroyed) await finished(child.stderr);
        log.end();
        await finished(log);
      })(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('Log drain deadline exceeded')), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
    if (!log.writableFinished) log.destroy();
  }
}

export async function stopOwned(child, { graceMs = 2000, forceMs = 2000 } = {}) {
  if (!owned.has(child)) throw new Error('Refusing to terminate an unowned process');
  if (!child.pid) return { forced: false };
  if (process.platform === 'win32') {
    if (child.exitCode !== null || child.signalCode !== null) return { forced: false };
    if (child.connected) child.send({ type: 'shutdown' });
    else await taskkill(child.pid, false, graceMs);
  } else {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch (error) {
      if (error.code !== 'ESRCH') throw error;
    }
  }
  const exited = await waitExit(child, graceMs);
  // Kill the owned process group even if its leader exited but left descendants.
  if (process.platform !== 'win32') {
    try {
      process.kill(-child.pid, 'SIGKILL');
    } catch (error) {
      if (error.code !== 'ESRCH') throw error;
    }
  } else if (!exited) await taskkill(child.pid, true, forceMs);
  if (!(await waitExit(child, forceMs)))
    throw new Error(`Owned process ${child.pid} did not terminate within deadline`);
  return { forced: !exited };
}

export async function cleanupResources(resources, removeDocker, originalError = null) {
  const failures = [];
  for (const { child, log } of [...resources].reverse()) {
    try {
      const result = await stopOwned(child);
      if (result.forced) console.warn(`Forced termination of owned PID ${child.pid}`);
    } catch (error) {
      failures.push(error);
    } finally {
      if (log) {
        try {
          await drain(child, log);
        } catch (error) {
          failures.push(error);
        }
      }
    }
  }
  try {
    await removeDocker();
  } catch (error) {
    failures.push(error);
  }
  for (const error of failures) console.error('Cleanup failure:', error.message);
  if (originalError) {
    originalError.cleanupErrors = failures;
    throw originalError;
  }
  if (failures.length) throw new AggregateError(failures, 'Resource cleanup failed');
}
