import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  // Add any other Astro configuration options you need
  outDir: './dist/client',
  server: {
    port: 3000,
  },
});
