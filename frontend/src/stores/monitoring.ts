import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/utils/api'

export interface ServiceStatus {
  id: string
  name: string
  description: string
  status: 'online' | 'offline' | 'warning' | 'maintenance'
  responseTime?: number
  lastCheck?: Date
  uptime?: number
  errorMessage?: string
  icon: string
}

export interface SystemMetric {
  key: string
  title: string
  description: string
  value: string
  unit: string
  icon: string
  colorClass: string
  progressColorClass: string
  showProgress: boolean
  percentage: number
  trend: number
}

export interface PerformanceData {
  cpu: number[]
  memory: number[]
  network: number[]
  responseTime: number[]
}

export const useMonitoringStore = defineStore('monitoring', () => {
  // État
  const services = ref<ServiceStatus[]>([
    {
      id: 'asterisk',
      name: 'Asterisk',
      description: 'Serveur de téléphonie IP',
      status: 'online',
      responseTime: 45,
      lastCheck: new Date(),
      uptime: 99.8,
      icon: 'PhoneIcon'
    },
    {
      id: 'hospital-db',
      name: 'Base de données Hôpital',
      description: 'Connexion Oracle',
      status: 'online',
      responseTime: 120,
      lastCheck: new Date(),
      uptime: 99.9,
      icon: 'CircleStackIcon'
    },
    {
      id: 'hellojade-db',
      name: 'Base de données HelloJADE',
      description: 'Connexion PostgreSQL',
      status: 'online',
      responseTime: 85,
      lastCheck: new Date(),
      uptime: 99.7,
      icon: 'CircleStackIcon'
    },
    {
      id: 'active-directory',
      name: 'Active Directory',
      description: 'Service d\'authentification',
      status: 'online',
      responseTime: 65,
      lastCheck: new Date(),
      uptime: 99.5,
      icon: 'UserGroupIcon'
    }
  ])

  const systemMetrics = ref<SystemMetric[]>([
    {
      key: 'cpu',
      title: 'CPU',
      description: 'Utilisation du processeur',
      value: '45',
      unit: '%',
      icon: 'CpuChipIcon',
      colorClass: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
      progressColorClass: 'bg-blue-500',
      showProgress: true,
      percentage: 45,
      trend: 2
    },
    {
      key: 'memory',
      title: 'Mémoire',
      description: 'Utilisation de la RAM',
      value: '2.8',
      unit: 'GB',
      icon: 'ServerIcon',
      colorClass: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
      progressColorClass: 'bg-green-500',
      showProgress: true,
      percentage: 70,
      trend: -5
    },
    {
      key: 'network',
      title: 'Réseau',
      description: 'Trafic réseau',
      value: '125',
      unit: 'Mbps',
      icon: 'WifiIcon',
      colorClass: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300',
      progressColorClass: 'bg-purple-500',
      showProgress: true,
      percentage: 60,
      trend: 12
    },
    {
      key: 'response',
      title: 'Temps de réponse',
      description: 'Latence moyenne',
      value: '45',
      unit: 'ms',
      icon: 'ClockIcon',
      colorClass: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300',
      progressColorClass: 'bg-orange-500',
      showProgress: false,
      trend: -8
    },
    {
      key: 'database',
      title: 'Base de données',
      description: 'Connexions actives',
      value: '24',
      unit: 'connexions',
      icon: 'CircleStackIcon',
      colorClass: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300',
      progressColorClass: 'bg-indigo-500',
      showProgress: false,
      trend: 0
    },
    {
      key: 'users',
      title: 'Utilisateurs',
      description: 'Utilisateurs connectés',
      value: '12',
      unit: 'actifs',
      icon: 'UserGroupIcon',
      colorClass: 'bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-300',
      progressColorClass: 'bg-pink-500',
      showProgress: false,
      trend: 3
    }
  ])

  const performanceData = ref<PerformanceData>({
    cpu: [45, 52, 48, 61, 55, 49, 58, 62, 51, 47, 53, 59],
    memory: [70, 68, 72, 75, 71, 69, 73, 76, 70, 68, 71, 74],
    network: [125, 138, 142, 156, 148, 135, 149, 162, 145, 132, 151, 158],
    responseTime: [45, 42, 48, 51, 47, 44, 49, 52, 46, 43, 50, 53]
  })

  const isLoading = ref(false)
  const lastUpdate = ref<Date>(new Date())

  // Getters
  const onlineServices = computed(() => 
    services.value.filter(service => service.status === 'online')
  )

  const offlineServices = computed(() => 
    services.value.filter(service => service.status === 'offline')
  )

  const warningServices = computed(() => 
    services.value.filter(service => service.status === 'warning')
  )

  const overallStatus = computed(() => {
    const total = services.value.length
    const online = onlineServices.value.length
    const warning = warningServices.value.length
    const offline = offlineServices.value.length

    if (offline > 0) return 'critical'
    if (warning > 0) return 'warning'
    return 'healthy'
  })

  const overallUptime = computed(() => {
    const totalUptime = services.value.reduce((sum, service) => sum + (service.uptime || 0), 0)
    return Math.round(totalUptime / services.value.length * 100) / 100
  })

  // Actions
  const checkServiceStatus = async (serviceId: string) => {
    const service = services.value.find(s => s.id === serviceId)
    if (!service) return

    try {
      const startTime = Date.now()
      
      console.log(`🔍 Monitoring: Vérification du service ${serviceId}`)
      
      // Simuler différents types de vérifications selon le service
      let response
      switch (serviceId) {
        case 'asterisk':
          response = await api.get('/api/monitoring/asterisk')
          break
        case 'hospital-db':
          response = await api.get('/api/monitoring/hospital-db')
          break
        case 'hellojade-db':
          response = await api.get('/api/monitoring/hellojade-db')
          break
        case 'active-directory':
          response = await api.get('/api/monitoring/active-directory')
          break
        default:
          throw new Error('Service inconnu')
      }

      const responseTime = Date.now() - startTime
      
      console.log(`✅ Monitoring ${serviceId}:`, response.data)
      
      service.status = response.data.status
      service.responseTime = responseTime
      service.lastCheck = new Date()
      service.uptime = response.data.uptime
      service.errorMessage = response.data.error || undefined

    } catch (error: any) {
      console.error(`❌ Monitoring ${serviceId}:`, error)
      console.error(`❌ Monitoring ${serviceId} response:`, error.response?.data)
      
      service.status = 'offline'
      service.lastCheck = new Date()
      service.errorMessage = error.response?.data?.error || error.message || 'Erreur de connexion'
    }
  }

  const checkAllServices = async () => {
    console.log('🔄 Monitoring: Début de la vérification de tous les services')
    isLoading.value = true
    try {
      await Promise.all(
        services.value.map(service => checkServiceStatus(service.id))
      )
      lastUpdate.value = new Date()
      console.log('✅ Monitoring: Vérification terminée')
    } catch (error) {
      console.error('❌ Monitoring: Erreur lors de la vérification des services:', error)
    } finally {
      isLoading.value = false
    }
  }

  const updateSystemMetrics = async () => {
    try {
      const response = await api.get('/api/monitoring/system-metrics')
      systemMetrics.value = response.data.metrics
      performanceData.value = response.data.performance
    } catch (error) {
      console.error('Erreur lors de la mise à jour des métriques:', error)
    }
  }

  const startAutoRefresh = () => {
    // Vérifier les services toutes les 30 secondes
    setInterval(() => {
      checkAllServices()
    }, 30000)

    // Mettre à jour les métriques toutes les 5 secondes
    setInterval(() => {
      updateSystemMetrics()
    }, 5000)
  }

  return {
    // État
    services,
    systemMetrics,
    performanceData,
    isLoading,
    lastUpdate,
    
    // Getters
    onlineServices,
    offlineServices,
    warningServices,
    overallStatus,
    overallUptime,
    
    // Actions
    checkServiceStatus,
    checkAllServices,
    updateSystemMetrics,
    startAutoRefresh
  }
}) 