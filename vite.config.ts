import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')

  // Custom plugin to replace environment variables in HTML
  const htmlEnvPlugin = () => {
    return {
      name: 'html-env-replace',
      transformIndexHtml(html: string) {
        return html.replace(
          '__VITE_HEAP_APP_ID__',
          env.VITE_HEAP_APP_ID || 'heap_placeholder'
        );
      },
    };
  };

  return {
  base: './',
  plugins: [react(), htmlEnvPlugin()],
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler', // Use modern Sass API instead of legacy
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/',
      ],
    },
  },
  };
});
