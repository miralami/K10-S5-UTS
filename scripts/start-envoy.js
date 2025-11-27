const { spawn } = require('child_process');
const path = require('path');

function log(...a) { console.log('[envoy]', ...a); }

const repoRoot = path.resolve(__dirname, '..');
const yamlPath = path.join(repoRoot, 'infrastructure', 'envoy', 'grpc-web-envoy.yaml');

log('Starting Envoy (local binary)...');

// Spawn envoy directly
// Assumes 'envoy' is in the system PATH
const envoy = spawn('envoy', ['-c', yamlPath], { stdio: 'inherit', shell: true });

envoy.on('error', (err) => {
  if (err.code === 'ENOENT') {
    console.warn('[envoy] "envoy" binary not found in PATH.');
    console.warn('[envoy] Please install Envoy or add it to your PATH to use gRPC features.');
    console.warn('[envoy] Continuing without Envoy...');
  } else {
    console.error('[envoy] Failed to start Envoy:', err.message);
  }
  // Don't exit with error, just let other services run
});

envoy.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    log(`Envoy exited with code ${code}`);
  }
});

