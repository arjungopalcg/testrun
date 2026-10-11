/// <reference types="vitest/config" />
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({ mode }) => ({
  // `demo` mode inlines everything into one HTML file for static hosting.
  plugins: [react(), tailwindcss(), ...(mode === 'demo' ? [viteSingleFile()] : [])],
  build: mode === 'demo' ? { outDir: 'dist-demo' } : undefined,
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: { environment: 'node', globals: true },
}));
