import {defineConfig} from 'tsup';

export default defineConfig({
  entry: ['./src/index.ts'],
  clean: true,
  outDir: 'dist',
  format: ['cjs'],
  target: 'es2015',
  // dts: true,
});
