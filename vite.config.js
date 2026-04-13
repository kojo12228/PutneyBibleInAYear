import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectRegister: 'auto',
      manifest: false, // we manage manifest.webmanifest ourselves in public/
      devOptions: {
        enabled: false, // don't activate SW in dev
      },
    }),
  ],
  base: './',
})
