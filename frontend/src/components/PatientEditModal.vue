<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <!-- En-tête du modal -->
      <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
        <h2 class="text-xl font-semibold text-slate-900 dark:text-white">
          Modifier le Patient
        </h2>
        <button
          @click="$emit('close')"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <XMarkIcon class="h-6 w-6" />
        </button>
      </div>

      <!-- Formulaire d'édition -->
      <form @submit.prevent="savePatient" class="px-6 py-4" v-if="patient">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Informations personnelles -->
          <div class="space-y-4">
            <h4 class="text-lg font-semibold text-slate-900 dark:text-white border-b border-gray-200 dark:border-slate-700 pb-2">
              Informations Personnelles
            </h4>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nom *
                </label>
                <input
                  v-model="formData.nom"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Prénom *
                </label>
                <input
                  v-model="formData.prenom"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Date de naissance *
                </label>
                <input
                  v-model="formData.date_naissance"
                  type="date"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Numéro de sécurité sociale
                </label>
                <input
                  v-model="formData.numero_secu"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  placeholder="1234567890123"
                />
              </div>
            </div>
          </div>

          <!-- Informations de contact -->
          <div class="space-y-4">
            <h4 class="text-lg font-semibold text-slate-900 dark:text-white border-b border-gray-200 dark:border-slate-700 pb-2">
              Contact
            </h4>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Téléphone
                </label>
                <input
                  v-model="formData.telephone"
                  type="tel"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  placeholder="01-23-45-67-89"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email
                </label>
                <input
                  v-model="formData.email"
                  type="email"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  placeholder="patient@email.fr"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Adresse
                </label>
                <textarea
                  v-model="formData.adresse"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  placeholder="123 Rue de la Paix, 75001 Paris"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700 flex justify-end space-x-3">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors duration-200"
          >
            Annuler
          </button>
          <button
            type="submit"
            :disabled="isLoading"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
          >
            <ArrowPathIcon v-if="isLoading" class="h-4 w-4 mr-2 animate-spin" />
            <CheckIcon v-else class="h-4 w-4 mr-2" />
            Enregistrer
          </button>
        </div>
      </form>

      <!-- État de chargement -->
      <div v-else class="px-6 py-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p class="text-slate-600 dark:text-slate-400">Chargement des données...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import { XMarkIcon, CheckIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'
import { notify } from '@/composables/useNotifications'
import type { Patient } from '@/stores/patients'

interface Props {
  patient: Patient | null
}

interface Emits {
  (e: 'close'): void
  (e: 'saved', patient: Patient): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isLoading = ref(false)

// Fonction utilitaire pour formater la date
const formatDateForInput = (dateString: string): string => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
  } catch {
    return dateString
  }
}

// Données du formulaire
const formData = ref({
  nom: '',
  prenom: '',
  date_naissance: '',
  telephone: '',
  email: '',
  adresse: '',
  numero_secu: ''
})

// Initialiser le formulaire quand le patient change
watch(() => props.patient, (newPatient) => {
  if (newPatient) {
    formData.value = {
      nom: newPatient.nom,
      prenom: newPatient.prenom,
      date_naissance: formatDateForInput(newPatient.date_naissance),
      telephone: newPatient.telephone || '',
      email: newPatient.email || '',
      adresse: newPatient.adresse || '',
      numero_secu: newPatient.numero_secu || ''
    }
  }
}, { immediate: true })

const savePatient = async () => {
  if (!props.patient) return
  
  try {
    isLoading.value = true
    
    // Créer l'objet patient mis à jour
    const updatedPatient: Patient = {
      ...props.patient,
      ...formData.value,
      date_naissance: new Date(formData.value.date_naissance).toISOString()
    }
    
    // Émettre l'événement de sauvegarde
    emit('saved', updatedPatient)
    
    // Fermer le modal
    emit('close')
    
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
    // Afficher une notification d'erreur à l'utilisateur
    notify.error('Erreur de sauvegarde', 'Erreur lors de la sauvegarde du patient')
  } finally {
    isLoading.value = false
  }
}
</script> 