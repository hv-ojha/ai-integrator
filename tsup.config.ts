import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  treeshake: true,
  clean: true,
  minify: true,
  sourcemap: true,
  target: 'es2022',
  outDir: 'dist',
  external: [
    'openai',
    '@anthropic-ai/sdk',
    '@google/generative-ai',
  ],
});
