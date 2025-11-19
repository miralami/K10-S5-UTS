const { spawnSync } = require('child_process');

const containerName = 'uts_envoy';
console.log('[envoy] Stopping container', containerName);
const res = spawnSync('docker', ['rm', '-f', containerName], { stdio: 'inherit', shell: false });
if (res.error) {
  console.error('[envoy] Error stopping container:', res.error.message);
  process.exit(1);
}
process.exit(res.status || 0);
