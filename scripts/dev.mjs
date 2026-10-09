import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const processes = [
  spawn(process.execPath, ['server/index.js'], {cwd: root, stdio: 'inherit'}),
  spawn(process.execPath, [path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')], {cwd: root, stdio: 'inherit'}),
];

let shuttingDown = false;
const stop = code => {
  if (shuttingDown) return;
  shuttingDown = true;
  processes.forEach(child => child.kill('SIGTERM'));
  process.exit(code);
};

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
processes.forEach(child => child.on('exit', code => stop(code ?? 0)));
