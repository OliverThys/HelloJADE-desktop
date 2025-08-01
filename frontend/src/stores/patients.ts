import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface Patient {
  id: number
  name: string
  age: number
  service: string
  status: string
  lastContact: Date
}

export const usePatientsStore = defineStore('patients', () => {
  const patients = ref<Patient[]>([])
  const isLoading = ref(false)
  const currentPatient = ref<Patient | null>(null)

  const fetchPatients = async () => {
    try {
      isLoading.value = true
      
      // Simulation de données
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      patients.value = [
        {
          id: 1,
          name: 'Jean Dupont',
          age: 45,
          service: 'Cardiologie',
          status: 'actif',
          lastContact: new Date(Date.now() - 86400000)
        },
        {
          id: 2,
          name: 'Marie Martin',
          age: 32,
          service: 'Orthopédie',
          status: 'actif',
          lastContact: new Date(Date.now() - 172800000)
        }
      ]
      
      console.log('Patients chargés avec succès')
      
    } catch (error) {
      console.error('Erreur lors du chargement des patients:', error)
    } finally {
      isLoading.value = false
    }
  }

  return {
    patients,
    isLoading,
    currentPatient,
    fetchPatients
  }
}) 