<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="title-light">Gestion des appels post-hospitalisation</h1>
        <p class="subtitle-light">Suivi des appels prévus et réalisés avec analyse et scoring</p>
      </div>
      
      <!-- Actions -->
      <div class="flex items-center space-x-3">
        <button
          @click="refreshData"
          class="btn-action-primary-light"
          :disabled="isLoading"
        >
          <ArrowPathIcon class="h-4 w-4 mr-2" :class="{ 'animate-spin': isLoading }" />
          Actualiser
        </button>
      </div>
    </div>

    <!-- Statistiques -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div class="flex items-center">
          <div class="p-2 bg-blue-100 rounded-lg">
            <PhoneIcon class="h-6 w-6 text-blue-600" />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">Total</p>
            <p class="text-2xl font-semibold text-gray-900">{{ callStats.total }}</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div class="flex items-center">
          <div class="p-2 bg-yellow-100 rounded-lg">
            <ClockIcon class="h-6 w-6 text-yellow-600" />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">En attente</p>
            <p class="text-2xl font-semibold text-gray-900">{{ callStats.pending }}</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div class="flex items-center">
          <div class="p-2 bg-green-100 rounded-lg">
            <CheckCircleIcon class="h-6 w-6 text-green-600" />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">Terminés</p>
            <p class="text-2xl font-semibold text-gray-900">{{ callStats.completed }}</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div class="flex items-center">
          <div class="p-2 bg-red-100 rounded-lg">
            <XCircleIcon class="h-6 w-6 text-red-600" />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">Échoués</p>
            <p class="text-2xl font-semibold text-gray-900">{{ callStats.failed }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Message d'erreur -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex">
        <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Erreur de chargement</h3>
          <p class="text-sm text-red-700 mt-1">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Liste des appels -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">Liste des appels</h3>
      </div>
      
      <div v-if="isLoading" class="p-8 text-center">
        <ArrowPathIcon class="h-8 w-8 text-gray-400 animate-spin mx-auto" />
        <p class="mt-2 text-gray-500">Chargement des appels...</p>
      </div>
      
      <div v-else-if="calls.length === 0" class="p-8 text-center">
        <PhoneIcon class="h-12 w-12 text-gray-400 mx-auto" />
        <p class="mt-2 text-gray-500">Aucun appel trouvé</p>
      </div>
      
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date prévue
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Score
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="call in calls" :key="call.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm font-medium text-gray-900">
                    {{ call.nom }} {{ call.prenom }}
                  </div>
                  <div class="text-sm text-gray-500">{{ call.numero_patient }}</div>
                  <div class="text-sm text-gray-500">{{ call.telephone }}</div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ call.service }}</div>
                <div class="text-sm text-gray-500">{{ call.medecin }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatDate(call.date_appel_prevue) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <StatusBadge :status="call.statut" />
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span v-if="call.score !== null" class="font-medium">{{ call.score }}/100</span>
                <span v-else class="text-gray-400">-</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  @click="viewCallDetails(call)"
                  class="text-indigo-600 hover:text-indigo-900"
                >
                  Voir détails
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useCallsEnhancedStore } from '@/stores/callsEnhanced'
import { 
  PhoneIcon, 
  ArrowPathIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import StatusBadge from '@/components/StatusBadge.vue'

const callsStore = useCallsEnhancedStore()

// Computed properties
const calls = computed(() => callsStore.calls)
const isLoading = computed(() => callsStore.isLoading)
const error = computed(() => callsStore.error)
const callStats = computed(() => callsStore.callStats)

// Methods
const refreshData = () => {
  callsStore.fetchCalls()
}

const viewCallDetails = (call: any) => {
  console.log('Voir détails de l\'appel:', call)
  // TODO: Implémenter la vue détaillée
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR')
}

// Lifecycle
onMounted(() => {
  callsStore.fetchCalls()
})
</script>

<style scoped>
.table-header {
  @apply px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider;
}

.table-cell {
  @apply px-6 py-4 whitespace-nowrap text-sm text-gray-900;
}

.btn-action-small {
  @apply p-1 text-gray-400 hover:text-gray-600 rounded;
}

.btn-pagination {
  @apply relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-pagination-nav {
  @apply relative inline-flex items-center px-4 py-2 border text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary-light {
  @apply px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
}
</style> 