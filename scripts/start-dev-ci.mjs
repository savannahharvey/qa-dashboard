import { spawn } from 'node:child_process';

const env = {
  ...process.env,
  PORT: process.env.PORT ?? '4000',
};

const children = [];

function start(command, args, extraEnv = {}) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: { ...env, ...extraEnv },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  children.push(child);
  child.on('exit', (code, signal) => {
    shutdown(code ?? (signal ? 1 : 0));
  });

  return child;
}

let shuttingDown = false;

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  for (const child of children) {
    child.kill('SIGTERM');
  }

  setTimeout(() => {
    for (const child of children) {
      if (!child.killed) {
        child.kill('SIGKILL');
      }
    }
    process.exit(exitCode);
  }, 1500).unref();
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

start('node', ['--import', 'tsx', 'src/server.ts']);
start('npm', ['run', 'dev:web']);
