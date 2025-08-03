<template>
  <div class="calls-container">
    <!-- En-tête avec filtres -->
    <CallsHeader 
      @filter="handleFilter"
    />

    <!-- Tableau des appels -->
    <CallsTable
      :calls="calls"
      :pagination="pagination"
      :sort-by="sortBy"
      :sort-order="sortOrder"
      @sort="handleSort"
      @page-change="handlePageChange"
      @call-started="handleCallStarted"
      @view-summary="handleViewSummary"
      @report-issue="handleReportIssue"
    />

    <!-- Modal résumé d'appel -->
    <CallSummaryModal
      :is-open="summaryModalOpen"
      :call="selectedCall"
      @close="closeSummaryModal"
    />

    <!-- Modal signalement problème -->
    <IssueReportModal
      :is-open="issueModalOpen"
      :call="selectedCall"
      @close="closeIssueModal"
      @issue-reported="handleIssueReported"
    />

    <!-- Indicateur de chargement -->
    <div v-if="isLoading" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-xl">
        <div class="flex items-center space-x-3">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span class="text-gray-700">Chargement des appels...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useCallsStore } from '@/stores/calls'
import CallsHeader from '@/components/calls/CallsHeader.vue'
import CallsTable from '@/components/calls/CallsTable.vue'
import CallSummaryModal from '@/components/calls/CallSummaryModal.vue'
import IssueReportModal from '@/components/calls/IssueReportModal.vue'
import type { CallFilters, Call } from '@/utils/api'

const callsStore = useCallsStore()

// État local
const isLoading = ref(false)
const sortBy = ref('date_heure_prevue')
const sortOrder = ref<'ASC' | 'DESC'>('DESC')
const summaryModalOpen = ref(false)
const issueModalOpen = ref(false)
const selectedCall = ref<Call | null>(null)

// Filtres actuels
const currentFilters = reactive<CallFilters>({
  page: 1,
  limit: 50,
  sort_by: 'date_heure_prevue',
  sort_order: 'DESC'
})

// Computed
const calls = computed(() => callsStore.calls)
const pagination = computed(() => callsStore.pagination)
const isStoreLoading = computed(() => callsStore.isLoading)

// Méthodes
const handleFilter = async (filters: CallFilters, forceRefresh = false) => {
  try {
    isLoading.value = true
    
    // Mettre à jour les filtres
    Object.assign(currentFilters, filters)
    
    // Charger les appels
    await callsStore.fetchCalls(currentFilters, forceRefresh)
  } catch (error) {
    console.error('Erreur lors du filtrage:', error)
  } finally {
    isLoading.value = false
  }
}

const handleSort = (key: string) => {
  if (sortBy.value === key) {
    sortOrder.value = sortOrder.value === 'ASC' ? 'DESC' : 'ASC'
  } else {
    sortBy.value = key
    sortOrder.value = 'ASC'
  }
  
  currentFilters.sort_by = key
  currentFilters.sort_order = sortOrder.value
  
  handleFilter(currentFilters)
}

const handlePageChange = (page: number) => {
  currentFilters.page = page
  handleFilter(currentFilters)
}

const handleCallStarted = (id: number) => {
  console.log('Appel démarré:', id)
  // Optionnel : rafraîchir les données après un délai
  setTimeout(() => {
    handleFilter(currentFilters, true)
  }, 3000)
}

const handleViewSummary = (call: Call) => {
  selectedCall.value = call
  summaryModalOpen.value = true
}

const closeSummaryModal = () => {
  summaryModalOpen.value = false
  selectedCall.value = null
}

const handleReportIssue = (id: number) => {
  // Trouver l'appel correspondant
  const call = calls.value.find(c => c.id === id)
  if (call) {
    selectedCall.value = call
    issueModalOpen.value = true
  }
}

const closeIssueModal = () => {
  issueModalOpen.value = false
  selectedCall.value = null
}

const handleIssueReported = (issueId: number) => {
  console.log('Problème signalé:', issueId)
  // Optionnel : rafraîchir les données
  handleFilter(currentFilters, true)
}

// Lifecycle
onMounted(async () => {
  await handleFilter(currentFilters)
})

// Watchers
watch(isStoreLoading, (loading) => {
  if (!loading) {
    isLoading.value = false
  }
})
</script>

<style scoped>
.calls-container {
  @apply p-6;
}
</style> 
