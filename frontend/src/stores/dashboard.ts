import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/utils/api'

export interface DashboardOverview {
  patients_suivis: number
  patients_appeles: number
  patients_a_appeler: number
  patients_echec: number
  appels_aujourd_hui: number
  satisfaction_moyenne: number
  total_evaluations: number
  alertes_actives: number
}

export interface PatientRecent {
  call_id: number
  patient_id: number
  nom: string
  prenom: string
  service: string
  medecin: string
  date_sortie: string
  jours_post_sortie: number
  statut_appel: string
  date_appel: string
  temps_appel: string
  score_calcule: number | null
  satisfaction_score: number | null
  resume_appel: string
  // Nouvelles métriques de score (null pour les patients non encore appelés)
  douleur: number | null
  traitement_suivi: boolean | null
  transit_normal: boolean | null
  moral: number | null
  fievre: boolean | null
  mots_cles_urgents: string[]
  // Alertes basées sur le score
  alerte_id: number | null
  niveau_urgence: string | null
  raison_alerte: string | null
  action_requise: string | null
  statut: string
  statut_color: string
}

export interface ServiceStats {
  nom_service: string
  total_patients: number
  patients_appeles: number
  satisfaction_moyenne: number
  alertes_actives: number
}

export interface SatisfactionStats {
  date: string
  nombre_evaluations: number
  satisfaction_moyenne: number
}

export interface AlerteStats {
  type_alerte: string
  niveau_urgence: string
  nombre: number
}

export interface DashboardStatistics {
  par_service: ServiceStats[]
  satisfaction_evolution: SatisfactionStats[]
  alertes: AlerteStats[]
}

export const useDashboardStore = defineStore('dashboard', () => {
  // État
  const overview = ref<DashboardOverview | null>(null)
  const recentPatients = ref<PatientRecent[]>([])
  const statistics = ref<DashboardStatistics | null>(null)
  const alerts = ref<{
    alerte_id: number
    patient_id: number
    patient_nom: string
    patient_prenom: string
    score_calcule: number
    niveau_urgence: string
    raison_alerte: string
    action_requise: string
    date_creation: string
  }[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const patientsSuivis = computed(() => overview.value?.patients_suivis || 0)
  const alertesActives = computed(() => overview.value?.alertes_actives || 0)
  const appelsAujourdHui = computed(() => overview.value?.appels_aujourd_hui || 0)
  const satisfactionMoyenne = computed(() => overview.value?.satisfaction_moyenne || 0)

  const patientsStables = computed(() => 
    recentPatients.value.filter(p => p.statut === 'STABLE').length
  )
  const patientsAlertes = computed(() => 
    recentPatients.value.filter(p => p.statut === 'ALERTE').length
  )

  // Actions
  const fetchOverview = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.get('/api/dashboard/overview')
      if (response.data.success) {
        overview.value = response.data.data
      } else {
        throw new Error('Erreur lors de la récupération des données')
      }
    } catch (err: any) {
      error.value = err.message || 'Erreur lors de la récupération des données'
      console.error('Erreur fetchOverview:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchRecentPatients = async (limit = 10) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.get(`/api/dashboard/recent-patients?limit=${limit}`)
      if (response.data.success) {
        recentPatients.value = response.data.data
      } else {
        throw new Error('Erreur lors de la récupération des patients')
      }
    } catch (err: any) {
      error.value = err.message || 'Erreur lors de la récupération des patients'
      console.error('Erreur fetchRecentPatients:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchStatistics = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.get('/api/dashboard/statistics')
      if (response.data.success) {
        statistics.value = response.data.data
      } else {
        throw new Error('Erreur lors de la récupération des statistiques')
      }
    } catch (err: any) {
      error.value = err.message || 'Erreur lors de la récupération des statistiques'
      console.error('Erreur fetchStatistics:', err)
    } finally {
      loading.value = false
    }
  }

  const fetchAlerts = async (limit = 20) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.get(`/api/dashboard/alerts?limit=${limit}`)
      if (response.data.success) {
        alerts.value = response.data.data
      } else {
        throw new Error('Erreur lors de la récupération des alertes')
      }
    } catch (err: any) {
      error.value = err.message || 'Erreur lors de la récupération des alertes'
      console.error('Erreur fetchAlerts:', err)
    } finally {
      loading.value = false
    }
  }

  const refreshAll = async () => {
    await Promise.all([
      fetchOverview(),
      fetchRecentPatients(),
      fetchStatistics(),
      fetchAlerts()
    ])
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // État
    overview,
    recentPatients,
    statistics,
    alerts,
    loading,
    error,
    
    // Getters
    patientsSuivis,
    alertesActives,
    appelsAujourdHui,
    satisfactionMoyenne,
    patientsStables,
    patientsAlertes,
    
    // Actions
    fetchOverview,
    fetchRecentPatients,
    fetchStatistics,
    fetchAlerts,
    refreshAll,
    clearError
  }
}) 