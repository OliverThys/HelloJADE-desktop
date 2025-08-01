// Export centralisé des stores
export { useAuthStore } from './auth'
export { useUserStore } from './user'
export { usePatientsStore } from './patients'
export { useCallsStore } from './calls'
export { useDashboardStore } from './dashboard'
export { useMonitoringStore } from './monitoring'

// Configuration globale des stores
export const initializeStores = async () => {
  console.log('🔄 Initialisation des stores...')
  
  // Les stores s'initialisent automatiquement via leurs méthodes initialize()
  // Cette fonction peut être utilisée pour une initialisation globale si nécessaire
  
  return Promise.resolve()
} 