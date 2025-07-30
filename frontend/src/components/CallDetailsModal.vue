<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
      <!-- En-tête -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-lg font-medium text-gray-900">
            Modifier l'appel
          </h3>
          <p class="text-sm text-gray-500">
            {{ call?.prenom }} {{ call?.nom }}
          </p>
        </div>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon class="h-6 w-6" />
        </button>
      </div>

      <!-- Formulaire -->
      <form @submit.prevent="saveCall" class="space-y-6">
        <!-- Informations du patient (lecture seule) -->
        <div class="bg-gray-50 rounded-lg p-4">
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
              <span class="text-gray-500">Service:</span>
              <span class="ml-2 font-medium">{{ call?.service || '-' }}</span>
            </div>
            <div>
              <span class="text-gray-500">Médecin:</span>
              <span class="ml-2 font-medium">{{ call?.medecin || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- Statut de l'appel -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Statut de l'appel
          </label>
          <select
            v-model="formData.status"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="pending">À appeler</option>
            <option value="called">Appelé</option>
            <option value="failed">Échec</option>
            <option value="in_progress">En cours</option>
          </select>
        </div>

        <!-- Date et heure de l'appel réel -->
        <div v-if="formData.status === 'called'">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Date et heure de l'appel
          </label>
          <input
            v-model="formData.date_appel_reelle"
            type="datetime-local"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <!-- Durée de l'appel -->
        <div v-if="formData.status === 'called'">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Durée de l'appel (secondes)
          </label>
          <input
            v-model="formData.duree_secondes"
            type="number"
            min="0"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Durée en secondes"
          />
        </div>

        <!-- Score -->
        <div v-if="formData.status === 'called'">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Score de l'appel (0-100)
          </label>
          <input
            v-model="formData.score"
            type="number"
            min="0"
            max="100"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Score entre 0 et 100"
          />
          <p class="text-xs text-gray-500 mt-1">
            Score basé sur l'algorithme défini avec le médecin
          </p>
        </div>

        <!-- Résumé de l'appel -->
        <div v-if="formData.status === 'called'">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Résumé de l'appel
          </label>
          <textarea
            v-model="formData.resume_appel"
            rows="6"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Résumé détaillé de l'appel, points importants, actions à suivre..."
          ></textarea>
        </div>

        <!-- Nombre de tentatives -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Nombre de tentatives
          </label>
          <input
            v-model="formData.nombre_tentatives"
            type="number"
            min="0"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Nombre de tentatives"
          />
          <p class="text-xs text-gray-500 mt-1">
            L'appel sera marqué comme "Échec" si le nombre maximum de tentatives est dépassé
          </p>
        </div>

        <!-- Actions -->
        <div class="flex justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            @click="$emit('close')"
            class="btn-secondary-light"
          >
            Annuler
          </button>
          <button
            type="submit"
            class="btn-action-primary-light"
            :disabled="isSaving"
          >
            <ArrowPathIcon v-if="isSaving" class="h-4 w-4 mr-2 animate-spin" />
            {{ isSaving ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { XMarkIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'

interface Props {
  call: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  save: [callData: any]
}>()

// État local
const isSaving = ref(false)

// Données du formulaire
const formData = reactive({
  status: 'pending',
  date_appel_reelle: '',
  duree_secondes: 0,
  score: null,
  resume_appel: '',
  nombre_tentatives: 0
})

// Initialiser les données du formulaire
onMounted(() => {
  if (props.call) {
    formData.status = props.call.statut || 'pending'
    formData.date_appel_reelle = props.call.date_appel_reelle ? 
      new Date(props.call.date_appel_reelle).toISOString().slice(0, 16) : ''
    formData.duree_secondes = props.call.duree_secondes || 0
    formData.score = props.call.score || null
    formData.resume_appel = props.call.resume_appel || ''
    formData.nombre_tentatives = props.call.nombre_tentatives || 0
  }
})

// Sauvegarder l'appel
const saveCall = async () => {
  try {
    isSaving.value = true
    
    const callData = {
      id: props.call.id,
      statut: formData.status,
      date_appel_reelle: formData.date_appel_reelle ? new Date(formData.date_appel_reelle).toISOString() : null,
      duree_secondes: parseInt(formData.duree_secondes) || 0,
      score: formData.score ? parseInt(formData.score) : null,
      resume_appel: formData.resume_appel,
      nombre_tentatives: parseInt(formData.nombre_tentatives) || 0
    }
    
    emit('save', callData)
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.btn-primary {
  @apply inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
}

.btn-outline {
  @apply inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
}
</style> 