const { spawnSync } = require('child_process');
const path = require('path');

function log(...a) { console.log('[envoy]', ...a); }

const repoRoot = path.resolve(__dirname, '..');
const yamlPath = path.join(repoRoot, 'deploy', 'envoy', 'grpc-web-envoy.yaml');
const containerName = 'uts_envoy';

// Check if Docker is available
const dockerCheck = spawnSync('docker', ['--version'], { stdio: 'pipe', shell: false });
if (dockerCheck.error || dockerCheck.status !== 0) {
  console.warn('[envoy] Docker not found or not running. Skipping Envoy start.');
  console.warn('[envoy] gRPC typing feature will not work without Envoy proxy.');
  console.warn('[envoy] Set VITE_ENABLE_GRPC=false in reactjs/.env to disable gRPC.');
  process.exit(0); // Exit gracefully
}

log('Starting Envoy container', containerName);

// Remove existing container if exists (ignore errors)
spawnSync('docker', ['rm', '-f', containerName], { stdio: 'ignore', shell: false });

// Build mount spec (use absolute Windows path)
const mount = `${yamlPath}:/etc/envoy/envoy.yaml:ro`;

const args = ['run', '-d', '--name', containerName, '-v', mount, '-p', '8081:8081', 'envoyproxy/envoy:v1.22.0'];

const res = spawnSync('docker', args, { stdio: 'pipe', encoding: 'utf8', shell: false });
if (res.error) {
  console.error('[envoy] Error launching docker:', res.error.message);
  console.error('[envoy] gRPC typing feature will not be available.');
  process.exit(0); // Exit gracefully, don't fail the whole dev command
}
if (res.status !== 0) {
  console.error('[envoy] Docker exited with code', res.status);
  console.error(res.stdout);
  console.error(res.stderr);
  console.error('[envoy] gRPC typing feature will not be available.');
  process.exit(0); // Exit gracefully
}

log('Envoy started (container id):', res.stdout.trim());
process.exit(0);
