import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { dashboardService, type DashboardStats, type RecentActivity } from '@/utils/api'
import { useToast } from 'vue-toastification'

export const useDashboardStore = defineStore('dashboard', () => {
  const toast = useToast()
  
  // State
  const stats = ref<DashboardStats | null>(null)
  const recentActivity = ref<RecentActivity[]>([])
  const isLoading = ref(false)
  const lastUpdate = ref<Date | null>(null)

  // Computed
  const hasData = computed(() => stats.value !== null)
  
  const urgentAnalyses = computed(() => {
    if (!stats.value) return 0
    return stats.value.analyses_urgentes
  })

  const pendingTranscriptions = computed(() => {
    if (!stats.value) return 0
    return stats.value.transcriptions_en_cours
  })

  const activePatients = computed(() => {
    if (!stats.value) return 0
    return stats.value.patients_actifs
  })

  const currentHospitalizations = computed(() => {
    if (!stats.value) return 0
    return stats.value.hospitalisations_en_cours
  })

  const todayConsultations = computed(() => {
    if (!stats.value) return 0
    return stats.value.consultations_aujourd_hui
  })

  const serviceDistribution = computed(() => {
    if (!stats.value) return {}
    return stats.value.repartition_services
  })

  const hospitalizationTrend = computed(() => {
    if (!stats.value) return []
    return stats.value.evolution_hospitalisations
  })

  const recentActivityByType = computed(() => {
    const grouped = {
      hospitalisation: [] as RecentActivity[],
      consultation: [] as RecentActivity[],
      transcription: [] as RecentActivity[],
      analyse: [] as RecentActivity[]
    }
    
    recentActivity.value.forEach(activity => {
      grouped[activity.type].push(activity)
    })
    
    return grouped
  })

  const criticalActivities = computed(() => {
    return recentActivity.value.filter(activity => 
      activity.description.toLowerCase().includes('urgence') ||
      activity.description.toLowerCase().includes('critique') ||
      activity.description.toLowerCase().includes('important')
    )
  })

  // Actions
  const fetchDashboardData = async () => {
    try {
      isLoading.value = true
      
      // Charger les données en parallèle
      const [statsData, activityData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentActivity()
      ])
      
      // S'assurer que statsData est correct
      if (statsData && typeof statsData === 'object') {
        stats.value = statsData
      } else {
        console.warn('Unexpected stats format:', statsData)
        stats.value = null
      }
      
      // S'assurer que activityData est un tableau
      if (Array.isArray(activityData)) {
        recentActivity.value = activityData
      } else if (activityData && activityData.data && Array.isArray(activityData.data)) {
        recentActivity.value = activityData.data
      } else if (activityData && activityData.success && Array.isArray(activityData.data)) {
        recentActivity.value = activityData.data
      } else {
        console.warn('Unexpected activity format:', activityData)
        recentActivity.value = []
      }
      
      lastUpdate.value = new Date()
      
      toast.success('Données du tableau de bord mises à jour')
    } catch (error) {
      console.error('Erreur lors du chargement du tableau de bord:', error)
      toast.error('Erreur lors du chargement du tableau de bord')
      stats.value = null
      recentActivity.value = []
    } finally {
      isLoading.value = false
    }
  }

  const fetchStats = async () => {
    try {
      const data = await dashboardService.getStats()
      stats.value = data
      lastUpdate.value = new Date()
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
    }
  }

  const fetchRecentActivity = async () => {
    try {
      const data = await dashboardService.getRecentActivity()
      recentActivity.value = data
    } catch (error) {
      console.error('Erreur lors du chargement de l\'activité récente:', error)
    }
  }

  const refreshData = async () => {
    await fetchDashboardData()
  }

  const addActivity = (activity: RecentActivity) => {
    recentActivity.value.unshift(activity)
    
    // Garder seulement les 50 dernières activités
    if (recentActivity.value.length > 50) {
      recentActivity.value = recentActivity.value.slice(0, 50)
    }
  }

  const updateStats = (newStats: Partial<DashboardStats>) => {
    if (stats.value) {
      stats.value = { ...stats.value, ...newStats }
    }
  }

  const getServiceColor = (service: string): string => {
    const colors = {
      'Cardiologie': 'text-red-600 bg-red-100 dark:bg-red-900/50 dark:text-red-300',
      'Orthopédie': 'text-blue-600 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300',
      'Pneumologie': 'text-green-600 bg-green-100 dark:bg-green-900/50 dark:text-green-300',
      'Oncologie': 'text-purple-600 bg-purple-100 dark:bg-purple-900/50 dark:text-purple-300',
      'Neurologie': 'text-orange-600 bg-orange-100 dark:bg-orange-900/50 dark:text-orange-300',
      'Chirurgie': 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-300',
      'Urgences': 'text-pink-600 bg-pink-100 dark:bg-pink-900/50 dark:text-pink-300'
    }
    
    return colors[service as keyof typeof colors] || 'text-gray-600 bg-gray-100 dark:bg-gray-900/50 dark:text-gray-300'
  }

  const getActivityIcon = (type: string): string => {
    const icons = {
      'hospitalisation': '🏥',
      'consultation': '👨‍⚕️',
      'transcription': '🎤',
      'analyse': '🤖'
    }
    
    return icons[type as keyof typeof icons] || '📋'
  }

  const getActivityColor = (type: string): string => {
    const colors = {
      'hospitalisation': 'text-blue-600 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300',
      'consultation': 'text-green-600 bg-green-100 dark:bg-green-900/50 dark:text-green-300',
      'transcription': 'text-purple-600 bg-purple-100 dark:bg-purple-900/50 dark:text-purple-300',
      'analyse': 'text-orange-600 bg-orange-100 dark:bg-orange-900/50 dark:text-orange-300'
    }
    
    return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-100 dark:bg-gray-900/50 dark:text-gray-300'
  }

  const formatLastUpdate = (): string => {
    if (!lastUpdate.value) return 'Jamais'
    
    const now = new Date()
    const diff = now.getTime() - lastUpdate.value.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (minutes < 1) return 'À l\'instant'
    if (minutes < 60) return `Il y a ${minutes} min`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `Il y a ${hours}h`
    
    const days = Math.floor(hours / 24)
    return `Il y a ${days}j`
  }

  const clearData = () => {
    stats.value = null
    recentActivity.value = []
    lastUpdate.value = null
  }

  return {
    // State
    stats,
    recentActivity,
    isLoading,
    lastUpdate,

    // Computed
    hasData,
    urgentAnalyses,
    pendingTranscriptions,
    activePatients,
    currentHospitalizations,
    todayConsultations,
    serviceDistribution,
    hospitalizationTrend,
    recentActivityByType,
    criticalActivities,

    // Actions
    fetchDashboardData,
    fetchStats,
    fetchRecentActivity,
    refreshData,
    addActivity,
    updateStats,
    getServiceColor,
    getActivityIcon,
    getActivityColor,
    formatLastUpdate,
    clearData
  }
}) 