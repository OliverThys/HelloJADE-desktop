import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/utils/api'

export const useCallsStore = defineStore('calls', () => {
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
      
      console.log('Appels chargés avec succès')
      
    } catch (error) {
      console.error('Erreur lors du chargement des appels:', error)
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