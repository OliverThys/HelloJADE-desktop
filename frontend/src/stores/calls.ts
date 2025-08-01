import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { callsService } from '@/utils/api'

interface Call {
  id: number
  project_patient_id: number
  project_hospitalisation_id: number
  statut: string
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

export const useCallsStore = defineStore('calls', () => {
  const calls = ref<Call[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastFetch = ref<number | null>(null)

  // Persistance des données
  const STORAGE_KEY = 'calls_data'
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  // Restaurer les données depuis le localStorage
  const restoreFromStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        if (data.timestamp && Date.now() - data.timestamp < CACHE_DURATION) {
          calls.value = data.calls
          lastFetch.value = data.timestamp
          console.log('📦 Appels restaurés depuis le cache')
          return true
        }
      }
    } catch (error) {
      console.error('Erreur lors de la restauration des appels:', error)
    }
    return false
  }

  // Sauvegarder les données dans le localStorage
  const saveToStorage = () => {
    try {
      const data = {
        calls: calls.value,
        timestamp: Date.now()
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des appels:', error)
    }
  }

  // Surveiller les changements et sauvegarder
  watch(calls, saveToStorage, { deep: true })

  const fetchCalls = async (forceRefresh = false) => {
    try {
      // Vérifier si on peut utiliser le cache
      if (!forceRefresh && restoreFromStorage()) {
        return
      }

      isLoading.value = true
      error.value = null
      
      console.log('🔄 Chargement des appels depuis l\'API...')
      const data = await callsService.getAll()
      
      calls.value = data
      lastFetch.value = Date.now()
      
      console.log(`✅ ${data.length} appels chargés avec succès`)
      
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement des appels:', err)
      error.value = err.message || 'Erreur lors du chargement des appels'
      
      // Si pas de données en cache, utiliser des données de fallback
      if (calls.value.length === 0) {
        calls.value = getFallbackCalls()
      }
    } finally {
      isLoading.value = false
    }
  }

  const getFallbackCalls = (): Call[] => {
    return [
      {
        id: 1,
        project_patient_id: 1,
        project_hospitalisation_id: 1,
        statut: 'TERMINE',
        date_appel_prevue: new Date(Date.now() - 3600000).toISOString(),
        date_appel_reelle: new Date(Date.now() - 3600000).toISOString(),
        duree_secondes: 300,
        score: 85,
        resume_appel: 'Appel réussi, patient satisfait',
        dialogue_result: null,
        nombre_tentatives: 1,
        date_creation: new Date(Date.now() - 7200000).toISOString(),
        date_modification: new Date(Date.now() - 3600000).toISOString(),
        numero_patient: 'P001',
        nom: 'Dupont',
        prenom: 'Jean',
        date_naissance: '1980-05-15',
        telephone: '0471034785',
        service: 'Cardiologie',
        medecin: 'Dr. Martin',
        site: 'CHU Gabriel-Montpied',
        date_sortie: new Date(Date.now() - 86400000).toISOString()
      }
    ]
  }

  const getCallById = async (id: number): Promise<Call | null> => {
    try {
      // Chercher d'abord dans le cache
      const cached = calls.value.find(c => c.id === id)
      if (cached) {
        return cached
      }

      // Sinon, charger depuis l'API
      const call = await callsService.getById(id)
      return call
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'appel:', error)
      return null
    }
  }

  const clearCache = () => {
    localStorage.removeItem(STORAGE_KEY)
    calls.value = []
    lastFetch.value = null
    error.value = null
  }

  // Initialisation automatique
  const initialize = () => {
    if (calls.value.length === 0) {
      fetchCalls()
    }
  }

  return {
    // State
    calls,
    isLoading,
    error,
    lastFetch,
    
    // Actions
    fetchCalls,
    getCallById,
    clearCache,
    initialize
  }
}) 