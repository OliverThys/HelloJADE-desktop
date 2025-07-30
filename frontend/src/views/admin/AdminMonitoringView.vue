<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- En-tête -->
      <div class="mb-8">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Monitoring système</h1>
            <p class="mt-2 text-gray-600">
              Surveillez les performances et l'état du système
            </p>
          </div>
          <div class="flex space-x-3">
            <button
              @click="refreshData"
              class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-[#36454F] hover:bg-gray-50"
            >
              <ArrowPathIcon class="mr-2 h-4 w-4" />
              Actualiser
            </button>
            <button
              @click="exportMetrics"
              class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-[#36454F] hover:bg-gray-50"
            >
              <ArrowDownTrayIcon class="mr-2 h-4 w-4" />
              Exporter
            </button>
          </div>
        </div>
      </div>

      <!-- Métriques principales -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="CPU"
          :value="`${metrics.cpu}%`"
          icon="CpuChipIcon"
          color="blue"
          :change="metrics.cpuChange"
        />
        <StatCard
          title="Mémoire"
          :value="`${metrics.memory}%`"
          icon="MemoryIcon"
          color="purple"
          :change="metrics.memoryChange"
        />
        <StatCard
          title="Disque"
          :value="`${metrics.disk}%`"
          icon="HardDriveIcon"
          color="orange"
          :change="metrics.diskChange"
        />
        <StatCard
          title="Réseau"
          :value="`${metrics.network} Mbps`"
          icon="SignalIcon"
          color="green"
          :change="metrics.networkChange"
        />
      </div>

      <!-- Graphiques de performance -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- CPU et Mémoire -->
        <div class="bg-[#36454F] rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">CPU et Mémoire</h2>
          <div class="h-64">
            <PerformanceChart :data="performanceData" />
          </div>
        </div>

        <!-- Activité réseau -->
        <div class="bg-[#36454F] rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Activité réseau</h2>
          <div class="h-64">
            <NetworkChart :data="networkData" />
          </div>
        </div>
      </div>

      <!-- Services et processus -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- Statut des services -->
        <div class="bg-[#36454F] rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Statut des services</h2>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              <div
                v-for="service in services"
                :key="service.name"
                class="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div class="flex items-center">
                  <div
                    :class="[
                      'w-3 h-3 rounded-full mr-3',
                      service.status === 'running' ? 'bg-green-500' : 'bg-red-500'
                    ]"
                  />
                  <div>
                    <h3 class="text-sm font-medium text-gray-900">{{ service.name }}</h3>
                    <p class="text-xs text-gray-500">{{ service.description }}</p>
                  </div>
                </div>
                <div class="flex items-center space-x-2">
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      service.status === 'running' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    ]"
                  >
                    {{ service.status === 'running' ? 'Actif' : 'Arrêté' }}
                  </span>
                  <button
                    @click="toggleService(service)"
                    class="text-blue-600 hover:text-blue-900"
                  >
                    <component :is="service.status === 'running' ? PauseIcon : PlayIcon" class="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Logs système -->
        <div class="bg-[#36454F] rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Logs système</h2>
          </div>
          <div class="p-6">
            <div class="space-y-2 max-h-64 overflow-y-auto">
              <div
                v-for="log in systemLogs"
                :key="log.id"
                class="flex items-start space-x-3 p-2 rounded"
                :class="getLogClass(log.level)"
              >
                <div
                  :class="[
                    'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                    getLogColor(log.level)
                  ]"
                />
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-gray-900">{{ log.message }}</p>
                  <p class="text-xs text-gray-500">{{ formatDate(log.timestamp) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Alertes et événements -->
      <div class="bg-[#36454F] rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Alertes et événements</h2>
        </div>
        <div class="overflow-hidden">
          <DataTable
            :data="alerts"
            :columns="alertColumns"
            :loading="loading"
          >
            <template #cell-severity="{ row }">
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  getSeverityClass(row.severity)
                ]"
              >
                {{ getSeverityLabel(row.severity) }}
              </span>
            </template>
            
            <template #cell-status="{ row }">
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  row.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                ]"
              >
                {{ row.status === 'resolved' ? 'Résolu' : 'En cours' }}
              </span>
            </template>
          </DataTable>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  ArrowPathIcon,
  ArrowDownTrayIcon,
  PauseIcon,
  PlayIcon
} from '@heroicons/vue/24/outline'
import DataTable from '@/components/common/DataTable.vue'
import StatCard from '@/components/common/StatCard.vue'
import PerformanceChart from '@/components/PerformanceChart.vue'
import NetworkChart from '@/components/NetworkChart.vue'
import { useExport } from '@/composables/useExport'
import { useNotifications } from '@/composables/useNotifications'

const { exportToExcel } = useExport()
const { showNotification } = useNotifications()

// État local
const loading = ref(false)

// Métriques système
const metrics = ref({
  cpu: 45,
  cpuChange: 2.1,
  memory: 62,
  memoryChange: -1.5,
  disk: 78,
  diskChange: 0.8,
  network: 125,
  networkChange: 5.2
})

// Données des graphiques
const performanceData = ref([
  { time: '00:00', cpu: 35, memory: 58 },
  { time: '04:00', cpu: 42, memory: 61 },
  { time: '08:00', cpu: 55, memory: 65 },
  { time: '12:00', cpu: 68, memory: 72 },
  { time: '16:00', cpu: 45, memory: 62 },
  { time: '20:00', cpu: 38, memory: 59 }
])

const networkData = ref([
  { time: '00:00', incoming: 45, outgoing: 23 },
  { time: '04:00', incoming: 52, outgoing: 28 },
  { time: '08:00', incoming: 78, outgoing: 45 },
  { time: '12:00', incoming: 95, outgoing: 67 },
  { time: '16:00', incoming: 82, outgoing: 54 },
  { time: '20:00', incoming: 61, outgoing: 38 }
])

// Services
const services = ref([
  {
    name: 'API HelloJADE',
    description: 'Service principal de l\'API',
    status: 'running'
  },
  {
    name: 'Asterisk',
    description: 'Serveur de téléphonie',
    status: 'running'
  },
  {
    name: 'Redis',
    description: 'Cache et session',
    status: 'running'
  },
  {
    name: 'PostgreSQL',
    description: 'Base de données',
    status: 'running'
  },
  {
    name: 'Nginx',
    description: 'Serveur web',
    status: 'stopped'
  }
])

// Logs système
const systemLogs = ref([
  {
    id: 1,
    level: 'info',
    message: 'Service API démarré avec succès',
    timestamp: new Date(Date.now() - 300000)
  },
  {
    id: 2,
    level: 'warning',
    message: 'Utilisation CPU élevée détectée',
    timestamp: new Date(Date.now() - 180000)
  },
  {
    id: 3,
    level: 'error',
    message: 'Erreur de connexion à la base de données',
    timestamp: new Date(Date.now() - 60000)
  },
  {
    id: 4,
    level: 'info',
    message: 'Sauvegarde automatique terminée',
    timestamp: new Date(Date.now() - 30000)
  }
])

// Alertes
const alerts = ref([
  {
    id: 1,
    title: 'Utilisation CPU élevée',
    description: 'L\'utilisation CPU dépasse 80%',
    severity: 'warning',
    status: 'active',
    timestamp: new Date(Date.now() - 300000)
  },
  {
    id: 2,
    title: 'Espace disque faible',
    description: 'Il reste moins de 10% d\'espace disque',
    severity: 'critical',
    status: 'active',
    timestamp: new Date(Date.now() - 180000)
  },
  {
    id: 3,
    title: 'Service Nginx arrêté',
    description: 'Le service Nginx s\'est arrêté inopinément',
    severity: 'error',
    status: 'resolved',
    timestamp: new Date(Date.now() - 60000)
  }
])

// Colonnes pour les alertes
const alertColumns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'title', label: 'Titre', sortable: true },
  { key: 'description', label: 'Description', sortable: false },
  { key: 'severity', label: 'Sévérité', sortable: true },
  { key: 'status', label: 'Statut', sortable: true },
  { key: 'timestamp', label: 'Date', sortable: true }
]

// Méthodes
const refreshData = async () => {
  loading.value = true
  try {
    // Simulation de rafraîchissement des données
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mettre à jour les métriques avec des valeurs aléatoires
    metrics.value = {
      cpu: Math.floor(Math.random() * 30) + 30,
      cpuChange: (Math.random() - 0.5) * 10,
      memory: Math.floor(Math.random() * 20) + 55,
      memoryChange: (Math.random() - 0.5) * 8,
      disk: Math.floor(Math.random() * 15) + 70,
      diskChange: (Math.random() - 0.5) * 5,
      network: Math.floor(Math.random() * 50) + 100,
      networkChange: (Math.random() - 0.5) * 15
    }
    
    showNotification('Données actualisées', 'success')
  } catch (error) {
    showNotification('Erreur lors de l\'actualisation', 'error')
  } finally {
    loading.value = false
  }
}

const exportMetrics = () => {
  const data = [
    {
      Métrique: 'CPU',
      Valeur: `${metrics.value.cpu}%`,
      Variation: `${metrics.value.cpuChange > 0 ? '+' : ''}${metrics.value.cpuChange.toFixed(1)}%`
    },
    {
      Métrique: 'Mémoire',
      Valeur: `${metrics.value.memory}%`,
      Variation: `${metrics.value.memoryChange > 0 ? '+' : ''}${metrics.value.memoryChange.toFixed(1)}%`
    },
    {
      Métrique: 'Disque',
      Valeur: `${metrics.value.disk}%`,
      Variation: `${metrics.value.diskChange > 0 ? '+' : ''}${metrics.value.diskChange.toFixed(1)}%`
    },
    {
      Métrique: 'Réseau',
      Valeur: `${metrics.value.network} Mbps`,
      Variation: `${metrics.value.networkChange > 0 ? '+' : ''}${metrics.value.networkChange.toFixed(1)} Mbps`
    }
  ]
  
  exportToExcel(data, 'metriques-systeme')
}

const toggleService = async (service: any) => {
  try {
    const newStatus = service.status === 'running' ? 'stopped' : 'running'
    service.status = newStatus
    
    showNotification(
      `Service ${service.name} ${newStatus === 'running' ? 'démarré' : 'arrêté'}`,
      'success'
    )
  } catch (error) {
    showNotification('Erreur lors de la modification du service', 'error')
  }
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date)
}

const getLogClass = (level: string) => {
  switch (level) {
    case 'error':
      return 'bg-red-50'
    case 'warning':
      return 'bg-yellow-50'
    case 'info':
      return 'bg-blue-50'
    default:
      return ''
  }
}

const getLogColor = (level: string) => {
  switch (level) {
    case 'error':
      return 'bg-red-500'
    case 'warning':
      return 'bg-yellow-500'
    case 'info':
      return 'bg-blue-500'
    default:
      return 'bg-gray-500'
  }
}

const getSeverityClass = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-800'
    case 'error':
      return 'bg-orange-100 text-orange-800'
    case 'warning':
      return 'bg-yellow-100 text-yellow-800'
    case 'info':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getSeverityLabel = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'Critique'
    case 'error':
      return 'Erreur'
    case 'warning':
      return 'Avertissement'
    case 'info':
      return 'Information'
    default:
      return 'Inconnu'
  }
}

// Lifecycle
onMounted(() => {
  refreshData()
})
</script> 
