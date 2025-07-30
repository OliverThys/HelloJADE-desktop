<template>
  <div class="min-h-screen bg-gray-50 dark:bg-slate-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- En-tête -->
      <div class="mb-8">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="title-light">Gestion des patients</h1>
            <p class="subtitle-light mt-2">
              Gérez vos patients et leurs informations médicales
            </p>
          </div>
          <button
            @click="showAddPatientModal = true"
            class="btn-action-primary-light"
          >
            <PlusIcon class="mr-2 h-4 w-4" />
            Nouveau patient
          </button>
        </div>
      </div>

      <!-- Filtres et recherche -->
      <div class="filter-container-light mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="md:col-span-1">
            <label class="filter-label-light">
              Recherche
            </label>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Nom, prénom, téléphone..."
              class="filter-input-light"
            />
          </div>
          <div class="md:col-span-1">
            <label class="filter-label-light">
              Statut
            </label>
            <select
              v-model="statusFilter"
              class="filter-input-light"
            >
              <option value="">Tous</option>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
            </select>
          </div>
          <div class="md:col-span-1">
            <label class="filter-label-light">
              Service
            </label>
            <select
              v-model="serviceFilter"
              class="filter-input-light"
            >
              <option value="">Tous</option>
              <option value="Cardiologie">Cardiologie</option>
              <option value="Chirurgie generale">Chirurgie générale</option>
              <option value="Dermatologie">Dermatologie</option>
              <option value="Endocrinologie">Endocrinologie</option>
              <option value="Gastro-enterologie">Gastro-entérologie</option>
              <option value="Gynecologie">Gynécologie</option>
              <option value="Hematologie">Hématologie</option>
              <option value="Infectiologie">Infectiologie</option>
              <option value="Nephrologie">Néphrologie</option>
              <option value="Neurologie">Neurologie</option>
              <option value="Oncologie">Oncologie</option>
              <option value="Ophtalmologie">Ophtalmologie</option>
              <option value="ORL">ORL</option>
              <option value="Orthopedie">Orthopédie</option>
              <option value="Pneumologie">Pneumologie</option>
              <option value="Psychiatrie">Psychiatrie</option>
              <option value="Rhumatologie">Rhumatologie</option>
              <option value="Traumatologie">Traumatologie</option>
              <option value="Urologie">Urologie</option>
            </select>
          </div>

          <div class="flex items-end">
            <button
              v-if="!patientsStore.isSelectionMode"
              @click="startExportMode"
              class="btn-action-light"
            >
              <ArrowDownTrayIcon class="mr-2 h-4 w-4" />
              Exporter
            </button>
            <div v-else class="flex flex-col space-y-2 w-full">
              <!-- Première ligne : Sélection -->
              <div class="flex space-x-2">
                <button
                  @click="patientsStore.selectAllPatients"
                  class="flex-1 btn-action-light"
                >
                  <CheckIcon class="mr-2 h-4 w-4" />
                  Tout sélectionner
                </button>
                <button
                  @click="patientsStore.deselectAllPatients"
                  class="flex-1 btn-action-light"
                >
                  <XMarkIcon class="mr-2 h-4 w-4" />
                  Tout désélectionner
                </button>
              </div>
              <!-- Deuxième ligne : Actions -->
              <div class="flex space-x-2">
                <button
                  @click="exportSelectedPatients"
                  :disabled="patientsStore.selectedPatients.length === 0"
                  class="flex-1 btn-action-primary-light disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowDownTrayIcon class="mr-2 h-4 w-4" />
                  Exporter sélection ({{ patientsStore.selectedPatients.length }})
                </button>
                <button
                  @click="cancelExportMode"
                  class="btn-action-light"
                >
                  <XMarkIcon class="mr-2 h-4 w-4" />
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tableau des patients -->
      <div class="table-light">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead class="bg-gradient-to-r from-gray-50 to-gray-100 dark:bg-slate-900">
            <tr>
              <th scope="col" class="table-header-light">
                ID
              </th>
              <th scope="col" class="table-header-light">
                NOM
              </th>
              <th scope="col" class="table-header-light">
                PRÉNOM
              </th>
              <th scope="col" class="table-header-light">
                TÉLÉPHONE
              </th>
              <th scope="col" class="table-header-light">
                EMAIL
              </th>
              <th scope="col" class="table-header-light">
                SERVICE
              </th>
              <th scope="col" class="table-header-light">
                STATUT
              </th>
              <th scope="col" class="table-header-light">
                DATE CRÉATION
              </th>
              <th scope="col" class="table-header-light">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
            <tr
              v-for="patient in filteredPatients"
              :key="patient.id"
              class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors duration-200"
            >
              <td class="table-cell-light">
                <span class="data-text-light">#{{ patient.id }}</span>
              </td>
              <td class="table-cell-light">
                <span class="data-text-light">{{ patient.nom }}</span>
              </td>
              <td class="table-cell-light">
                <span class="data-text-light">{{ patient.prenom }}</span>
              </td>
              <td class="table-cell-light">
                <span class="data-text-secondary-light">{{ patient.telephone }}</span>
              </td>
              <td class="table-cell-light">
                <span class="data-text-secondary-light">{{ patient.email }}</span>
              </td>
              <td class="table-cell-light">
                <span class="data-text-secondary-light">{{ patient.service }}</span>
              </td>
              <td class="table-cell-light">
                <span 
                  class="badge-green-light"
                  v-if="patient.statut === 'actif'"
                >
                  Actif
                </span>
                <span 
                  class="badge-red-light"
                  v-else
                >
                  Inactif
                </span>
              </td>
              <td class="table-cell-light">
                <span class="data-text-muted-light">{{ formatDate(patient.date_creation) }}</span>
              </td>
              <td class="table-cell-light">
                <div class="flex items-center space-x-2">
                  <button
                    @click="editPatient(patient)"
                    class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                    title="Modifier"
                  >
                    <PencilIcon class="w-4 h-4" />
                  </button>
                  <button
                    @click="deletePatient(patient.id)"
                    class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
                    title="Supprimer"
                  >
                    <TrashIcon class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination-light">
        <div class="flex items-center justify-between">
          <div class="pagination-text-light">
            Affichage de {{ startIndex + 1 }} à {{ endIndex }} sur {{ filteredPatients.length }} patients
          </div>
          <div class="flex items-center space-x-2">
            <button
              @click="previousPage"
              :disabled="currentPage === 1"
              class="pagination-button-light disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon class="w-4 h-4" />
              Précédent
            </button>
            <button
              v-for="page in visiblePages"
              :key="page"
              @click="goToPage(page)"
              :class="[
                'pagination-button-light',
                page === currentPage ? 'pagination-button-active-light' : ''
              ]"
            >
              {{ page }}
            </button>
            <button
              @click="nextPage"
              :disabled="currentPage === totalPages"
              class="pagination-button-light disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
              <ChevronRightIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal d'ajout/modification de patient -->
    <PatientModal
      v-if="showAddPatientModal"
      :patient="selectedPatient"
      @close="closePatientModal"
      @save="savePatient"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  CheckIcon,
  XMarkIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/vue/24/outline'
import DataTable from '@/components/common/DataTable.vue'
import PatientModal from '@/components/PatientModal.vue'
import ExportModal from '@/components/ExportModal.vue'
import { usePatientsStore } from '@/stores/patients'
import { useExport } from '@/composables/useExport'
import { useNotifications } from '@/composables/useNotifications'
import { formatDate } from '@/utils/api'

const router = useRouter()
const patientsStore = usePatientsStore()
const { exportToExcel } = useExport()
const { showNotification } = useNotifications()

// État local
const showAddPatientModal = ref(false)
const selectedPatient = ref(null)
const searchQuery = ref('')
const statusFilter = ref('')
const serviceFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Computed
const filteredPatients = computed(() => {
  return patientsStore.filteredPatients
})

const paginatedPatients = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredPatients.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredPatients.value.length / itemsPerPage.value)
})

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

const startIndex = computed(() => {
  return (currentPage.value - 1) * itemsPerPage.value
})

const endIndex = computed(() => {
  return Math.min(startIndex.value + itemsPerPage.value, filteredPatients.value.length)
})

// Méthodes
const editPatient = (patient: any) => {
  selectedPatient.value = patient
  showAddPatientModal.value = true
}

const deletePatient = async (patientId: number) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce patient ?')) {
    try {
      await patientsStore.deletePatient(patientId)
      showNotification('Patient supprimé avec succès', 'success')
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error')
    }
  }
}

const savePatient = async (patientData: any) => {
  try {
    if (selectedPatient.value) {
      await patientsStore.updatePatient(selectedPatient.value.id, patientData)
      showNotification('Patient modifié avec succès', 'success')
    } else {
      await patientsStore.createPatient(patientData)
      showNotification('Patient créé avec succès', 'success')
    }
    closePatientModal()
  } catch (error) {
    showNotification('Erreur lors de la sauvegarde', 'error')
  }
}

const closePatientModal = () => {
  showAddPatientModal.value = false
  selectedPatient.value = null
}

const startExportMode = () => {
  patientsStore.startSelectionMode()
}

const cancelExportMode = () => {
  patientsStore.stopSelectionMode()
}

const exportSelectedPatients = () => {
  const selectedPatients = patientsStore.selectedPatients
  if (selectedPatients.length === 0) {
    showNotification('Aucun patient sélectionné', 'warning')
    return
  }
  
  const data = selectedPatients.map(patient => ({
    ID: patient.id,
    Nom: patient.nom,
    Prénom: patient.prenom,
    Téléphone: patient.telephone,
    Email: patient.email,
    Service: patient.service,
    Statut: patient.statut,
    'Date création': formatDate(patient.date_creation)
  }))
  
  exportToExcel(data, 'patients-selectionnes')
  showNotification(`${selectedPatients.length} patients exportés`, 'success')
  cancelExportMode()
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const goToPage = (page: number) => {
  currentPage.value = page
}

// Watchers
watch([searchQuery, statusFilter, serviceFilter], () => {
  patientsStore.updateFilters({
    search: searchQuery.value,
    status: statusFilter.value,
    service: serviceFilter.value
  })
  currentPage.value = 1
})

// Lifecycle
onMounted(async () => {
  if (patientsStore.patients.length === 0) {
    await patientsStore.fetchPatients()
  }
})
</script>

<style scoped>
/* Styles minimaux pour éviter les conflits */
.fixed-height-table :deep(tbody tr) {
  height: auto;
}

.fixed-height-table :deep(tbody td) {
  vertical-align: middle;
}
</style> 
