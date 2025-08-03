<template>
  <div class="calls-table bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
    <!-- En-tête du tableau -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
        <thead class="bg-gray-50 dark:bg-slate-700">
          <tr>
            <th 
              v-for="column in columns" 
              :key="column.key"
              class="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600"
              @click="handleSort(column.key)"
            >
              <div class="flex items-center space-x-1">
                <span>{{ column.label }}</span>
                <svg v-if="(column.key === 'nom_prenom' && sortBy === 'nom') || sortBy === column.key" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path v-if="sortOrder === 'ASC'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                  <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </th>
            <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-slate-800">
                    <tr v-for="call in calls" :key="`${call.id}-${call.statut_appel}`" :class="[getRowBackgroundClass(call.statut_appel), getRowBorderClass(call.statut_appel)]" class="hover:opacity-80 transition-opacity border-b border-gray-200 dark:border-slate-700">
            <!-- Nom et Prénom -->
            <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
              <div class="flex flex-col">
                <span class="font-medium">{{ call.nom }}</span>
                <span class="text-gray-600 dark:text-slate-400">{{ call.prenom }}</span>
              </div>
            </td>
            
            <!-- Date de naissance -->
            <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
              {{ formatDate(call.date_naissance) }}
            </td>
            
            <!-- Téléphone -->
            <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
              {{ formatPhone(call.telephone) }}
            </td>
            
            <!-- Date de sortie -->
            <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
              {{ call.date_sortie_hospitalisation ? formatDate(call.date_sortie_hospitalisation) : '-' }}
            </td>
            
            <!-- Date et heure prévue -->
            <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
              <div class="flex flex-col">
                <span>{{ formatDate(call.date_heure_prevue) }}</span>
                <span class="text-gray-600 dark:text-slate-400">{{ formatTime(call.date_heure_prevue) }}</span>
              </div>
            </td>
            
            <!-- Statut -->
            <td class="px-3 py-4 whitespace-nowrap">
              <StatusBadge :status="call.statut_appel" />
            </td>
            
            <!-- Médecin -->
            <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
              {{ call.medecin_referent || '-' }}
            </td>
            
            <!-- Service -->
            <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
              {{ call.service_hospitalisation || '-' }}
            </td>
            
            <!-- Date et heure réelle -->
            <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
              <div v-if="call.date_heure_reelle" class="flex flex-col">
                <span>{{ formatDate(call.date_heure_reelle) }}</span>
                <span class="text-gray-600 dark:text-slate-400">{{ formatTime(call.date_heure_reelle) }}</span>
              </div>
              <span v-else class="text-gray-400 dark:text-slate-500">-</span>
            </td>
            
            <!-- Durée -->
            <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
              {{ call.duree_appel ? formatDuration(call.duree_appel) : '-' }}
            </td>
            
            <!-- Résumé -->
            <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
              <button
                v-if="call.resume_appel"
                @click="viewSummary(call)"
                class="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105"
              >
                <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Résumé
              </button>
              <span v-else class="text-gray-400 dark:text-slate-500">-</span>
            </td>
            
            <!-- Score -->
            <td class="px-3 py-4 whitespace-nowrap">
              <ScoreBadge v-if="call.score_calcule !== null" :score="call.score_calcule" />
              <span v-else class="text-gray-400 dark:text-slate-500">-</span>
            </td>
            
            <!-- Actions -->
            <td class="px-3 py-4 whitespace-nowrap text-sm font-medium">
              <div class="flex space-x-2">
                                 <!-- Bouton appel manuel -->
                 <button
                   v-if="call.statut_appel === 'A_APPELER'"
                   @click="startCall(call.id)"
                   :disabled="isStartingCall === call.id"
                   class="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
                   :title="isStartingCall === call.id ? 'Appel en cours...' : 'Démarrer l\'appel'"
                 >
                   <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                   </svg>
                 </button>
                 
                 <!-- Bouton signaler problème -->
                 <button
                   @click="reportIssue(call.id)"
                   class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                   title="Signaler un problème"
                 >
                   <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                   </svg>
                 </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.totalPages > 1" class="bg-white dark:bg-slate-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-slate-700 sm:px-6">
      <div class="flex-1 flex justify-between sm:hidden">
        <button
          @click="changePage((pagination?.page || 1) - 1)"
          :disabled="!pagination || pagination.page <= 1"
          class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 text-sm font-medium rounded-md text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Précédent
        </button>
        <button
          @click="changePage((pagination?.page || 1) + 1)"
          :disabled="!pagination || pagination.page >= pagination.totalPages"
          class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 text-sm font-medium rounded-md text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Suivant
        </button>
      </div>
      <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p class="text-sm text-gray-700 dark:text-slate-300">
            Affichage de <span class="font-medium">{{ pagination ? (pagination.page - 1) * pagination.limit + 1 : 0 }}</span> à 
            <span class="font-medium">{{ pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0 }}</span> sur 
            <span class="font-medium">{{ pagination?.total || 0 }}</span> résultats
          </p>
        </div>
        <div>
          <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            <button
              @click="changePage((pagination?.page || 1) - 1)"
              :disabled="!pagination || pagination.page <= 1"
              class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-medium text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010 1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </button>
            
            <button
              v-for="page in visiblePages"
              :key="page"
              @click="changePage(page)"
              :class="[
                page === (pagination?.page || 1)
                  ? 'z-10 bg-blue-50 dark:bg-blue-900/50 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-600',
                'relative inline-flex items-center px-4 py-2 border text-sm font-medium'
              ]"
            >
              {{ page }}
            </button>
            
            <button
              @click="changePage((pagination?.page || 1) + 1)"
              :disabled="!pagination || pagination.page >= pagination.totalPages"
              class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-medium text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCallsStore } from '@/stores/calls'
import StatusBadge from '@/components/StatusBadge.vue'
import ScoreBadge from '@/components/ScoreBadge.vue'
import type { Call } from '@/utils/api'

const callsStore = useCallsStore()

// Props
const props = defineProps<{
  calls: Call[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  sortBy: string
  sortOrder: 'ASC' | 'DESC'
}>()

// État local
const isStartingCall = ref<number | null>(null)

// Colonnes du tableau
const columns = [
  { key: 'nom_prenom', label: 'Patient' },
  { key: 'date_naissance', label: 'Date naissance' },
  { key: 'telephone', label: 'Téléphone' },
  { key: 'date_sortie_hospitalisation', label: 'Date sortie' },
  { key: 'date_heure_prevue', label: 'Appel prévu' },
  { key: 'statut_appel', label: 'Statut' },
  { key: 'medecin_referent', label: 'Médecin' },
  { key: 'service_hospitalisation', label: 'Service' },
  { key: 'date_heure_reelle', label: 'Appel réel' },
  { key: 'duree_appel', label: 'Durée' },
  { key: 'resume_appel', label: 'Résumé' },
  { key: 'score_calcule', label: 'Score' }
]

// Computed
const visiblePages = computed(() => {
  // Vérification de sécurité pour pagination
  if (!props.pagination) {
    return []
  }
  
  const current = props.pagination.page || 1
  const total = props.pagination.totalPages || 1
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
  
  return rangeWithDots
})

// Méthodes
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR')
}

const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatPhone = (phone: string): string => {
  if (!phone) return '-'
  return phone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')
}

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const getRowBackgroundClass = (status: string): string => {
  console.log('getRowBackgroundClass called with status:', status)
  switch (status) {
    case 'A_APPELER':
      return 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20'
    case 'APPELE':
      return 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
    case 'ECHEC':
      return 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20'
    case 'EN_COURS':
      return 'bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20'
    default:
      return 'bg-white dark:bg-slate-800'
  }
}

const getRowBorderClass = (status: string): string => {
  switch (status) {
    case 'A_APPELER':
      return 'border-l-4 border-orange-400'
    case 'APPELE':
      return 'border-l-4 border-green-400'
    case 'ECHEC':
      return 'border-l-4 border-red-400'
    case 'EN_COURS':
      return 'border-l-4 border-blue-400'
    default:
      return ''
  }
}

const handleSort = (key: string) => {
  // Gérer le tri pour la colonne nom_prenom
  if (key === 'nom_prenom') {
    emit('sort', 'nom') // Trier par nom par défaut
  } else {
    emit('sort', key)
  }
}

const changePage = (page: number) => {
  if (props.pagination && page >= 1 && page <= props.pagination.totalPages) {
    emit('page-change', page)
  }
}

const startCall = async (id: number) => {
  try {
    isStartingCall.value = id
    await callsStore.startCall(id)
    emit('call-started', id)
  } catch (error) {
    console.error('Erreur lors du démarrage de l\'appel:', error)
  } finally {
    isStartingCall.value = null
  }
}

const viewSummary = (call: Call) => {
  emit('view-summary', call)
}

const reportIssue = (id: number) => {
  emit('report-issue', id)
}

// Événements
const emit = defineEmits<{
  sort: [key: string]
  'page-change': [page: number]
  'call-started': [id: number]
  'view-summary': [call: Call]
  'report-issue': [id: number]
}>()
</script> 