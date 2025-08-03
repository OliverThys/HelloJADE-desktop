<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Overlay -->
      <div class="fixed inset-0 bg-gray-500 dark:bg-slate-900 bg-opacity-75 dark:bg-opacity-75 transition-opacity" @click="close"></div>

      <!-- Modal -->
      <div class="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
        <!-- En-tête -->
        <div class="bg-gray-50 dark:bg-slate-700 px-6 py-4 border-b border-gray-200 dark:border-slate-600">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              Résumé de l'appel - {{ call?.prenom }} {{ call?.nom }}
            </h3>
            <div class="flex space-x-2">
              <button
                @click="exportPDF"
                class="px-3 py-1 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-600 border border-gray-300 dark:border-slate-500 rounded-md hover:bg-gray-50 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export PDF
              </button>
              <button
                @click="close"
                class="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-300"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Contenu -->
        <div class="px-6 py-4 max-h-96 overflow-y-auto">
          <div v-if="call" class="space-y-6">
            <!-- Informations patient -->
            <div class="bg-blue-50 p-4 rounded-lg">
              <h4 class="text-lg font-medium text-blue-900 mb-3">Informations patient</h4>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span class="text-sm font-medium text-blue-700">Numéro patient:</span>
                  <p class="text-blue-900">{{ call.numero_patient }}</p>
                </div>
                <div>
                  <span class="text-sm font-medium text-blue-700">Nom complet:</span>
                  <p class="text-blue-900">{{ call.prenom }} {{ call.nom }}</p>
                </div>
                <div>
                  <span class="text-sm font-medium text-blue-700">Date de naissance:</span>
                  <p class="text-blue-900">{{ formatDate(call.date_naissance) }}</p>
                </div>
                <div>
                  <span class="text-sm font-medium text-blue-700">Téléphone:</span>
                  <p class="text-blue-900">{{ formatPhone(call.telephone) }}</p>
                </div>
              </div>
            </div>

            <!-- Informations hospitalisation -->
            <div class="bg-green-50 p-4 rounded-lg">
              <h4 class="text-lg font-medium text-green-900 mb-3">Informations hospitalisation</h4>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span class="text-sm font-medium text-green-700">Site:</span>
                  <p class="text-green-900">{{ call.site_hospitalisation || '-' }}</p>
                </div>
                <div>
                  <span class="text-sm font-medium text-green-700">Service:</span>
                  <p class="text-green-900">{{ call.service_hospitalisation || '-' }}</p>
                </div>
                <div>
                  <span class="text-sm font-medium text-green-700">Médecin référent:</span>
                  <p class="text-green-900">{{ call.medecin_referent || '-' }}</p>
                </div>
                <div>
                  <span class="text-sm font-medium text-green-700">Date de sortie:</span>
                  <p class="text-green-900">{{ call.date_sortie_hospitalisation ? formatDate(call.date_sortie_hospitalisation) : '-' }}</p>
                </div>
              </div>
            </div>

            <!-- Informations appel -->
            <div class="bg-purple-50 p-4 rounded-lg">
              <h4 class="text-lg font-medium text-purple-900 mb-3">Informations appel</h4>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span class="text-sm font-medium text-purple-700">Appel prévu:</span>
                  <p class="text-purple-900">{{ formatDateTime(call.date_heure_prevue) }}</p>
                </div>
                <div>
                  <span class="text-sm font-medium text-purple-700">Appel réel:</span>
                  <p class="text-purple-900">{{ call.date_heure_reelle ? formatDateTime(call.date_heure_reelle) : '-' }}</p>
                </div>
                <div>
                  <span class="text-sm font-medium text-purple-700">Durée:</span>
                  <p class="text-purple-900">{{ call.duree_appel ? formatDuration(call.duree_appel) : '-' }}</p>
                </div>
                <div>
                  <span class="text-sm font-medium text-purple-700">Tentatives:</span>
                  <p class="text-purple-900">{{ call.nombre_tentatives }}/{{ call.max_tentatives }}</p>
                </div>
              </div>
              <div class="mt-3">
                <span class="text-sm font-medium text-purple-700">Statut:</span>
                <StatusBadge :status="call.statut_appel" class="ml-2" />
              </div>
            </div>

            <!-- Score et résumé -->
            <div class="bg-yellow-50 p-4 rounded-lg">
              <h4 class="text-lg font-medium text-yellow-900 mb-3">Évaluation</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span class="text-sm font-medium text-yellow-700">Score calculé:</span>
                  <div class="mt-1">
                    <ScoreBadge v-if="call.score_calcule !== null" :score="call.score_calcule" />
                    <span v-else class="text-gray-400">Non calculé</span>
                  </div>
                </div>
                <div>
                  <span class="text-sm font-medium text-yellow-700">Résumé:</span>
                  <p class="text-yellow-900 mt-1">{{ call.resume_appel || 'Aucun résumé disponible' }}</p>
                </div>
              </div>
            </div>

            <!-- Résultats du dialogue JADE -->
            <div v-if="call.dialogue_result" class="bg-indigo-50 p-4 rounded-lg">
              <h4 class="text-lg font-medium text-indigo-900 mb-3">Résultats du dialogue JADE</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span class="text-sm font-medium text-indigo-700">Patient confirmé:</span>
                  <p class="text-indigo-900">{{ call.dialogue_result.patient_confirme ? 'Oui' : 'Non' }}</p>
                </div>
                <div>
                  <span class="text-sm font-medium text-indigo-700">Identité vérifiée:</span>
                  <p class="text-indigo-900">{{ call.dialogue_result.identite_verifiee ? 'Oui' : 'Non' }}</p>
                </div>
                <div>
                  <span class="text-sm font-medium text-indigo-700">Niveau de douleur:</span>
                  <p class="text-indigo-900">{{ call.dialogue_result.douleur_niveau }}/10</p>
                </div>
                <div>
                  <span class="text-sm font-medium text-indigo-700">Localisation douleur:</span>
                  <p class="text-indigo-900">{{ call.dialogue_result.douleur_localisation || 'Aucune' }}</p>
                </div>
                <div>
                  <span class="text-sm font-medium text-indigo-700">Traitement suivi:</span>
                  <p class="text-indigo-900">{{ call.dialogue_result.traitement_suivi ? 'Oui' : 'Non' }}</p>
                </div>
                <div>
                  <span class="text-sm font-medium text-indigo-700">Transit normal:</span>
                  <p class="text-indigo-900">{{ call.dialogue_result.transit_normal ? 'Oui' : 'Non' }}</p>
                </div>
                <div>
                  <span class="text-sm font-medium text-indigo-700">Niveau moral:</span>
                  <p class="text-indigo-900">{{ call.dialogue_result.moral_niveau }}/10</p>
                </div>
                <div>
                  <span class="text-sm font-medium text-indigo-700">Fièvre:</span>
                  <p class="text-indigo-900">{{ call.dialogue_result.fievre ? 'Oui' : 'Non' }}</p>
                </div>
                <div v-if="call.dialogue_result.fievre">
                  <span class="text-sm font-medium text-indigo-700">Température:</span>
                  <p class="text-indigo-900">{{ call.dialogue_result.temperature }}°C</p>
                </div>
                <div v-if="call.dialogue_result.autres_plaintes">
                  <span class="text-sm font-medium text-indigo-700">Autres plaintes:</span>
                  <p class="text-indigo-900">{{ call.dialogue_result.autres_plaintes }}</p>
                </div>
              </div>
            </div>

            <!-- Problèmes signalés -->
            <div v-if="call.issues && call.issues.length > 0" class="bg-red-50 p-4 rounded-lg">
              <h4 class="text-lg font-medium text-red-900 mb-3">Problèmes signalés</h4>
              <div class="space-y-2">
                <div v-for="issue in call.issues" :key="issue.id" class="border border-red-200 rounded p-3">
                  <div class="flex justify-between items-start">
                    <div>
                      <p class="text-sm font-medium text-red-700">{{ issue.type_probleme }}</p>
                      <p class="text-red-900 mt-1">{{ issue.description }}</p>
                    </div>
                    <div class="text-right">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {{ issue.priorite }}
                      </span>
                      <p class="text-xs text-red-600 mt-1">{{ issue.statut }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pied de page -->
        <div class="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <div class="flex justify-end">
            <button
              @click="close"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import StatusBadge from '@/components/StatusBadge.vue'
import ScoreBadge from '@/components/ScoreBadge.vue'
import type { Call } from '@/utils/api'

// Props
const props = defineProps<{
  isOpen: boolean
  call: Call | null
}>()

// Événements
const emit = defineEmits<{
  close: []
}>()

// Méthodes
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR')
}

const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatPhone = (phone: string): string => {
  if (!phone) return '-'
  return phone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')
}

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const close = () => {
  emit('close')
}

const exportPDF = () => {
  // TODO: Implémenter l'export PDF
  console.log('Export PDF pour l\'appel:', props.call?.id)
}
</script> 