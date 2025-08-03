<template>
  <div class="patients-container">
    <!-- En-tête principal -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="title-light mb-2">
            Gestion des Patients
          </h1>
          <p class="subtitle-light">
            Interface de gestion des patients hospitaliers - {{ statistics.total_patients }} patients enregistrés
          </p>
        </div>
        <div class="flex items-center space-x-4">
          <button
            @click="openExportModal"
            :disabled="isLoading"
            class="group relative px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 hover:shadow-lg transition-all duration-300 ease-out flex items-center font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            <div class="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300"></div>
            <DocumentArrowDownIcon class="h-5 w-5 mr-2 group-hover:-translate-y-0.5 transition-transform duration-300" />
            Exporter
          </button>
          
          <button
            @click="refreshData"
            :disabled="isLoading"
            class="group relative px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transform hover:scale-105 hover:shadow-lg transition-all duration-300 ease-out flex items-center font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            <div class="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300"></div>
            <ArrowPathIcon v-if="isLoading" class="h-5 w-5 mr-2 animate-spin" />
            <ArrowPathIcon v-else class="h-5 w-5 mr-2 group-hover:rotate-180 transition-transform duration-500" />
            Actualiser
          </button>
        </div>
      </div>

      <!-- Conteneur des statistiques avec transition -->
      <transition
        enter-active-class="transition-all duration-300 ease-out"
        leave-active-class="transition-all duration-200 ease-in"
        enter-from-class="opacity-0 transform -translate-y-4"
        leave-to-class="opacity-0 transform -translate-y-4"
      >
        <div 
          v-show="showStatistics"
          class="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-6 mb-6 bg-opacity-95 dark:bg-opacity-95 relative"
        >
                     <!-- Encoche pour fermer les statistiques -->
           <div 
             @click="toggleStatistics"
             class="absolute -top-4 left-1/2 transform -translate-x-1/2 w-20 h-8 bg-gradient-to-b from-purple-600 to-purple-700 rounded-t-lg cursor-pointer hover:from-purple-700 hover:to-purple-800 transition-all duration-200 flex items-center justify-center shadow-lg"
           >
             <ChevronUpIcon class="h-5 w-5 text-white" />
           </div>
          
          <!-- Nouveau Dashboard avec cartes cliquables -->
          <PatientStatsCards 
            :patients="patients" 
            :active-filter="activeFilter"
            @filter-change="handleFilterChange"
          />

          <!-- Recherche intelligente -->
          <div class="mt-6">
            <SmartSearch 
              :patients="patients"
              @search-change="handleSearchChange"
            />
          </div>

          <!-- Graphiques et visualisations -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <!-- Pyramide des âges -->
            <PatientAgePyramid :patients="patients" />
            
            <!-- Heatmap des admissions -->
            <PatientAdmissionsHeatmap :patients="patients" />
          </div>
        </div>
      </transition>
    </div>

    <!-- Message d'erreur -->
    <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
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

    <!-- Indicateur de chargement -->
    <div v-if="isLoading && patients.length === 0" class="flex items-center justify-center h-64">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p class="text-slate-600 dark:text-slate-400">Chargement des patients...</p>
      </div>
    </div>

    <!-- Tableau des patients avec transition -->
    <div 
      v-if="patients.length > 0" 
      class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden relative transition-all duration-700 ease-out"
      :style="showStatistics ? 'transform: translateY(0)' : 'transform: translateY(0)'"
    >
             <!-- Encoche pour ouvrir les statistiques -->
       <div 
         @click="toggleStatistics"
         class="absolute -top-4 left-1/2 transform -translate-x-1/2 w-20 h-8 bg-gradient-to-b from-purple-500 to-purple-600 rounded-t-lg cursor-pointer hover:from-purple-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center shadow-lg"
       >
         <ChevronDownIcon class="h-5 w-5 text-white transform translate-y-1" />
       </div>

      <!-- En-tête du tableau -->
      <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-800 dark:text-white">
            Liste des Patients
          </h3>
          <div class="flex items-center space-x-4">
            <!-- Tri -->
            <div class="flex items-center space-x-2">
              <label class="text-sm text-slate-600 dark:text-slate-400">Trier par:</label>
              <select
                v-model="filters.sortBy"
                @change="handleSortChange"
                class="text-sm border border-gray-300 dark:border-slate-600 rounded px-2 py-1 dark:bg-slate-700 dark:text-white"
              >
                <option value="nom">Nom</option>
                <option value="prenom">Prénom</option>
                <option value="date_naissance">Date de naissance</option>
                <option value="age">Âge</option>
              </select>
              <button
                @click="toggleSortOrder"
                class="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
              >
                <ArrowUpIcon v-if="filters.sortOrder === 'ASC'" class="h-4 w-4" />
                <ArrowDownIcon v-else class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tableau -->
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-slate-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                Patient
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                Âge
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                Contact
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                Adresse
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                N° Sécurité
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-slate-700">
            <tr
              v-for="patient in patients"
              :key="patient.patient_id"
              class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors duration-200"
            >
              <td class="px-6 py-4">
                <div class="flex items-center">
                  <div class="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                    <span class="text-green-600 dark:text-green-400 font-semibold">
                      {{ patient.prenom.charAt(0) }}{{ patient.nom.charAt(0) }}
                    </span>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-slate-900 dark:text-white">
                      {{ patient.prenom }} {{ patient.nom }}
                    </div>
                    <div class="text-sm text-slate-500 dark:text-slate-400">
                      ID: {{ patient.patient_id }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-slate-900 dark:text-white">
                  {{ patient.age }} ans
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-slate-900 dark:text-white">
                  {{ patient.telephone || 'Non renseigné' }}
                </div>
                <div class="text-sm text-slate-500 dark:text-slate-400">
                  {{ patient.email || 'Non renseigné' }}
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-slate-900 dark:text-white max-w-xs truncate">
                  {{ patient.adresse || 'Non renseignée' }}
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-slate-900 dark:text-white font-mono">
                  {{ patient.numero_secu || 'Non renseigné' }}
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center space-x-2">
                  <button
                    @click="viewPatient(patient)"
                    class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    title="Voir les détails"
                  >
                    <EyeIcon class="h-4 w-4" />
                  </button>
                  <button
                    @click="editPatient(patient)"
                    class="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                    title="Modifier"
                  >
                    <PencilIcon class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="px-6 py-4 border-t border-gray-200 dark:border-slate-700">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <span class="text-sm text-slate-600 dark:text-slate-400">
              Affichage par page:
            </span>
            <select
              v-model="pagination.limit"
              @change="handleLimitChange"
              class="text-sm border border-gray-300 dark:border-slate-600 rounded px-2 py-1 dark:bg-slate-700 dark:text-white"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
          
          <div class="flex items-center space-x-2">
            <button
              @click="prevPage"
              :disabled="!hasPrevPage"
              class="px-3 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              Précédent
            </button>
            
            <div class="flex items-center space-x-1">
              <button
                v-for="page in getVisiblePages()"
                :key="page"
                @click="goToPage(page)"
                :class="[
                  'px-3 py-1 text-sm rounded',
                  page === pagination.page
                    ? 'bg-blue-500 text-white'
                    : 'border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700'
                ]"
              >
                {{ page }}
              </button>
            </div>
            
            <button
              @click="nextPage"
              :disabled="!hasNextPage"
              class="px-3 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- État vide -->
    <div v-else class="flex items-center justify-center h-64">
      <div class="text-center">
        <div class="text-6xl mb-4">👥</div>
        <h2 class="text-xl font-semibold mb-2">Aucun patient trouvé</h2>
        <p class="text-slate-500 dark:text-slate-400 mb-4">
          {{ filters.search || filters.sexe || filters.ageMin || filters.ageMax 
            ? 'Aucun patient ne correspond aux critères de recherche' 
            : 'Aucun patient n\'est actuellement enregistré' }}
        </p>
        <button
          v-if="filters.search || filters.sexe || filters.ageMin || filters.ageMax"
          @click="clearFilters"
          class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
        >
          Effacer les filtres
        </button>
      </div>
    </div>

    <!-- Modal de détails du patient -->
    <PatientModal
      v-if="showPatientModal"
      :patient="selectedPatient"
      @close="showPatientModal = false"
    />

    <!-- Modal d'édition du patient -->
    <PatientEditModal
      v-if="showEditModal"
      :patient="selectedPatient"
      @close="showEditModal = false"
      @saved="handlePatientSaved"
    />

    <!-- Modal d'export des patients -->
    <PatientExportModal
      v-if="showExportModal"
      :patients="patients"
      @close="showExportModal = false"
      @export-pdf="handleExportPDF"
      @export-csv="handleExportCSV"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue'
import { 
  ExclamationTriangleIcon, 
  ArrowRightOnRectangleIcon,
  UsersIcon,
  UserIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  PencilIcon,
  DocumentArrowDownIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/vue/24/outline'
import { usePatientsStore } from '@/stores/patients'
import { notify } from '@/composables/useNotifications'
import PatientModal from '@/components/PatientModal.vue'
import PatientEditModal from '@/components/PatientEditModal.vue'
import PatientExportModal from '@/components/PatientExportModal.vue'
import { generateDefaultPatientPDF } from '@/utils/pdfGenerator'
import PatientStatsCards from '@/components/patients/PatientStatsCards.vue'
import SmartSearch from '@/components/patients/SmartSearch.vue'
import PatientAgePyramid from '@/components/patients/PatientAgePyramid.vue'
import PatientAdmissionsHeatmap from '@/components/patients/PatientAdmissionsHeatmap.vue'

const patientsStore = usePatientsStore()

// State local
const showPatientModal = ref(false)
const showEditModal = ref(false)
const showExportModal = ref(false)
const selectedPatient = ref(null)
const searchTimeout = ref<NodeJS.Timeout | null>(null)
const activeFilter = ref('all')
const showStatistics = ref(false)

// Computed properties
const patients = computed(() => patientsStore.patients)
const isLoading = computed(() => patientsStore.isLoading)
const error = computed(() => patientsStore.error)
const pagination = computed(() => patientsStore.pagination)
const statistics = computed(() => patientsStore.statistics)
const filters = computed(() => patientsStore.filters)
const hasNextPage = computed(() => patientsStore.hasNextPage)
const hasPrevPage = computed(() => patientsStore.hasPrevPage)
const currentPageInfo = computed(() => patientsStore.currentPageInfo)

// Actions
const refreshData = () => {
  patientsStore.fetchPatients(true)
}

const toggleStatistics = () => {
  showStatistics.value = !showStatistics.value
}

const handleSearch = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  searchTimeout.value = setTimeout(() => {
    patientsStore.setFilters({ search: filters.value.search })
    patientsStore.fetchPatients(true)
  }, 300)
}

const handleSortChange = () => {
  patientsStore.fetchPatients()
}

const toggleSortOrder = () => {
  patientsStore.setFilters({
    sortOrder: filters.value.sortOrder === 'ASC' ? 'DESC' : 'ASC'
  })
  patientsStore.fetchPatients()
}

const handleLimitChange = () => {
  patientsStore.setLimit(pagination.value.limit)
  patientsStore.fetchPatients()
}

const clearFilters = () => {
  patientsStore.clearFilters()
  patientsStore.fetchPatients(true)
}

// Nouvelles fonctions pour les filtres avancés
const handleFilterChange = (filter: { type: string, value: any }) => {
  activeFilter.value = filter.value.group || filter.value
  
  if (filter.type === 'age') {
    const { minAge, maxAge } = filter.value
    patientsStore.setFilters({
      ageMin: minAge.toString(),
      ageMax: maxAge.toString()
    })
  } else if (filter.type === 'status') {
    // Appliquer le filtre de statut côté client
    // Le filtrage se fait dans le composant SmartSearch
  }
  
  patientsStore.fetchPatients(true)
}

const handleSearchChange = (filters: {
  query: string
  ageFilter: string
  statusFilter: string
  sortBy: string
  sortOrder: string
}) => {
  // Appliquer les nouveaux filtres
  patientsStore.setFilters({
    search: filters.query,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder
  })
  
  // Appliquer les filtres d'âge
  if (filters.ageFilter) {
    const [minAge, maxAge] = filters.ageFilter.split('-').map(Number)
    patientsStore.setFilters({
      ageMin: minAge.toString(),
      ageMax: maxAge === 65 ? '65' : '120'
    })
  }
  
  patientsStore.fetchPatients(true)
}

const nextPage = () => {
  patientsStore.nextPage()
  patientsStore.fetchPatients()
}

const prevPage = () => {
  patientsStore.prevPage()
  patientsStore.fetchPatients()
}

const goToPage = (page: number) => {
  patientsStore.goToPage(page)
  patientsStore.fetchPatients()
}

const getVisiblePages = () => {
  const current = pagination.value.page
  const total = pagination.value.totalPages
  const delta = 2
  
  const range = []
  const rangeWithDots = []
  
  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    range.push(i)
  }
  
  if (current - delta > 2) {
    rangeWithDots.push(1, '...')
  } else {
    rangeWithDots.push(1)
  }
  
  rangeWithDots.push(...range)
  
  if (current + delta < total - 1) {
    rangeWithDots.push('...', total)
  } else {
    rangeWithDots.push(total)
  }
  
  return rangeWithDots.filter(page => page !== 1 || total === 1)
}

const viewPatient = (patient: any) => {
  selectedPatient.value = patient
  showPatientModal.value = true
}

const editPatient = (patient: any) => {
  selectedPatient.value = patient
  showEditModal.value = true
}

const handlePatientSaved = async (updatedPatient: any) => {
  try {
    await patientsStore.updatePatient(updatedPatient.patient_id, updatedPatient)
    // Afficher une notification de succès
    console.log('Patient mis à jour avec succès')
    notify.success('Patient mis à jour', `Patient ${updatedPatient.prenom} ${updatedPatient.nom} mis à jour avec succès`)
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error)
    notify.error('Erreur de mise à jour', 'Erreur lors de la mise à jour du patient')
  }
}

const exportCSV = () => {
  patientsStore.exportCSV()
}

const openExportModal = () => {
  showExportModal.value = true
}

const handleExportPDF = async (selectedPatients: any[]) => {
  try {
    console.log('Début de l\'export PDF pour', selectedPatients.length, 'patients')
    
    // Vérifier qu'il y a des patients sélectionnés
    if (!selectedPatients || selectedPatients.length === 0) {
      console.warn('Aucun patient sélectionné pour l\'export')
      return
    }
    
    // Générer le PDF
    await generateDefaultPatientPDF(selectedPatients)
    
    // Fermer le modal après succès
    showExportModal.value = false
    
    // Afficher une notification de succès
    notify.success('Export PDF', `Export PDF réussi pour ${selectedPatients.length} patients`)
    
  } catch (error) {
    console.error('Erreur lors de l\'export PDF:', error)
    
    // Afficher une notification d'erreur
    notify.error('Erreur Export PDF', `Erreur lors de l'export PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
  }
}

const handleExportCSV = async (selectedPatients: any[]) => {
  try {
    await patientsStore.exportCSV(selectedPatients)
    showExportModal.value = false
  } catch (error) {
    console.error('Erreur lors de l\'export CSV:', error)
  }
}

// Watchers
watch(() => pagination.value.page, () => {
  patientsStore.fetchPatients()
})

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

.title-light {
  @apply text-3xl font-bold text-slate-900 dark:text-white;
}

.subtitle-light {
  @apply text-slate-600 dark:text-slate-400;
}


</style> 
