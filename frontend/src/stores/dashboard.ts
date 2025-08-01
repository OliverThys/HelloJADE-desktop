import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/utils/api'

export const useDashboardStore = defineStore('dashboard', () => {
  const stats = ref({
    totalPatients: 0,
    activePatients: 0,
    totalCalls: 0,
    pendingCalls: 0,
    completedCalls: 0,
    averageCallDuration: 0,
    satisfactionRate: 0
  })

  const recentActivity = ref([])
  const isLoading = ref(false)

  const fetchDashboardData = async () => {
    try {
      isLoading.value = true
      
      // Simulation de données
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      stats.value = {
        totalPatients: 156,
        activePatients: 89,
        totalCalls: 1247,
        pendingCalls: 12,
        completedCalls: 1235,
        averageCallDuration: 8.5,
        satisfactionRate: 94.2
      }
      
      recentActivity.value = [
        {
          id: 1,
          type: 'call',
          message: 'Nouvel appel reçu pour le patient Jean Dupont',
          timestamp: new Date(Date.now() - 300000)
        },
        {
          id: 2,
          type: 'patient',
          message: 'Patient Marie Martin ajouté au système',
          timestamp: new Date(Date.now() - 600000)
        },
        {
          id: 3,
          type: 'call',
          message: 'Appel #1234 terminé avec succès',
          timestamp: new Date(Date.now() - 900000)
        }
      ]
      
      console.log('Données du tableau de bord chargées avec succès')
      
    } catch (error) {
      console.error('Erreur lors du chargement des données du tableau de bord:', error)
    } finally {
      isLoading.value = false
    }
  }

  return {
    stats,
    recentActivity,
    isLoading,
    fetchDashboardData
  }
}) 