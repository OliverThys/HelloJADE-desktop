<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Gestion des appels</h1>
        <p class="text-gray-600">Suivi des appels post-hospitalisation</p>
      </div>
      
      <!-- Actions -->
      <div class="flex items-center space-x-3">
        <button
          @click="exportData"
          class="btn-secondary"
          :disabled="isLoading"
        >
          <ArrowDownTrayIcon class="h-4 w-4 mr-2" />
          Exporter
        </button>
        <button
          @click="refreshData"
          class="btn-primary"
          :disabled="isLoading"
        >
          <ArrowPathIcon class="h-4 w-4 mr-2" :class="{ 'animate-spin': isLoading }" />
          Actualiser
        </button>
      </div>
    </div>

    <!-- Filtres -->
    <div class="card">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Recherche -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Recherche
          </label>
          <div class="relative">
            <input
              v-model="filters.search"
              type="text"
              placeholder="Nom, prénom, téléphone..."
              class="input-field pl-10"
              @input="debouncedSearch"
            />
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>

        <!-- Statut -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Statut
          </label>
          <select
            v-model="filters.status"
            @change="loadCalls"
            class="input-field"
          >
            <option value="">Tous les statuts</option>
            <option value="pending">À appeler</option>
            <option value="called">Appelé</option>
            <option value="failed">Échec</option>
          </select>
        </div>

        <!-- Date de début -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Date de début
          </label>
          <input
            v-model="filters.fromDate"
            type="date"
            @change="loadCalls"
            class="input-field"
          />
        </div>

        <!-- Date de fin -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Date de fin
          </label>
          <input
            v-model="filters.toDate"
            type="date"
            @change="loadCalls"
            class="input-field"
          />
        </div>
      </div>

      <!-- Boutons de filtres -->
      <div class="flex items-center justify-between mt-4">
        <div class="flex items-center space-x-2">
          <button
            @click="clearFilters"
            class="text-sm text-gray-600 hover:text-gray-900"
          >
            Effacer les filtres
          </button>
        </div>
        
        <div class="text-sm text-gray-500">
          {{ pagination.total }} appels trouvés
        </div>
      </div>
    </div>

    <!-- Tableau des appels -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                v-for="column in columns"
                :key="column.key"
                @click="sortBy(column.key)"
                :class="[
                  'table-header cursor-pointer hover:bg-gray-100 transition-colors duration-200',
                  sortByField === column.key ? 'text-green-600' : ''
                ]"
              >
                <div class="flex items-center">
                  {{ column.label }}
                  <div v-if="sortByField === column.key" class="ml-1">
                    <ChevronUpIcon v-if="sortOrder === 'asc'" class="h-4 w-4" />
                    <ChevronDownIcon v-else class="h-4 w-4" />
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="call in calls"
              :key="call.id"
              class="hover:bg-gray-50 transition-colors duration-200"
            >
              <td class="table-cell">
                <span class="font-medium text-gray-900">#{{ call.patient_number }}</span>
              </td>
              <td class="table-cell">
                <div>
                  <div class="font-medium text-gray-900">{{ call.patient_last_name }}</div>
                  <div class="text-gray-500">{{ call.patient_first_name }}</div>
                </div>
              </td>
              <td class="table-cell">
                {{ formatDate(call.birth_date) }}
              </td>
              <td class="table-cell">
                {{ call.phone }}
              </td>
              <td class="table-cell">
                {{ call.hospital_site }}
              </td>
              <td class="table-cell">
                {{ formatDate(call.discharge_date) }}
              </td>
              <td class="table-cell">
                {{ formatDateTime(call.scheduled_call) }}
              </td>
              <td class="table-cell">
                <span
                  :class="[
                    'status-badge',
                    getStatusClass(call.status)
                  ]"
                >
                  {{ getStatusLabel(call.status) }}
                </span>
              </td>
              <td class="table-cell">
                {{ call.doctor }}
              </td>
              <td class="table-cell">
                {{ call.service }}
              </td>
              <td class="table-cell">
                {{ call.actual_call ? formatDateTime(call.actual_call) : '-' }}
              </td>
              <td class="table-cell">
                {{ call.duration ? `${call.duration} min` : '-' }}
              </td>
              <td class="table-cell">
                <button
                  @click="viewSummary(call.id)"
                  class="text-green-600 hover:text-green-900 font-medium"
                >
                  Voir résumé
                </button>
              </td>
              <td class="table-cell">
                <span class="font-medium" :class="getScoreClass(call.score)">
                  {{ call.score || '-' }}
                </span>
              </td>
              <td class="table-cell">
                <div class="flex items-center space-x-2">
                  <button
                    @click="viewSummary(call.id)"
                    class="text-gray-400 hover:text-gray-600"
                    title="Voir le résumé"
                  >
                    <EyeIcon class="h-4 w-4" />
                  </button>
                  <button
                    @click="exportCallPDF(call.id)"
                    class="text-gray-400 hover:text-gray-600"
                    title="Exporter en PDF"
                  >
                    <DocumentArrowDownIcon class="h-4 w-4" />
                  </button>
                  <button
                    @click="reportIssue(call.id)"
                    class="text-gray-400 hover:text-red-600"
                    title="Signaler un problème"
                  >
                    <ExclamationTriangleIcon class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-700">Affichage de</span>
          <select
            v-model="pagination.per_page"
            @change="loadCalls"
            class="input-field w-20"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <span class="text-sm text-gray-700">entrées</span>
        </div>

        <div class="flex items-center space-x-2">
          <button
            @click="previousPage"
            :disabled="pagination.page === 1"
            class="btn-secondary px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          
          <span class="text-sm text-gray-700">
            Page {{ pagination.page }} sur {{ pagination.pages }}
          </span>
          
          <button
            @click="nextPage"
            :disabled="pagination.page === pagination.pages"
            class="btn-secondary px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Résumé d'appel -->
    <div v-if="showSummaryModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">
            Résumé de l'appel #{{ selectedCall?.patient_number }}
          </h3>
          <button
            @click="showSummaryModal = false"
            class="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>
        
        <div v-if="selectedCall" class="space-y-4">
          <!-- Informations patient -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <h4 class="font-medium text-gray-900 mb-2">Informations patient</h4>
              <div class="space-y-1 text-sm">
                <p><span class="font-medium">Nom :</span> {{ selectedCall.patient_last_name }} {{ selectedCall.patient_first_name }}</p>
                <p><span class="font-medium">Téléphone :</span> {{ selectedCall.phone }}</p>
                <p><span class="font-medium">Date de sortie :</span> {{ formatDate(selectedCall.discharge_date) }}</p>
                <p><span class="font-medium">Médecin :</span> {{ selectedCall.doctor }}</p>
              </div>
            </div>
            <div>
              <h4 class="font-medium text-gray-900 mb-2">Détails de l'appel</h4>
              <div class="space-y-1 text-sm">
                <p><span class="font-medium">Statut :</span> 
                  <span :class="['status-badge', getStatusClass(selectedCall.status)]">
                    {{ getStatusLabel(selectedCall.status) }}
                  </span>
                </p>
                <p><span class="font-medium">Durée :</span> {{ selectedCall.duration ? `${selectedCall.duration} min` : 'Non disponible' }}</p>
                <p><span class="font-medium">Score :</span> 
                  <span :class="['font-medium', getScoreClass(selectedCall.score)]">
                    {{ selectedCall.score || 'Non calculé' }}
                  </span>
                </p>
              </div>
            </div>
          </div>
          
          <!-- Conversation simulée -->
          <div>
            <h4 class="font-medium text-gray-900 mb-2">Conversation</h4>
            <div class="bg-gray-50 rounded-lg p-4 space-y-3">
              <div class="flex items-start space-x-3">
                <div class="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span class="text-white text-xs font-medium">IA</span>
                </div>
                <div class="bg-white rounded-lg p-3 shadow-sm">
                  <p class="text-sm">Bonjour ! Je suis HelloJADE. Comment vous sentez-vous aujourd'hui ?</p>
                </div>
              </div>
              <div class="flex items-start space-x-3 justify-end">
                <div class="bg-blue-100 rounded-lg p-3 shadow-sm max-w-xs">
                  <p class="text-sm">Ça va mieux qu'hier, merci.</p>
                </div>
                <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span class="text-white text-xs font-medium">P</span>
                </div>
              </div>
              <div class="flex items-start space-x-3">
                <div class="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span class="text-white text-xs font-medium">IA</span>
                </div>
                <div class="bg-white rounded-lg p-3 shadow-sm">
                  <p class="text-sm">Sur une échelle de 0 à 10, comment évaluez-vous votre douleur ?</p>
                </div>
              </div>
              <div class="flex items-start space-x-3 justify-end">
                <div class="bg-blue-100 rounded-lg p-3 shadow-sm max-w-xs">
                  <p class="text-sm">8 sur 10, c'est très douloureux.</p>
                </div>
                <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span class="text-white text-xs font-medium">P</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              @click="exportCallPDF(selectedCall.id)"
              class="btn-secondary"
            >
              <DocumentArrowDownIcon class="h-4 w-4 mr-2" />
              Exporter en PDF
            </button>
            <button
              @click="reportIssue(selectedCall.id)"
              class="btn-danger"
            >
              <ExclamationTriangleIcon class="h-4 w-4 mr-2" />
              Signaler un problème
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { apiClient } from '@/utils/api'
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'
import { useToast } from 'vue-toastification'

const route = useRoute()
const toast = useToast()

// État de l'interface
const isLoading = ref(false)
const showSummaryModal = ref(false)
const selectedCall = ref(null)

// Filtres
const filters = reactive({
  search: '',
  status: '',
  fromDate: '',
  toDate: ''
})

// Pagination
const pagination = reactive({
  page: 1,
  per_page: 25,
  total: 0,
  pages: 0
})

// Tri
const sortByField = ref('scheduled_call')
const sortOrder = ref('desc')

// Colonnes du tableau
const columns = [
  { key: 'patient_number', label: 'N° Patient' },
  { key: 'patient_name', label: 'Nom du patient' },
  { key: 'birth_date', label: 'Date de naissance' },
  { key: 'phone', label: 'Téléphone' },
  { key: 'hospital_site', label: 'Site d\'hospitalisation' },
  { key: 'discharge_date', label: 'Date de sortie' },
  { key: 'scheduled_call', label: 'Appel prévu' },
  { key: 'status', label: 'Statut' },
  { key: 'doctor', label: 'Médecin référent' },
  { key: 'service', label: 'Service' },
  { key: 'actual_call', label: 'Appel réel' },
  { key: 'duration', label: 'Durée' },
  { key: 'summary', label: 'Résumé' },
  { key: 'score', label: 'Score' },
  { key: 'actions', label: 'Actions' }
]

// Données des appels
const calls = ref([])

// Recherche avec debounce
let searchTimeout: NodeJS.Timeout
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadCalls()
  }, 300)
}

// Charger les appels
const loadCalls = async () => {
  try {
    isLoading.value = true
    
    const params = {
      page: pagination.page,
      per_page: pagination.per_page,
      search: filters.search,
      status: filters.status
    }
    
    const response = await apiClient.calls.getCalls(params)
    
    if (response.data.success) {
      calls.value = response.data.data.items
      pagination.total = response.data.data.total
      pagination.pages = response.data.data.pages
    }
    
  } catch (error) {
    console.error('Erreur lors du chargement des appels:', error)
    toast.error('Erreur lors du chargement des appels')
  } finally {
    isLoading.value = false
  }
}

// Effacer les filtres
const clearFilters = () => {
  filters.search = ''
  filters.status = ''
  filters.fromDate = ''
  filters.toDate = ''
  loadCalls()
}

// Tri
const sortBy = (field: string) => {
  if (sortByField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortByField.value = field
    sortOrder.value = 'asc'
  }
  loadCalls()
}

// Pagination
const previousPage = () => {
  if (pagination.page > 1) {
    pagination.page--
    loadCalls()
  }
}

const nextPage = () => {
  if (pagination.page < pagination.pages) {
    pagination.page++
    loadCalls()
  }
}

// Voir le résumé d'un appel
const viewSummary = (callId: number) => {
  selectedCall.value = calls.value.find(call => call.id === callId)
  showSummaryModal.value = true
}

// Exporter en PDF
const exportCallPDF = async (callId: number) => {
  try {
    toast.info('Génération du PDF en cours...')
    // Simuler l'export
    await new Promise(resolve => setTimeout(resolve, 2000))
    toast.success('PDF généré avec succès')
  } catch (error) {
    console.error('Erreur lors de l\'export PDF:', error)
    toast.error('Erreur lors de l\'export PDF')
  }
}

// Signaler un problème
const reportIssue = (callId: number) => {
  toast.info('Fonctionnalité de signalement à implémenter')
}

// Exporter les données
const exportData = async () => {
  try {
    toast.info('Export en cours...')
    // Simuler l'export
    await new Promise(resolve => setTimeout(resolve, 2000))
    toast.success('Données exportées avec succès')
  } catch (error) {
    console.error('Erreur lors de l\'export:', error)
    toast.error('Erreur lors de l\'export')
  }
}

// Actualiser les données
const refreshData = () => {
  loadCalls()
}

// Utilitaires
const getStatusClass = (status: string) => {
  switch (status) {
    case 'pending': return 'status-pending'
    case 'called': return 'status-called'
    case 'failed': return 'status-failed'
    default: return 'status-pending'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending': return 'À appeler'
    case 'called': return 'Appelé'
    case 'failed': return 'Échec'
    default: return 'Inconnu'
  }
}

const getScoreClass = (score: number | null) => {
  if (!score) return 'text-gray-500'
  if (score >= 8) return 'text-red-600'
  if (score >= 6) return 'text-yellow-600'
  return 'text-green-600'
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('fr-FR')
}

const formatDateTime = (dateTime: string) => {
  return new Date(dateTime).toLocaleString('fr-FR')
}

// Initialisation
onMounted(() => {
  loadCalls()
  
  // Vérifier s'il y a un appel spécifique dans l'URL
  const callId = route.query.call
  if (callId) {
    const call = calls.value.find(c => c.id === parseInt(callId as string))
    if (call) {
      viewSummary(call.id)
    }
  }
})
</script> 