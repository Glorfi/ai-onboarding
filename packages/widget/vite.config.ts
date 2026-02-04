import { defineConfig, type Plugin } from 'vite';
import preact from '@preact/preset-vite';
import path from 'path';

/**
 * Collects all CSS produced by the build, removes .css assets,
 * and prepends `window.__WIDGET_CSS__ = "…"` to the entry JS chunk.
 * This lets us inject the CSS into a Shadow DOM at runtime.
 */
function cssToGlobalVarPlugin(): Plugin {
  return {
    name: 'css-to-global-var',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      let css = '';

      // Collect and remove CSS assets
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type === 'asset' && fileName.endsWith('.css')) {
          css += chunk.source;
          delete bundle[fileName];
        }
      }

      // Prepend CSS string to the entry JS chunk
      for (const chunk of Object.values(bundle)) {
        if (chunk.type === 'chunk' && chunk.isEntry) {
          chunk.code =
            `window.__WIDGET_CSS__=${JSON.stringify(css)};\n` + chunk.code;
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [preact(), cssToGlobalVarPlugin()],
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
