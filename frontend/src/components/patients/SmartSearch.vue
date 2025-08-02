<template>
  <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-slate-800 dark:text-white">
        Recherche Intelligente
      </h3>
      <div class="flex items-center space-x-2">
        <button
          @click="clearSearch"
          class="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline"
        >
          Effacer
        </button>
      </div>
    </div>

    <!-- Barre de recherche principale -->
    <div class="relative mb-4">
      <MagnifyingGlassIcon class="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
      <input
        v-model="searchQuery"
        @input="handleSearch"
        @focus="showSuggestions = true"
        @blur="handleBlur"
        type="text"
        placeholder="Rechercher par nom, prénom, téléphone, email, numéro de sécurité..."
        class="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm"
      />
      <div v-if="searchQuery" class="absolute right-3 top-1/2 transform -translate-y-1/2">
        <button
          @click="clearSearch"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <XMarkIcon class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Suggestions de recherche -->
    <div v-if="showSuggestions && searchSuggestions.length > 0" class="mb-4">
      <div class="text-sm text-slate-600 dark:text-slate-400 mb-2">
        Suggestions de recherche :
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="suggestion in searchSuggestions"
          :key="suggestion"
          @click="selectSuggestion(suggestion)"
          class="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
        >
          {{ suggestion }}
        </button>
      </div>
    </div>

    <!-- Filtres avancés -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Filtre par âge -->
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Tranche d'âge
        </label>
        <select
          v-model="ageFilter"
          @change="applyFilters"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm"
        >
          <option value="">Toutes les tranches</option>
          <option value="0-18">0-18 ans (Jeunes)</option>
          <option value="19-65">19-65 ans (Adultes)</option>
          <option value="65+">65+ ans (Seniors)</option>
        </select>
      </div>

      <!-- Filtre par statut -->
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Statut
        </label>
        <select
          v-model="statusFilter"
          @change="applyFilters"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="actif">Actif (Données complètes)</option>
          <option value="inactif">Inactif (Données partielles)</option>
          <option value="attente">En attente (Données manquantes)</option>
        </select>
      </div>

      <!-- Tri -->
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Trier par
        </label>
        <select
          v-model="sortBy"
          @change="applyFilters"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm"
        >
          <option value="nom">Nom</option>
          <option value="prenom">Prénom</option>
          <option value="age">Âge</option>
          <option value="date_naissance">Date de naissance</option>
          <option value="created_date">Date d'admission</option>
          <option value="sync_timestamp">Dernière modification</option>
        </select>
      </div>

      <!-- Ordre de tri -->
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Ordre
        </label>
        <div class="flex space-x-2">
          <button
            @click="toggleSortOrder"
            class="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-sm flex items-center justify-center"
          >
            <ArrowUpIcon v-if="sortOrder === 'ASC'" class="h-4 w-4 mr-1" />
            <ArrowDownIcon v-else class="h-4 w-4 mr-1" />
            {{ sortOrder === 'ASC' ? 'Croissant' : 'Décroissant' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Résultats de recherche -->
    <div v-if="searchQuery || ageFilter || statusFilter" class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
      <div class="text-sm text-blue-700 dark:text-blue-300">
        <span class="font-medium">{{ filteredCount }}</span> patient(s) trouvé(s)
        <span v-if="searchQuery" class="ml-2">pour "{{ searchQuery }}"</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  MagnifyingGlassIcon, 
  XMarkIcon, 
  ArrowUpIcon, 
  ArrowDownIcon 
} from '@heroicons/vue/24/outline'

interface Props {
  patients: Array<{
    nom: string
    prenom: string
    telephone?: string
    email?: string
    numero_secu?: string
    age: number
    created_date: string
    sync_timestamp: string
  }>
}

interface Emits {
  (e: 'search-change', filters: {
    query: string
    ageFilter: string
    statusFilter: string
    sortBy: string
    sortOrder: string
  }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// État local
const searchQuery = ref('')
const ageFilter = ref('')
const statusFilter = ref('')
const sortBy = ref('nom')
const sortOrder = ref('ASC')
const showSuggestions = ref(false)

// Suggestions de recherche basées sur les données
const searchSuggestions = computed(() => {
  if (!searchQuery.value || searchQuery.value.length < 2) return []

  const query = searchQuery.value.toLowerCase()
  const suggestions = new Set<string>()

  props.patients.forEach(patient => {
    // Suggestions de noms
    if (patient.nom.toLowerCase().includes(query)) {
      suggestions.add(patient.nom)
    }
    if (patient.prenom.toLowerCase().includes(query)) {
      suggestions.add(patient.prenom)
    }
    
    // Suggestions de numéros
    if (patient.telephone && patient.telephone.includes(query)) {
      suggestions.add(patient.telephone)
    }
    if (patient.numero_secu && patient.numero_secu.includes(query)) {
      suggestions.add(patient.numero_secu)
    }
  })

  return Array.from(suggestions).slice(0, 5)
})

// Nombre de patients filtrés
const filteredCount = computed(() => {
  return props.patients.filter(patient => {
    // Filtre par recherche
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      const searchableText = [
        patient.nom,
        patient.prenom,
        patient.telephone,
        patient.email,
        patient.numero_secu
      ].filter(Boolean).join(' ').toLowerCase()
      
      if (!searchableText.includes(query)) return false
    }

    // Filtre par âge
    if (ageFilter.value) {
      const age = patient.age
      switch (ageFilter.value) {
        case '0-18':
          if (age > 18) return false
          break
        case '19-65':
          if (age <= 18 || age > 65) return false
          break
        case '65+':
          if (age <= 65) return false
          break
      }
    }

    // Filtre par statut
    if (statusFilter.value) {
      const hasCompleteData = patient.telephone && patient.email && patient.adresse && patient.numero_secu
      const hasPartialData = patient.telephone || patient.email || patient.adresse || patient.numero_secu
      
      switch (statusFilter.value) {
        case 'actif':
          if (!hasCompleteData) return false
          break
        case 'inactif':
          if (!hasPartialData || hasCompleteData) return false
          break
        case 'attente':
          if (hasPartialData) return false
          break
      }
    }

    return true
  }).length
})

// Gestionnaires d'événements
const handleSearch = () => {
  applyFilters()
}

const handleBlur = () => {
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

const selectSuggestion = (suggestion: string) => {
  searchQuery.value = suggestion
  applyFilters()
  showSuggestions.value = false
}

const clearSearch = () => {
  searchQuery.value = ''
  ageFilter.value = ''
  statusFilter.value = ''
  applyFilters()
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'ASC' ? 'DESC' : 'ASC'
  applyFilters()
}

const applyFilters = () => {
  emit('search-change', {
    query: searchQuery.value,
    ageFilter: ageFilter.value,
    statusFilter: statusFilter.value,
    sortBy: sortBy.value,
    sortOrder: sortOrder.value
  })
}

// Appliquer les filtres au changement
watch([searchQuery, ageFilter, statusFilter, sortBy, sortOrder], () => {
  applyFilters()
})
</script> 