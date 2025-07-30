<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- En-tête avec navigation -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <button
              @click="$router.go(-1)"
              class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-[#36454F] hover:bg-gray-50"
            >
              <ArrowLeftIcon class="mr-2 h-4 w-4" />
              Retour
            </button>
            <div>
              <h1 class="text-3xl font-bold text-gray-900">
                {{ patient?.firstName }} {{ patient?.lastName }}
              </h1>
              <p class="text-gray-600">ID: {{ patient?.id }}</p>
            </div>
          </div>
          <div class="flex space-x-3">
            <button
              @click="showEditModal = true"
              class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-[#36454F] hover:bg-gray-50"
            >
              <PencilIcon class="mr-2 h-4 w-4" />
              Modifier
            </button>
            <button
              @click="initiateCall"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <PhoneIcon class="mr-2 h-4 w-4" />
              Appeler
            </button>
          </div>
        </div>
      </div>

      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <div v-else-if="patient" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Informations principales -->
        <div class="lg:col-span-1">
          <div class="bg-[#36454F] rounded-lg shadow p-6 mb-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Informations personnelles</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-500">Nom complet</label>
                <p class="mt-1 text-sm text-gray-900">{{ patient.firstName }} {{ patient.lastName }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-500">Date de naissance</label>
                <p class="mt-1 text-sm text-gray-900">{{ formatDate(patient.birthDate) }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-500">Téléphone</label>
                <p class="mt-1 text-sm text-gray-900">{{ patient.phone }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-500">Email</label>
                <p class="mt-1 text-sm text-gray-900">{{ patient.email }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-500">Adresse</label>
                <p class="mt-1 text-sm text-gray-900">{{ patient.address }}</p>
              </div>
            </div>
          </div>

          <div class="bg-[#36454F] rounded-lg shadow p-6 mb-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Informations médicales</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-500">Service</label>
                <p class="mt-1 text-sm text-gray-900">{{ getServiceLabel(patient.service) }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-500">Statut</label>
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    getStatusClass(patient.status)
                  ]"
                >
                  {{ getStatusLabel(patient.status) }}
                </span>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-500">Date d'admission</label>
                <p class="mt-1 text-sm text-gray-900">{{ formatDate(patient.admissionDate) }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-500">Date de sortie</label>
                <p class="mt-1 text-sm text-gray-900">{{ formatDate(patient.dischargeDate) }}</p>
              </div>
            </div>
          </div>

          <div class="bg-[#36454F] rounded-lg shadow p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Statistiques</h2>
            <div class="space-y-4">
              <StatCard
                title="Total des appels"
                :value="patientStats.totalCalls"
                icon="PhoneIcon"
                color="blue"
              />
              <StatCard
                title="Appels réussis"
                :value="patientStats.successfulCalls"
                icon="CheckCircleIcon"
                color="green"
              />
              <StatCard
                title="Taux de réponse"
                :value="`${patientStats.responseRate}%`"
                icon="ChartBarIcon"
                color="purple"
              />
            </div>
          </div>
        </div>

        <!-- Contenu principal -->
        <div class="lg:col-span-2">
          <!-- Graphiques -->
          <div class="bg-[#36454F] rounded-lg shadow p-6 mb-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Évolution des appels</h2>
            <div class="h-64">
              <CallChart :data="callChartData" />
            </div>
          </div>

          <!-- Historique des appels -->
          <div class="bg-[#36454F] rounded-lg shadow">
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="text-lg font-semibold text-gray-900">Historique des appels</h2>
            </div>
            <div class="overflow-hidden">
              <DataTable
                :data="patientCalls"
                :columns="callColumns"
                :loading="callsLoading"
                @row-click="handleCallClick"
              >
                <template #cell-status="{ row }">
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      getCallStatusClass(row.status)
                    ]"
                  >
                    {{ getCallStatusLabel(row.status) }}
                  </span>
                </template>
                
                <template #cell-duration="{ row }">
                  {{ formatDuration(row.duration) }}
                </template>
              </DataTable>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-12">
        <ExclamationTriangleIcon class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">Patient non trouvé</h3>
        <p class="mt-1 text-sm text-gray-500">
          Le patient que vous recherchez n'existe pas ou a été supprimé.
        </p>
      </div>
    </div>

    <!-- Modal d'édition -->
    <PatientModal
      v-if="showEditModal"
      :patient="patient"
      @close="showEditModal = false"
      @save="handleUpdatePatient"
    />

    <!-- Modal de lecture audio -->
    <AudioPlayerModal
      v-if="showAudioModal"
      :audio-url="selectedCall?.audioUrl"
      :transcription="selectedCall?.transcription"
      @close="showAudioModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeftIcon,
  PencilIcon,
  PhoneIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import DataTable from '@/components/common/DataTable.vue'
import StatCard from '@/components/common/StatCard.vue'
import PatientModal from '@/components/PatientModal.vue'
import CallChart from '@/components/CallChart.vue'
import AudioPlayerModal from '@/components/AudioPlayerModal.vue'
import { usePatientsStore } from '@/stores/patients'
import { useCallsStore } from '@/stores/calls'
import { useNotifications } from '@/composables/useNotifications'

const route = useRoute()
const router = useRouter()
const patientsStore = usePatientsStore()
const callsStore = useCallsStore()
const { showNotification } = useNotifications()

// État local
const loading = ref(false)
const callsLoading = ref(false)
const showEditModal = ref(false)
const showAudioModal = ref(false)
const selectedCall = ref(null)

// Computed
const patient = computed(() => patientsStore.currentPatient)
const patientCalls = computed(() => callsStore.patientCalls)
const patientStats = computed(() => {
  const calls = patientCalls.value
  const totalCalls = calls.length
  const successfulCalls = calls.filter(call => call.status === 'completed').length
  const responseRate = totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 0

  return {
    totalCalls,
    successfulCalls,
    responseRate
  }
})

const callChartData = computed(() => {
  // Données pour le graphique des appels
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    return date.toISOString().split('T')[0]
  }).reverse()

  return last7Days.map(date => {
    const dayCalls = patientCalls.value.filter(call => 
      call.createdAt.startsWith(date)
    )
    return {
      date,
      calls: dayCalls.length,
      successful: dayCalls.filter(call => call.status === 'completed').length
    }
  })
})

const callColumns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'createdAt', label: 'Date', sortable: true },
  { key: 'status', label: 'Statut', sortable: true },
  { key: 'duration', label: 'Durée', sortable: true },
  { key: 'type', label: 'Type', sortable: true }
]

// Méthodes
const loadPatient = async () => {
  loading.value = true
  try {
    const patientId = route.params.id as string
    await patientsStore.fetchPatient(patientId)
    await loadPatientCalls(patientId)
  } catch (error) {
    showNotification('Erreur lors du chargement du patient', 'error')
  } finally {
    loading.value = false
  }
}

const loadPatientCalls = async (patientId: string) => {
  callsLoading.value = true
  try {
    await callsStore.fetchPatientCalls(patientId)
  } catch (error) {
    showNotification('Erreur lors du chargement des appels', 'error')
  } finally {
    callsLoading.value = false
  }
}

const handleUpdatePatient = async (patientData: any) => {
  try {
    await patientsStore.updatePatient(patient.id, patientData)
    showNotification('Patient mis à jour avec succès', 'success')
    showEditModal.value = false
  } catch (error) {
    showNotification('Erreur lors de la mise à jour', 'error')
  }
}

const initiateCall = () => {
  // Logique pour initier un appel
  showNotification('Fonctionnalité d\'appel en cours de développement', 'info')
}

const handleCallClick = (call: any) => {
  selectedCall.value = call
  showAudioModal.value = true
}

const formatDate = (date: string) => {
  if (!date) return 'Non renseigné'
  return new Date(date).toLocaleDateString('fr-FR')
}

const formatDuration = (seconds: number) => {
  if (!seconds) return '00:00'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

const getServiceLabel = (service: string) => {
  const services = {
    cardiology: 'Cardiologie',
    neurology: 'Neurologie',
    orthopedics: 'Orthopédie',
    general: 'Médecine générale'
  }
  return services[service] || service
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'inactive':
      return 'bg-gray-100 text-gray-800'
    case 'completed':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active':
      return 'Actif'
    case 'inactive':
      return 'Inactif'
    case 'completed':
      return 'Terminé'
    default:
      return 'Inconnu'
  }
}

const getCallStatusClass = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'missed':
      return 'bg-red-100 text-red-800'
    case 'no-answer':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getCallStatusLabel = (status: string) => {
  switch (status) {
    case 'completed':
      return 'Terminé'
    case 'missed':
      return 'Manqué'
    case 'no-answer':
      return 'Pas de réponse'
    default:
      return 'Inconnu'
  }
}

// Lifecycle
onMounted(() => {
  loadPatient()
})
</script> 
