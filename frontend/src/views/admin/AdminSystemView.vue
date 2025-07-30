<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- En-tête -->
      <div class="mb-8">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Configuration système</h1>
            <p class="mt-2 text-gray-600">
              Gérez les paramètres système et la configuration
            </p>
          </div>
          <button
            @click="saveAllSettings"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <CheckIcon class="mr-2 h-4 w-4" />
            Sauvegarder
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Configuration générale -->
        <div class="lg:col-span-2">
          <div class="bg-[#36454F] rounded-lg shadow p-6 mb-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Configuration générale</h2>
            <div class="space-y-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'établissement
                </label>
                <input
                  v-model="settings.hospitalName"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  URL de l'API
                </label>
                <input
                  v-model="settings.apiUrl"
                  type="url"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Fuseau horaire
                </label>
                <select
                  v-model="settings.timezone"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Europe/Paris">Europe/Paris</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Langue par défaut
                </label>
                <select
                  v-model="settings.language"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Configuration des appels -->
          <div class="bg-[#36454F] rounded-lg shadow p-6 mb-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Configuration des appels</h2>
            <div class="space-y-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Durée maximale d'appel (minutes)
                </label>
                <input
                  v-model.number="settings.maxCallDuration"
                  type="number"
                  min="1"
                  max="60"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Tentatives de rappel
                </label>
                <input
                  v-model.number="settings.retryAttempts"
                  type="number"
                  min="0"
                  max="5"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Intervalle entre tentatives (minutes)
                </label>
                <input
                  v-model.number="settings.retryInterval"
                  type="number"
                  min="5"
                  max="60"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div class="flex items-center">
                <input
                  v-model="settings.autoRecord"
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label class="ml-2 block text-sm text-gray-900">
                  Enregistrement automatique des appels
                </label>
              </div>
            </div>
          </div>

          <!-- Configuration des notifications -->
          <div class="bg-[#36454F] rounded-lg shadow p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Configuration des notifications</h2>
            <div class="space-y-6">
              <div class="flex items-center">
                <input
                  v-model="settings.emailNotifications"
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label class="ml-2 block text-sm text-gray-900">
                  Notifications par email
                </label>
              </div>
              
              <div class="flex items-center">
                <input
                  v-model="settings.smsNotifications"
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label class="ml-2 block text-sm text-gray-900">
                  Notifications par SMS
                </label>
              </div>
              
              <div class="flex items-center">
                <input
                  v-model="settings.pushNotifications"
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label class="ml-2 block text-sm text-gray-900">
                  Notifications push
                </label>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Email de contact
                </label>
                <input
                  v-model="settings.contactEmail"
                  type="email"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Panneau latéral -->
        <div class="lg:col-span-1">
          <!-- Statut du système -->
          <div class="bg-[#36454F] rounded-lg shadow p-6 mb-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Statut du système</h2>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">API</span>
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    systemStatus.api ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  ]"
                >
                  {{ systemStatus.api ? 'Opérationnel' : 'Erreur' }}
                </span>
              </div>
              
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Base de données</span>
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    systemStatus.database ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  ]"
                >
                  {{ systemStatus.database ? 'Opérationnel' : 'Erreur' }}
                </span>
              </div>
              
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Asterisk</span>
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    systemStatus.asterisk ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  ]"
                >
                  {{ systemStatus.asterisk ? 'Opérationnel' : 'Erreur' }}
                </span>
              </div>
              
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Redis</span>
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    systemStatus.redis ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  ]"
                >
                  {{ systemStatus.redis ? 'Opérationnel' : 'Erreur' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Actions système -->
          <div class="bg-[#36454F] rounded-lg shadow p-6 mb-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Actions système</h2>
            <div class="space-y-3">
              <button
                @click="restartServices"
                class="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-[#36454F] hover:bg-gray-50"
              >
                <ArrowPathIcon class="mr-2 h-4 w-4" />
                Redémarrer les services
              </button>
              
              <button
                @click="clearCache"
                class="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-[#36454F] hover:bg-gray-50"
              >
                <TrashIcon class="mr-2 h-4 w-4" />
                Vider le cache
              </button>
              
              <button
                @click="backupDatabase"
                class="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-[#36454F] hover:bg-gray-50"
              >
                <ArrowDownTrayIcon class="mr-2 h-4 w-4" />
                Sauvegarde BDD
              </button>
            </div>
          </div>

          <!-- Informations système -->
          <div class="bg-[#36454F] rounded-lg shadow p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Informations système</h2>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Version</span>
                <span class="text-gray-900">{{ systemInfo.version }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Uptime</span>
                <span class="text-gray-900">{{ systemInfo.uptime }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">CPU</span>
                <span class="text-gray-900">{{ systemInfo.cpu }}%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Mémoire</span>
                <span class="text-gray-900">{{ systemInfo.memory }}%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Disque</span>
                <span class="text-gray-900">{{ systemInfo.disk }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  CheckIcon,
  ArrowPathIcon,
  TrashIcon,
  ArrowDownTrayIcon
} from '@heroicons/vue/24/outline'
import { useNotifications } from '@/composables/useNotifications'

const { showNotification } = useNotifications()

// État local
const settings = ref({
  hospitalName: 'HelloJADE Hospital',
  apiUrl: 'http://localhost:8000',
  timezone: 'Europe/Paris',
  language: 'fr',
  maxCallDuration: 30,
  retryAttempts: 3,
  retryInterval: 15,
  autoRecord: true,
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  contactEmail: 'contact@hellojade.com'
})

const systemStatus = ref({
  api: true,
  database: true,
  asterisk: true,
  redis: true
})

const systemInfo = ref({
  version: '1.0.0',
  uptime: '5j 12h 30m',
  cpu: 45,
  memory: 62,
  disk: 78
})

// Méthodes
const saveAllSettings = async () => {
  try {
    // Simulation de sauvegarde
    await new Promise(resolve => setTimeout(resolve, 1000))
    showNotification('Configuration sauvegardée avec succès', 'success')
  } catch (error) {
    showNotification('Erreur lors de la sauvegarde', 'error')
  }
}

const restartServices = async () => {
  if (confirm('Êtes-vous sûr de vouloir redémarrer les services ?')) {
    try {
      showNotification('Redémarrage des services en cours...', 'info')
      await new Promise(resolve => setTimeout(resolve, 3000))
      showNotification('Services redémarrés avec succès', 'success')
    } catch (error) {
      showNotification('Erreur lors du redémarrage', 'error')
    }
  }
}

const clearCache = async () => {
  if (confirm('Êtes-vous sûr de vouloir vider le cache ?')) {
    try {
      showNotification('Vidage du cache en cours...', 'info')
      await new Promise(resolve => setTimeout(resolve, 1000))
      showNotification('Cache vidé avec succès', 'success')
    } catch (error) {
      showNotification('Erreur lors du vidage du cache', 'error')
    }
  }
}

const backupDatabase = async () => {
  try {
    showNotification('Sauvegarde de la base de données en cours...', 'info')
    await new Promise(resolve => setTimeout(resolve, 2000))
    showNotification('Sauvegarde terminée avec succès', 'success')
  } catch (error) {
    showNotification('Erreur lors de la sauvegarde', 'error')
  }
}

// Lifecycle
onMounted(() => {
  // Charger les paramètres système
  // TODO: Implémenter le chargement des paramètres
})
</script> 
