import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  
  // Configuration du serveur de développement
  server: {
    port: 5173,
    host: true,
    strictPort: false,
    cors: true
  },
  
  // Configuration de la build
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          ui: ['@headlessui/vue', '@heroicons/vue'],
          charts: ['chart.js', 'vue-chartjs'],
          utils: ['lodash-es', 'date-fns']
        }
      }
    }
  },
  
  // Configuration des alias
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@views': fileURLToPath(new URL('./src/views', import.meta.url)),
      '@stores': fileURLToPath(new URL('./src/stores', import.meta.url)),
      '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
      '@types': fileURLToPath(new URL('./src/types', import.meta.url)),
      '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
      '@i18n': fileURLToPath(new URL('./src/i18n', import.meta.url)),
      '@router': fileURLToPath(new URL('./src/router', import.meta.url))
    }
  },
  
  // Configuration CSS
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/assets/styles/variables.scss";`
      }
    }
  },
  
  // Configuration des variables d'environnement
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false
  },
  
  // Configuration pour Tauri
  clearScreen: false,
  envPrefix: ['VITE_', 'TAURI_'],
  
  // Configuration des optimisations
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'axios',
      'vue-i18n',
      '@headlessui/vue',
      '@heroicons/vue',
      'chart.js',
      'vue-chartjs',
      'date-fns',
      'lodash-es',
      'vue-toastification'
    ]
  }
}) 