<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
      <!-- En-tête -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-lg font-medium text-gray-900">
            Résumé de l'appel
          </h3>
          <p class="text-sm text-gray-500">
            {{ call?.prenom }} {{ call?.nom }} - {{ formatDateTime(call?.date_appel_reelle) }}
          </p>
        </div>
        <div class="flex items-center space-x-2">
          <button
            @click="$emit('export-pdf', call)"
            class="btn-action-light"
          >
            <DocumentArrowDownIcon class="h-4 w-4 mr-2" />
            Exporter PDF
          </button>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>
      </div>

      <!-- Informations du patient -->
      <div class="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 class="font-medium text-gray-900 mb-3">Informations du patient</h4>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-500">Numéro patient:</span>
            <span class="ml-2 font-medium">{{ call?.numero_patient || '-' }}</span>
          </div>
          <div>
            <span class="text-gray-500">Téléphone:</span>
            <span class="ml-2 font-medium">{{ call?.telephone || '-' }}</span>
          </div>
          <div>
            <span class="text-gray-500">Date de naissance:</span>
            <span class="ml-2 font-medium">{{ formatDate(call?.date_naissance) }}</span>
          </div>
          <div>
            <span class="text-gray-500">Service:</span>
            <span class="ml-2 font-medium">{{ call?.service || '-' }}</span>
          </div>
          <div>
            <span class="text-gray-500">Médecin:</span>
            <span class="ml-2 font-medium">{{ call?.medecin || '-' }}</span>
          </div>
          <div>
            <span class="text-gray-500">Date de sortie:</span>
            <span class="ml-2 font-medium">{{ formatDate(call?.date_sortie) }}</span>
          </div>
        </div>
      </div>

      <!-- Détails de l'appel -->
      <div class="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 class="font-medium text-gray-900 mb-3">Détails de l'appel</h4>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-500">Appel prévu:</span>
            <span class="ml-2 font-medium">{{ formatDateTime(call?.date_appel_prevue) }}</span>
          </div>
          <div>
            <span class="text-gray-500">Appel réalisé:</span>
            <span class="ml-2 font-medium">{{ formatDateTime(call?.date_appel_reelle) }}</span>
          </div>
          <div>
            <span class="text-gray-500">Durée:</span>
            <span class="ml-2 font-medium">{{ formatDuration(call?.duree_secondes) }}</span>
          </div>
          <div>
            <span class="text-gray-500">Score:</span>
            <span class="ml-2">
              <ScoreBadge :score="call?.score" />
            </span>
          </div>
          <div>
            <span class="text-gray-500">Statut:</span>
            <span class="ml-2">
              <StatusBadge :status="call?.statut" :attempts="call?.nombre_tentatives" />
            </span>
          </div>
        </div>
      </div>

      <!-- Résumé de l'appel -->
      <div class="mb-6">
        <h4 class="font-medium text-gray-900 mb-3">Résumé de l'appel</h4>
        <div class="bg-white border border-gray-200 rounded-lg p-4">
          <div v-if="call?.resume_appel" class="text-gray-700 whitespace-pre-wrap">
            {{ call.resume_appel }}
          </div>
          <div v-else class="text-gray-400 italic">
            Aucun résumé disponible pour cet appel.
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-3">
        <button
          @click="$emit('close')"
          class="btn-secondary-light"
        >
          Fermer
        </button>
        <button
          @click="editCall"
          class="btn-action-primary-light"
        >
          Modifier
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { XMarkIcon, DocumentArrowDownIcon } from '@heroicons/vue/24/outline'
import StatusBadge from './StatusBadge.vue'
import ScoreBadge from './ScoreBadge.vue'

interface Props {
  call: any
}

defineProps<Props>()

defineEmits<{
  close: []
  'export-pdf': [call: any]
}>()

// Utilitaires
const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-FR')
}

const formatDateTime = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('fr-FR')
}

const formatDuration = (duration: number) => {
  if (!duration) return '-'
  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const editCall = () => {
  // Émettre un événement pour ouvrir la modale d'édition
  // Cette fonctionnalité peut être implémentée plus tard
}
</script>

<style scoped>
.btn-primary {
  @apply inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
}

.btn-secondary {
  @apply inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
}

.btn-outline {
  @apply inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
}
</style> 