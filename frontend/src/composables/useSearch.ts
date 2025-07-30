import { ref, computed, watch } from 'vue'

export interface SearchOptions {
  debounceMs?: number
  minLength?: number
  caseSensitive?: boolean
  searchFields?: string[]
}

export function useSearch<T>(
  items: T[],
  options: SearchOptions = {}
) {
  const {
    debounceMs = 300,
    minLength = 2,
    caseSensitive = false,
    searchFields = []
  } = options

  const searchQuery = ref('')
  const debouncedQuery = ref('')
  const isSearching = ref(false)
  const searchResults = ref<T[]>([])
  const searchHistory = ref<string[]>([])

  let debounceTimer: NodeJS.Timeout | null = null

  // Fonction de recherche générique
  const searchInItem = (item: T, query: string): boolean => {
    if (!query || query.length < minLength) return true

    const searchTerm = caseSensitive ? query : query.toLowerCase()

    // Si des champs spécifiques sont définis, chercher seulement dans ces champs
    if (searchFields.length > 0) {
      return searchFields.some(field => {
        const value = (item as any)[field]
        if (value == null) return false
        
        const stringValue = String(value)
        const searchValue = caseSensitive ? stringValue : stringValue.toLowerCase()
        return searchValue.includes(searchTerm)
      })
    }

    // Sinon, chercher dans tous les champs de l'objet
    return Object.values(item).some(value => {
      if (value == null) return false
      
      const stringValue = String(value)
      const searchValue = caseSensitive ? stringValue : stringValue.toLowerCase()
      return searchValue.includes(searchTerm)
    })
  }

  // Fonction de recherche avec debouncing
  const performSearch = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    debounceTimer = setTimeout(() => {
      isSearching.value = true
      debouncedQuery.value = searchQuery.value

      if (searchQuery.value.length >= minLength) {
        searchResults.value = items.filter(item => 
          searchInItem(item, searchQuery.value)
        )
        
        // Ajouter à l'historique si pas déjà présent
        if (!searchHistory.value.includes(searchQuery.value)) {
          searchHistory.value.unshift(searchQuery.value)
          // Garder seulement les 10 dernières recherches
          if (searchHistory.value.length > 10) {
            searchHistory.value = searchHistory.value.slice(0, 10)
          }
        }
      } else {
        searchResults.value = items
      }

      isSearching.value = false
    }, debounceMs)
  }

  // Fonction de recherche immédiate (sans debouncing)
  const searchImmediate = (query: string) => {
    searchQuery.value = query
    debouncedQuery.value = query
    isSearching.value = true

    if (query.length >= minLength) {
      searchResults.value = items.filter(item => 
        searchInItem(item, query)
      )
    } else {
      searchResults.value = items
    }

    isSearching.value = false
  }

  // Fonction de recherche avancée avec plusieurs termes
  const searchAdvanced = (queries: string[]) => {
    isSearching.value = true

    searchResults.value = items.filter(item => {
      return queries.every(query => {
        if (query.length < minLength) return true
        return searchInItem(item, query)
      })
    })

    isSearching.value = false
  }

  // Fonction de recherche par regex
  const searchRegex = (pattern: string) => {
    try {
      const regex = new RegExp(pattern, caseSensitive ? '' : 'i')
      isSearching.value = true

      searchResults.value = items.filter(item => {
        return Object.values(item).some(value => {
          if (value == null) return false
          return regex.test(String(value))
        })
      })

      isSearching.value = false
    } catch (error) {
      console.error('Regex invalide:', error)
      searchResults.value = items
    }
  }

  // Fonction de recherche avec filtres
  const searchWithFilters = (
    query: string,
    filters: Record<string, any>
  ) => {
    isSearching.value = true

    let filteredItems = items

    // Appliquer les filtres
    Object.entries(filters).forEach(([field, value]) => {
      if (value != null && value !== '') {
        filteredItems = filteredItems.filter(item => {
          const itemValue = (item as any)[field]
          if (Array.isArray(value)) {
            return value.includes(itemValue)
          }
          return itemValue === value
        })
      }
    })

    // Appliquer la recherche
    if (query.length >= minLength) {
      searchResults.value = filteredItems.filter(item => 
        searchInItem(item, query)
      )
    } else {
      searchResults.value = filteredItems
    }

    isSearching.value = false
  }

  // Fonction de recherche avec tri
  const searchWithSort = (
    query: string,
    sortField: string,
    sortOrder: 'asc' | 'desc' = 'asc'
  ) => {
    searchImmediate(query)
    
    searchResults.value.sort((a, b) => {
      const aValue = (a as any)[sortField]
      const bValue = (b as any)[sortField]
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }

  // Fonction de recherche avec pagination
  const searchWithPagination = (
    query: string,
    page: number,
    pageSize: number
  ) => {
    searchImmediate(query)
    
    const start = (page - 1) * pageSize
    const end = start + pageSize
    
    return {
      items: searchResults.value.slice(start, end),
      total: searchResults.value.length,
      page,
      pageSize,
      totalPages: Math.ceil(searchResults.value.length / pageSize)
    }
  }

  // Fonction de recherche avec highlight
  const searchWithHighlight = (query: string) => {
    searchImmediate(query)
    
    return searchResults.value.map(item => {
      const highlightedItem = { ...item }
      
      Object.keys(highlightedItem).forEach(key => {
        const value = (highlightedItem as any)[key]
        if (typeof value === 'string' && query.length >= minLength) {
          const searchTerm = caseSensitive ? query : query.toLowerCase()
          const stringValue = caseSensitive ? value : value.toLowerCase()
          
          if (stringValue.includes(searchTerm)) {
            const regex = new RegExp(`(${query})`, caseSensitive ? 'g' : 'gi')
            (highlightedItem as any)[key] = value.replace(regex, '<mark>$1</mark>')
          }
        }
      })
      
      return highlightedItem
    })
  }

  // Fonction de nettoyage
  const clearSearch = () => {
    searchQuery.value = ''
    debouncedQuery.value = ''
    searchResults.value = items
    isSearching.value = false
  }

  // Fonction de suppression de l'historique
  const clearHistory = () => {
    searchHistory.value = []
  }

  // Fonction de suppression d'un élément de l'historique
  const removeFromHistory = (query: string) => {
    searchHistory.value = searchHistory.value.filter(q => q !== query)
  }

  // Computed properties
  const hasResults = computed(() => searchResults.value.length > 0)
  const resultCount = computed(() => searchResults.value.length)
  const isEmpty = computed(() => searchQuery.value.length === 0)
  const isSearchingNow = computed(() => isSearching.value)

  // Watchers
  watch(searchQuery, performSearch)
  watch(items, () => {
    if (searchQuery.value.length >= minLength) {
      performSearch()
    } else {
      searchResults.value = items
    }
  })

  return {
    // State
    searchQuery,
    debouncedQuery,
    isSearching,
    searchResults,
    searchHistory,

    // Computed
    hasResults,
    resultCount,
    isEmpty,
    isSearchingNow,

    // Actions
    performSearch,
    searchImmediate,
    searchAdvanced,
    searchRegex,
    searchWithFilters,
    searchWithSort,
    searchWithPagination,
    searchWithHighlight,
    clearSearch,
    clearHistory,
    removeFromHistory
  }
} 