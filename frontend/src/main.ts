import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'

// Création de l'application
const app = createApp(App)

// Installation des plugins
app.use(createPinia())

// Montage de l'application
app.mount('#app') 