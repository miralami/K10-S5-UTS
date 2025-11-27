const { execSync } = require('child_process');

console.log('[envoy] Stopping Envoy...');

try {
  // Try to kill envoy process on Windows
  execSync('taskkill /F /IM envoy.exe', { stdio: 'ignore' });
  console.log('[envoy] Envoy stopped.');
} catch (e) {
  // Ignore if not found
  console.log('[envoy] No running Envoy process found or failed to stop.');
}

