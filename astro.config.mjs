// @ts-check
import { defineConfig } from 'astro/config';
import relativeLinks from 'astro-relative-links';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://astro.build/config
export default defineConfig({
  integrations: [relativeLinks()],
  output: 'static',
  vite: {
    resolve: {
      alias: {
        '@altv': path.resolve(__dirname, 'src/altv'),
      },
    },
  },
});
