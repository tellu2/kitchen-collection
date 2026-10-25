import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig({
  // Relative base so the build works inside the Capacitor WebView
  base: './',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts']
  }
});
