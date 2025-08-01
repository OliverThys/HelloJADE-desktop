import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { patientsService } from '@/utils/api'

interface Patient {
  id_patient: number
  numero_patient: string
  nom: string
  prenom: string
  date_naissance: string
  sexe: string
  telephone: string
  email: string
  date_creation: string
  statut: string
  adresse: string
  code_postal: string
  ville: string
  medecin_traitant: string
  personne_contact: string
  tel_contact: string
  numero_secu: string
  service?: string
  medecin?: string
  date_admission?: string
  date_sortie?: string
}

export const usePatientsStore = defineStore('patients', () => {
  const patients = ref<Patient[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastFetch = ref<number | null>(null)
  const currentPatient = ref<Patient | null>(null)

  // Persistance des données
  const STORAGE_KEY = 'patients_data'
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  // Restaurer les données depuis le localStorage
  const restoreFromStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        if (data.timestamp && Date.now() - data.timestamp < CACHE_DURATION) {
          patients.value = data.patients
          lastFetch.value = data.timestamp
          console.log('📦 Patients restaurés depuis le cache')
          return true
        }
      }
    } catch (error) {
      console.error('Erreur lors de la restauration des patients:', error)
    }
    return false
  }

  // Sauvegarder les données dans le localStorage
  const saveToStorage = () => {
    try {
      const data = {
        patients: patients.value,
        timestamp: Date.now()
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des patients:', error)
    }
  }

  // Surveiller les changements et sauvegarder
  watch(patients, saveToStorage, { deep: true })

  const fetchPatients = async (forceRefresh = false) => {
    try {
      // Vérifier si on peut utiliser le cache
      if (!forceRefresh && restoreFromStorage()) {
        return
      }

      isLoading.value = true
      error.value = null
      
      console.log('🔄 Chargement des patients depuis l\'API...')
      const data = await patientsService.getAll()
      
      patients.value = data
      lastFetch.value = Date.now()
      
      console.log(`✅ ${data.length} patients chargés avec succès`)
      
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement des patients:', err)
      error.value = err.message || 'Erreur lors du chargement des patients'
      
      // Si pas de données en cache, utiliser des données de fallback
      if (patients.value.length === 0) {
        patients.value = getFallbackPatients()
      }
    } finally {
      isLoading.value = false
    }
  }

  const getFallbackPatients = (): Patient[] => {
    return [
      {
        id_patient: 1,
        numero_patient: 'P001',
        nom: 'Dupont',
        prenom: 'Jean',
        date_naissance: '1980-05-15',
        sexe: 'M',
        telephone: '0471034785',
        email: 'jean.dupont@email.com',
        date_creation: new Date().toISOString(),
        statut: 'ACTIF',
        adresse: '123 Rue de la Paix',
        code_postal: '63000',
        ville: 'Clermont-Ferrand',
        medecin_traitant: 'Dr. Martin',
        personne_contact: 'Marie Dupont',
        tel_contact: '0471034786',
        numero_secu: '1234567890123'
      }
    ]
  }

  const getPatientById = async (id: number): Promise<Patient | null> => {
    try {
      // Chercher d'abord dans le cache
      const cached = patients.value.find(p => p.id_patient === id)
      if (cached) {
        return cached
      }

      // Sinon, charger depuis l'API
      const patient = await patientsService.getById(id)
      return patient
    } catch (error) {
      console.error('Erreur lors de la récupération du patient:', error)
      return null
    }
  }

  const clearCache = () => {
    localStorage.removeItem(STORAGE_KEY)
    patients.value = []
    lastFetch.value = null
    error.value = null
  }

  // Initialisation automatique
  const initialize = () => {
    if (patients.value.length === 0) {
      fetchPatients()
    }
  }

  return {
    // State
    patients,
    isLoading,
    error,
    currentPatient,
    lastFetch,
    
    // Actions
    fetchPatients,
    getPatientById,
    clearCache,
    initialize
  }
}) 