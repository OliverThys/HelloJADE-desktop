<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
      <!-- En-tête du modal -->
      <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold text-slate-900 dark:text-white">
            Exporter les Patients
          </h2>
          <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Sélectionnez les patients à exporter et choisissez le format
          </p>
        </div>
        <button
          @click="$emit('close')"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <XMarkIcon class="h-6 w-6" />
        </button>
      </div>

      <!-- Contenu principal -->
      <div class="flex flex-col h-full">
        <!-- Barre d'outils de sélection -->
        <div class="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <!-- Sélectionner tout -->
              <button
                @click="toggleSelectAll"
                class="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600 rounded-lg border border-gray-300 dark:border-slate-600 transition-colors duration-200"
              >
                <CheckIcon v-if="isAllSelected" class="h-4 w-4 text-blue-600" />
                <Square2StackIcon v-else class="h-4 w-4" />
                <span>{{ isAllSelected ? 'Désélectionner tout' : 'Sélectionner tout' }}</span>
              </button>

              <!-- Compteur de sélection -->
              <div class="text-sm text-slate-600 dark:text-slate-400">
                {{ selectedPatients.length }} patient{{ selectedPatients.length > 1 ? 's' : '' }} sélectionné{{ selectedPatients.length > 1 ? 's' : '' }}
              </div>
            </div>

                         <!-- Filtres rapides et sélection de format -->
             <div class="flex items-center space-x-3">
               <select
                 v-model="quickFilter"
                 @change="applyQuickFilter"
                 class="text-sm border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
               >
                                   <option value="">Tous les patients</option>
                  <option value="age_0_25">0-25 ans</option>
                  <option value="age_26_50">26-50 ans</option>
                  <option value="age_51_75">51-75 ans</option>
                  <option value="age_76_plus">76+ ans</option>
               </select>
               
                               <!-- Sélection de format -->
                <div class="flex items-center space-x-2">
                  <span class="text-sm text-slate-600 dark:text-slate-400">Format:</span>
                  <select
                    v-model="selectedFormat"
                    class="text-sm border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[120px]"
                  >
                    <option value="">Choisir...</option>
                    <option value="pdf">PDF</option>
                    <option value="csv">CSV</option>
                  </select>
                  
                  <!-- Bouton de confirmation -->
                  <button
                    @click="confirmExport"
                    :disabled="selectedPatients.length === 0 || selectedFormat === ''"
                    class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center text-sm"
                  >
                    <DocumentArrowDownIcon class="h-4 w-4 mr-1" />
                    Confirmer
                  </button>
                </div>
             </div>
          </div>
        </div>

        <!-- Tableau des patients -->
        <div class="flex-1 overflow-y-auto">
          <div class="px-6 py-4">
            <div class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
              <table class="w-full">
                <thead class="bg-gray-50 dark:bg-slate-700">
                  <tr>
                    <th class="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        :checked="isAllSelected"
                        @change="toggleSelectAll"
                        class="rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                      Patient
                    </th>
                                         <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                       Âge
                     </th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                      Contact
                    </th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                      N° Sécurité
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-slate-700">
                  <tr
                    v-for="patient in filteredPatients"
                    :key="patient.patient_id"
                    class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors duration-200"
                  >
                    <td class="px-4 py-3">
                      <input
                        type="checkbox"
                        :checked="isPatientSelected(patient.patient_id)"
                        @change="togglePatientSelection(patient.patient_id)"
                        class="rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex items-center">
                        <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                          <span class="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                            {{ patient.prenom.charAt(0) }}{{ patient.nom.charAt(0) }}
                          </span>
                        </div>
                        <div class="ml-3">
                          <div class="text-sm font-medium text-slate-900 dark:text-white">
                            {{ patient.prenom }} {{ patient.nom }}
                          </div>
                          <div class="text-sm text-slate-500 dark:text-slate-400">
                            ID: {{ patient.patient_id }}
                          </div>
                        </div>
                      </div>
                    </td>
                                                              <td class="px-4 py-3">
                        <div class="text-sm text-slate-900 dark:text-white">
                          {{ patient.age }} ans
                        </div>
                      </td>
                    <td class="px-4 py-3">
                      <div class="text-sm text-slate-900 dark:text-white">
                        {{ patient.telephone || 'Non renseigné' }}
                      </div>
                      <div class="text-sm text-slate-500 dark:text-slate-400">
                        {{ patient.email || 'Non renseigné' }}
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <div class="text-sm text-slate-900 dark:text-white font-mono">
                        {{ patient.numero_secu || 'Non renseigné' }}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Barre d'actions -->
        <div class="px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
          <div class="flex items-center justify-between">
            <div class="text-sm text-slate-600 dark:text-slate-400">
              {{ selectedPatients.length }} patient{{ selectedPatients.length > 1 ? 's' : '' }} sélectionné{{ selectedPatients.length > 1 ? 's' : '' }}
            </div>
            
                         <div class="flex items-center space-x-3">
               <button
                 @click="$emit('close')"
                 class="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-white dark:hover:bg-slate-600 transition-colors duration-200"
               >
                 Fermer
               </button>
             </div>
          </div>
        </div>
      </div>

             

             <!-- Indicateur de chargement -->
       <div v-if="isExporting" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
        <div class="bg-white dark:bg-slate-800 rounded-xl p-6 flex items-center space-x-4">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <div>
            <div class="font-medium text-slate-900 dark:text-white">Génération en cours...</div>
            <div class="text-sm text-slate-600 dark:text-slate-400">Veuillez patienter</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  XMarkIcon, 
  CheckIcon, 
  Square2StackIcon,
  DocumentArrowDownIcon
} from '@heroicons/vue/24/outline'
import type { Patient } from '@/stores/patients'

interface Props {
  patients: Patient[]
}

interface Emits {
  (e: 'close'): void
  (e: 'export-pdf', patients: Patient[]): void
  (e: 'export-csv', patients: Patient[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const selectedPatientIds = ref<Set<number>>(new Set())
const quickFilter = ref('')
const isExporting = ref(false)
const selectedFormat = ref('')

// Computed
const filteredPatients = computed(() => {
  let patients = props.patients

  // Appliquer le filtre rapide
  if (quickFilter.value) {
    switch (quickFilter.value) {
      case 'age_0_25':
        patients = patients.filter(p => p.age >= 0 && p.age <= 25)
        break
      case 'age_26_50':
        patients = patients.filter(p => p.age >= 26 && p.age <= 50)
        break
      case 'age_51_75':
        patients = patients.filter(p => p.age >= 51 && p.age <= 75)
        break
      case 'age_76_plus':
        patients = patients.filter(p => p.age >= 76)
        break
    }
  }

  return patients
})

const selectedPatients = computed(() => {
  return props.patients.filter(p => selectedPatientIds.value.has(p.patient_id))
})

const isAllSelected = computed(() => {
  if (filteredPatients.value.length === 0) return false
  return filteredPatients.value.every(p => selectedPatientIds.value.has(p.patient_id))
})

// Methods
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    // Désélectionner tous les patients filtrés
    filteredPatients.value.forEach(p => {
      selectedPatientIds.value.delete(p.patient_id)
    })
  } else {
    // Sélectionner tous les patients filtrés
    filteredPatients.value.forEach(p => {
      selectedPatientIds.value.add(p.patient_id)
    })
  }
}

const togglePatientSelection = (patientId: number) => {
  if (selectedPatientIds.value.has(patientId)) {
    selectedPatientIds.value.delete(patientId)
  } else {
    selectedPatientIds.value.add(patientId)
  }
}

const isPatientSelected = (patientId: number) => {
  return selectedPatientIds.value.has(patientId)
}

const applyQuickFilter = () => {
  // Réinitialiser la sélection quand on change de filtre
  selectedPatientIds.value.clear()
}

const confirmExport = async () => {
  if (!selectedFormat.value) return
  
  isExporting.value = true
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulation
    
    if (selectedFormat.value === 'pdf') {
      emit('export-pdf', selectedPatients.value)
    } else if (selectedFormat.value === 'csv') {
      emit('export-csv', selectedPatients.value)
    }
  } finally {
    isExporting.value = false
    selectedFormat.value = '' // Reset selection
  }
}

// Watchers
watch(quickFilter, () => {
  applyQuickFilter()
})
</script> 