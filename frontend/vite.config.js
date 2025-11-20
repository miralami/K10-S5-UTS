import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'global': 'globalThis',
  },
  resolve: {
    alias: {
      'grpc-web': 'grpc-web',
    }
  },
  optimizeDeps: {
    include: ['grpc-web', 'google-protobuf'],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    open: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
    cors: {
      origin: 'http://127.0.0.1:8000',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    },
  },
});
