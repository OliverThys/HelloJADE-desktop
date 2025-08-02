import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { createI18n } from 'vue-i18n'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'



import App from './App.vue'
import { routes, setupRouterGuards } from './router'
import { i18nConfig } from './i18n'
import './assets/tailwind.css'

// Configuration du router
const router = createRouter({
  history: createWebHistory(),
  routes
})

// Configuration i18n
const i18n = createI18n(i18nConfig)

// Configuration des toasts
const toastOptions = {
  position: 'top-right',
  timeout: 5000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: 'button',
  icon: true,
  rtl: false
}

// Plugin de persistance pour Pinia
const pinia = createPinia()

// Création de l'application
const app = createApp(App)

// Installation des plugins
app.use(pinia)
app.use(router)
app.use(i18n)
app.use(Toast, toastOptions)

// Configuration des guards de routage
setupRouterGuards(router)

// Montage de l'application
app.mount('#app') 