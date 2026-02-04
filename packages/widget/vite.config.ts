import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import path from 'path';

export default defineConfig({
  plugins: [preact(), cssInjectedByJsPlugin()],
  build: {
    lib: {
      entry: 'src/index.tsx',
      name: 'OnboardingWidget',
      fileName: () => 'widget.js',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        manualChunks: undefined,
      },
    },
    cssCodeSplit: false,
    sourcemap: true,
    target: 'es2020',
    minify: 'esbuild',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@ai-onboarding/shared': path.resolve(
        __dirname,
        '../shared/src/index.ts',
      ),
    },
  },
  server: {
    port: 5172,
    host: true,
    allowedHosts: ['unpervasive-densus-yan.ngrok-free.dev'],
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: 5172,
    host: '0.0.0.0',
    allowedHosts: ['unpervasive-densus-yan.ngrok-free.dev'],
  },
});
