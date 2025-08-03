<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
      <!-- En-tête -->
      <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Dialogue JADE - {{ call?.patient.prenom }} {{ call?.patient.nom }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Assistant vocal intelligent pour le suivi post-hospitalisation
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
      <div class="px-6 py-4 flex-1 overflow-y-auto">
        <!-- Informations patient -->
        <div class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 class="font-medium text-blue-900 dark:text-blue-100 mb-2">Informations Patient</h4>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-blue-700 dark:text-blue-300">Nom:</span>
              <span class="ml-2 text-blue-900 dark:text-blue-100">{{ call?.patient.prenom }} {{ call?.patient.nom }}</span>
            </div>
            <div>
              <span class="text-blue-700 dark:text-blue-300">Téléphone:</span>
              <span class="ml-2 text-blue-900 dark:text-blue-100">{{ call?.patient.telephone }}</span>
            </div>
            <div>
              <span class="text-blue-700 dark:text-blue-300">Service:</span>
              <span class="ml-2 text-blue-900 dark:text-blue-100">{{ call?.hospital_data.service }}</span>
            </div>
            <div>
              <span class="text-blue-700 dark:text-blue-300">Médecin:</span>
              <span class="ml-2 text-blue-900 dark:text-blue-100">{{ call?.hospital_data.medecin }}</span>
            </div>
          </div>
        </div>

        <!-- Dialogue en cours -->
        <div class="mb-6">
          <h4 class="font-medium text-gray-900 dark:text-white mb-3">Dialogue en cours</h4>
          
          <!-- Messages -->
          <div class="space-y-4 max-h-64 overflow-y-auto">
            <div
              v-for="(message, index) in dialogueMessages"
              :key="index"
              :class="[
                'flex',
                message.type === 'jade' ? 'justify-start' : 'justify-end'
              ]"
            >
              <div
                :class="[
                  'max-w-xs lg:max-w-md px-4 py-2 rounded-lg',
                  message.type === 'jade' 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' 
                    : 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100'
                ]"
              >
                <div class="text-sm font-medium mb-1">
                  {{ message.type === 'jade' ? 'JADE' : 'Patient' }}
                </div>
                <div class="text-sm">{{ message.text }}</div>
                <div class="text-xs opacity-75 mt-1">
                  {{ formatTime(message.timestamp) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Question actuelle -->
          <div v-if="currentQuestion" class="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-400">
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                  <MicrophoneIcon class="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              <div class="flex-1">
                <h5 class="font-medium text-yellow-900 dark:text-yellow-100">Question actuelle</h5>
                <p class="text-sm text-yellow-800 dark:text-yellow-200 mt-1">{{ currentQuestion }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Simulation de réponse (pour les tests) -->
        <div class="mb-6">
          <h4 class="font-medium text-gray-900 dark:text-white mb-3">Simulation de réponse</h4>
          <div class="flex space-x-2">
            <input
              v-model="simulatedResponse"
              type="text"
              placeholder="Tapez une réponse simulée..."
              class="flex-1 input-field"
              @keyup.enter="sendSimulatedResponse"
            />
            <button
              @click="sendSimulatedResponse"
              class="btn-primary"
              :disabled="!simulatedResponse.trim()"
            >
              Envoyer
            </button>
          </div>
          
          <!-- Réponses rapides -->
          <div class="mt-3 flex flex-wrap gap-2">
            <button
              v-for="quickResponse in quickResponses"
              :key="quickResponse"
              @click="simulatedResponse = quickResponse"
              class="btn-sm btn-outline"
            >
              {{ quickResponse }}
            </button>
          </div>
        </div>

        <!-- Progression -->
        <div class="mb-6">
          <h4 class="font-medium text-gray-900 dark:text-white mb-3">Progression</h4>
          <div class="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${dialogueProgress}%` }"
            ></div>
          </div>
          <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
            <span>Étape {{ currentStep }} sur {{ totalSteps }}</span>
            <span>{{ Math.round(dialogueProgress) }}%</span>
          </div>
        </div>

        <!-- Résultats partiels -->
        <div v-if="partialResults" class="mb-6">
          <h4 class="font-medium text-gray-900 dark:text-white mb-3">Résultats partiels</h4>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div v-if="partialResults.douleur_niveau !== undefined">
              <span class="text-gray-600 dark:text-gray-400">Douleur:</span>
              <span class="ml-2 font-medium">{{ partialResults.douleur_niveau }}/10</span>
            </div>
            <div v-if="partialResults.traitement_suivi !== undefined">
              <span class="text-gray-600 dark:text-gray-400">Traitement:</span>
              <span class="ml-2 font-medium">{{ partialResults.traitement_suivi ? 'Suivi' : 'Non suivi' }}</span>
            </div>
            <div v-if="partialResults.transit_normal !== undefined">
              <span class="text-gray-600 dark:text-gray-400">Transit:</span>
              <span class="ml-2 font-medium">{{ partialResults.transit_normal ? 'Normal' : 'Anormal' }}</span>
            </div>
            <div v-if="partialResults.moral_niveau !== undefined">
              <span class="text-gray-600 dark:text-gray-400">Moral:</span>
              <span class="ml-2 font-medium">{{ partialResults.moral_niveau }}/10</span>
            </div>
            <div v-if="partialResults.fievre !== undefined">
              <span class="text-gray-600 dark:text-gray-400">Fièvre:</span>
              <span class="ml-2 font-medium">{{ partialResults.fievre ? 'Oui' : 'Non' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <button
              @click="pauseDialogue"
              class="btn-outline"
              :disabled="isPaused"
            >
              <PauseIcon class="h-4 w-4 mr-2" />
              Pause
            </button>
            <button
              @click="resumeDialogue"
              class="btn-outline"
              :disabled="!isPaused"
            >
              <PlayIcon class="h-4 w-4 mr-2" />
              Reprendre
            </button>
          </div>
          <div class="flex items-center space-x-2">
            <button
              @click="$emit('close')"
              class="btn-outline"
            >
              Annuler
            </button>
            <button
              @click="endDialogue"
              class="btn-primary"
              :disabled="!dialogueComplete"
            >
              Terminer l'appel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCallsEnhancedStore } from '@/stores/callsEnhanced'
import { useNotifications } from '@/composables/useNotifications'
import {
  XMarkIcon,
  MicrophoneIcon,
  PauseIcon,
  PlayIcon
} from '@heroicons/vue/24/outline'
import type { CallRecord, DialogueResult } from '@/types/calls'

interface Props {
  call: CallRecord | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  complete: [callId: string]
}>()

const { showSuccess, showError, showInfo } = useNotifications()
const callsStore = useCallsEnhancedStore()

// État local
const dialogueMessages = ref<Array<{
  type: 'jade' | 'patient'
  text: string
  timestamp: Date
}>>([])
const currentQuestion = ref('')
const simulatedResponse = ref('')
const currentStep = ref(1)
const totalSteps = ref(13)
const isPaused = ref(false)
const dialogueComplete = ref(false)
const partialResults = ref<Partial<DialogueResult>>({})

// Réponses rapides pour les tests
const quickResponses = [
  'Oui',
  'Non',
  '5',
  '7',
  '38.5°C',
  'Pas de problème',
  'Fatigue'
]

// Computed
const dialogueProgress = computed(() => {
  return (currentStep.value / totalSteps.value) * 100
})

// Méthodes
const startDialogue = async () => {
  if (!props.call) return

  try {
    const initialQuestion = await callsStore.startDialogue(props.call.call_id)
    currentQuestion.value = initialQuestion
    
    // Ajouter le premier message de JADE
    dialogueMessages.value.push({
      type: 'jade',
      text: initialQuestion,
      timestamp: new Date()
    })
  } catch (error) {
    console.error('Erreur lors du démarrage du dialogue:', error)
    showError('Erreur de démarrage', 'Erreur lors du démarrage du dialogue')
  }
}

const sendSimulatedResponse = async () => {
  if (!simulatedResponse.value.trim() || !props.call) return

  const response = simulatedResponse.value
  simulatedResponse.value = ''

  // Ajouter la réponse du patient
  dialogueMessages.value.push({
    type: 'patient',
    text: response,
    timestamp: new Date()
  })

  try {
    // Traiter la réponse via le store
    const result = await callsStore.processDialogueResponse(props.call.call_id, response)
    
    // Mettre à jour les résultats partiels
    partialResults.value = { ...partialResults.value, ...result.dialogueResult }
    
    if (result.isComplete) {
      // Dialogue terminé
      dialogueComplete.value = true
      currentQuestion.value = ''
      showSuccess('Dialogue terminé', 'Dialogue terminé avec succès')
    } else {
      // Question suivante
      currentQuestion.value = result.nextQuestion
      currentStep.value++
      
      // Ajouter la nouvelle question de JADE
      dialogueMessages.value.push({
        type: 'jade',
        text: result.nextQuestion,
        timestamp: new Date()
      })
    }
  } catch (error) {
    console.error('Erreur lors du traitement de la réponse:', error)
    showError('Erreur de traitement', 'Erreur lors du traitement de la réponse')
  }
}

const pauseDialogue = () => {
  isPaused.value = true
  showInfo('Dialogue en pause', 'Le dialogue a été mis en pause')
}

const resumeDialogue = () => {
  isPaused.value = false
  showInfo('Dialogue repris', 'Le dialogue a été repris')
}

const endDialogue = () => {
  if (props.call) {
    emit('complete', props.call.call_id)
  }
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// Lifecycle
onMounted(() => {
  startDialogue()
})

onUnmounted(() => {
  // Nettoyer si nécessaire
})
</script>

<style scoped>
.input-field {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white;
}

.btn-primary {
  @apply inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
}

.btn-outline {
  @apply inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
}

.btn-sm {
  @apply px-3 py-1.5 text-xs;
}
</style> 