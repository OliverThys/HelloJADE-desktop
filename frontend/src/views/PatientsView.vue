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
           <div class="flex items-center space-x-3">
             <button
               v-if="!patientsStore.isSelectionMode"
               @click="startExportMode"
               class="btn-action-light"
             >
               <ArrowDownTrayIcon class="mr-2 h-4 w-4" />
               Exporter
             </button>
             <div v-else class="flex flex-col space-y-2">
               <!-- Première ligne : Sélection -->
               <div class="flex space-x-2">
                 <button
                   @click="patientsStore.selectAllPatients"
                   class="btn-action-light"
                 >
                   <CheckIcon class="mr-2 h-4 w-4" />
                   Tout sélectionner
                 </button>
                 <button
                   @click="patientsStore.deselectAllPatients"
                   class="btn-action-light"
                 >
                   <XMarkIcon class="mr-2 h-4 w-4" />
                   Tout désélectionner
                 </button>
               </div>
               <!-- Deuxième ligne : Actions -->
               <div class="flex space-x-2">
                                   <button
                    @click="exportSelectedPatients"
                    :disabled="patientsStore.selectedPatients.size === 0"
                    class="btn-action-primary-light disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowDownTrayIcon class="mr-2 h-4 w-4" />
                    Exporter sélection ({{ patientsStore.selectedPatients.size }})
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
             <button
               @click="showAddPatientModal = true"
               class="btn-action-primary-light"
             >
               <PlusIcon class="mr-2 h-4 w-4" />
               Nouveau patient
             </button>
           </div>
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

          
        </div>
      </div>

      <!-- Tableau des patients -->
      <div class="table-light">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                     <thead class="bg-gradient-to-r from-gray-50 to-gray-100 dark:bg-slate-900">
             <tr>
                               <th v-if="patientsStore.isSelectionMode" scope="col" class="table-header-light w-12">
                  <input
                    type="checkbox"
                    :checked="patientsStore.selectedPatients.size === filteredPatients.length && filteredPatients.length > 0"
                    @change="patientsStore.selectedPatients.size === filteredPatients.length ? patientsStore.deselectAllPatients() : patientsStore.selectAllPatients()"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
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
                               <td v-if="patientsStore.isSelectionMode" class="table-cell-light">
                  <input
                    type="checkbox"
                    :checked="patientsStore.selectedPatients.has(patient.id)"
                    @change="patientsStore.selectedPatients.has(patient.id) ? patientsStore.deselectPatient(patient) : patientsStore.selectPatient(patient)"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
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
               Sélectionnez le format souhaité pour exporter {{ patientsStore.selectedPatients.size }} patient(s)
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
  ChevronRightIcon,
  DocumentArrowDownIcon
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
const showExportFormatModal = ref(false)
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

// Fonction pour démarrer le mode export
const startExportMode = () => {
  patientsStore.startSelectionMode()
}

// Fonction pour annuler le mode export
const cancelExportMode = () => {
  patientsStore.stopSelectionMode()
}

const exportSelectedPatients = () => {
  const selectedPatients = patientsStore.getSelectedPatients()
  if (selectedPatients.length === 0) {
    showNotification('Aucun patient sélectionné', 'warning')
    return
  }
  
  // Afficher le modal de sélection de format
  showExportFormatModal.value = true
}

const exportAsPDF = async () => {
  try {
    const selectedPatients = patientsStore.getSelectedPatients()
    await generatePDFContent(selectedPatients)
    showNotification(`${selectedPatients.length} patients exportés en PDF`, 'success')
    showExportFormatModal.value = false
    cancelExportMode()
  } catch (error) {
    showNotification('Erreur lors de l\'export PDF', 'error')
  }
}

const exportAsCSV = async () => {
  try {
    const selectedPatients = patientsStore.getSelectedPatients()
    const csvContent = generateCSVContent(selectedPatients)
    downloadCSV(csvContent, `patients_selectionnes_${new Date().toISOString().split('T')[0]}.csv`)
    showNotification(`${selectedPatients.length} patients exportés en CSV`, 'success')
    showExportFormatModal.value = false
    cancelExportMode()
  } catch (error) {
    showNotification('Erreur lors de l\'export CSV', 'error')
  }
}

const cancelExportFormat = () => {
  showExportFormatModal.value = false
}

const generateCSVContent = (selectedPatients: any[]) => {
  const headers = [
    'ID', 'Nom', 'Prénom', 'Téléphone', 'Email', 'Service', 'Statut', 'Date création'
  ]
  
  const rows = selectedPatients.map(patient => [
    patient.id,
    patient.nom || '',
    patient.prenom || '',
    patient.telephone || '',
    patient.email || '',
    patient.service || '',
    patient.statut || '',
    formatDate(patient.date_creation) || ''
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

const generatePDFContent = async (selectedPatients: any[]) => {
  try {
    // Importer jsPDF dynamiquement
    const { default: jsPDF } = await import('jspdf')
    const pdf = new jsPDF()
    
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
    pdf.text('HelloJADE - Rapport des Patients', pageWidth / 2, 25, { align: 'center' })
    
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
    if (searchQuery.value) activeFilters.push(`Recherche: "${searchQuery.value}"`)
    if (statusFilter.value) activeFilters.push(`Statut: ${statusFilter.value}`)
    if (serviceFilter.value) activeFilters.push(`Service: ${serviceFilter.value}`)
    
    if (activeFilters.length > 0) {
      pdf.text(`Filtres appliqués: ${activeFilters.join(', ')}`, margin, yPosition)
      yPosition += lineHeight
    }
    
    yPosition += lineHeight
    
    // Statistiques en haut
    const stats = {
      total: selectedPatients.length,
      actif: selectedPatients.filter(p => p.statut === 'actif').length,
      inactif: selectedPatients.filter(p => p.statut === 'inactif').length
    }
    
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Résumé:', margin, yPosition)
    yPosition += lineHeight
    
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`• Total des patients: ${stats.total}`, margin + 5, yPosition)
    yPosition += lineHeight
    pdf.text(`• Patients actifs: ${stats.actif}`, margin + 5, yPosition)
    yPosition += lineHeight
    pdf.text(`• Patients inactifs: ${stats.inactif}`, margin + 5, yPosition)
    
    yPosition += lineHeight * 2
    
    // Tableau des patients avec design amélioré
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    
    // En-tête du tableau avec fond gris
    pdf.setFillColor(245, 245, 245)
    pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 12, 'F')
    
    const headers = ['Patient', 'Téléphone', 'Email', 'Service', 'Statut', 'Date création']
    const columnWidths = [45, 30, 40, 30, 25, 30]
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
    
    selectedPatients.forEach((patient, index) => {
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
      const patientName = `${patient.prenom || ''} ${patient.nom || ''}`.trim()
      pdf.text(patientName.substring(0, 25), xPosition, yPosition)
      xPosition += columnWidths[0]
      
      // Téléphone
      pdf.text(patient.telephone || '-', xPosition, yPosition)
      xPosition += columnWidths[1]
      
      // Email
      pdf.text((patient.email || '-').substring(0, 25), xPosition, yPosition)
      xPosition += columnWidths[2]
      
      // Service
      pdf.text((patient.service || '-').substring(0, 18), xPosition, yPosition)
      xPosition += columnWidths[3]
      
      // Statut avec couleur
      const statusText = patient.statut === 'actif' ? 'Actif' : 'Inactif'
      const statusColor = patient.statut === 'actif' ? { r: 34, g: 197, b: 94 } : { r: 239, g: 68, b: 68 }
      pdf.setTextColor(statusColor.r, statusColor.g, statusColor.b)
      pdf.text(statusText, xPosition, yPosition)
      xPosition += columnWidths[4]
      pdf.setTextColor(0, 0, 0)
      
      // Date création
      const creationDate = formatDate(patient.date_creation) || '-'
      pdf.text(creationDate, xPosition, yPosition)
      
      yPosition += lineHeight
    })
    
    // Pied de page
    yPosition += lineHeight * 2
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'italic')
    pdf.setTextColor(128, 128, 128)
    pdf.text('Document généré automatiquement par HelloJADE', pageWidth / 2, yPosition, { align: 'center' })
    
    // Télécharger le PDF
    const filename = `HelloJADE_Patients_${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(filename)
    
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error)
    throw error
  }
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
