<template>
  <div class="card-glass animate-fade-in">
    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Patients Appelés
      </h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
        Suivi post-hospitalisation - {{ recentPatients.length }} patients appelés
      </p>
    </div>

    <div class="p-6">
      <div v-if="loading" class="flex items-center justify-center py-8">
        <div class="relative animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <div v-else-if="recentPatients.length === 0" class="text-center py-8">
        <div class="relative w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <p class="text-gray-500 dark:text-gray-400">Aucun patient appelé</p>
      </div>

      <div v-else class="space-y-4">
        <div 
          v-for="(patient, index) in recentPatients" 
          :key="patient.call_id"
          class="relative p-5 rounded-lg border border-gray-200 dark:border-gray-700 transition-hellojade hover-lift bg-white dark:bg-gray-800"
          :class="getPatientCardClasses(patient)"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          <!-- Badge de statut -->
          <div class="absolute top-4 right-4">
            <span 
              class="px-3 py-1 text-xs font-medium rounded-full"
              :class="getStatusBadgeClasses(patient.statut_color)"
            >
              {{ getStatusLabel(patient.statut) }}
            </span>
          </div>

          <!-- En-tête du patient -->
          <div class="mb-4">
            <h4 class="font-semibold text-gray-900 dark:text-white text-lg mb-1">
              {{ patient.prenom }} {{ patient.nom }}
            </h4>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ patient.service }} • {{ patient.medecin }}
            </p>
          </div>

          <!-- Métriques principales -->
          <div class="grid grid-cols-2 gap-6 mb-4">
            <!-- Score -->
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Score</p>
              <p class="text-lg font-semibold" :class="getScoreColor(patient.score_calcule)">
                {{ patient.score_calcule !== null ? patient.score_calcule + '/100' : 'Non évalué' }}
              </p>
            </div>
            
            <!-- Douleur -->
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Douleur</p>
              <p class="text-lg font-semibold" :class="getDouleurColor(patient.douleur)">
                {{ patient.douleur !== null ? patient.douleur + '/10' : 'Non évalué' }}
              </p>
            </div>
          </div>

          <!-- Informations d'appel -->
          <div class="grid grid-cols-2 gap-6 mb-4">
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Appelé</p>
              <p class="text-sm text-gray-700 dark:text-gray-300">
                {{ patient.temps_appel || 'Non appelé' }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Satisfaction</p>
              <p class="text-sm text-gray-700 dark:text-gray-300">
                {{ patient.satisfaction_score || 'Non évalué' }}
              </p>
            </div>
          </div>

          <!-- État de santé -->
          <div class="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Traitement</p>
              <p class="text-sm font-medium" :class="patient.traitement_suivi !== null ? (patient.traitement_suivi ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400') : 'text-gray-500 dark:text-gray-400'">
                {{ patient.traitement_suivi !== null ? (patient.traitement_suivi ? 'Suivi' : 'Non suivi') : 'Non évalué' }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Transit</p>
              <p class="text-sm font-medium" :class="patient.transit_normal !== null ? (patient.transit_normal ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400') : 'text-gray-500 dark:text-gray-400'">
                {{ patient.transit_normal !== null ? (patient.transit_normal ? 'Normal' : 'Anormal') : 'Non évalué' }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Fièvre</p>
              <p class="text-sm font-medium" :class="patient.fievre !== null ? (patient.fievre ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400') : 'text-gray-500 dark:text-gray-400'">
                {{ patient.fievre !== null ? (patient.fievre ? 'Oui' : 'Non') : 'Non évalué' }}
              </p>
            </div>
          </div>

          <!-- Moral -->
          <div class="mb-4">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Moral</p>
            <p class="text-sm font-semibold" :class="getMoralColor(patient.moral)">
              {{ patient.moral !== null ? patient.moral + '/10' : 'Non évalué' }}
            </p>
          </div>

          <!-- Mots-clés urgents -->
          <div v-if="patient.mots_cles_urgents && patient.mots_cles_urgents.length > 0" class="mb-4">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Mots-clés urgents</p>
            <div class="flex flex-wrap gap-2">
              <span 
                v-for="mot in patient.mots_cles_urgents" 
                :key="mot"
                class="px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 rounded-full"
              >
                {{ mot }}
              </span>
            </div>
          </div>

          <!-- Alerte si présente -->
          <div v-if="patient.alerte_id" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div class="flex items-start">
              <svg class="w-4 h-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p class="text-sm font-medium text-red-800">
                  Score faible ({{ patient.score_calcule }}/100) : {{ patient.raison_alerte }}
                </p>
                <button 
                  @click="viewPatientDetails(patient.patient_id)"
                  class="mt-2 text-sm text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Voir les informations du patient →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDashboardStore, type PatientRecent } from '@/stores/dashboard'

const dashboardStore = useDashboardStore()

const recentPatients = computed(() => dashboardStore.recentPatients)
const loading = computed(() => dashboardStore.loading)

const getPatientCardClasses = (patient: PatientRecent) => {
  const baseClasses = 'border-slate-200 dark:border-slate-700'
  
  if (patient.statut === 'URGENCE') {
    return `${baseClasses} border-red-300 dark:border-red-600 bg-red-50/50 dark:bg-red-900/10`
  } else if (patient.statut === 'ATTENTION') {
    return `${baseClasses} border-orange-300 dark:border-orange-600 bg-orange-50/50 dark:bg-orange-900/10`
  } else if (patient.statut === 'EN_ATTENTE') {
    return `${baseClasses} border-blue-300 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-900/10`
  } else if (patient.statut === 'ECHEC') {
    return `${baseClasses} border-red-300 dark:border-red-600 bg-red-50/50 dark:bg-red-900/10`
  }
  
  return `${baseClasses} bg-slate-50/50 dark:bg-slate-700/50`
}

const getStatusBadgeClasses = (color: string) => {
  switch (color) {
    case 'red':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    case 'orange':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
    case 'blue':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    case 'green':
    default:
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
  }
}

const getStatusGlowColor = (color: string) => {
  switch (color) {
    case 'red':
      return 'bg-red-400'
    case 'orange':
      return 'bg-orange-400'
    case 'blue':
      return 'bg-blue-400'
    case 'green':
    default:
      return 'bg-green-400'
  }
}

const getStatusLabel = (statut: string) => {
  switch (statut) {
    case 'URGENCE':
      return 'Urgence'
    case 'ATTENTION':
      return 'Attention'
    case 'EN_ATTENTE':
      return 'En attente'
    case 'ECHEC':
      return 'Échec'
    case 'EN_COURS':
      return 'En cours'
    case 'STABLE':
    default:
      return 'Stable'
  }
}

const getScoreColor = (score: number | null) => {
  if (score === null || score === undefined) return 'text-slate-500 dark:text-slate-400'
  if (score <= 30) return 'text-red-600 dark:text-red-400'
  if (score <= 60) return 'text-orange-600 dark:text-orange-400'
  return 'text-green-600 dark:text-green-400'
}

const getDouleurColor = (niveau: number | null) => {
  if (niveau === null || niveau === undefined) return 'text-slate-500 dark:text-slate-400'
  if (niveau >= 7) return 'text-red-600 dark:text-red-400'
  if (niveau >= 4) return 'text-orange-600 dark:text-orange-400'
  return 'text-green-600 dark:text-green-400'
}

const getMoralColor = (moral: number | null) => {
  if (moral === null || moral === undefined) return 'text-slate-500 dark:text-slate-400'
  if (moral <= 3) return 'text-red-600 dark:text-red-400'
  if (moral <= 6) return 'text-orange-600 dark:text-orange-400'
  return 'text-green-600 dark:text-green-400'
}
</script> 