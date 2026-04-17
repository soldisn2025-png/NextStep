import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  root: process.cwd(),
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['__tests__/**/*.test.ts', 'src/**/*.test.ts'],
    exclude: ['node_modules', '.next', 'public'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});
