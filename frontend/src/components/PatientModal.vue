<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <!-- En-tête du modal -->
      <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
        <h2 class="text-xl font-semibold text-slate-900 dark:text-white">
          Détails du Patient
        </h2>
        <button
          @click="$emit('close')"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <XMarkIcon class="h-6 w-6" />
        </button>
      </div>

      <!-- Contenu du modal -->
      <div class="px-6 py-4" v-if="patient">
        <!-- Informations principales -->
        <div class="mb-6">
          <div class="flex items-center mb-4">
            <div class="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
              <span class="text-green-600 dark:text-green-400 font-bold text-xl">
                {{ patient.prenom.charAt(0) }}{{ patient.nom.charAt(0) }}
              </span>
            </div>
            <div class="ml-4">
              <h3 class="text-2xl font-bold text-slate-900 dark:text-white">
                {{ patient.prenom }} {{ patient.nom }}
              </h3>
              <p class="text-slate-600 dark:text-slate-400">
                ID: {{ patient.patient_id }}
              </p>
            </div>
          </div>
        </div>

        <!-- Grille d'informations -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Informations personnelles -->
          <div class="space-y-4">
            <h4 class="text-lg font-semibold text-slate-900 dark:text-white border-b border-gray-200 dark:border-slate-700 pb-2">
              Informations Personnelles
            </h4>
            
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-slate-600 dark:text-slate-400">
                  Date de naissance
                </label>
                <p class="text-slate-900 dark:text-white">
                  {{ formatDate(patient.date_naissance) }} ({{ patient.age }} ans)
                </p>
              </div>
              

              
              <div>
                <label class="block text-sm font-medium text-slate-600 dark:text-slate-400">
                  Numéro de sécurité sociale
                </label>
                <p class="text-slate-900 dark:text-white font-mono">
                  {{ patient.numero_secu || 'Non renseigné' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Informations de contact -->
          <div class="space-y-4">
            <h4 class="text-lg font-semibold text-slate-900 dark:text-white border-b border-gray-200 dark:border-slate-700 pb-2">
              Contact
            </h4>
            
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-slate-600 dark:text-slate-400">
                  Téléphone
                </label>
                <p class="text-slate-900 dark:text-white">
                  {{ patient.telephone || 'Non renseigné' }}
                </p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-slate-600 dark:text-slate-400">
                  Email
                </label>
                <p class="text-slate-900 dark:text-white">
                  {{ patient.email || 'Non renseigné' }}
                </p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-slate-600 dark:text-slate-400">
                  Adresse
                </label>
                <p class="text-slate-900 dark:text-white">
                  {{ patient.adresse || 'Non renseignée' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Informations système -->
        <div class="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
          <h4 class="text-lg font-semibold text-slate-900 dark:text-white border-b border-gray-200 dark:border-slate-700 pb-2 mb-4">
            Informations Système
          </h4>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-600 dark:text-slate-400">
                Date de création
              </label>
              <p class="text-slate-900 dark:text-white text-sm">
                {{ patient.created_date ? formatDate(patient.created_date) : 'Non renseignée' }}
              </p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-slate-600 dark:text-slate-400">
                Dernière synchronisation
              </label>
              <p class="text-slate-900 dark:text-white text-sm">
                {{ patient.sync_timestamp ? formatDate(patient.sync_timestamp) : 'Non renseignée' }}
              </p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-slate-600 dark:text-slate-400">
                Source
              </label>
              <p class="text-slate-900 dark:text-white text-sm">
                {{ patient.sync_source || 'Non renseignée' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700 flex justify-end space-x-3">
          <button
            @click="$emit('close')"
            class="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors duration-200"
          >
            Fermer
          </button>
          <button
            @click="editPatient"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center"
          >
            <PencilIcon class="h-4 w-4 mr-2" />
            Modifier
          </button>
        </div>
      </div>

      <!-- État de chargement -->
      <div v-else class="px-6 py-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p class="text-slate-600 dark:text-slate-400">Chargement des détails...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { XMarkIcon, PencilIcon } from '@heroicons/vue/24/outline'
import type { Patient } from '@/stores/patients'

interface Props {
  patient: Patient | null
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

const formatDate = (dateString: string): string => {
  if (!dateString) return 'Non renseignée'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return dateString
  }
}

const editPatient = () => {
  // TODO: Implémenter l'édition
  console.log('Éditer patient:', props.patient)
}
</script> 
