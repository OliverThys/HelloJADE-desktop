<template>
  <div class="dashboard-container">
    <!-- En-tête du tableau de bord -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard HelloJADE
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Suivi post-hospitalisation • Service Chirurgie • Dr. Martin
          </p>
        </div>
        <div class="flex items-center space-x-4">
          <button 
            @click="refreshData"
            :disabled="loading"
            class="btn-primary"
          >
            <svg v-if="!loading" class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <div v-else class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Actualiser
          </button>
        </div>
      </div>
    </div>

    <!-- Message d'erreur -->
    <div v-if="error" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg animate-bounce-in">
      <div class="flex items-center">
        <svg class="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <span class="text-red-800">{{ error }}</span>
        <button @click="clearError" class="ml-auto text-red-600 hover:text-red-800 transition-hellojade">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Statistiques principales -->
    <DashboardStats />

    <!-- Contenu principal -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Patients récents -->
      <div class="lg:col-span-2">
        <RecentPatients />
      </div>

      <!-- Panneau latéral -->
      <div class="space-y-6">
        <!-- Alertes actives -->
        <ActiveAlerts />

        <!-- Statistiques rapides -->
        <div class="card-glass animate-fade-in" style="animation-delay: 0.5s;">
          <div class="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Vue d'ensemble
            </h3>
          </div>
          <div class="p-6 space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Patients stables</span>
              <span class="text-sm font-medium text-green-600 dark:text-green-400">{{ patientsStables }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Patients en alerte</span>
              <span class="text-sm font-medium text-red-600 dark:text-red-400">{{ patientsAlertes }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Taux de réponse</span>
              <span class="text-sm font-medium text-blue-600 dark:text-blue-400">
                {{ tauxReponse }}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import DashboardStats from '@/components/dashboard/DashboardStats.vue'
import RecentPatients from '@/components/dashboard/RecentPatients.vue'
import ActiveAlerts from '@/components/dashboard/ActiveAlerts.vue'

const dashboardStore = useDashboardStore()

const loading = computed(() => dashboardStore.loading)
const error = computed(() => dashboardStore.error)
const patientsStables = computed(() => dashboardStore.patientsStables)
const patientsAlertes = computed(() => dashboardStore.patientsAlertes)

const tauxReponse = computed(() => {
  const total = dashboardStore.patientsSuivis
  const appeles = dashboardStore.overview?.patients_appeles || 0
  return total > 0 ? Math.round((appeles / total) * 100) : 0
})

const refreshData = async () => {
  await dashboardStore.refreshAll()
}

const clearError = () => {
  dashboardStore.clearError()
}

onMounted(async () => {
  await refreshData()
})
</script>

<style scoped>
.dashboard-container {
  @apply p-6 max-w-7xl mx-auto;
}
</style> 
