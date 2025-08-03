<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full mx-4">
      <!-- En-tête -->
      <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Signaler un problème
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Rapportez un problème lié à cet appel
            </p>
          </div>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>
      </div>

      <!-- Contenu -->
      <div class="px-6 py-4">
        <form @submit.prevent="submitIssue" class="space-y-6">
          <!-- Type de problème -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type de problème *
            </label>
            <select
              v-model="issueData.issue_type"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="">Sélectionnez un type</option>
              <option value="technical">Problème technique</option>
              <option value="medical">Problème médical</option>
              <option value="communication">Problème de communication</option>
              <option value="other">Autre</option>
            </select>
          </div>

          <!-- Gravité -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Niveau de gravité *
            </label>
            <div class="grid grid-cols-2 gap-4">
              <label class="flex items-center space-x-2">
                <input
                  type="radio"
                  v-model="issueData.severity"
                  value="low"
                  required
                  class="text-blue-600 focus:ring-blue-500"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">Faible</span>
              </label>
              <label class="flex items-center space-x-2">
                <input
                  type="radio"
                  v-model="issueData.severity"
                  value="medium"
                  required
                  class="text-blue-600 focus:ring-blue-500"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">Moyenne</span>
              </label>
              <label class="flex items-center space-x-2">
                <input
                  type="radio"
                  v-model="issueData.severity"
                  value="high"
                  required
                  class="text-blue-600 focus:ring-blue-500"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">Haute</span>
              </label>
              <label class="flex items-center space-x-2">
                <input
                  type="radio"
                  v-model="issueData.severity"
                  value="critical"
                  required
                  class="text-blue-600 focus:ring-blue-500"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">Critique</span>
              </label>
            </div>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description du problème *
            </label>
            <textarea
              v-model="issueData.description"
              required
              rows="4"
              placeholder="Décrivez le problème en détail..."
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
            ></textarea>
          </div>

          <!-- Informations supplémentaires -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Informations supplémentaires
            </label>
            <textarea
              v-model="issueData.additional_info"
              rows="3"
              placeholder="Contexte, actions déjà tentées, etc."
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
            ></textarea>
          </div>

          <!-- Contact -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contact pour suivi
            </label>
            <input
              v-model="issueData.contact"
              type="email"
              placeholder="votre.email@hopital.fr"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
            />
          </div>

          <!-- Urgence -->
          <div v-if="issueData.severity === 'critical' || issueData.severity === 'high'" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div class="flex items-center space-x-2">
              <ExclamationTriangleIcon class="h-5 w-5 text-red-500" />
              <span class="text-sm font-medium text-red-800 dark:text-red-200">
                Problème de haute priorité
              </span>
            </div>
            <p class="text-sm text-red-700 dark:text-red-300 mt-1">
              Ce problème sera traité en priorité par l'équipe technique.
            </p>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              @click="$emit('close')"
              class="btn-outline"
            >
              Annuler
            </button>
            <button
              type="submit"
              class="btn-primary"
              :disabled="isSubmitting"
            >
              <ExclamationTriangleIcon v-if="!isSubmitting" class="h-4 w-4 mr-2" />
              <div v-else class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {{ isSubmitting ? 'Envoi...' : 'Signaler le problème' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useNotifications } from '@/composables/useNotifications'
import {
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

interface Props {
  callId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  submit: [issueData: any]
}>()

const { showSuccess, showError } = useNotifications()

// État local
const isSubmitting = ref(false)
const issueData = reactive({
  issue_type: '',
  severity: '',
  description: '',
  additional_info: '',
  contact: ''
})

// Méthodes
const submitIssue = async () => {
  try {
    isSubmitting.value = true
    
    // Validation
    if (!issueData.issue_type || !issueData.severity || !issueData.description) {
      showError('Champs manquants', 'Veuillez remplir tous les champs obligatoires')
      return
    }

    // Préparer les données
    const submitData = {
      call_id: props.callId,
      issue_type: issueData.issue_type,
      severity: issueData.severity,
      description: issueData.description,
      additional_info: issueData.additional_info,
      contact: issueData.contact,
      reported_at: new Date().toISOString()
    }

    // Émettre l'événement
    emit('submit', submitData)
    
    // Réinitialiser le formulaire
    Object.assign(issueData, {
      issue_type: '',
      severity: '',
      description: '',
      additional_info: '',
      contact: ''
    })
    
    showSuccess('Problème signalé', 'Problème signalé avec succès')
  } catch (error) {
    console.error('Erreur lors du signalement:', error)
    showError('Erreur de signalement', 'Erreur lors du signalement')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.btn-primary {
  @apply inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50;
}

.btn-outline {
  @apply inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
}
</style> 