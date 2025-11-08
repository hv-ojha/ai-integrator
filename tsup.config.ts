import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  treeshake: true,
  clean: true,
  minify: 'terser',
  sourcemap: false,
  target: 'es2022',
  outDir: 'dist',
  external: [
    'openai',
    '@anthropic-ai/sdk',
    '@google/generative-ai',
  ],
  terserOptions: {
    compress: {
      drop_console: false,
      passes: 2,
    },
    mangle: {
      safari10: true,
    },
    format: {
      comments: false,
    },
  },
});
