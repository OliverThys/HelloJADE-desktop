<template>
  <div class="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
    <div class="p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
          Alertes Actives
        </h3>
        <span 
          v-if="alerts.length > 0"
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
        >
          {{ alerts.length }}
        </span>
      </div>

      <div v-if="loading" class="space-y-3">
        <div v-for="i in 3" :key="i" class="animate-pulse">
          <div class="h-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>

      <div v-else-if="alerts.length === 0" class="text-center py-8">
        <div class="text-slate-400 dark:text-slate-500">
          <svg class="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-sm">Aucune alerte active</p>
        </div>
      </div>

      <div v-else class="space-y-3">
        <div 
          v-for="alert in alerts" 
          :key="alert.alerte_id"
          class="p-4 rounded-lg border transition-colors"
          :class="getAlertClasses(alert.niveau_urgence)"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-sm font-medium text-slate-900 dark:text-white">
                  {{ alert.patient_prenom }} {{ alert.patient_nom }}
                </span>
                <span 
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                  :class="getUrgencyBadgeClasses(alert.niveau_urgence)"
                >
                  {{ getUrgencyLabel(alert.niveau_urgence) }}
                </span>
              </div>
              
              <p class="text-sm text-slate-600 dark:text-slate-400 mb-2">
                {{ alert.description }}
              </p>
              
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-500 dark:text-slate-500">
                  {{ getAlertTypeLabel(alert.type_alerte) }}
                </span>
                <span class="text-xs text-slate-500 dark:text-slate-500">
                  {{ formatDate(alert.date_creation) }}
                </span>
              </div>
              
              <div v-if="alert.action_requise" class="mt-2 p-2 bg-slate-50 dark:bg-slate-700 rounded text-xs text-slate-600 dark:text-slate-400">
                <strong>Action requise:</strong> {{ alert.action_requise }}
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
import { useDashboardStore } from '@/stores/dashboard'

const dashboardStore = useDashboardStore()

const alerts = computed(() => dashboardStore.alerts)
const loading = computed(() => dashboardStore.loading)

const getUrgencyLabel = (urgence: string) => {
  switch (urgence) {
    case 'ELEVE':
      return 'Élevée'
    case 'MOYEN':
      return 'Moyenne'
    case 'FAIBLE':
      return 'Faible'
    default:
      return urgence
  }
}

const getAlertTypeLabel = (type: string) => {
  switch (type) {
    case 'CONTACT_ECHEC':
      return 'Échec de contact'
    case 'COMPLICATION':
      return 'Complication'
    default:
      return type
  }
}

const getUrgencyBadgeClasses = (urgence: string) => {
  switch (urgence) {
    case 'ELEVE':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    case 'MOYEN':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
    case 'FAIBLE':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
    default:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300'
  }
}

const getAlertClasses = (urgence: string) => {
  const baseClasses = 'border'
  switch (urgence) {
    case 'ELEVE':
      return `${baseClasses} border-red-200 dark:border-red-700 bg-red-50/30 dark:bg-red-900/10`
    case 'MOYEN':
      return `${baseClasses} border-orange-200 dark:border-orange-700 bg-orange-50/30 dark:bg-orange-900/10`
    case 'FAIBLE':
      return `${baseClasses} border-yellow-200 dark:border-yellow-700 bg-yellow-50/30 dark:bg-yellow-900/10`
    default:
      return `${baseClasses} border-slate-200 dark:border-slate-700`
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return 'Aujourd\'hui'
  } else if (diffDays === 1) {
    return 'Hier'
  } else if (diffDays < 7) {
    return `Il y a ${diffDays} jours`
  } else {
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short' 
    })
  }
}
</script> 