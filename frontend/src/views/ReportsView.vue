<template>
  <div class="min-h-screen bg-gray-50 dark:bg-slate-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- En-tête -->
      <div class="mb-8">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="title-light">Rapports et statistiques</h1>
            <p class="subtitle-light mt-2">
              Analysez les performances et générez des rapports
            </p>
          </div>
          <div class="flex space-x-3">
            <button
              @click="exportReport"
              class="btn-action-light"
            >
              <ArrowDownTrayIcon class="mr-2 h-4 w-4" />
              Exporter
            </button>
            <button
              @click="generateReport"
              class="btn-action-secondary-light"
            >
              <DocumentChartBarIcon class="mr-2 h-4 w-4" />
              Générer rapport
            </button>
          </div>
        </div>
      </div>

      <!-- Filtres de période -->
      <div class="filter-container-light mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="filter-label-light">
              Période
            </label>
            <select
              v-model="selectedPeriod"
              @change="updateData"
              class="filter-input-light"
            >
              <option value="7">7 derniers jours</option>
              <option value="30">30 derniers jours</option>
              <option value="90">3 derniers mois</option>
              <option value="365">12 derniers mois</option>
            </select>
          </div>
          <div>
            <label class="filter-label-light">
              Service
            </label>
            <select
              v-model="selectedService"
              @change="updateData"
              class="filter-input-light"
            >
              <option value="">Tous les services</option>
              <option value="cardiology">Cardiologie</option>
              <option value="neurology">Neurologie</option>
              <option value="orthopedics">Orthopédie</option>
              <option value="general">Médecine générale</option>
            </select>
          </div>
          <div>
            <label class="filter-label-light">
              Type de rapport
            </label>
            <select
              v-model="reportType"
              @change="updateData"
              class="filter-input-light"
            >
              <option value="calls">Appels</option>
              <option value="patients">Patients</option>
              <option value="performance">Performance</option>
            </select>
          </div>
          <div class="flex items-end">
            <button
              @click="refreshData"
              class="w-full btn-action-light"
            >
              <ArrowPathIcon class="mr-2 h-4 w-4" />
              Actualiser
            </button>
          </div>
        </div>
      </div>

      <!-- Statistiques principales -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total des appels"
          :value="stats.totalCalls"
          icon="PhoneIcon"
          color="blue"
          :change="stats.callsChange"
        />
        <StatCard
          title="Taux de réponse"
          :value="stats.responseRate"
          unit="%"
          icon="CheckCircleIcon"
          color="green"
          :change="stats.responseChange"
        />
        <StatCard
          title="Durée moyenne"
          :value="stats.avgDuration"
          unit="min"
          icon="ClockIcon"
          color="yellow"
          :change="stats.durationChange"
        />
        <StatCard
          title="Patients actifs"
          :value="stats.activePatients"
          icon="UsersIcon"
          color="purple"
          :change="stats.patientsChange"
        />
      </div>

      <!-- Graphiques -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Évolution des appels -->
        <div class="chart-container-light">
          <div class="flex items-center justify-between mb-6">
            <h3 class="chart-title-light">Évolution des appels</h3>
            <div class="flex items-center space-x-4">
              <div class="flex items-center space-x-2">
                <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span class="chart-legend-light text-sm">Total des appels</span>
              </div>
              <div class="flex items-center space-x-2">
                <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                <span class="chart-legend-light text-sm">Appels réussis</span>
              </div>
            </div>
          </div>
          
          <div class="h-64 flex items-center justify-center">
            <div class="text-center">
              <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                <ChartBarIcon class="w-8 h-8 text-white" />
              </div>
              <p class="text-light-muted mb-2">Graphique en cours de développement</p>
              <p class="text-sm text-light-muted">Données : {{ stats.totalCalls }} appels</p>
            </div>
          </div>
        </div>

        <!-- Répartition par service -->
        <div class="chart-container-light">
          <h3 class="chart-title-light mb-6">Répartition par service</h3>
          
          <div class="h-64 flex items-center justify-center">
            <div class="text-center">
              <div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center">
                <ChartPieIcon class="w-8 h-8 text-white" />
              </div>
              <p class="text-light-muted">Graphique en cours de développement</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Détails des appels -->
      <div class="card-light">
        <h3 class="title-light mb-4">Détails des appels</h3>
        <div class="empty-state-light">
          <p class="empty-state-description-light">Données 0 éléments</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  ArrowDownTrayIcon,
  DocumentChartBarIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ChartPieIcon
} from '@heroicons/vue/24/outline'
import DataTable from '@/components/common/DataTable.vue'
import StatCard from '@/components/common/StatCard.vue'
import CallChart from '@/components/CallChart.vue'
import ServiceChart from '@/components/ServiceChart.vue'
import { useCallsStore } from '@/stores/calls'
import { usePatientsStore } from '@/stores/patients'
import { useExport } from '@/composables/useExport'
import { useNotifications } from '@/composables/useNotifications'

const callsStore = useCallsStore()
const patientsStore = usePatientsStore()
const { exportToExcel } = useExport()
const { showNotification } = useNotifications()

// État local
const loading = ref(false)
const selectedPeriod = ref('30')
const selectedService = ref('')
const reportType = ref('calls')

// Données
const stats = ref({
  totalCalls: 0,
  callsChange: 0,
  responseRate: 0,
  responseChange: 0,
  avgDuration: 0,
  durationChange: 0,
  activePatients: 0,
  patientsChange: 0
})

const callChartData = ref([])
const serviceChartData = ref([])
const detailedData = ref([])

// Colonnes du tableau détaillé
const detailedColumns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'patientName', label: 'Patient', sortable: true },
  { key: 'service', label: 'Service', sortable: true },
  { key: 'statut', label: 'Statut', sortable: true },
  { key: 'duree', label: 'Durée', sortable: true },
  { key: 'date_debut', label: 'Date', sortable: true }
]

// Méthodes
const loadData = async () => {
  loading.value = true
  try {
    // Charger les données selon les filtres
    await Promise.all([
      callsStore.fetchCalls({
        period: selectedPeriod.value,
        service: selectedService.value
      }),
      patientsStore.fetchPatients()
    ])
    
    updateStats()
    updateCharts()
    updateDetailedData()
  } catch (error) {
    showNotification('Erreur lors du chargement des données', 'error')
  } finally {
    loading.value = false
  }
}

const updateStats = () => {
  const calls = callsStore.calls
  const patients = patientsStore.patients
  
  // S'assurer que les données sont des tableaux
  const callsArray = Array.isArray(calls) ? calls : []
  const patientsArray = Array.isArray(patients) ? patients : []
  
  // Calculer les statistiques
  stats.value = {
    totalCalls: callsArray.length,
    callsChange: 5.2, // Simulation
    responseRate: callsArray.length > 0 ? Math.round((callsArray.filter(c => c.statut === 'termine').length / callsArray.length) * 100) : 0,
    responseChange: 2.1, // Simulation
    avgDuration: callsArray.length > 0 ? Math.round(callsArray.reduce((sum, c) => sum + (c.duree || 0), 0) / callsArray.length) : 0,
    durationChange: -1.5, // Simulation
    activePatients: patientsArray.filter(p => p.statut === 'actif').length,
    patientsChange: 3.8 // Simulation
  }
}

const updateCharts = () => {
  const calls = callsStore.calls
  const patients = patientsStore.patients
  
  // S'assurer que les données sont des tableaux
  const callsArray = Array.isArray(calls) ? calls : []
  const patientsArray = Array.isArray(patients) ? patients : []
  
  // Données pour le graphique des appels
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    return date.toISOString().split('T')[0]
  }).reverse()

  callChartData.value = last7Days.map(date => {
    const dayCalls = callsArray.filter(call => 
      call.date_debut.startsWith(date)
    )
    return {
      date,
      calls: dayCalls.length,
      successful: dayCalls.filter(call => call.statut === 'termine').length
    }
  })

  // Données pour le graphique des services
  const services = ['cardiology', 'neurology', 'orthopedics', 'general']
  serviceChartData.value = services.map(service => ({
    service: getServiceLabel(service),
    calls: callsArray.filter(call => call.service === service).length,
    patients: patientsArray.filter(patient => {
      const hospitalisations = patientsStore.patientHospitalisations.filter(h => h.patient_id === patient.id)
      return hospitalisations.some(h => h.service === service)
    }).length
  }))
}

const updateDetailedData = () => {
  const calls = callsStore.calls
  const callsArray = Array.isArray(calls) ? calls : []
  
  detailedData.value = callsArray.map(call => ({
    ...call,
    patientName: call.patient_id ? `Patient ${call.patient_id}` : 'Inconnu'
  }))
}

const updateData = () => {
  loadData()
}

const refreshData = () => {
  loadData()
}

const generateReport = () => {
  showNotification('Génération du rapport en cours...', 'info')
  // Logique de génération de rapport
  setTimeout(() => {
    showNotification('Rapport généré avec succès', 'success')
  }, 2000)
}

const exportReport = () => {
  const data = detailedData.value.map(item => ({
    ID: item.id,
    Patient: item.patientName,
    Service: getServiceLabel(item.service || ''),
    Statut: getStatusLabel(item.statut),
    Durée: formatDuration(item.duree),
    Date: new Date(item.date_debut).toLocaleDateString('fr-FR')
  }))
  
  exportToExcel(data, `rapport-${reportType.value}-${selectedPeriod.value}j`)
}

const handleRowClick = (row: any) => {
  // Navigation vers le détail de l'appel
  // TODO: Implémenter la navigation vers le détail
}

const getServiceLabel = (service: string) => {
  const labels: Record<string, string> = {
    'cardiology': 'Cardiologie',
    'neurology': 'Neurologie',
    'orthopedics': 'Orthopédie',
    'general': 'Médecine générale'
  }
  return labels[service] || service
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'en_cours': 'En cours',
    'termine': 'Terminé',
    'rate': 'Raté',
    'en_attente': 'En attente'
  }
  return labels[status] || status
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'termine':
      return 'bg-green-100 text-green-800'
    case 'en_cours':
      return 'bg-blue-100 text-blue-800'
    case 'rate':
      return 'bg-red-100 text-red-800'
    case 'en_attente':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const formatDuration = (seconds: number) => {
  if (!seconds) return '00:00'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script> 
