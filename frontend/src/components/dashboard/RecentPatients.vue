<template>
  <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
    <div class="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
          Patients Appelés
        </h3>
        <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Suivi post-hospitalisation - {{ recentPatients.length }} patients appelés
        </p>
    </div>

    <div class="p-6">
      <div v-if="loading" class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <div v-else-if="recentPatients.length === 0" class="text-center py-8">
        <p class="text-slate-500 dark:text-slate-400">Aucun patient appelé</p>
      </div>

      <div v-else class="space-y-4">
        <div 
          v-for="patient in recentPatients" 
          :key="patient.call_id"
          class="relative p-4 rounded-lg border transition-all duration-200 hover:shadow-md"
          :class="getPatientCardClasses(patient)"
        >
          <!-- Badge de statut -->
          <div class="absolute top-3 right-3">
            <span 
              class="px-2 py-1 text-xs font-medium rounded-full"
              :class="getStatusBadgeClasses(patient.statut_color)"
            >
              {{ getStatusLabel(patient.statut) }}
            </span>
          </div>

          <!-- En-tête du patient -->
          <div class="flex items-start justify-between mb-3">
            <div>
              <h4 class="font-semibold text-slate-900 dark:text-white">
                {{ patient.prenom }} {{ patient.nom }}
              </h4>
              <p class="text-sm text-slate-600 dark:text-slate-400">
                {{ patient.service }} • {{ patient.medecin }}
              </p>
            </div>
          </div>

          <!-- Informations principales -->
          <div class="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p class="text-xs text-slate-500 dark:text-slate-400">Motif</p>
              <p class="text-sm text-slate-700 dark:text-slate-300">
                {{ getMotifLabel(patient.jours_post_sortie) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-slate-500 dark:text-slate-400">Douleur</p>
              <p class="text-sm font-medium" :class="getDouleurColor(patient.niveau_douleur)">
                {{ patient.niveau_douleur }}/10
              </p>
            </div>
          </div>

          <!-- Détails de l'appel -->
          <div class="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p class="text-xs text-slate-500 dark:text-slate-400">Appelé</p>
              <p class="text-sm text-slate-700 dark:text-slate-300">
                {{ patient.temps_appel || 'Non appelé' }}
              </p>
            </div>
            <div>
              <p class="text-xs text-slate-500 dark:text-slate-400">Satisfaction</p>
              <p class="text-sm text-slate-700 dark:text-slate-300">
                {{ patient.satisfaction_score || 'Non évalué' }}
              </p>
            </div>
          </div>

          <!-- État de santé -->
          <div class="grid grid-cols-3 gap-4 mb-3">
            <div>
              <p class="text-xs text-slate-500 dark:text-slate-400">Infection</p>
              <p class="text-sm" :class="patient.presence_infection ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'">
                {{ patient.presence_infection ? (patient.type_infection || 'Oui') : 'Non' }}
              </p>
            </div>
            <div>
              <p class="text-xs text-slate-500 dark:text-slate-400">Bien-être</p>
              <p class="text-sm text-slate-700 dark:text-slate-300">
                {{ getBienEtreLabel(patient.etat_fatigue) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-slate-500 dark:text-slate-400">Anxiété</p>
              <p class="text-sm text-slate-700 dark:text-slate-300">
                {{ getAnxieteLabel(patient.niveau_anxiete) }}
              </p>
            </div>
          </div>

          <!-- Alerte si présente -->
          <div v-if="patient.alerte_id" class="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div class="flex items-start">
              <svg class="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p class="text-sm font-medium text-red-800 dark:text-red-200">
                  Action requise : {{ patient.action_requise }}
                </p>
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
  
  if (patient.statut === 'ALERTE') {
    return `${baseClasses} border-red-300 dark:border-red-600 bg-red-50/50 dark:bg-red-900/10`
  } else if (patient.statut === 'ATTENTION') {
    return `${baseClasses} border-orange-300 dark:border-orange-600 bg-orange-50/50 dark:bg-orange-900/10`
  } else if (patient.statut === 'INFECTION') {
    return `${baseClasses} border-red-300 dark:border-red-600 bg-red-50/50 dark:bg-red-900/10`
  } else if (patient.statut === 'EN_ATTENTE') {
    return `${baseClasses} border-blue-300 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-900/10`
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

const getStatusLabel = (statut: string) => {
  switch (statut) {
    case 'ALERTE':
      return 'Alerte'
    case 'ATTENTION':
      return 'Attention'
    case 'INFECTION':
      return 'Infection'
    case 'EN_ATTENTE':
      return 'En attente'
    case 'STABLE':
    default:
      return 'Stable'
  }
}

const getMotifLabel = (jours: number) => {
  if (jours === null || jours === undefined) return 'Motif inconnu'
  return `Motif inconnu • J+${jours}`
}

const getDouleurColor = (niveau: number) => {
  if (niveau >= 7) return 'text-red-600 dark:text-red-400'
  if (niveau >= 4) return 'text-orange-600 dark:text-orange-400'
  return 'text-green-600 dark:text-green-400'
}

const getBienEtreLabel = (etat: string) => {
  switch (etat) {
    case 'EXCELLENT':
      return 'Excellent'
    case 'BIEN':
      return 'Bien'
    case 'FATIGUE':
      return 'Fatigué'
    case 'TRES_FATIGUE':
      return 'Très fatigué'
    case 'NON_EVALUE':
    default:
      return 'Non évalué'
  }
}

const getAnxieteLabel = (niveau: string) => {
  switch (niveau) {
    case 'AUCUNE':
      return 'Aucune'
    case 'LEGERE':
      return 'Légère'
    case 'MODEREE':
      return 'Modérée'
    case 'ELEVEE':
      return 'Élevée'
    case 'NON_EVALUE':
    default:
      return 'Non évalué'
  }
}
</script> 