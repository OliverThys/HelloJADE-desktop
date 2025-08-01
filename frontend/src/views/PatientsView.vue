<template>
  <div class="patients-container">
    <!-- En-tête -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="title-light mb-2">
            Gestion des Patients
          </h1>
          <p class="subtitle-light">
            Interface de gestion des patients hospitaliers
          </p>
        </div>
        <div class="flex items-center space-x-4">
          <button
            @click="refreshData"
            :disabled="isLoading"
            class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <span v-if="isLoading" class="animate-spin mr-2">⟳</span>
            Actualiser
          </button>
        </div>
      </div>
    </div>

    <!-- Indicateur de chargement -->
    <div v-if="isLoading && patients.length === 0" class="flex items-center justify-center h-64">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p class="text-slate-600 dark:text-slate-400">Chargement des patients...</p>
      </div>
    </div>

    <!-- Message d'erreur -->
    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
      <div class="flex items-center">
        <ExclamationTriangleIcon class="h-5 w-5 text-red-500 mr-2" />
        <p class="text-red-700 dark:text-red-300">{{ error }}</p>
      </div>
      <button
        @click="refreshData"
        class="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline"
      >
        Réessayer
      </button>
    </div>

    <!-- Liste des patients -->
    <div v-else-if="patients.length > 0" class="grid gap-6">
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h3 class="text-lg font-semibold text-slate-800 dark:text-white">
            Patients ({{ patients.length }})
          </h3>
        </div>
        <div class="divide-y divide-gray-200 dark:divide-slate-700">
          <div
            v-for="patient in patients"
            :key="patient.id_patient"
            class="px-6 py-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors duration-200"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <div class="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                  <span class="text-green-600 dark:text-green-400 font-semibold">
                    {{ patient.prenom.charAt(0) }}{{ patient.nom.charAt(0) }}
                  </span>
                </div>
                <div>
                  <h4 class="font-medium text-slate-800 dark:text-white">
                    {{ patient.prenom }} {{ patient.nom }}
                  </h4>
                  <p class="text-sm text-slate-500 dark:text-slate-400">
                    {{ patient.numero_patient }} • {{ patient.telephone }}
                  </p>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <span
                  :class="[
                    'px-2 py-1 text-xs font-medium rounded-full',
                    patient.statut === 'ACTIF' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300'
                  ]"
                >
                  {{ patient.statut }}
                </span>
                <button class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <ArrowRightOnRectangleIcon class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- État vide -->
    <div v-else class="flex items-center justify-center h-64">
      <div class="text-center">
        <div class="text-6xl mb-4">👥</div>
        <h2 class="text-xl font-semibold mb-2">Aucun patient trouvé</h2>
        <p class="text-slate-500 dark:text-slate-400 mb-4">Aucun patient n'est actuellement enregistré</p>
        <button
          @click="refreshData"
          class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
        >
          Actualiser
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { ExclamationTriangleIcon, ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline'
import { usePatientsStore } from '@/stores'

const patientsStore = usePatientsStore()

// Computed properties
const patients = computed(() => patientsStore.patients)
const isLoading = computed(() => patientsStore.isLoading)
const error = computed(() => patientsStore.error)

// Actions
const refreshData = () => {
  patientsStore.fetchPatients(true) // Force refresh
}

// Initialisation
onMounted(() => {
  if (patients.value.length === 0) {
    patientsStore.initialize()
  }
})
</script>

<style scoped>
.patients-container {
  @apply p-6;
}
</style> 
