<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Overlay -->
      <div class="fixed inset-0 bg-gray-500 dark:bg-slate-900 bg-opacity-75 dark:bg-opacity-75 transition-opacity" @click="close"></div>

      <!-- Modal -->
      <div class="inline-block align-bottom bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <!-- En-tête -->
        <div class="bg-red-50 dark:bg-red-900/20 px-6 py-4 border-b border-red-200 dark:border-red-800">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium text-red-900 dark:text-red-300">
              Signaler un problème
            </h3>
            <button
              @click="close"
              class="text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Contenu -->
        <div class="px-6 py-4">
          <form @submit.prevent="submitIssue">
            <!-- Type de problème -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Type de problème *
              </label>
              <select
                v-model="issueData.type_probleme"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Sélectionner un type</option>
                <option value="TECHNICAL">Problème technique</option>
                <option value="MEDICAL">Problème médical</option>
                <option value="COMMUNICATION">Problème de communication</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>

            <!-- Priorité -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Priorité
              </label>
              <select
                v-model="issueData.priorite"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="LOW">Faible</option>
                <option value="MEDIUM">Moyenne</option>
                <option value="HIGH">Élevée</option>
                <option value="CRITICAL">Critique</option>
              </select>
            </div>

            <!-- Description -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Description du problème *
              </label>
              <textarea
                v-model="issueData.description"
                required
                rows="4"
                placeholder="Décrivez le problème rencontré..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
              ></textarea>
            </div>

            <!-- Informations sur l'appel -->
            <div class="mb-4 p-3 bg-gray-50 rounded-md">
              <h4 class="text-sm font-medium text-gray-700 mb-2">Informations sur l'appel</h4>
              <div class="text-sm text-gray-600 space-y-1">
                <p><span class="font-medium">Patient:</span> {{ call?.prenom }} {{ call?.nom }}</p>
                <p><span class="font-medium">Numéro:</span> {{ call?.numero_patient }}</p>
                <p><span class="font-medium">Date prévue:</span> {{ formatDateTime(call?.date_heure_prevue) }}</p>
                <p><span class="font-medium">Statut:</span> {{ getStatusLabel(call?.statut_appel) }}</p>
              </div>
            </div>
          </form>
        </div>

        <!-- Pied de page -->
        <div class="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <div class="flex justify-end space-x-3">
            <button
              @click="close"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Annuler
            </button>
            <button
              @click="submitIssue"
              :disabled="isSubmitting || !isFormValid"
              class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="isSubmitting">Envoi...</span>
              <span v-else>Signaler le problème</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useCallsStore } from '@/stores/calls'
import type { Call } from '@/utils/api'

const callsStore = useCallsStore()

// Props
const props = defineProps<{
  isOpen: boolean
  call: Call | null
}>()

// Événements
const emit = defineEmits<{
  close: []
  'issue-reported': [issueId: number]
}>()

// État local
const isSubmitting = ref(false)
const issueData = reactive({
  type_probleme: '',
  description: '',
  priorite: 'MEDIUM'
})

// Computed
const isFormValid = computed(() => {
  return issueData.type_probleme && issueData.description.trim()
})

// Méthodes
const formatDateTime = (dateString?: string): string => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusLabel = (status?: string): string => {
  const statusMap: Record<string, string> = {
    'A_APPELER': 'À appeler',
    'EN_COURS': 'En cours',
    'APPELE': 'Appelé',
    'ECHEC': 'Échec'
  }
  return statusMap[status || ''] || status || '-'
}

const close = () => {
  // Réinitialiser le formulaire
  Object.assign(issueData, {
    type_probleme: '',
    description: '',
    priorite: 'MEDIUM'
  })
  emit('close')
}

const submitIssue = async () => {
  if (!props.call || !isFormValid.value) return

  try {
    isSubmitting.value = true
    
    const issue = await callsStore.reportIssue(props.call.id, {
      type_probleme: issueData.type_probleme,
      description: issueData.description,
      priorite: issueData.priorite
    })

    emit('issue-reported', issue.id)
    close()
  } catch (error) {
    console.error('Erreur lors du signalement du problème:', error)
  } finally {
    isSubmitting.value = false
  }
}
</script> 