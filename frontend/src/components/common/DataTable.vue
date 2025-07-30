<template>
  <div class="data-table-container">
    <!-- En-tête du tableau -->
    <div v-if="showTotal || showExport" class="flex items-center justify-between mb-6">
      <div class="flex items-center space-x-4">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
          {{ title }}
        </h3>
        <span 
          v-if="totalItems !== undefined && showTotal"
          class="px-3 py-1 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full"
        >
          {{ totalItems }} éléments
        </span>
      </div>
      
      <!-- Actions -->
      <div class="flex items-center space-x-3">
        <slot name="actions" />
        
        <!-- Bouton d'export -->
        <button
          v-if="showExport"
          @click="$emit('export')"
          class="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-[#36454F] dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
        >
          <ArrowDownTrayIcon class="w-4 h-4 mr-2" />
          Exporter
        </button>
      </div>
    </div>

    <!-- Filtres et recherche -->
    <div v-if="showFilters" class="mb-6">
      <div class="flex flex-wrap items-center gap-4">
        <!-- Recherche -->
        <div class="flex-1 min-w-64">
          <div class="relative">
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              v-model="localSearchQuery"
              type="text"
              :placeholder="searchPlaceholder"
              class="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            />
          </div>
        </div>
        
        <!-- Filtres personnalisés -->
        <slot name="filters" />
        
        <!-- Bouton pour effacer les filtres -->
        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors duration-200"
        >
          <XMarkIcon class="w-4 h-4 mr-1" />
          Effacer
        </button>
      </div>
    </div>

    <!-- Tableau -->
            <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
                     <thead class="bg-slate-50 dark:bg-slate-900/50">
             <tr>
               <!-- Colonne de sélection -->
               <th v-if="showSelection" class="px-6 py-4 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                 <input
                   type="checkbox"
                   :checked="isAllSelected"
                   @change="toggleSelectAll"
                   class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                 />
               </th>
               
               <th
                 v-for="column in columns"
                 :key="column.key"
                 class="px-6 py-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200"
                 :class="column.class"
                 @click="handleSort(column.key)"
               >
                 <div class="flex items-center space-x-1">
                   <span>{{ column.label }}</span>
                   <div v-if="column.sortable !== false" class="flex flex-col">
                     <ChevronUpIcon 
                       class="w-3 h-3 -mb-1"
                       :class="getSortIconClass(column.key, 'asc')"
                     />
                     <ChevronDownIcon 
                       class="w-3 h-3 -mt-1"
                       :class="getSortIconClass(column.key, 'desc')"
                     />
                   </div>
                 </div>
               </th>
               
               <!-- Colonne d'actions -->
               <th v-if="showActions" class="px-6 py-4 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                 Actions
               </th>
             </tr>
           </thead>
          
          <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
                         <tr
               v-for="(item, index) in paginatedData"
               :key="getItemKey(item, index)"
               class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200"
             >
               <!-- Cellule de sélection -->
               <td v-if="showSelection" class="px-6 py-4 text-center">
                 <input
                   type="checkbox"
                   :checked="isItemSelected(item)"
                   @change="toggleItemSelection(item)"
                   class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                 />
               </td>
               
               <td
                 v-for="column in columns"
                 :key="column.key"
                 class="px-6 py-4 text-sm text-slate-900 dark:text-white"
                 :class="column.class"
               >
                <!-- Contenu personnalisé -->
                <slot 
                  :name="`cell-${column.key}`" 
                  :item="item" 
                  :value="getItemValue(item, column.key)"
                  :column="column"
                  :row="item"
                >
                  <!-- Contenu par défaut -->
                  <component
                    v-if="column.component"
                    :is="column.component"
                    :value="getItemValue(item, column.key)"
                    :item="item"
                    :column="column"
                  />
                  <span v-else>
                    {{ formatCellValue(getItemValue(item, column.key), column) }}
                  </span>
                </slot>
              </td>
              
              <!-- Actions -->
              <td v-if="showActions" class="px-6 py-4 text-right text-sm font-medium">
                <slot name="actions" :item="item" :index="index">
                  <div class="flex items-center justify-end space-x-2">
                    <button
                      @click="$emit('edit', item)"
                      class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200"
                    >
                      <PencilIcon class="w-4 h-4" />
                    </button>
                    <button
                      @click="$emit('delete', item)"
                      class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors duration-200"
                    >
                      <TrashIcon class="w-4 h-4" />
                    </button>
                  </div>
                </slot>
              </td>
            </tr>
            
            <!-- État vide -->
            <tr v-if="paginatedData.length === 0">
              <td :colspan="columns.length + (showActions ? 1 : 0)" class="px-6 py-12 text-center">
                <div class="flex flex-col items-center">
                  <InboxIcon class="w-12 h-12 text-slate-400 dark:text-slate-500 mb-4" />
                  <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-2">
                    {{ emptyMessage }}
                  </h3>
                  <p class="text-slate-500 dark:text-slate-400">
                    {{ emptyDescription }}
                  </p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="showPagination && totalPages > 1" class="mt-6 flex items-center justify-between">
      <div class="flex items-center text-sm text-slate-700 dark:text-slate-300">
        <span>
          Affichage de {{ startIndex + 1 }} à {{ endIndex }} sur {{ totalItems }} résultats
        </span>
      </div>
      
      <div class="flex items-center space-x-2">
        <button
          @click="goToPage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 bg-[#36454F] dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <ChevronLeftIcon class="w-4 h-4" />
          Précédent
        </button>
        
        <div class="flex items-center space-x-1">
          <button
            v-for="page in visiblePages"
            :key="page"
            @click="goToPage(page)"
            :class="[
              'px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200',
              page === currentPage
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 dark:text-slate-300 bg-[#36454F] dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
            ]"
          >
            {{ page }}
          </button>
        </div>
        
        <button
          @click="goToPage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 bg-[#36454F] dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          Suivant
          <ChevronRightIcon class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  MagnifyingGlassIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  InboxIcon,
  ArrowDownTrayIcon
} from '@heroicons/vue/24/outline'

interface Column {
  key: string
  label: string
  sortable?: boolean
  class?: string
  component?: any
  formatter?: (value: any) => string
}

interface Props {
  title?: string
  columns: Column[]
  data: any[]
  searchQuery?: string
  searchPlaceholder?: string
  showFilters?: boolean
  showActions?: boolean
  showPagination?: boolean
  showExport?: boolean
  showTotal?: boolean
  showSelection?: boolean
  selectedItems?: Set<any>
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  emptyMessage?: string
  emptyDescription?: string
  itemKey?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Données',
  searchPlaceholder: 'Rechercher...',
  showFilters: true,
  showActions: true,
  showPagination: true,
  showExport: false,
  showTotal: true,
  showSelection: false,
  selectedItems: () => new Set(),
  pageSize: 10,
  sortBy: '',
  sortOrder: 'asc',
  emptyMessage: 'Aucune donnée',
  emptyDescription: 'Aucun élément trouvé avec les critères actuels.',
  itemKey: 'id'
})

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'sort': [key: string, order: 'asc' | 'desc']
  'page-change': [page: number]
  'edit': [item: any]
  'delete': [item: any]
  'export': []
  'select': [item: any]
  'deselect': [item: any]
}>()

// State local
const currentPage = ref(1)
const localSearchQuery = ref(props.searchQuery || '')
const localSortBy = ref(props.sortBy)
const localSortOrder = ref(props.sortOrder)

// Computed
const filteredData = computed(() => {
  console.log('🔍 DataTable: Calcul des données filtrées...')
  console.log('📊 props.data:', props.data)
  console.log('📊 props.data type:', typeof props.data)
  console.log('📊 props.data isArray:', Array.isArray(props.data))
  
  // S'assurer que props.data est un tableau
  if (!Array.isArray(props.data)) {
    console.warn('DataTable: data prop is not an array:', props.data)
    return []
  }

  let filtered = props.data.filter(item => {
    // Vérifier que chaque item est valide
    const isValid = item && typeof item === 'object'
    if (!isValid) {
      console.warn('DataTable: Invalid item in data:', item)
    }
    return isValid
  })

  console.log(`✅ ${filtered.length} items valides après filtrage initial`)

  // Filtre par recherche
  if (localSearchQuery.value) {
    const query = localSearchQuery.value.toLowerCase()
    const beforeSearch = filtered.length
    filtered = filtered.filter(item => {
      return Object.values(item).some(value => {
        if (value == null) return false
        return String(value).toLowerCase().includes(query)
      })
    })
    console.log(`🔍 Filtre recherche: ${beforeSearch} → ${filtered.length} items`)
  }

  console.log(`✅ ${filtered.length} items filtrés finaux`)
  return filtered
})

const sortedData = computed(() => {
  if (!localSortBy.value) {
    console.log('🔍 Pas de tri appliqué')
    return filteredData.value
  }

  console.log('🔍 Tri appliqué:', {
    sortBy: localSortBy.value,
    sortOrder: localSortOrder.value
  })

  return [...filteredData.value].sort((a, b) => {
    const aValue = getItemValue(a, localSortBy.value!)
    const bValue = getItemValue(b, localSortBy.value!)

    console.log('🔍 Comparaison:', {
      aValue,
      bValue,
      sortOrder: localSortOrder.value
    })

    if (aValue < bValue) return localSortOrder.value === 'asc' ? -1 : 1
    if (aValue > bValue) return localSortOrder.value === 'asc' ? 1 : -1
    return 0
  })
})

const totalItems = computed(() => sortedData.value.length)
const totalPages = computed(() => Math.ceil(totalItems.value / props.pageSize))

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize
  const end = start + props.pageSize
  const paginated = sortedData.value.slice(start, end)
  
  console.log('📄 Pagination:', {
    currentPage: currentPage.value,
    pageSize: props.pageSize,
    start,
    end,
    totalItems: sortedData.value.length,
    paginatedItems: paginated.length
  })
  
  return paginated
})

const startIndex = computed(() => (currentPage.value - 1) * props.pageSize)
const endIndex = computed(() => Math.min(startIndex.value + props.pageSize, totalItems.value))

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

const hasActiveFilters = computed(() => {
  return localSearchQuery.value.length > 0
})

// Gestion de la sélection
const isAllSelected = computed(() => {
  if (!props.showSelection || paginatedData.value.length === 0) return false
  return paginatedData.value.every(item => props.selectedItems.has(getItemKey(item, 0)))
})

const isItemSelected = (item: any) => {
  return props.selectedItems.has(getItemKey(item, 0))
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    // Désélectionner tous
    paginatedData.value.forEach(item => {
      emit('deselect', item)
    })
  } else {
    // Sélectionner tous
    paginatedData.value.forEach(item => {
      emit('select', item)
    })
  }
}

const toggleItemSelection = (item: any) => {
  if (isItemSelected(item)) {
    emit('deselect', item)
  } else {
    emit('select', item)
  }
}

// Methods
const getItemKey = (item: any, index: number) => {
  // S'assurer que l'item est valide
  if (!item || typeof item !== 'object') {
    console.warn('DataTable: Invalid item for key generation:', item)
    return `invalid-${index}`
  }
  
  // Essayer d'utiliser la clé spécifiée
  if (props.itemKey && item[props.itemKey] !== undefined) {
    return item[props.itemKey]
  }
  
  // Fallback sur l'index
  return `item-${index}`
}

const getItemValue = (item: any, key: string) => {
  // S'assurer que l'item est valide
  if (!item || typeof item !== 'object') {
    console.warn('DataTable: Invalid item for value extraction:', item)
    return null
  }
  
  // S'assurer que la clé est valide
  if (!key || typeof key !== 'string') {
    console.warn('DataTable: Invalid key for value extraction:', key)
    return null
  }
  
  return key.split('.').reduce((obj, k) => obj?.[k], item)
}

const formatCellValue = (value: any, column: Column) => {
  console.log('🔍 formatCellValue:', { value, column: column.key })
  
  if (column.formatter) {
    const formatted = column.formatter(value)
    console.log('✅ Valeur formatée:', formatted)
    return formatted
  }
  
  if (value == null) {
    console.log('⚠️ Valeur null/undefined, retour de "-"')
    return '-'
  }
  
  const stringValue = String(value)
  console.log('✅ Valeur convertie en string:', stringValue)
  return stringValue
}

const handleSort = (key: string) => {
  console.log('🔍 Tri demandé pour la clé:', key)
  
  if (localSortBy.value === key) {
    localSortOrder.value = localSortOrder.value === 'asc' ? 'desc' : 'asc'
    console.log('🔄 Ordre de tri inversé:', localSortOrder.value)
  } else {
    localSortBy.value = key
    localSortOrder.value = 'asc'
    console.log('🆕 Nouvelle clé de tri:', key)
  }
  
  emit('sort', key, localSortOrder.value)
  currentPage.value = 1
}

const getSortIconClass = (key: string, order: 'asc' | 'desc') => {
  if (localSortBy.value !== key) {
    return 'text-slate-300 dark:text-slate-600'
  }
  
  if (localSortOrder.value === order) {
    return 'text-blue-600 dark:text-blue-400'
  }
  
  return 'text-slate-300 dark:text-slate-600'
}

const goToPage = (page: number) => {
  console.log('📄 Navigation vers la page:', page)
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    emit('page-change', page)
    console.log('✅ Navigation réussie')
  } else {
    console.warn('❌ Page invalide:', page, '(1 à', totalPages.value, ')')
  }
}

const clearFilters = () => {
  console.log('🧹 Effacement des filtres')
  localSearchQuery.value = ''
  currentPage.value = 1
  emit('update:searchQuery', '')
  console.log('✅ Filtres effacés')
}

// Watchers
watch(localSearchQuery, (newValue) => {
  console.log('🔍 localSearchQuery changé:', newValue)
  emit('update:searchQuery', newValue)
  currentPage.value = 1
})

watch(() => props.searchQuery, (newValue) => {
  console.log('🔍 props.searchQuery changé:', newValue)
  if (newValue !== undefined) {
    localSearchQuery.value = newValue
  }
})

watch(() => props.sortBy, (newValue) => {
  console.log('🔍 props.sortBy changé:', newValue)
  if (newValue !== undefined) {
    localSortBy.value = newValue
  }
})

watch(() => props.sortOrder, (newValue) => {
  console.log('🔍 props.sortOrder changé:', newValue)
  if (newValue !== undefined) {
    localSortOrder.value = newValue
  }
})

// Reset pagination when data changes
watch(() => props.data, (newData) => {
  console.log('📊 props.data changé:', newData?.length, 'items')
  currentPage.value = 1
})
</script>

<style scoped>
.data-table-container {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scrollbar personnalisée pour le tableau */
.overflow-x-auto::-webkit-scrollbar {
  height: 6px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.3);
  border-radius: 3px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.5);
}

.dark .overflow-x-auto::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.2);
}

.dark .overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.4);
}
</style> 
