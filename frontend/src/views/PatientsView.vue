<template>
  <div class="patients-container">
    <!-- En-tête avec statistiques -->
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
        <div class="flex items-center space-x-3">
                     <button
             @click="openExportModal"
             :disabled="isLoading"
             class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
           >
             <DocumentArrowDownIcon class="h-4 w-4 mr-2" />
             Exporter
           </button>
          <button
            @click="refreshData"
            :disabled="isLoading"
            class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
          >
            <ArrowPathIcon v-if="isLoading" class="h-4 w-4 mr-2 animate-spin" />
            <ArrowPathIcon v-else class="h-4 w-4 mr-2" />
            Actualiser
          </button>
        </div>
      </div>

      <!-- Cartes de statistiques -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <div class="flex items-center">
            <div class="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <UsersIcon class="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Total Patients</p>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ statistics.total_patients }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <div class="flex items-center">
            <div class="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <UserIcon class="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Hommes</p>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ statistics.male_count }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <div class="flex items-center">
            <div class="p-2 bg-pink-100 dark:bg-pink-900/50 rounded-lg">
              <UserIcon class="h-6 w-6 text-pink-600 dark:text-pink-400" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Femmes</p>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ statistics.female_count }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <div class="flex items-center">
            <div class="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
              <ClockIcon class="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Âge Moyen</p>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ Math.round(statistics.avg_age) }} ans</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtres et recherche -->
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Recherche -->
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Recherche
          </label>
          <div class="relative">
            <MagnifyingGlassIcon class="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              v-model="filters.search"
              @input="handleSearch"
              type="text"
              placeholder="Nom, prénom, téléphone..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            />
          </div>
        </div>



        <!-- Âge minimum -->
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Âge min
          </label>
          <input
            v-model="filters.ageMin"
            @input="handleFilterChange"
            type="number"
            placeholder="0"
            class="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
          />
        </div>

        <!-- Âge maximum -->
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Âge max
          </label>
          <input
            v-model="filters.ageMax"
            @input="handleFilterChange"
            type="number"
            placeholder="120"
            class="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
          />
        </div>
      </div>

      <!-- Boutons de filtres -->
      <div class="flex items-center justify-between mt-4">
        <div class="flex items-center space-x-4">
          <button
            @click="clearFilters"
            class="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline"
          >
            Effacer les filtres
          </button>
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-sm text-slate-600 dark:text-slate-400">
            {{ currentPageInfo }}
          </span>
        </div>
      </div>
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

    <!-- Tableau des patients -->
    <div v-else-if="patients.length > 0" class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
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
  ArrowPathIcon
} from '@heroicons/vue/24/outline'
import { usePatientsStore } from '@/stores/patients'
import PatientModal from '@/components/PatientModal.vue'
import PatientEditModal from '@/components/PatientEditModal.vue'
import PatientExportModal from '@/components/PatientExportModal.vue'
import { generateDefaultPatientPDF } from '@/utils/pdfGenerator'

const patientsStore = usePatientsStore()

// State local
const showPatientModal = ref(false)
const showEditModal = ref(false)
const showExportModal = ref(false)
const selectedPatient = ref(null)
const searchTimeout = ref<NodeJS.Timeout | null>(null)

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

const handleSearch = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  searchTimeout.value = setTimeout(() => {
    patientsStore.setFilters({ search: filters.value.search })
    patientsStore.fetchPatients(true)
  }, 300)
}

const handleFilterChange = () => {
  patientsStore.fetchPatients(true)
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
    // Optionnel : afficher une notification de succès
    console.log('Patient mis à jour avec succès')
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error)
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
    await generateDefaultPatientPDF(selectedPatients)
    showExportModal.value = false
  } catch (error) {
    console.error('Erreur lors de l\'export PDF:', error)
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
