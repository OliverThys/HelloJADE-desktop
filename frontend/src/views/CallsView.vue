<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="title-light">Gestion des appels</h1>
        <p class="subtitle-light">Suivi des appels post-hospitalisation</p>
      </div>
      
      <!-- Actions -->
      <div class="flex items-center space-x-3">
        <button
          @click="exportData"
          class="btn-action-light"
          :disabled="isLoading"
        >
          <ArrowDownTrayIcon class="h-4 w-4 mr-2" />
          Exporter
        </button>
        <button
          @click="refreshData"
          class="btn-action-primary-light"
          :disabled="isLoading"
        >
          <ArrowPathIcon class="h-4 w-4 mr-2" :class="{ 'animate-spin': isLoading }" />
          Actualiser
        </button>
      </div>
    </div>

    <!-- Filtres -->
    <div class="filter-container-light">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Recherche -->
        <div>
          <label class="filter-label-light">
            Recherche
          </label>
          <div class="relative">
            <input
              v-model="filters.search"
              type="text"
              placeholder="Nom, prénom, téléphone..."
              class="filter-input-light pl-10"
              @input="debouncedSearch"
            />
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-light-muted" />
          </div>
        </div>

        <!-- Statut -->
        <div>
          <label class="filter-label-light">
            Statut
          </label>
          <select
            v-model="filters.status"
            @change="loadCalls"
            class="filter-input-light"
          >
            <option value="">Tous les statuts</option>
            <option value="pending">À appeler</option>
            <option value="called">Appelé</option>
            <option value="failed">Échec</option>
          </select>
        </div>

        <!-- Date de début -->
        <div>
          <label class="filter-label-light">
            Date de début
          </label>
          <input
            v-model="filters.fromDate"
            type="date"
            @change="loadCalls"
            class="filter-input-light"
          />
        </div>

        <!-- Date de fin -->
        <div>
          <label class="filter-label-light">
            Date de fin
          </label>
          <input
            v-model="filters.toDate"
            type="date"
            @change="loadCalls"
            class="filter-input-light"
          />
        </div>
      </div>

      <!-- Boutons de filtres -->
      <div class="flex items-center justify-between mt-4">
        <div class="flex items-center space-x-2">
          <button
            @click="clearFilters"
            class="link-light"
          >
            Effacer les filtres
          </button>
          <span class="text-light-secondary">
            {{ filteredCalls.length }} appels trouvés
          </span>
        </div>
      </div>
    </div>

    <!-- Tableau des appels -->
    <div class="table-light">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
        <thead class="bg-gradient-to-r from-gray-50 to-gray-100 dark:bg-slate-900">
          <tr>
            <th scope="col" class="table-header-light">
              N° PATIENT
            </th>
            <th scope="col" class="table-header-light">
              NOM DU PATIENT
            </th>
            <th scope="col" class="table-header-light">
              DATE DE NAISSANCE
            </th>
            <th scope="col" class="table-header-light">
              TÉLÉPHONE
            </th>
            <th scope="col" class="table-header-light">
              SITE D'HOSPITALISATION
            </th>
            <th scope="col" class="table-header-light">
              DATE DE SORTIE
            </th>
            <th scope="col" class="table-header-light">
              APPEL PRÉVU
            </th>
            <th scope="col" class="table-header-light">
              STATUT
            </th>
            <th scope="col" class="table-header-light">
              MÉDECIN RÉFÉRENT
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
          <tr
            v-for="call in paginatedCalls"
            :key="call.id"
            class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors duration-200"
          >
            <td class="table-cell-light">
              <span class="data-text-light">#{{ call.patient_id }}</span>
            </td>
            <td class="table-cell-light">
              <span class="data-text-light">{{ call.patient_nom }} {{ call.patient_prenom }}</span>
            </td>
            <td class="table-cell-light">
              <span class="data-text-secondary-light">{{ formatDate(call.date_naissance) }}</span>
            </td>
            <td class="table-cell-light">
              <span class="data-text-secondary-light">{{ call.telephone }}</span>
            </td>
            <td class="table-cell-light">
              <span class="data-text-secondary-light">{{ call.site_hospitalisation }}</span>
            </td>
            <td class="table-cell-light">
              <span class="data-text-secondary-light">{{ formatDate(call.date_sortie) }}</span>
            </td>
            <td class="table-cell-light">
              <span class="data-text-secondary-light">{{ formatDate(call.appel_prevu) }}</span>
            </td>
            <td class="table-cell-light">
              <span 
                class="badge-yellow-light"
                v-if="call.statut === 'pending'"
              >
                À appeler
              </span>
              <span 
                class="badge-green-light"
                v-else-if="call.statut === 'called'"
              >
                Appelé
              </span>
              <span 
                class="badge-red-light"
                v-else
              >
                Échec
              </span>
            </td>
            <td class="table-cell-light">
              <span class="data-text-secondary-light">{{ call.medecin_referent }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination-light">
      <div class="flex items-center justify-between">
        <div class="pagination-text-light">
          Affichage de {{ startIndex + 1 }} à {{ endIndex }} sur {{ filteredCalls.length }} appels
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
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/vue/24/outline'
import { formatDate } from '@/utils/api'

const route = useRoute()

// État de l'interface
const isLoading = ref(false)

// Filtres
const filters = reactive({
  search: '',
  status: '',
  fromDate: '',
  toDate: ''
})

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Données simulées pour les appels
const calls = ref([
  {
    id: 1,
    patient_id: 'P001',
    patient_nom: 'Dupont',
    patient_prenom: 'Jean',
    date_naissance: '1980-05-15',
    telephone: '0123456789',
    site_hospitalisation: 'Hôpital Central',
    date_sortie: '2024-01-15',
    appel_prevu: '2024-01-20',
    statut: 'pending',
    medecin_referent: 'Dr. Martin'
  },
  {
    id: 2,
    patient_id: 'P002',
    patient_nom: 'Martin',
    patient_prenom: 'Marie',
    date_naissance: '1975-08-22',
    telephone: '0987654321',
    site_hospitalisation: 'Clinique Sud',
    date_sortie: '2024-01-18',
    appel_prevu: '2024-01-25',
    statut: 'called',
    medecin_referent: 'Dr. Dubois'
  }
])

// Computed
const filteredCalls = computed(() => {
  let filtered = calls.value

  if (filters.search) {
    const search = filters.search.toLowerCase()
    filtered = filtered.filter(call => 
      call.patient_nom.toLowerCase().includes(search) ||
      call.patient_prenom.toLowerCase().includes(search) ||
      call.telephone.includes(search)
    )
  }

  if (filters.status) {
    filtered = filtered.filter(call => call.statut === filters.status)
  }

  return filtered
})

const paginatedCalls = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredCalls.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredCalls.value.length / itemsPerPage.value)
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
  return Math.min(startIndex.value + itemsPerPage.value, filteredCalls.value.length)
})

// Méthodes
const loadCalls = async () => {
  isLoading.value = true
  try {
    // Simulation d'un appel API
    await new Promise(resolve => setTimeout(resolve, 500))
    // Ici vous pourriez appeler votre vraie API
  } catch (error) {
    console.error('Erreur lors du chargement des appels:', error)
  } finally {
    isLoading.value = false
  }
}

const refreshData = () => {
  loadCalls()
}

const exportData = () => {
  // Logique d'export
  console.log('Export des données')
}

const clearFilters = () => {
  filters.search = ''
  filters.status = ''
  filters.fromDate = ''
  filters.toDate = ''
  currentPage.value = 1
}

const debouncedSearch = () => {
  // Logique de recherche avec debounce
  currentPage.value = 1
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

// Lifecycle
onMounted(() => {
  loadCalls()
})
</script> 
