<template>
  <div class="card-glass animate-fade-in">
    <div class="p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Alertes Actives
        </h3>
        <span v-if="alerts.length > 0" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium badge-danger">
          {{ alerts.length }}
        </span>
      </div>

      <div v-if="loading" class="space-y-3">
        <div v-for="i in 3" :key="i" class="animate-pulse">
          <div class="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>

      <div v-else-if="alerts.length === 0" class="text-center py-8">
        <div class="text-gray-400 dark:text-gray-500">
          <svg class="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-sm">Aucune alerte active</p>
        </div>
      </div>

      <div v-else class="space-y-3">
        <div 
          v-for="(alert, index) in alerts" 
          :key="alert.alerte_id"
          class="p-4 rounded-lg border border-gray-200 dark:border-gray-700 transition-hellojade hover-lift bg-white dark:bg-gray-800"
          :class="getAlertClasses(alert.niveau_urgence)"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ alert.patient_prenom }} {{ alert.patient_nom }}
                </span>
                <span 
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                  :class="getUrgencyBadgeClasses(alert.niveau_urgence)"
                >
                  Score: {{ alert.score_calcule }}/100
                </span>
              </div>
              
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {{ alert.raison_alerte }}
              </p>
              
              <div class="flex items-center justify-between">
                <span class="text-xs text-gray-500">
                  Score faible
                </span>
                <span class="text-xs text-gray-500">
                  {{ formatDate(alert.date_creation) }}
                </span>
              </div>
              
              <div v-if="alert.action_requise" class="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
                <strong>Action requise:</strong> {{ alert.action_requise }}
              </div>
              
              <!-- Bouton pour voir les informations du patient -->
              <div class="mt-3">
                <button 
                  @click="viewPatientInfo(alert.patient_id)"
                  class="btn-primary text-xs py-1.5 px-3"
                >
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Voir les informations du patient
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
import { useRouter } from 'vue-router'
import { useDashboardStore } from '@/stores/dashboard'

const router = useRouter()
const dashboardStore = useDashboardStore()

const alerts = computed(() => dashboardStore.alerts)
const loading = computed(() => dashboardStore.loading)

const viewPatientInfo = (patientId: number) => {
  router.push(`/patients/${patientId}`)
}

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

const getUrgencyBadgeClasses = (urgence: string) => {
  switch (urgence) {
    case 'ELEVE':
      return 'badge-danger'
    case 'MOYEN':
      return 'badge-warning'
    case 'FAIBLE':
      return 'badge-info'
    default:
      return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300'
  }
}

const getUrgencyGlowColor = (urgence: string) => {
  switch (urgence) {
    case 'ELEVE':
      return 'bg-red-400'
    case 'MOYEN':
      return 'bg-orange-400'
    case 'FAIBLE':
      return 'bg-blue-400'
    default:
      return 'bg-slate-400'
  }
}

const getAlertClasses = (urgence: string) => {
  const baseClasses = 'border'
  switch (urgence) {
    case 'ELEVE':
      return `${baseClasses} border-red-200/50 dark:border-red-700/50 bg-red-50/30 dark:bg-red-900/10`
    case 'MOYEN':
      return `${baseClasses} border-orange-200/50 dark:border-orange-700/50 bg-orange-50/30 dark:bg-orange-900/10`
    case 'FAIBLE':
      return `${baseClasses} border-blue-200/50 dark:border-blue-700/50 bg-blue-50/30 dark:bg-blue-900/10`
    default:
      return `${baseClasses} border-slate-200/50 dark:border-slate-700/50`
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