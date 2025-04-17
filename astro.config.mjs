// @ts-nocheck
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
        'alt-client': path.resolve(__dirname, 'src/altv/client-stub.js'),
        'natives': path.resolve(__dirname, 'src/altv/client-stub.js'),
        '@Client/webview/index.js': path.resolve(
          __dirname,
          'src/altv/client-stub.js'
        ),
        '@Client/webview/index.ts': path.resolve(
          __dirname,
          'src/altv/client-stub.js'
        ),
      },
    },
    optimizeDeps: {
      include: ['alt-client', 'natives'],
    },
    ssr: {
      noExternal: ['alt-client', 'natives'],
    },
  },
});
