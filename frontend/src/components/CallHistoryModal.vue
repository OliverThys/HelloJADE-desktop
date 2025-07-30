<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <!-- En-tête -->
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900">
            Historique de l'appel
          </h3>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>

        <!-- Informations de l'appel -->
        <div class="bg-gray-50 rounded-lg p-4 mb-4">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="font-medium text-gray-700">Patient:</span>
              <span class="ml-2">{{ call?.prenom }} {{ call?.nom }}</span>
            </div>
            <div>
              <span class="font-medium text-gray-700">Numéro:</span>
              <span class="ml-2">{{ call?.numero_patient }}</span>
            </div>
            <div>
              <span class="font-medium text-gray-700">Téléphone:</span>
              <span class="ml-2">{{ call?.telephone }}</span>
            </div>
            <div>
              <span class="font-medium text-gray-700">Service:</span>
              <span class="ml-2">{{ call?.service || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- Historique -->
        <div class="max-h-96 overflow-y-auto">
          <div v-if="history.length === 0" class="text-center py-8 text-gray-500">
            Aucun historique disponible
          </div>
          
          <div v-else class="space-y-4">
            <div
              v-for="(entry, index) in history"
              :key="index"
              class="border-l-4 border-blue-500 pl-4 py-2"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span class="font-medium text-gray-900">
                    {{ getActionLabel(entry.action) }}
                  </span>
                </div>
                <span class="text-sm text-gray-500">
                  {{ formatDateTime(entry.date_action) }}
                </span>
              </div>
              
              <div class="mt-2 text-sm text-gray-600">
                <div v-if="entry.ancien_statut && entry.nouveau_statut">
                  <span class="font-medium">Statut:</span>
                  <span class="ml-1 px-2 py-1 bg-gray-100 rounded text-xs">
                    {{ entry.ancien_statut }}
                  </span>
                  <ArrowRightIcon class="inline h-3 w-3 mx-1 text-gray-400" />
                  <span class="px-2 py-1 bg-blue-100 rounded text-xs">
                    {{ entry.nouveau_statut }}
                  </span>
                </div>
                
                <div v-if="entry.utilisateur" class="mt-1">
                  <span class="font-medium">Utilisateur:</span>
                  <span class="ml-1">{{ entry.utilisateur }}</span>
                </div>
              </div>
              
              <!-- Détails des changements -->
              <div v-if="entry.donnees_avant && entry.donnees_apres" class="mt-3">
                <button
                  @click="toggleDetails(index)"
                  class="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <ChevronDownIcon v-if="!expandedDetails.includes(index)" class="h-4 w-4 mr-1" />
                  <ChevronUpIcon v-else class="h-4 w-4 mr-1" />
                  Voir les détails
                </button>
                
                <div v-if="expandedDetails.includes(index)" class="mt-2 p-3 bg-gray-50 rounded text-xs">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <h4 class="font-medium text-gray-700 mb-2">Avant</h4>
                      <pre class="text-gray-600 whitespace-pre-wrap">{{ formatJson(entry.donnees_avant) }}</pre>
                    </div>
                    <div>
                      <h4 class="font-medium text-gray-700 mb-2">Après</h4>
                      <pre class="text-gray-600 whitespace-pre-wrap">{{ formatJson(entry.donnees_apres) }}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end mt-6 space-x-3">
          <button
            @click="$emit('close')"
            class="btn-secondary-light"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  XMarkIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/vue/24/outline'

// Props
interface Props {
  call: any
  history: any[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
}>()

// State
const expandedDetails = ref<number[]>([])

// Méthodes
const getActionLabel = (action: string) => {
  const labels: Record<string, string> = {
    'created': 'Création',
    'updated': 'Modification',
    'status_changed': 'Changement de statut',
    'deleted': 'Suppression'
  }
  return labels[action] || action
}

const formatDateTime = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('fr-FR')
}

const formatJson = (data: any) => {
  try {
    if (typeof data === 'string') {
      return JSON.stringify(JSON.parse(data), null, 2)
    }
    return JSON.stringify(data, null, 2)
  } catch {
    return data
  }
}

const toggleDetails = (index: number) => {
  const idx = expandedDetails.value.indexOf(index)
  if (idx > -1) {
    expandedDetails.value.splice(idx, 1)
  } else {
    expandedDetails.value.push(index)
  }
}
</script>

<style scoped>
.btn-secondary-light {
  @apply px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
}
</style> 