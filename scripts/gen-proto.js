const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(...args) { console.log('[gen-proto]', ...args); }

const repoRoot = path.resolve(__dirname, '..');
const outDir = path.join(repoRoot, 'frontend', 'src', 'proto');
fs.mkdirSync(outDir, { recursive: true });

// Resolve protoc: prefer env.PROTOC, otherwise prefer local grpc_tools_node_protoc, then 'protoc'
function resolveLocalProtoc() {
  const binDir = path.join(repoRoot, 'node_modules', '.bin');
  const candidates = [];
  if (fs.existsSync(binDir)) {
    candidates.push(path.join(binDir, 'grpc_tools_node_protoc.cmd'));
    candidates.push(path.join(binDir, 'grpc_tools_node_protoc'));
    candidates.push(path.join(binDir, 'protoc.cmd'));
    candidates.push(path.join(binDir, 'protoc'));
  }
  // reactjs local node_modules
  const reactBin = path.join(repoRoot, 'frontend', 'node_modules', '.bin');
  if (fs.existsSync(reactBin)) {
    candidates.push(path.join(reactBin, 'grpc_tools_node_protoc.cmd'));
    candidates.push(path.join(reactBin, 'grpc_tools_node_protoc'));
  }

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

const protocCmd = process.env.PROTOC || resolveLocalProtoc() || 'protoc';

// Try to locate local plugin from node_modules/.bin
function resolveLocalPlugin() {
  const candidates = [];
  const binDir = path.join(repoRoot, 'node_modules', '.bin');
  if (fs.existsSync(binDir)) {
    // On Windows npm creates .cmd wrappers
    candidates.push(path.join(binDir, 'protoc-gen-grpc-web.cmd'));
    candidates.push(path.join(binDir, 'protoc-gen-grpc-web'));
    candidates.push(path.join(binDir, 'protoc-gen-grpc-web.exe'));
  }
  // also check reactjs/node_modules if plugin installed there
  const reactBin = path.join(repoRoot, 'frontend', 'node_modules', '.bin');
  if (fs.existsSync(reactBin)) {
    candidates.push(path.join(reactBin, 'protoc-gen-grpc-web.cmd'));
    candidates.push(path.join(reactBin, 'protoc-gen-grpc-web'));
    candidates.push(path.join(reactBin, 'protoc-gen-grpc-web.exe'));
  }

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

const pluginPath = resolveLocalPlugin();
if (pluginPath) log('Found local plugin at', pluginPath);
else log('Local protoc-gen-grpc-web plugin not found; assuming it is on PATH');

// Build protoc args
const args = [];
if (pluginPath) {
  args.push(`--plugin=protoc-gen-grpc-web=${pluginPath}`);
}
args.push('-I=shared/proto');
args.push('shared/proto/chat.proto');
args.push('shared/proto/ai.proto');
args.push(`--js_out=import_style=commonjs:frontend/src/proto`);
args.push(`--grpc-web_out=import_style=commonjs,mode=grpcwebtext:frontend/src/proto`);

log('Running protoc:', protocCmd, args.join(' '));

// On Windows .cmd wrappers need shell: true. Build command string in that case.
const useShell = process.platform === 'win32' && (protocCmd.endsWith('.cmd') || protocCmd.endsWith('.bat'));
let res;
if (useShell) {
  function quoteIfNeeded(a) {
    if (/\s/.test(a) && !/^".*"$/.test(a)) return `"${a}"`;
    return a;
  }
  const cmdString = [protocCmd, ...args].map(quoteIfNeeded).join(' ');
  res = spawnSync(cmdString, { stdio: 'inherit', cwd: repoRoot, shell: true });
} else {
  res = spawnSync(protocCmd, args, { stdio: 'inherit', cwd: repoRoot, shell: false });
}
if (res.error) {
  console.error('[gen-proto] Error running protoc:', res.error.message);
  process.exit(1);
}
if (res.status !== 0) {
  console.error('[gen-proto] protoc exited with code', res.status);
  process.exit(res.status);
}

log('protoc finished successfully. Generated files in', outDir);
