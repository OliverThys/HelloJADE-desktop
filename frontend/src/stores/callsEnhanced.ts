import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/utils/api'

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
  const calls = ref([])
  const isLoading = ref(false)

  const fetchCalls = async () => {
    try {
      isLoading.value = true
      
      // Simulation de données
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      calls.value = [
        {
          id: 1,
          patientName: 'Jean Dupont',
          phoneNumber: '+33123456789',
          status: 'completed',
          duration: 300,
          timestamp: new Date(Date.now() - 3600000)
        },
        {
          id: 2,
          patientName: 'Marie Martin',
          phoneNumber: '+33987654321',
          status: 'pending',
          duration: 0,
          timestamp: new Date(Date.now() - 1800000)
        }
      ]
      
      console.log('Appels JADE chargés avec succès')
      
    } catch (error) {
      console.error('Erreur lors du chargement des appels JADE:', error)
    } finally {
      isLoading.value = false
    }
  }

  return {
    calls,
    isLoading,
    fetchCalls
  }
}) 