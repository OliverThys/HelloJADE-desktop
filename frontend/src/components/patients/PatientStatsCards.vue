<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <!-- Carte Total Patients -->
    <div 
      @click="filterByStatus('all')"
      :class="[
        'bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105',
        activeFilter === 'all' ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
      ]"
    >
      <div class="flex items-center">
        <div class="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
          <UsersIcon class="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Total Patients</p>
          <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ stats.total }}</p>
        </div>
      </div>
    </div>

    <!-- Carte Jeunes (0-18 ans) -->
    <div 
      @click="filterByAgeGroup('jeunes')"
      :class="[
        'bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105',
        activeFilter === 'jeunes' ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20' : ''
      ]"
    >
      <div class="flex items-center">
        <div class="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
          <UserIcon class="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Jeunes (0-18)</p>
          <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ stats.jeunes }}</p>
          <p class="text-xs text-slate-500 dark:text-slate-400">{{ ((stats.jeunes / stats.total) * 100).toFixed(1) }}%</p>
        </div>
      </div>
    </div>

    <!-- Carte Adultes (19-65 ans) -->
    <div 
      @click="filterByAgeGroup('adultes')"
      :class="[
        'bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105',
        activeFilter === 'adultes' ? 'ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-900/20' : ''
      ]"
    >
      <div class="flex items-center">
        <div class="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
          <UserIcon class="h-6 w-6 text-orange-600 dark:text-orange-400" />
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Adultes (19-65)</p>
          <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ stats.adultes }}</p>
          <p class="text-xs text-slate-500 dark:text-slate-400">{{ ((stats.adultes / stats.total) * 100).toFixed(1) }}%</p>
        </div>
      </div>
    </div>

    <!-- Carte Seniors (65+ ans) -->
    <div 
      @click="filterByAgeGroup('seniors')"
      :class="[
        'bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105',
        activeFilter === 'seniors' ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/20' : ''
      ]"
    >
      <div class="flex items-center">
        <div class="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
          <UserIcon class="h-6 w-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Seniors (65+)</p>
          <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ stats.seniors }}</p>
          <p class="text-xs text-slate-500 dark:text-slate-400">{{ ((stats.seniors / stats.total) * 100).toFixed(1) }}%</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Cartes de statut -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <!-- Patients Actifs -->
    <div 
      @click="filterByStatus('actif')"
      :class="[
        'bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105',
        activeFilter === 'actif' ? 'ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : ''
      ]"
    >
      <div class="flex items-center">
        <div class="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
          <CheckCircleIcon class="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Patients Actifs</p>
          <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ stats.actifs }}</p>
          <p class="text-xs text-slate-500 dark:text-slate-400">Données complètes</p>
        </div>
      </div>
    </div>

    <!-- Patients Inactifs -->
    <div 
      @click="filterByStatus('inactif')"
      :class="[
        'bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105',
        activeFilter === 'inactif' ? 'ring-2 ring-gray-500 bg-gray-50 dark:bg-gray-900/20' : ''
      ]"
    >
      <div class="flex items-center">
        <div class="p-2 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
          <ClockIcon class="h-6 w-6 text-gray-600 dark:text-gray-400" />
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Patients Inactifs</p>
          <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ stats.inactifs }}</p>
          <p class="text-xs text-slate-500 dark:text-slate-400">Données partielles</p>
        </div>
      </div>
    </div>

    <!-- Patients en Attente -->
    <div 
      @click="filterByStatus('attente')"
      :class="[
        'bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105',
        activeFilter === 'attente' ? 'ring-2 ring-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : ''
      ]"
    >
      <div class="flex items-center">
        <div class="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
          <ExclamationTriangleIcon class="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-slate-600 dark:text-slate-400">En Attente</p>
          <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ stats.attente }}</p>
          <p class="text-xs text-slate-500 dark:text-slate-400">Données manquantes</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  UsersIcon, 
  UserIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/vue/24/outline'

interface Props {
  patients: Array<{
    age: number
    telephone?: string
    email?: string
    adresse?: string
    numero_secu?: string
  }>
  activeFilter: string
}

interface Emits {
  (e: 'filter-change', filter: { type: string, value: any }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Calculer les statistiques
const stats = computed(() => {
  const total = props.patients.length
  
  // Par tranche d'âge
  const jeunes = props.patients.filter(p => p.age <= 18).length
  const adultes = props.patients.filter(p => p.age > 18 && p.age <= 65).length
  const seniors = props.patients.filter(p => p.age > 65).length

  // Par statut (basé sur la complétude des données)
  const actifs = props.patients.filter(p => 
    p.telephone && p.email && p.adresse && p.numero_secu
  ).length
  
  const inactifs = props.patients.filter(p => 
    (p.telephone || p.email || p.adresse || p.numero_secu) && 
    !(p.telephone && p.email && p.adresse && p.numero_secu)
  ).length
  
  const attente = props.patients.filter(p => 
    !p.telephone && !p.email && !p.adresse && !p.numero_secu
  ).length

  return {
    total,
    jeunes,
    adultes,
    seniors,
    actifs,
    inactifs,
    attente
  }
})

// Fonctions de filtrage
const filterByAgeGroup = (group: string) => {
  let minAge = 0
  let maxAge = 120

  switch (group) {
    case 'jeunes':
      maxAge = 18
      break
    case 'adultes':
      minAge = 19
      maxAge = 65
      break
    case 'seniors':
      minAge = 66
      break
  }

  emit('filter-change', {
    type: 'age',
    value: { minAge, maxAge, group }
  })
}

const filterByStatus = (status: string) => {
  emit('filter-change', {
    type: 'status',
    value: status
  })
}
</script> 