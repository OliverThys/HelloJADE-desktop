   <template>
    <div class="space-y-6 -mx-12">
    <!-- En-tête -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="title-light">Gestion des appels</h1>
        <p class="subtitle-light">Suivi des appels prévus et réalisés post-hospitalisation</p>
      </div>
      
      <!-- Actions -->
      <div class="flex items-center space-x-3">
        <div v-if="!isSelectionMode" class="flex space-x-2">
          <button
            @click="startExportMode"
            class="btn-action-light"
            :disabled="isLoading"
          >
            <ArrowDownTrayIcon class="h-4 w-4 mr-2" />
            Exporter
          </button>
        </div>
        <div v-else class="flex flex-col space-y-2">
          <!-- Première ligne : Sélection -->
          <div class="flex space-x-2">
            <button
              @click="selectAllCalls"
              class="btn-action-light"
            >
              <CheckIcon class="h-4 w-4 mr-2" />
              Tout sélectionner
            </button>
            <button
              @click="deselectAllCalls"
              class="btn-action-light"
            >
              <XMarkIcon class="h-4 w-4 mr-2" />
              Tout désélectionner
            </button>
          </div>
          <!-- Deuxième ligne : Actions -->
          <div class="flex space-x-2">
            <button
              @click="exportSelectedCalls"
              :disabled="selectedCalls.size === 0"
              class="btn-action-primary-light disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowDownTrayIcon class="h-4 w-4 mr-2" />
              Exporter sélection ({{ selectedCalls.size }})
            </button>
            <button
              @click="cancelExportMode"
              class="btn-action-light"
            >
              <XMarkIcon class="h-4 w-4 mr-2" />
              Annuler
            </button>
          </div>
        </div>
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



         <!-- Bandeau de recherche -->
     <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 -mx-16">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Recherche globale -->
        <div class="lg:col-span-2">
          <label class="filter-label-light">
            Recherche
          </label>
          <div class="relative">
            <input
              v-model="filters.search"
              type="text"
              placeholder="Numéro patient, nom, prénom, téléphone..."
              class="filter-input-light pl-10"
              @input="debouncedSearch"
            />
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>

        <!-- Statut -->
        <div>
          <label class="filter-label-light">
            Statut d'appel
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

        <!-- Service -->
        <div>
          <label class="filter-label-light">
            Service
          </label>
          <select
            v-model="filters.service"
            @change="loadCalls"
            class="filter-input-light"
          >
            <option value="">Tous les services</option>
            <option v-for="service in services" :key="service" :value="service">
              {{ service }}
            </option>
          </select>
        </div>
      </div>

      <!-- Filtres de dates -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div>
          <label class="filter-label-light">
            Date de sortie - Début
          </label>
          <input
            v-model="filters.fromDate"
            type="date"
            @change="loadCalls"
            class="filter-input-light"
          />
        </div>
        <div>
          <label class="filter-label-light">
            Date de sortie - Fin
          </label>
          <input
            v-model="filters.toDate"
            type="date"
            @change="loadCalls"
            class="filter-input-light"
          />
        </div>
        <div class="flex items-end">
          <button
            @click="clearFilters"
            class="btn-secondary-light w-full"
          >
            Effacer les filtres
          </button>
        </div>
      </div>
    </div>

                             <!-- Tableau des appels -->
       <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden -mx-16">
        <div class="overflow-x-auto">
                  <table class="w-full divide-y divide-gray-200 table-fixed">
                     <thead class="bg-gray-50">
                         <tr>
              <th v-if="isSelectionMode" class="table-header w-12">
                <input
                  type="checkbox"
                  :checked="selectedCalls.size === calls.length && calls.length > 0"
                  :indeterminate="selectedCalls.size > 0 && selectedCalls.size < calls.length"
                  @change="selectedCalls.size === calls.length ? deselectAllCalls() : selectAllCalls()"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th class="table-header">Nom</th>
              <th class="table-header">Prénom</th>
              <th class="table-header">Date naissance</th>
              <th class="table-header">Téléphone</th>
              <th class="table-header">Date sortie</th>
              <th class="table-header w-32">Appel prévu</th>
              <th class="table-header">Statut</th>
              <th class="table-header">Médecin</th>
              <th class="table-header">Service</th>
              <th class="table-header w-32">Appel réel</th>
              <th class="table-header">Durée</th>
              <th class="table-header">Score</th>
              <th class="table-header">Résumé</th>
              <th class="table-header">Actions</th>
            </tr>
           </thead>
          <tbody class="bg-white divide-y divide-gray-200">
                                     <tr v-for="call in calls" :key="call.id" class="hover:bg-gray-50">
              <td v-if="isSelectionMode" class="table-cell">
                <input
                  type="checkbox"
                  :checked="selectedCalls.has(call.id)"
                  @change="toggleCallSelection(call.id)"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </td>
              <td class="table-cell">{{ call.nom }}</td>
               <td class="table-cell">{{ call.prenom }}</td>
               <td class="table-cell">{{ formatDate(call.date_naissance) }}</td>
               <td class="table-cell font-mono">{{ call.telephone }}</td>
               <td class="table-cell">{{ formatDate(call.date_sortie) }}</td>
                               <td class="table-cell">
                  <div class="flex flex-col">
                    <span class="text-sm">{{ formatDate(call.date_appel_prevue) }}</span>
                    <span class="text-xs text-gray-500">{{ formatTime(call.date_appel_prevue) }}</span>
                  </div>
                </td>
                <td class="table-cell">
                  <StatusBadge :status="call.statut" :attempts="call.nombre_tentatives" />
                </td>
                <td class="table-cell">{{ call.medecin }}</td>
                <td class="table-cell">{{ call.service }}</td>
                <td class="table-cell">
                  <div class="flex flex-col">
                    <span class="text-sm">{{ formatDate(call.date_appel_reelle) }}</span>
                    <span class="text-xs text-gray-500">{{ formatTime(call.date_appel_reelle) }}</span>
                  </div>
                </td>
               <td class="table-cell">{{ formatDuration(call.duree_secondes) }}</td>
               <td class="table-cell">
                 <ScoreBadge :score="call.score" />
               </td>
               <td class="table-cell">
                 <button
                   v-if="call.resume_appel"
                   @click="showCallSummary(call)"
                   class="text-blue-600 hover:text-blue-800 underline text-sm"
                 >
                   Voir résumé
                 </button>
                 <span v-else class="text-gray-400 text-sm">-</span>
               </td>
               <td class="table-cell">
                 <div class="flex items-center space-x-2">
                   <button
                     @click="startCall(call)"
                     class="btn-action-small"
                     :disabled="call.statut === 'called'"
                   >
                     <PhoneIcon class="h-4 w-4" />
                   </button>
                   <button
                     @click="editCall(call)"
                     class="btn-action-small"
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
      <div class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
        <div class="flex items-center justify-between">
          <div class="flex-1 flex justify-between sm:hidden">
            <button
              @click="previousPage"
              :disabled="currentPage === 1"
              class="btn-pagination"
            >
              Précédent
            </button>
            <button
              @click="nextPage"
              :disabled="currentPage >= totalPages"
              class="btn-pagination"
            >
              Suivant
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Affichage de <span class="font-medium">{{ startIndex + 1 }}</span> à 
                <span class="font-medium">{{ endIndex }}</span> sur 
                <span class="font-medium">{{ total }}</span> résultats
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  @click="previousPage"
                  :disabled="currentPage === 1"
                  class="btn-pagination-nav"
                >
                  <ChevronLeftIcon class="h-5 w-5" />
                </button>
                <button
                  v-for="page in visiblePages"
                  :key="page"
                  @click="goToPage(page)"
                  :class="[
                    'btn-pagination-nav',
                    page === currentPage ? 'bg-blue-50 border-blue-500 text-blue-600' : ''
                  ]"
                >
                  {{ page }}
                </button>
                <button
                  @click="nextPage"
                  :disabled="currentPage >= totalPages"
                  class="btn-pagination-nav"
                >
                  <ChevronRightIcon class="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de résumé d'appel -->
    <CallSummaryModal
      v-if="showSummaryModal"
      :call="selectedCall"
      @close="showSummaryModal = false"
      @export-pdf="exportCallSummaryPDF"
    />

    <!-- Modal d'édition d'appel -->
    <CallDetailsModal
      v-if="showEditModal"
      :call="selectedCall"
      @close="showEditModal = false"
      @save="saveCallDetails"
    />

    <!-- Modal de sélection de format d'export -->
    <div v-if="showExportFormatModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3 text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
            <ArrowDownTrayIcon class="h-6 w-6 text-blue-600" />
          </div>
          <h3 class="text-lg font-medium text-gray-900 mt-4 mb-2">
            Choisir le format d'export
          </h3>
          <div class="mt-2 px-7 py-3">
            <p class="text-sm text-gray-500 mb-4">
              Sélectionnez le format souhaité pour exporter {{ selectedCalls.size }} appel(s)
            </p>
            
            <div class="space-y-3">
              <!-- Option PDF -->
              <button
                @click="exportAsPDF"
                class="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div class="flex items-center">
                  <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                    <DocumentArrowDownIcon class="h-5 w-5 text-red-600" />
                  </div>
                  <div class="text-left">
                    <div class="font-medium text-gray-900">PDF</div>
                    <div class="text-sm text-gray-500">Mise en page professionnelle avec statistiques</div>
                  </div>
                </div>
                <ChevronRightIcon class="h-5 w-5 text-gray-400" />
              </button>

              <!-- Option Excel -->
              <button
                @click="exportAsCSV"
                class="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div class="flex items-center">
                  <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <ArrowDownTrayIcon class="h-5 w-5 text-green-600" />
                  </div>
                  <div class="text-left">
                    <div class="font-medium text-gray-900">Excel (CSV)</div>
                    <div class="text-sm text-gray-500">Compatible avec Excel et autres tableurs</div>
                  </div>
                </div>
                <ChevronRightIcon class="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>
          
          <div class="flex justify-center mt-4">
            <button
              @click="cancelExportFormat"
              class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCallsStore } from '@/stores/calls'
import { useToast } from 'vue-toastification'
import { debounce } from 'lodash-es'
import type { Call } from '@/utils/api'
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  PhoneIcon,
  PencilIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentArrowDownIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'
import StatusBadge from '@/components/StatusBadge.vue'
import ScoreBadge from '@/components/ScoreBadge.vue'
import CallSummaryModal from '@/components/CallSummaryModal.vue'
import CallDetailsModal from '@/components/CallDetailsModal.vue'

// Composables
const callsStore = useCallsStore()
const toast = useToast()

// State
const isLoading = ref(false)
const calls = ref<Call[]>([])
const total = ref(0)
const currentPage = ref(1)
const perPage = ref(20)
const showSummaryModal = ref(false)
const showEditModal = ref(false)
const selectedCall = ref(null)
const isSelectionMode = ref(false)
const selectedCalls = ref<Set<number>>(new Set())
const showExportFormatModal = ref(false)

// Filtres
const filters = ref({
  search: '',
  status: '',
  service: '',
  fromDate: '',
  toDate: ''
})

// Services disponibles
const services = ref([])

// Computed
const totalPages = computed(() => Math.ceil(total.value / perPage.value))
const startIndex = computed(() => (currentPage.value - 1) * perPage.value)
const endIndex = computed(() => Math.min(startIndex.value + perPage.value, total.value))

const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// Méthodes
const loadCalls = async () => {
  try {
    isLoading.value = true
    
    const params = {
      page: currentPage.value,
      perPage: perPage.value,
      recherche: filters.value.search,
      statut: filters.value.status,
      service: filters.value.service,
      dateAppelDebut: filters.value.fromDate,
      dateAppelFin: filters.value.toDate
    }
    
    const response = await callsStore.fetchCallsEnhanced(params)
    
    if (response.success) {
      calls.value = response.data.items
      total.value = response.data.total
    } else {
      toast.error('Erreur lors du chargement des appels')
    }
  } catch (error) {
    console.error('Erreur lors du chargement des appels:', error)
    toast.error('Erreur lors du chargement des appels')
  } finally {
    isLoading.value = false
  }
}

const debouncedSearch = debounce(() => {
  currentPage.value = 1
  loadCalls()
}, 300)

const clearFilters = () => {
  filters.value = {
    search: '',
    status: '',
    service: '',
    fromDate: '',
    toDate: ''
  }
  currentPage.value = 1
  loadCalls()
}

const refreshData = () => {
  loadCalls()
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    loadCalls()
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    loadCalls()
  }
}

const goToPage = (page: number) => {
  currentPage.value = page
  loadCalls()
}

const showCallSummary = (call: any) => {
  selectedCall.value = call
  showSummaryModal.value = true
}

const editCall = (call: any) => {
  selectedCall.value = call
  showEditModal.value = true
}

const startCall = async (call: any) => {
  try {
    await callsStore.startCall({
      project_patient_id: call.project_patient_id,
      telephone: call.telephone,
      patient_name: `${call.prenom} ${call.nom}`
    })
    toast.success('Appel démarré')
  } catch (error) {
    toast.error('Erreur lors du démarrage de l\'appel')
  }
}

const saveCallDetails = async (callData: any) => {
  try {
    await callsStore.updateCallStatus(callData.id, callData)
    toast.success('Détails de l\'appel mis à jour')
    showEditModal.value = false
    loadCalls()
  } catch (error) {
    toast.error('Erreur lors de la mise à jour')
  }
}

const exportData = async () => {
  try {
    await callsStore.exportCalls(filters.value)
    toast.success('Export CSV généré')
  } catch (error) {
    toast.error('Erreur lors de l\'export')
  }
}

const exportToPDF = async () => {
  try {
    await callsStore.exportCallsPDF(filters.value)
    toast.success('Export PDF généré')
  } catch (error) {
    toast.error('Erreur lors de l\'export PDF')
  }
}

const exportCallSummaryPDF = async (call: any) => {
  try {
    await callsStore.exportCallSummaryPDF(call.id)
    toast.success('Résumé PDF généré')
  } catch (error) {
    toast.error('Erreur lors de l\'export du résumé')
  }
}

// Méthodes de sélection pour l'export
const startExportMode = () => {
  isSelectionMode.value = true
  selectedCalls.value.clear()
}

const cancelExportMode = () => {
  isSelectionMode.value = false
  selectedCalls.value.clear()
}

const selectAllCalls = () => {
  calls.value.forEach(call => {
    selectedCalls.value.add(call.id)
  })
}

const deselectAllCalls = () => {
  selectedCalls.value.clear()
}

const toggleCallSelection = (callId: number) => {
  if (selectedCalls.value.has(callId)) {
    selectedCalls.value.delete(callId)
  } else {
    selectedCalls.value.add(callId)
  }
}

const exportSelectedCalls = async () => {
  try {
    const selectedCallsArray = Array.from(selectedCalls.value)
    if (selectedCallsArray.length === 0) {
      toast.warning('Aucun appel sélectionné')
      return
    }

    // Afficher le modal de sélection de format
    showExportFormatModal.value = true
  } catch (error) {
    toast.error('Erreur lors de l\'export')
  }
}

const exportAsPDF = async () => {
  try {
    const selectedCallsArray = Array.from(selectedCalls.value)
    await generatePDFContent(selectedCallsArray)
    toast.success(`${selectedCallsArray.length} appels exportés en PDF`)
    showExportFormatModal.value = false
    cancelExportMode()
  } catch (error) {
    toast.error('Erreur lors de l\'export PDF')
  }
}

const exportAsCSV = async () => {
  try {
    const selectedCallsArray = Array.from(selectedCalls.value)
    const csvContent = generateCSVContent(selectedCallsArray)
    downloadCSV(csvContent, `appels_selectionnes_${new Date().toISOString().split('T')[0]}.csv`)
    toast.success(`${selectedCallsArray.length} appels exportés en CSV`)
    showExportFormatModal.value = false
    cancelExportMode()
  } catch (error) {
    toast.error('Erreur lors de l\'export CSV')
  }
}

const cancelExportFormat = () => {
  showExportFormatModal.value = false
}



const generateCSVContent = (callIds: number[]) => {
  const selectedCallsData = calls.value.filter(call => callIds.includes(call.id))
  
  const headers = [
    'ID', 'Nom', 'Prénom', 'Date naissance', 'Téléphone', 'Date sortie',
    'Appel prévu', 'Statut', 'Médecin', 'Service', 'Appel réel', 'Durée', 'Score'
  ]
  
  const rows = selectedCallsData.map(call => [
    call.id,
    call.nom || '',
    call.prenom || '',
    formatDate(call.date_naissance) || '',
    call.telephone || '',
    formatDate(call.date_sortie) || '',
    formatDateTime(call.date_appel_prevue) || '',
    call.statut || '',
    call.medecin || '',
    call.service || '',
    formatDateTime(call.date_appel_reelle) || '',
    formatDuration(call.duree_secondes) || '',
    call.score || ''
  ])
  
  return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
}

const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}



// Générer le contenu PDF
const generatePDFContent = async (callIds: number[]) => {
  try {
    // Importer jsPDF dynamiquement
    const { default: jsPDF } = await import('jspdf')
    const pdf = new jsPDF()
    
    const selectedCallsData = calls.value.filter(call => callIds.includes(call.id))
    
    // Configuration de la page
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 20
    const lineHeight = 7
    let yPosition = margin
    
    // En-tête avec logo et titre
    pdf.setFillColor(59, 130, 246) // Bleu
    pdf.rect(0, 0, pageWidth, 40, 'F')
    
    // Titre principal
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(20)
    pdf.setFont('helvetica', 'bold')
    pdf.text('HelloJADE - Rapport des Appels', pageWidth / 2, 25, { align: 'center' })
    
    // Retour à la couleur normale
    pdf.setTextColor(0, 0, 0)
    yPosition = 50
    
    // Informations de génération
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Rapport généré le: ${new Date().toLocaleString('fr-FR')}`, margin, yPosition)
    yPosition += lineHeight
    
    // Filtres appliqués
    const activeFilters = []
    if (filters.value.search) activeFilters.push(`Recherche: "${filters.value.search}"`)
    if (filters.value.status) activeFilters.push(`Statut: ${getStatusText(filters.value.status)}`)
    if (filters.value.service) activeFilters.push(`Service: ${filters.value.service}`)
    if (filters.value.fromDate || filters.value.toDate) {
      const dateRange = []
      if (filters.value.fromDate) dateRange.push(filters.value.fromDate)
      if (filters.value.toDate) dateRange.push(filters.value.toDate)
      activeFilters.push(`Période: ${dateRange.join(' - ')}`)
    }
    
    if (activeFilters.length > 0) {
      pdf.text(`Filtres appliqués: ${activeFilters.join(', ')}`, margin, yPosition)
      yPosition += lineHeight
    }
    
    yPosition += lineHeight
    
    // Statistiques en haut
    const stats = {
      total: selectedCallsData.length,
      pending: selectedCallsData.filter(c => c.statut === 'pending').length,
      called: selectedCallsData.filter(c => c.statut === 'called').length,
      failed: selectedCallsData.filter(c => c.statut === 'failed').length,
      inProgress: selectedCallsData.filter(c => c.statut === 'in_progress').length
    }
    
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Résumé:', margin, yPosition)
    yPosition += lineHeight
    
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`• Total des appels: ${stats.total}`, margin + 5, yPosition)
    yPosition += lineHeight
    pdf.text(`• À appeler: ${stats.pending}`, margin + 5, yPosition)
    yPosition += lineHeight
    pdf.text(`• Appelés: ${stats.called}`, margin + 5, yPosition)
    yPosition += lineHeight
    pdf.text(`• Échecs: ${stats.failed}`, margin + 5, yPosition)
    yPosition += lineHeight
    pdf.text(`• En cours: ${stats.inProgress}`, margin + 5, yPosition)
    
    yPosition += lineHeight * 2
    
    // Tableau des appels avec design amélioré
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    
    // En-tête du tableau avec fond gris
    pdf.setFillColor(245, 245, 245)
    pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 12, 'F')
    
    const headers = ['Patient', 'Téléphone', 'Service', 'Statut', 'Date appel', 'Score']
    const columnWidths = [45, 30, 30, 25, 30, 20]
    let xPosition = margin + 2
    
    headers.forEach((header, index) => {
      pdf.setTextColor(75, 85, 99) // Gris foncé
      pdf.text(header, xPosition, yPosition)
      xPosition += columnWidths[index]
    })
    
    yPosition += lineHeight + 2
    
    // Lignes de données
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(0, 0, 0)
    
    selectedCallsData.forEach((call, index) => {
      // Vérifier si on doit passer à une nouvelle page
      if (yPosition > pageHeight - margin - 50) {
        pdf.addPage()
        yPosition = margin
      }
      
      // Alternance de couleurs pour les lignes
      if (index % 2 === 0) {
        pdf.setFillColor(250, 250, 250)
        pdf.rect(margin, yPosition - 3, pageWidth - 2 * margin, 10, 'F')
      }
      
      xPosition = margin + 2
      
      // Patient
      const patientName = `${call.prenom || ''} ${call.nom || ''}`.trim()
      pdf.text(patientName.substring(0, 25), xPosition, yPosition)
      xPosition += columnWidths[0]
      
      // Téléphone
      pdf.text(call.telephone || '-', xPosition, yPosition)
      xPosition += columnWidths[1]
      
      // Service
      pdf.text((call.service || '-').substring(0, 18), xPosition, yPosition)
      xPosition += columnWidths[2]
      
      // Statut avec couleur
      const statusText = getStatusText(call.statut)
      const statusColor = getStatusColor(call.statut)
      pdf.setTextColor(statusColor.r, statusColor.g, statusColor.b)
      pdf.text(statusText.substring(0, 12), xPosition, yPosition)
      xPosition += columnWidths[3]
      pdf.setTextColor(0, 0, 0)
      
      // Date appel
      const callDate = formatDate(call.date_appel_prevue) || '-'
      pdf.text(callDate, xPosition, yPosition)
      xPosition += columnWidths[4]
      
      // Score avec couleur
      if (call.score !== null && call.score !== undefined) {
        const scoreColor = getScoreColor(call.score)
        pdf.setTextColor(scoreColor.r, scoreColor.g, scoreColor.b)
        pdf.text(call.score.toString(), xPosition, yPosition)
        pdf.setTextColor(0, 0, 0)
      } else {
        pdf.text('-', xPosition, yPosition)
      }
      
      yPosition += lineHeight
    })
    
    // Pied de page
    yPosition += lineHeight * 2
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'italic')
    pdf.setTextColor(128, 128, 128)
    pdf.text('Document généré automatiquement par HelloJADE', pageWidth / 2, yPosition, { align: 'center' })
    
    // Télécharger le PDF
    const filename = `HelloJADE_Appels_${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(filename)
    
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error)
    toast.error('Erreur lors de la génération du PDF')
  }
}

// Fonction utilitaire pour obtenir le texte du statut
const getStatusText = (status: string) => {
  switch (status) {
    case 'pending': return 'À appeler'
    case 'called': return 'Appelé'
    case 'failed': return 'Échec'
    case 'in_progress': return 'En cours'
    default: return status
  }
}

// Fonction utilitaire pour obtenir la couleur du statut
const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return { r: 245, g: 158, b: 11 } // Jaune
    case 'called': return { r: 34, g: 197, b: 94 }   // Vert
    case 'failed': return { r: 239, g: 68, b: 68 }   // Rouge
    case 'in_progress': return { r: 59, g: 130, b: 246 } // Bleu
    default: return { r: 0, g: 0, b: 0 } // Noir
  }
}

// Fonction utilitaire pour obtenir la couleur du score
const getScoreColor = (score: number) => {
  if (score >= 80) return { r: 34, g: 197, b: 94 }   // Vert
  if (score >= 60) return { r: 245, g: 158, b: 11 } // Jaune
  return { r: 239, g: 68, b: 68 }                   // Rouge
}

 // Utilitaires
 const formatDate = (date: string) => {
   if (!date) return '-'
   return new Date(date).toLocaleDateString('fr-FR')
 }
 
 const formatTime = (date: string) => {
   if (!date) return '-'
   return new Date(date).toLocaleTimeString('fr-FR', { 
     hour: '2-digit', 
     minute: '2-digit' 
   })
 }
 
 const formatDateTime = (date: string) => {
   if (!date) return '-'
   return new Date(date).toLocaleString('fr-FR')
 }
 
 const formatDuration = (duration: number) => {
   if (!duration) return '-'
   const minutes = Math.floor(duration / 60)
   const seconds = duration % 60
   return `${minutes}:${seconds.toString().padStart(2, '0')}`
 }

// Charger les services disponibles
const loadServices = async () => {
  try {
    const servicesData = await callsStore.fetchServices()
    services.value = servicesData
  } catch (error) {
    console.error('Erreur lors du chargement des services:', error)
  }
}



// Lifecycle
onMounted(() => {
  loadCalls()
  loadServices()
})

// Watchers
watch(filters, () => {
  currentPage.value = 1
}, { deep: true })
</script>

 <style scoped>
 .table-header {
   @apply px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider;
 }
 
 .table-cell {
   @apply px-2 py-3 whitespace-nowrap text-sm text-gray-900;
 }
 
 .w-32 {
   width: 8rem;
   min-width: 8rem;
   max-width: 8rem;
 }

.btn-action-small {
  @apply p-1 text-gray-400 hover:text-gray-600 rounded;
}

.btn-pagination {
  @apply relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-pagination-nav {
  @apply relative inline-flex items-center px-4 py-2 border text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary-light {
  @apply px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
}
</style> 
