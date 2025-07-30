import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/utils/api'
import { useToast } from 'vue-toastification'

export interface Call {
  id: number
  project_patient_id: number
  project_hospitalisation_id: number
  statut: 'pending' | 'called' | 'failed' | 'in_progress'
  date_appel_prevue: string
  date_appel_reelle: string | null
  duree_secondes: number | null
  score: number | null
  resume_appel: string | null
  dialogue_result: any | null
  nombre_tentatives: number
  date_creation: string
  date_modification: string
  numero_patient: string
  nom: string
  prenom: string
  date_naissance: string
  telephone: string
  service: string | null
  medecin: string | null
  site: string | null
  date_sortie: string
}

export const useCallsEnhancedStore = defineStore('callsEnhanced', () => {
  const toast = useToast()
  
  // State
  const calls = ref<Call[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const pendingCalls = computed(() => 
    calls.value.filter(call => call.statut === 'pending')
  )

  const activeCalls = computed(() => 
    calls.value.filter(call => call.statut === 'in_progress')
  )

  const completedCalls = computed(() => 
    calls.value.filter(call => call.statut === 'called')
  )

  const failedCalls = computed(() => 
    calls.value.filter(call => call.statut === 'failed')
  )

  const callStats = computed(() => ({
    total: calls.value.length,
    pending: pendingCalls.value.length,
    active: activeCalls.value.length,
    completed: completedCalls.value.length,
    failed: failedCalls.value.length
  }))

  // Actions
  const fetchCalls = async (params?: any) => {
    try {
      isLoading.value = true
      error.value = null
      
      console.log('📞 Chargement des appels avec params:', params)
      
      const response = await api.get('/api/calls', { params })
      console.log('📥 Réponse API:', response.data)
      
      if (response.data.success && response.data.data && response.data.data.items) {
        calls.value = response.data.data.items
        console.log(`✅ ${calls.value.length} appels chargés`)
        toast.success(`${calls.value.length} appels chargés`)
      } else {
        console.warn('❌ Format de réponse inattendu:', response.data)
        calls.value = []
        error.value = 'Format de réponse inattendu'
        toast.error('Erreur: format de réponse inattendu')
      }
      
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement des appels:', err)
      error.value = err.message || 'Erreur lors du chargement des appels'
      calls.value = []
      toast.error(error.value)
    } finally {
      isLoading.value = false
    }
  }

  const getCallById = async (id: number): Promise<Call | null> => {
    try {
      const response = await api.get(`/api/calls/${id}`)
      if (response.data.success) {
        return response.data.data
      }
      return null
    } catch (err) {
      console.error('Erreur lors de la récupération de l\'appel:', err)
      return null
    }
  }

  const getCallScores = async (id: number) => {
    try {
      const response = await api.get(`/api/calls/${id}/scores`)
      if (response.data.success) {
        return response.data.data
      }
      return []
    } catch (err) {
      console.error('Erreur lors de la récupération des scores:', err)
      return []
    }
  }

  const getServices = async () => {
    try {
      const response = await api.get('/api/calls/services')
      if (response.data.success) {
        return response.data.data
      }
      return []
    } catch (err) {
      console.error('Erreur lors de la récupération des services:', err)
      return []
    }
  }

  const getStatistics = async () => {
    try {
      const response = await api.get('/api/calls/statistics/overview')
      if (response.data.success) {
        return response.data.data
      }
      return null
    } catch (err) {
      console.error('Erreur lors de la récupération des statistiques:', err)
      return null
    }
  }

  return {
    // State
    calls,
    isLoading,
    error,
    
    // Computed
    pendingCalls,
    activeCalls,
    completedCalls,
    failedCalls,
    callStats,
    
    // Actions
    fetchCalls,
    getCallById,
    getCallScores,
    getServices,
    getStatistics
  }
}) 