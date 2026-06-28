import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  server: {
    https: true,
    host: true // Exposes the server on the local network (for testing on mobile)
  },
  resolve: {
    alias: {
      // Use the browser ESM bundle for mqtt to avoid Node.js built-in dependencies
      mqtt: resolve(__dirname, 'node_modules/mqtt/dist/mqtt.esm.js'),
    },
  },
  plugins: [
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'Smart Glasses HUD',
        short_name: 'HUD',
        description: 'High-contrast navigation HUD for smart glasses',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});
