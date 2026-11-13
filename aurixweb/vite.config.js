import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: '/aurixapp/',
  build: {
    outDir: 'aurixapp',
    emptyOutDir: false,
    sourcemap: false,
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('axios')) {
              return 'vendor-api';
            }
          }
        },
      },
    },
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
  server: {
    host: true,
    port: 3000,
    proxy: {
      '/aurixwebapi': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/aurixweb': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/TTDScheme': {
        target: 'http://192.168.1.100:8080',
        changeOrigin: true,
        secure: false,
      },
    }
  },
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      'src/**/*.spec.ts',
      'src/**/*.spec.tsx'
    ]
  }
});
