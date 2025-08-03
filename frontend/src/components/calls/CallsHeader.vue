<template>
  <div class="calls-header bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-6">
    <!-- Titre et statistiques -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Gestion des Appels
        </h1>
        <p class="text-gray-600 dark:text-slate-400">
          Interface de gestion des appels post-hospitalisation
        </p>
      </div>
      
      <!-- Statistiques rapides -->
      <div class="flex space-x-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ stats?.overview?.total_calls || 0 }}</div>
          <div class="text-sm text-gray-500 dark:text-slate-400">Total</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ stats?.overview?.successful_calls || 0 }}</div>
          <div class="text-sm text-gray-500 dark:text-slate-400">Réussis</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-red-600 dark:text-red-400">{{ stats?.overview?.failed_calls || 0 }}</div>
          <div class="text-sm text-gray-500 dark:text-slate-400">Échecs</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">{{ stats?.overview?.pending_calls || 0 }}</div>
          <div class="text-sm text-gray-500 dark:text-slate-400">En attente</div>
        </div>
      </div>
    </div>

    <!-- Barre de recherche -->
    <div class="mb-4">
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher par nom, prénom, numéro patient, téléphone..."
          class="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
          @input="handleSearch"
        />
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg class="h-5 w-5 text-gray-400 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Filtres -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
      <!-- Filtre par date -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Date d'appel</label>
        <div class="flex space-x-2">
          <input
            v-model="filters.date_debut"
            type="date"
            class="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
            @change="handleFilterChange"
          />
          <input
            v-model="filters.date_fin"
            type="date"
            class="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
            @change="handleFilterChange"
          />
        </div>
      </div>

      <!-- Filtre par statut -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Statut</label>
        <select
          v-model="filters.statut"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
          @change="handleFilterChange"
        >
          <option value="">Tous les statuts</option>
          <option value="A_APPELER">À appeler</option>
          <option value="EN_COURS">En cours</option>
          <option value="APPELE">Appelé</option>
          <option value="ECHEC">Échec</option>
        </select>
      </div>

      <!-- Filtre par service -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Service</label>
        <select
          v-model="filters.service"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
          @change="handleFilterChange"
        >
          <option value="">Tous les services</option>
          <option v-for="service in availableFilters.services" :key="service" :value="service">
            {{ service }}
          </option>
        </select>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-between">
      <div class="flex space-x-2">
        <button
          @click="clearFilters"
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Effacer les filtres
        </button>
        <button
          @click="refreshData"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 border border-transparent rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Actualiser
        </button>
      </div>

      <div class="flex space-x-2">
        <button
          @click="exportData"
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Exporter CSV
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useCallsStore } from '@/stores/calls'
import type { CallFilters } from '@/utils/api'

const callsStore = useCallsStore()

// État local
const searchQuery = ref('')
const filters = reactive<CallFilters>({
  search: '',
  date_debut: '',
  date_fin: '',
  statut: '',
  site: '',
  service: '',
  page: 1,
  limit: 50,
  sort_by: 'date_heure_prevue',
  sort_order: 'DESC'
})

// Computed
const stats = computed(() => callsStore.stats)
const availableFilters = computed(() => callsStore.filters)

// Méthodes
const handleSearch = () => {
  filters.search = searchQuery.value
  filters.page = 1
  emitFilters()
}

const handleFilterChange = () => {
  filters.page = 1
  emitFilters()
}

const clearFilters = () => {
  searchQuery.value = ''
  Object.assign(filters, {
    search: '',
    date_debut: '',
    date_fin: '',
    statut: '',
    site: '',
    service: '',
    page: 1
  })
  emitFilters()
}

const refreshData = () => {
  emitFilters(true)
}

const exportData = async () => {
  try {
    await callsStore.exportCalls(filters)
  } catch (error) {
    console.error('Erreur lors de l\'export:', error)
  }
}

const emitFilters = (forceRefresh = false) => {
  emit('filter', { ...filters }, forceRefresh)
}

// Événements
const emit = defineEmits<{
  filter: [filters: CallFilters, forceRefresh?: boolean]
}>()

// Lifecycle
onMounted(async () => {
  await callsStore.fetchStats()
})

// Watchers
watch(() => callsStore.filters, (newFilters) => {
  // Mettre à jour les options disponibles
}, { deep: true })
</script> 