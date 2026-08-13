import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'TCGP-Meta',
        short_name: 'TCGP-Meta',
        description:
          'Meta-/Tierlist-/Winrate-Daten fuer Pokemon TCG Pocket Ranked-PVP',
        theme_color: '#45e0f5',
        background_color: '#08090d',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // App-Shell (JS/CSS/HTML) explizit precachen statt sich auf
        // generateSW-Zero-Config-Defaults zu verlassen (M0-Stand).
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        // SPA-Routen (/tierlist, /matchups, /karten) offline erreichbar
        // machen, indem unbekannte Navigations-Requests auf den
        // gecachten App-Shell zurueckfallen.
        navigateFallback: '/index.html',
        // BEWUSST kein runtimeCaching-Eintrag fuer TCGdex-Kartenbilder:
        // "kein Hosting/Caching von Kartenbildern" ist ein dokumentiertes
        // Nicht-Ziel (siehe CLAUDE.md) -- Kartenbilder bleiben offline
        // nicht verfuegbar, CardTile zeigt dafuer einen Hinweis statt
        // eines kaputten Bilds.
        // BEWUSST auch kein runtimeCaching-Eintrag fuer die Limitless-API
        // (play.limitlesstcg.com): das uebernimmt der Dexie-TTL-Cache in
        // src/lib/limitless/cache.ts auf einer anderen Ebene (Rate-Limit-
        // Schonung waehrend des Betriebs, nicht Offline-Verfuegbarkeit).
        // Turnierdaten aendern sich staendig -- ein Service-Worker-Cache
        // wuerde hier veraltete Daten laenger vorhalten als gewollt.
        runtimeCaching: [],
      },
    }),
  ],
})
