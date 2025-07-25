<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p class="text-gray-600">Vue d'ensemble de vos appels post-hospitalisation</p>
      </div>
      
      <!-- Filtres de période -->
      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-2">
          <label class="text-sm font-medium text-gray-700">Période :</label>
          <select
            v-model="selectedPeriod"
            @change="loadDashboardData"
            class="input-field w-40"
          >
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
            <option value="custom">Personnalisé</option>
          </select>
        </div>
        
        <!-- Période personnalisée -->
        <div v-if="selectedPeriod === 'custom'" class="flex items-center space-x-2">
          <input
            v-model="customDateFrom"
            type="date"
            class="input-field w-40"
          />
          <span class="text-gray-500">à</span>
          <input
            v-model="customDateTo"
            type="date"
            class="input-field w-40"
          />
          <button
            @click="loadDashboardData"
            class="btn-primary"
          >
            Appliquer
          </button>
        </div>
      </div>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      <div
        v-for="kpi in kpis"
        :key="kpi.id"
        class="kpi-card"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="kpi-label">{{ kpi.label }}</p>
            <p class="kpi-value">{{ kpi.value }}</p>
          </div>
          <div class="flex-shrink-0">
            <component
              :is="kpi.icon"
              :class="kpi.iconColor"
              class="h-8 w-8"
            />
          </div>
        </div>
        
        <!-- Variation -->
        <div v-if="kpi.change !== undefined" class="mt-2">
          <span
            :class="[
              'kpi-change',
              kpi.change >= 0 ? 'kpi-change-positive' : 'kpi-change-negative'
            ]"
          >
            <ArrowUpIcon v-if="kpi.change >= 0" class="inline h-4 w-4" />
            <ArrowDownIcon v-else class="inline h-4 w-4" />
            {{ Math.abs(kpi.change) }}%
          </span>
          <span class="text-xs text-gray-500 ml-1">vs période précédente</span>
        </div>
      </div>
    </div>

    <!-- Graphiques -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Graphique des appels -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Évolution des appels</h3>
          <select
            v-model="chartType"
            @change="loadChartData"
            class="input-field w-32"
          >
            <option value="daily">Quotidien</option>
            <option value="weekly">Hebdomadaire</option>
            <option value="monthly">Mensuel</option>
          </select>
        </div>
        <div class="h-64">
          <canvas ref="callsChart"></canvas>
        </div>
      </div>

      <!-- Graphique de répartition -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Répartition par statut</h3>
        </div>
        <div class="h-64">
          <canvas ref="statusChart"></canvas>
        </div>
      </div>
    </div>

    <!-- Alertes récentes -->
    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">Alertes récentes</h3>
        <router-link
          to="/calls"
          class="text-sm font-medium text-green-600 hover:text-green-500"
        >
          Voir tous les appels →
        </router-link>
      </div>
      
      <div v-if="recentAlerts.length === 0" class="text-center py-8">
        <ExclamationTriangleIcon class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">Aucune alerte</h3>
        <p class="mt-1 text-sm text-gray-500">
          Aucune alerte n'a été détectée récemment.
        </p>
      </div>
      
      <div v-else class="space-y-3">
        <div
          v-for="alert in recentAlerts"
          :key="alert.id"
          class="flex items-center p-4 bg-red-50 rounded-lg border border-red-200"
        >
          <div class="flex-shrink-0">
            <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
          </div>
          <div class="ml-3 flex-1">
            <p class="text-sm font-medium text-red-800">
              {{ alert.title }}
            </p>
            <p class="text-sm text-red-700">
              {{ alert.message }}
            </p>
            <p class="text-xs text-red-600 mt-1">
              {{ formatDate(alert.created_at) }}
            </p>
          </div>
          <div class="flex-shrink-0">
            <button
              @click="viewCall(alert.call_id)"
              class="text-sm font-medium text-red-600 hover:text-red-500"
            >
              Voir l'appel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/vue/24/outline'
import { Chart, registerables } from 'chart.js'
import { useToast } from 'vue-toastification'

// Enregistrer les composants Chart.js
Chart.register(...registerables)

const router = useRouter()
const toast = useToast()

// Références des graphiques
const callsChart = ref<HTMLCanvasElement>()
const statusChart = ref<HTMLCanvasElement>()

// État des données
const selectedPeriod = ref('week')
const customDateFrom = ref('')
const customDateTo = ref('')
const chartType = ref('daily')
const isLoading = ref(false)

// KPIs
const kpis = ref([
  {
    id: 1,
    label: 'Appels prévus',
    value: '0',
    icon: PhoneIcon,
    iconColor: 'text-blue-500',
    change: 0
  },
  {
    id: 2,
    label: 'Appels réalisés',
    value: '0',
    icon: CheckCircleIcon,
    iconColor: 'text-green-500',
    change: 0
  },
  {
    id: 3,
    label: 'Appels réussis',
    value: '0',
    icon: CheckCircleIcon,
    iconColor: 'text-green-600',
    change: 0
  },
  {
    id: 4,
    label: 'Appels en échec',
    value: '0',
    icon: XCircleIcon,
    iconColor: 'text-red-500',
    change: 0
  },
  {
    id: 5,
    label: 'Taux de réussite',
    value: '0%',
    icon: ChartBarIcon,
    iconColor: 'text-purple-500',
    change: 0
  },
  {
    id: 6,
    label: 'Durée moyenne',
    value: '0 min',
    icon: ClockIcon,
    iconColor: 'text-orange-500',
    change: 0
  }
])

// Alertes récentes
const recentAlerts = ref([
  {
    id: 1,
    title: 'Douleur élevée détectée',
    message: 'Patient #127 - Douleur évaluée à 8/10',
    created_at: new Date(),
    call_id: 127
  },
  {
    id: 2,
    title: 'Appel en échec',
    message: 'Patient #89 - 3 tentatives sans réponse',
    created_at: new Date(Date.now() - 3600000),
    call_id: 89
  }
])

// Instances des graphiques
let callsChartInstance: Chart | null = null
let statusChartInstance: Chart | null = null

// Charger les données du tableau de bord
const loadDashboardData = async () => {
  try {
    isLoading.value = true
    
    // Simuler un appel API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Données simulées
    kpis.value = [
      {
        id: 1,
        label: 'Appels prévus',
        value: '156',
        icon: PhoneIcon,
        iconColor: 'text-blue-500',
        change: 12
      },
      {
        id: 2,
        label: 'Appels réalisés',
        value: '142',
        icon: CheckCircleIcon,
        iconColor: 'text-green-500',
        change: 8
      },
      {
        id: 3,
        label: 'Appels réussis',
        value: '134',
        icon: CheckCircleIcon,
        iconColor: 'text-green-600',
        change: 15
      },
      {
        id: 4,
        label: 'Appels en échec',
        value: '8',
        icon: XCircleIcon,
        iconColor: 'text-red-500',
        change: -25
      },
      {
        id: 5,
        label: 'Taux de réussite',
        value: '94.4%',
        icon: ChartBarIcon,
        iconColor: 'text-purple-500',
        change: 6
      },
      {
        id: 6,
        label: 'Durée moyenne',
        value: '4.2 min',
        icon: ClockIcon,
        iconColor: 'text-orange-500',
        change: -3
      }
    ]
    
    await loadChartData()
    
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error)
    toast.error('Erreur lors du chargement des données')
  } finally {
    isLoading.value = false
  }
}

// Charger les données des graphiques
const loadChartData = async () => {
  try {
    // Données simulées pour le graphique des appels
    const callsData = {
      labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
      datasets: [
        {
          label: 'Appels réalisés',
          data: [12, 19, 15, 22, 18, 8, 14],
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4
        },
        {
          label: 'Appels réussis',
          data: [11, 17, 14, 20, 17, 7, 13],
          borderColor: '#059669',
          backgroundColor: 'rgba(5, 150, 105, 0.1)',
          tension: 0.4
        }
      ]
    }
    
    // Données simulées pour le graphique de répartition
    const statusData = {
      labels: ['Réussis', 'En échec', 'En attente'],
      datasets: [
        {
          data: [134, 8, 14],
          backgroundColor: ['#10B981', '#EF4444', '#F59E0B'],
          borderWidth: 0
        }
      ]
    }
    
    await nextTick()
    
    // Créer le graphique des appels
    if (callsChart.value && callsChartInstance) {
      callsChartInstance.destroy()
    }
    
    if (callsChart.value) {
      callsChartInstance = new Chart(callsChart.value, {
        type: 'line',
        data: callsData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top' as const
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      })
    }
    
    // Créer le graphique de répartition
    if (statusChart.value && statusChartInstance) {
      statusChartInstance.destroy()
    }
    
    if (statusChart.value) {
      statusChartInstance = new Chart(statusChart.value, {
        type: 'doughnut',
        data: statusData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom' as const
            }
          }
        }
      })
    }
    
  } catch (error) {
    console.error('Erreur lors du chargement des graphiques:', error)
  }
}

// Voir un appel spécifique
const viewCall = (callId: number) => {
  router.push(`/calls?call=${callId}`)
}

// Formater une date
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Initialisation
onMounted(() => {
  loadDashboardData()
})
</script> 