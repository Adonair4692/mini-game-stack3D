import { defineConfig } from 'vite';

export default defineConfig({
  // Relative assets keep the build portable across GitHub Pages repositories
  // and HTML5 hosts such as itch.io.
  base: './',
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 700,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
