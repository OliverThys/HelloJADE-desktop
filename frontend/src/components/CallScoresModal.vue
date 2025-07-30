<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <!-- En-tête -->
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900">
            Scores détaillés de l'appel
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
              <span class="font-medium text-gray-700">Score global:</span>
              <span class="ml-2">
                <ScoreBadge :score="call?.score" />
              </span>
            </div>
            <div>
              <span class="font-medium text-gray-700">Date d'appel:</span>
              <span class="ml-2">{{ formatDateTime(call?.date_appel_reelle) }}</span>
            </div>
            <div>
              <span class="font-medium text-gray-700">Durée:</span>
              <span class="ml-2">{{ formatDuration(call?.duree_secondes) }}</span>
            </div>
          </div>
        </div>

        <!-- Scores existants -->
        <div class="mb-6">
          <h4 class="text-md font-medium text-gray-900 mb-3">Scores existants</h4>
          <div v-if="scores.length === 0" class="text-center py-4 text-gray-500">
            Aucun score détaillé disponible
          </div>
          
          <div v-else class="space-y-3">
            <div
              v-for="score in scores"
              :key="score.score_id"
              class="border rounded-lg p-3 bg-white"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="w-3 h-3 rounded-full" :class="getScoreColor(score.valeur_score)"></div>
                  <div>
                    <span class="font-medium text-gray-900">{{ getScoreTypeLabel(score.type_score) }}</span>
                    <span class="ml-2 text-sm text-gray-500">({{ score.valeur_score }}/100)</span>
                  </div>
                </div>
                <div class="text-sm text-gray-500">
                  {{ formatDate(score.date_calcul) }}
                </div>
              </div>
              
              <div v-if="score.commentaire" class="mt-2 text-sm text-gray-600">
                {{ score.commentaire }}
              </div>
              
              <div class="mt-2 text-xs text-gray-500">
                Poids: {{ score.poids_score }}
              </div>
            </div>
          </div>
        </div>

        <!-- Ajouter un nouveau score -->
        <div class="border-t pt-4">
          <h4 class="text-md font-medium text-gray-900 mb-3">Ajouter un score</h4>
          
          <form @submit.prevent="addScore" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Type de score
                </label>
                <select
                  v-model="newScore.type_score"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Sélectionner un type</option>
                  <option value="douleur">Douleur</option>
                  <option value="moral">Moral</option>
                  <option value="traitement">Traitement</option>
                  <option value="compliance">Compliance</option>
                  <option value="symptomes">Symptômes</option>
                  <option value="qualite_vie">Qualité de vie</option>
                  <option value="global">Score global</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Valeur (0-100)
                </label>
                <input
                  v-model.number="newScore.valeur_score"
                  type="number"
                  min="0"
                  max="100"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Poids (0.1-2.0)
              </label>
              <input
                v-model.number="newScore.poids_score"
                type="number"
                min="0.1"
                max="2.0"
                step="0.1"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Commentaire
              </label>
              <textarea
                v-model="newScore.commentaire"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Commentaire optionnel sur ce score..."
              ></textarea>
            </div>
            
            <div class="flex justify-end space-x-3">
              <button
                type="button"
                @click="resetForm"
                class="btn-secondary-light"
              >
                Réinitialiser
              </button>
              <button
                type="submit"
                class="btn-primary-light"
                :disabled="!isFormValid"
              >
                Ajouter le score
              </button>
            </div>
          </form>
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
import { ref, computed } from 'vue'
import { useToast } from 'vue-toastification'
import {
  XMarkIcon
} from '@heroicons/vue/24/outline'
import ScoreBadge from '@/components/ScoreBadge.vue'

// Props
interface Props {
  call: any
  scores: any[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  'add-score': [scoreData: any]
}>()

// Composables
const toast = useToast()

// State
const newScore = ref({
  type_score: '',
  valeur_score: 50,
  poids_score: 1.0,
  commentaire: ''
})

// Computed
const isFormValid = computed(() => {
  return newScore.value.type_score && 
         newScore.value.valeur_score >= 0 && 
         newScore.value.valeur_score <= 100 &&
         newScore.value.poids_score >= 0.1 && 
         newScore.value.poids_score <= 2.0
})

// Méthodes
const getScoreTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    'douleur': 'Douleur',
    'moral': 'Moral',
    'traitement': 'Traitement',
    'compliance': 'Compliance',
    'symptomes': 'Symptômes',
    'qualite_vie': 'Qualité de vie',
    'global': 'Score global'
  }
  return labels[type] || type
}

const getScoreColor = (score: number) => {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-yellow-500'
  if (score >= 40) return 'bg-orange-500'
  return 'bg-red-500'
}

const formatDateTime = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('fr-FR')
}

const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-FR')
}

const formatDuration = (duration: number) => {
  if (!duration) return '-'
  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const addScore = () => {
  if (!isFormValid.value) {
    toast.error('Veuillez remplir tous les champs requis')
    return
  }
  
  emit('add-score', { ...newScore.value })
  resetForm()
}

const resetForm = () => {
  newScore.value = {
    type_score: '',
    valeur_score: 50,
    poids_score: 1.0,
    commentaire: ''
  }
}
</script>

<style scoped>
.btn-primary-light {
  @apply px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary-light {
  @apply px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
}
</style> 