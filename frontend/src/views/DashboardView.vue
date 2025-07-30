<template>
  <div class="dashboard-container">
    <!-- En-tête du tableau de bord -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="title-light mb-2">
            Tableau de bord
          </h1>
          <p class="subtitle-light">
            Vue d'ensemble de l'activité HelloJADE
          </p>
        </div>
        
        <div class="flex items-center space-x-4">
          <!-- Dernière mise à jour -->
          <div class="text-sm text-light-secondary">
            Dernière mise à jour : {{ dashboardStore.formatLastUpdate() }}
          </div>
          
          <!-- Bouton de rafraîchissement -->
          <button
            @click="refreshData"
            :disabled="dashboardStore.isLoading"
            class="btn-action-light"
          >
            <ArrowPathIcon 
              :class="[
                'w-4 h-4 mr-2',
                dashboardStore.isLoading ? 'animate-spin' : ''
              ]" 
            />
            Actualiser
          </button>
        </div>
      </div>
    </div>

    <!-- Cartes de statistiques principales -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="Patients actifs"
        :value="dashboardStore.activePatients"
        unit="patients"
        description="Patients suivis actuellement"
        :icon="UsersIcon"
        variant="primary"
        :trend="12"
        badge="+5%"
      >
        <template #actions>
          <router-link
            to="/patients"
            class="link-light"
          >
            Voir tous →
          </router-link>
        </template>
      </StatCard>

      <StatCard
        title="Hospitalisations en cours"
        :value="dashboardStore.currentHospitalizations"
        unit="patients"
        description="Patients actuellement hospitalisés"
        :icon="BuildingOfficeIcon"
        variant="warning"
        :trend="-3"
        badge="3"
      >
        <template #actions>
          <router-link
            to="/patients"
            class="link-light"
          >
            Voir détails →
          </router-link>
        </template>
      </StatCard>

      <StatCard
        title="Consultations du jour"
        :value="dashboardStore.todayConsultations"
        unit="consultations"
        description="Consultations programmées aujourd'hui"
        :icon="CalendarIcon"
        variant="success"
        :trend="8"
        badge="Aujourd'hui"
      >
        <template #actions>
          <router-link
            to="/patients"
            class="link-light"
          >
            Voir planning →
          </router-link>
        </template>
      </StatCard>

      <StatCard
        title="Analyses urgentes"
        :value="dashboardStore.urgentAnalyses"
        unit="analyses"
        description="Analyses IA nécessitant attention"
        :icon="ExclamationTriangleIcon"
        variant="danger"
        :trend="15"
        badge="Urgent"
      >
        <template #actions>
          <router-link
            to="/ai"
            class="link-light"
          >
            Voir alertes →
          </router-link>
        </template>
      </StatCard>
    </div>

    <!-- Graphiques et analyses -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- Évolution des hospitalisations -->
      <div class="chart-container-light lg:col-span-2">
        <div class="flex items-center justify-between mb-6">
          <h3 class="chart-title-light">Évolution des hospitalisations</h3>
          <span class="text-sm text-light-muted">7 derniers jours</span>
        </div>
        
        <div class="h-64 flex items-center justify-center">
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <ChartBarIcon class="w-8 h-8 text-white" />
            </div>
            <p class="text-light-muted mb-2">Graphique en cours de développement</p>
            <p class="text-sm text-light-muted">Données : {{ dashboardStore.currentHospitalizations }} admissions</p>
          </div>
        </div>
      </div>

      <!-- Répartition par service -->
      <div class="chart-container-light">
        <h3 class="chart-title-light mb-6">Répartition par service</h3>
        
        <div class="h-64 flex items-center justify-center">
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
              <ChartPieIcon class="w-8 h-8 text-white" />
            </div>
            <p class="text-light-muted">Graphique en cours de développement</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Activité récente et alertes -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Activité récente -->
      <div class="chart-container-light lg:col-span-2">
        <div class="flex items-center justify-between mb-6">
          <h3 class="chart-title-light">Activité récente</h3>
          <router-link to="/calls" class="link-light">
            Voir tout →
          </router-link>
        </div>
        
        <div class="h-64 flex items-center justify-center">
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
              <ClockIcon class="w-8 h-8 text-white" />
            </div>
            <p class="text-light-muted">Aucune activité récente</p>
          </div>
        </div>
      </div>

      <!-- Alertes -->
      <div class="chart-container-light">
        <h3 class="chart-title-light mb-6">Alertes</h3>
        
        <div class="h-64 flex items-center justify-center">
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <CheckIcon class="w-8 h-8 text-white" />
            </div>
            <p class="text-light-muted">Aucune alerte</p>
            <p class="text-sm text-light-muted">Tout fonctionne correctement</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { usePatientsStore } from '@/stores/patients'
import StatCard from '@/components/common/StatCard.vue'
import {
  UsersIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ChartBarIcon,
  ChartPieIcon,
  ClockIcon,
  CheckIcon
} from '@heroicons/vue/24/outline'
import { formatDate, getStatusColor } from '@/utils/api'

// Stores
const dashboardStore = useDashboardStore()
const patientsStore = usePatientsStore()

// Computed
const recentActivity = computed(() => {
  const activity = dashboardStore.recentActivity
  if (Array.isArray(activity)) {
    return activity.slice(0, 8)
  }
  console.warn('recentActivity is not an array:', activity)
  return []
})

const criticalActivities = computed(() => {
  const activity = dashboardStore.recentActivity
  if (Array.isArray(activity)) {
    return activity.filter(activity => 
      activity.description.toLowerCase().includes('urgence') ||
      activity.description.toLowerCase().includes('critique') ||
      activity.description.toLowerCase().includes('important')
    )
  }
  return []
})

const serviceDistribution = computed(() => 
  dashboardStore.serviceDistribution
)

const hospitalizationTrend = computed(() => 
  dashboardStore.hospitalizationTrend
)

const maxAdmissions = computed(() => {
  if (!hospitalizationTrend.value || !Array.isArray(hospitalizationTrend.value) || hospitalizationTrend.value.length === 0) return 1
  return Math.max(...hospitalizationTrend.value.map(day => day.admissions))
})

const totalAdmissions = computed(() => {
  if (!hospitalizationTrend.value || !Array.isArray(hospitalizationTrend.value)) {
    return 0
  }
  return hospitalizationTrend.value.reduce((total, day) => total + day.admissions, 0)
})

const maxServiceCount = computed(() => {
  if (!serviceDistribution.value || typeof serviceDistribution.value !== 'object') {
    return 1
  }
  const counts = Object.values(serviceDistribution.value)
  return Math.max(...counts, 1)
})

// Methods
const refreshData = async () => {
  await dashboardStore.refreshData()
}

const getServiceColor = (service: string) => {
  return dashboardStore.getServiceColor(service)
}

const getActivityColor = (type: string) => {
  return dashboardStore.getActivityColor(type)
}

// Lifecycle
onMounted(async () => {
  if (!dashboardStore.hasData) {
    await dashboardStore.fetchDashboardData()
  }
  
  if (patientsStore.patients.length === 0) {
    await patientsStore.fetchPatients()
  }
})
</script>

<style scoped>
.dashboard-container {
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Animation pour les barres du graphique */
.bg-gradient-to-t {
  animation: growUp 0.8s ease-out;
}

@keyframes growUp {
  from {
    height: 0;
  }
  to {
    height: var(--final-height);
  }
}
</style> 
