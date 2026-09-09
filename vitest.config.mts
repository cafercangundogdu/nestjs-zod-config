import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    // Vite's built-in TypeScript transform cannot emit decorator metadata, which
    // NestJS needs for constructor injection. unplugin-swc picks up
    // experimentalDecorators / emitDecoratorMetadata from tsconfig.json.
    swc.vite({ module: { type: 'es6' } }),
  ],
  test: {
    include: ['test/**/*.spec.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      reportsDirectory: './coverage',
    },
  },
});
