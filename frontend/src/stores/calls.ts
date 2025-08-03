import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { callsService } from '@/utils/api'

import type { Call, CallFilters, CallStats } from '@/utils/api'

interface CallsState {
  calls: Call[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters: {
    sites: string[]
    services: string[]
    statuts: string[]
  }
  stats: CallStats | null
  isLoading: boolean
  error: string | null
  lastFetch: number | null
}

export const useCallsStore = defineStore('calls', () => {
  const calls = ref<Call[]>([])
  const pagination = ref({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  })
  const filters = ref({
    sites: [],
    services: [],
    statuts: []
  })
  const stats = ref<CallStats | null>(null)
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
          calls.value = data.calls || []
          // S'assurer que pagination a toutes les propriétés requises
          pagination.value = {
            page: data.pagination?.page || 1,
            limit: data.pagination?.limit || 50,
            total: data.pagination?.total || 0,
            totalPages: data.pagination?.totalPages || 0
          }
          // S'assurer que filters a toutes les propriétés requises
          filters.value = {
            sites: data.filters?.sites || [],
            services: data.filters?.services || [],
            statuts: data.filters?.statuts || []
          }
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
        pagination: pagination.value,
        filters: filters.value,
        timestamp: Date.now()
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des appels:', error)
    }
  }

  // Surveiller les changements et sauvegarder
  watch([calls, pagination, filters], saveToStorage, { deep: true })

  const fetchCalls = async (filters?: CallFilters, forceRefresh = false) => {
    try {
      // Vérifier si on peut utiliser le cache
      if (!forceRefresh && !filters && restoreFromStorage()) {
        return
      }

      isLoading.value = true
      error.value = null
      
      console.log('🔄 Chargement des appels depuis l\'API...')
      const result = await callsService.getAll(filters)
      
      calls.value = result.data
      pagination.value = result.pagination
      filters.value = result.filters
      lastFetch.value = Date.now()
      
      console.log(`✅ ${result.data.length} appels chargés avec succès`)
      
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement des appels:', err)
      error.value = err.message || 'Erreur lors du chargement des appels'
      
      // Si pas de données en cache, utiliser des données de fallback
      if (calls.value.length === 0) {
        calls.value = getFallbackCalls()
        // Réinitialiser pagination et filters avec des valeurs par défaut
        pagination.value = {
          page: 1,
          limit: 50,
          total: calls.value.length,
          totalPages: Math.ceil(calls.value.length / 50)
        }
        filters.value = {
          sites: [],
          services: [],
          statuts: []
        }
      }
    } finally {
      isLoading.value = false
    }
  }

  const fetchStats = async () => {
    try {
      const statsData = await callsService.getStats()
      stats.value = statsData
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement des statistiques:', err)
    }
  }

  const startCall = async (id: number) => {
    try {
      const updatedCall = await callsService.startCall(id)
      // Mettre à jour l'appel dans la liste
      const index = calls.value.findIndex(c => c.id === id)
      if (index !== -1) {
        calls.value[index] = updatedCall
      }
      return updatedCall
    } catch (err: any) {
      console.error('❌ Erreur lors du démarrage de l\'appel:', err)
      throw err
    }
  }

  const reportIssue = async (id: number, issueData: { type_probleme: string, description: string, priorite?: string }) => {
    try {
      const issue = await callsService.reportIssue(id, issueData)
      return issue
    } catch (err: any) {
      console.error('❌ Erreur lors du signalement du problème:', err)
      throw err
    }
  }

  const exportCalls = async (filters?: CallFilters) => {
    try {
      const blob = await callsService.exportCSV(filters)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `appels_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      console.error('❌ Erreur lors de l\'export:', err)
      throw err
    }
  }

  const getFallbackCalls = (): Call[] => {
    return [
      {
        id: 1,
        patient_id: 1,
        numero_patient: 'P001',
        nom: 'Dupont',
        prenom: 'Jean',
        date_naissance: '1980-05-15',
        telephone: '0471034785',
        site_hospitalisation: 'CHU Gabriel-Montpied',
        date_sortie_hospitalisation: '2025-08-02',
        date_heure_prevue: new Date(Date.now() - 3600000).toISOString(),
        statut_appel: 'APPELE',
        medecin_referent: 'Dr. Martin',
        service_hospitalisation: 'Cardiologie',
        date_heure_reelle: new Date(Date.now() - 3600000).toISOString(),
        duree_appel: 300,
        resume_appel: 'Appel réussi, patient satisfait',
        score_calcule: 85,
        nombre_tentatives: 1,
        max_tentatives: 3,
        dialogue_result: null,
        audio_file_path: null,
        created_at: new Date(Date.now() - 7200000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString()
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
    pagination,
    filters,
    stats,
    isLoading,
    error,
    lastFetch,
    
    // Actions
    fetchCalls,
    fetchStats,
    startCall,
    reportIssue,
    exportCalls,
    getCallById,
    clearCache,
    initialize
  }
}) 