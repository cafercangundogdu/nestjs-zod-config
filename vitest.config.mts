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
      include: ['src/**'],
      // The example app is imported by example-app.spec.ts but is not part of the
      // published library, so it is excluded from the measurement.
      exclude: ['example/**'],
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      // Floors sit a few points below the current numbers (100 / 84.6 / 100 / 100,
      // identical on the NestJS 11 and 12 CI legs) so a regression fails CI without
      // making every small refactor fight the gate.
      thresholds: {
        statements: 95,
        branches: 75,
        functions: 95,
        lines: 95,
      },
    },
  },
});
