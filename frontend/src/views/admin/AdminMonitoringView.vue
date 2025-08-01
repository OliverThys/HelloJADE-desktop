<template>
  <div class="admin-monitoring-container">
    <!-- En-tête avec statut global -->
    <div class="monitoring-header">
      <div class="header-content">
        <div class="header-title">
          <h1 class="title-light mb-2">
            Monitoring Système
          </h1>
          <p class="subtitle-light">
            Surveillance en temps réel de l'infrastructure HelloJADE
          </p>
        </div>
        
        <div class="header-status">
          <div class="overall-status" :class="overallStatusClass">
            <div class="status-indicator">
              <div class="status-dot"></div>
              <span class="status-text">{{ overallStatusText }}</span>
            </div>
            <div class="uptime-info">
              <span class="uptime-value">{{ overallUptime }}%</span>
              <span class="uptime-label">disponibilité</span>
            </div>
          </div>
          
          <div class="header-actions">
            <button 
              @click="refreshAll"
              :disabled="isLoading"
              class="refresh-btn"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {{ isLoading ? 'Actualisation...' : 'Actualiser' }}
            </button>
            
            <div class="last-update">
              <span class="update-label">Dernière mise à jour</span>
              <span class="update-time">{{ formatLastUpdate }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Résumé des services -->
    <div class="services-summary">
      <div class="summary-card online">
        <div class="summary-icon">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div class="summary-content">
          <span class="summary-value">{{ onlineServices.length }}</span>
          <span class="summary-label">Services opérationnels</span>
        </div>
      </div>
      
      <div class="summary-card warning" v-if="warningServices.length > 0">
        <div class="summary-icon">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div class="summary-content">
          <span class="summary-value">{{ warningServices.length }}</span>
          <span class="summary-label">Services en alerte</span>
        </div>
      </div>
      
      <div class="summary-card offline" v-if="offlineServices.length > 0">
        <div class="summary-icon">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <div class="summary-content">
          <span class="summary-value">{{ offlineServices.length }}</span>
          <span class="summary-label">Services hors service</span>
        </div>
      </div>
    </div>

    <!-- Grille principale -->
    <div class="monitoring-grid">
      <!-- Statut des services -->
      <div class="services-section">
        <div class="section-header">
          <h2 class="section-title">Statut des Services</h2>
          <p class="section-description">État de fonctionnement des composants critiques</p>
        </div>
        
        <div class="services-grid">
          <ServiceStatusCard
            v-for="service in services"
            :key="service.id"
            :name="service.name"
            :description="service.description"
            :status="service.status"
            :icon="service.icon"
            :response-time="service.responseTime"
            :last-check="service.lastCheck"
            :uptime="service.uptime"
            :error-message="service.errorMessage"
          />
        </div>
      </div>

      <!-- Métriques système -->
      <div class="metrics-section">
        <div class="section-header">
          <h2 class="section-title">Métriques Système</h2>
          <p class="section-description">Performances et utilisation des ressources</p>
        </div>
        
        <SystemMetrics :metrics="systemMetrics" />
      </div>

      <!-- Graphiques de performance -->
      <div class="performance-section">
        <div class="section-header">
          <h2 class="section-title">Évolution des Performances</h2>
          <p class="section-description">Tendances et analyses temporelles</p>
        </div>
        
        <div class="charts-grid">
          <PerformanceChart
            title="Utilisation CPU"
            :data="performanceData.cpu"
            color="#3B82F6"
          />
          
          <PerformanceChart
            title="Utilisation Mémoire"
            :data="performanceData.memory"
            color="#10B981"
          />
          
          <PerformanceChart
            title="Trafic Réseau"
            :data="performanceData.network"
            color="#8B5CF6"
          />
          
          <PerformanceChart
            title="Temps de Réponse"
            :data="performanceData.responseTime"
            color="#F59E0B"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useMonitoringStore } from '@/stores/monitoring'
import ServiceStatusCard from '@/components/monitoring/ServiceStatusCard.vue'
import SystemMetrics from '@/components/monitoring/SystemMetrics.vue'
import PerformanceChart from '@/components/monitoring/PerformanceChart.vue'

const monitoringStore = useMonitoringStore()

// Getters du store
const {
  services,
  systemMetrics,
  performanceData,
  isLoading,
  lastUpdate,
  onlineServices,
  offlineServices,
  warningServices,
  overallStatus,
  overallUptime
} = monitoringStore

// Computed properties
const overallStatusClass = computed(() => {
  return {
    'status-healthy': overallStatus.value === 'healthy',
    'status-warning': overallStatus.value === 'warning',
    'status-critical': overallStatus.value === 'critical'
  }
})

const overallStatusText = computed(() => {
  const statusMap = {
    healthy: 'Tous les services opérationnels',
    warning: 'Certains services en alerte',
    critical: 'Services critiques hors service'
  }
  return statusMap[overallStatus.value] || 'État inconnu'
})

const formatLastUpdate = computed(() => {
  if (!lastUpdate.value) return 'Jamais'
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(lastUpdate.value)
})

// Actions
const refreshAll = async () => {
  await monitoringStore.checkAllServices()
  await monitoringStore.updateSystemMetrics()
}

// Lifecycle
onMounted(() => {
  refreshAll()
  monitoringStore.startAutoRefresh()
})
</script>

<style scoped>
.admin-monitoring-container {
  @apply p-6 space-y-6;
}

.monitoring-header {
  @apply bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white;
}

.header-content {
  @apply flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0;
}

.header-title {
  @apply flex-1;
}

.title-light {
  @apply text-2xl font-bold text-white;
}

.subtitle-light {
  @apply text-blue-100;
}

.header-status {
  @apply flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6;
}

.overall-status {
  @apply flex items-center space-x-4 p-4 rounded-lg bg-white/10 backdrop-blur-sm;
}

.status-indicator {
  @apply flex items-center space-x-2;
}

.status-dot {
  @apply w-3 h-3 rounded-full;
}

.status-healthy .status-dot {
  @apply bg-green-400;
}

.status-warning .status-dot {
  @apply bg-yellow-400;
}

.status-critical .status-dot {
  @apply bg-red-400;
}

.status-text {
  @apply text-sm font-medium;
}

.uptime-info {
  @apply text-center;
}

.uptime-value {
  @apply block text-2xl font-bold;
}

.uptime-label {
  @apply block text-xs text-blue-100;
}

.header-actions {
  @apply flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4;
}

.refresh-btn {
  @apply flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors duration-200 disabled:opacity-50;
}

.last-update {
  @apply text-center sm:text-left;
}

.update-label {
  @apply block text-xs text-blue-100;
}

.update-time {
  @apply block text-sm font-medium;
}

.services-summary {
  @apply grid grid-cols-1 sm:grid-cols-3 gap-4;
}

.summary-card {
  @apply flex items-center space-x-3 p-4 rounded-lg;
}

.summary-card.online {
  @apply bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800;
}

.summary-card.warning {
  @apply bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800;
}

.summary-card.offline {
  @apply bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800;
}

.summary-icon {
  @apply flex items-center justify-center w-10 h-10 rounded-lg;
}

.summary-card.online .summary-icon {
  @apply bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300;
}

.summary-card.warning .summary-icon {
  @apply bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300;
}

.summary-card.offline .summary-icon {
  @apply bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300;
}

.summary-content {
  @apply flex flex-col;
}

.summary-value {
  @apply text-2xl font-bold text-gray-900 dark:text-white;
}

.summary-label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.monitoring-grid {
  @apply space-y-8;
}

.section-header {
  @apply mb-6;
}

.section-title {
  @apply text-xl font-semibold text-gray-900 dark:text-white mb-2;
}

.section-description {
  @apply text-gray-600 dark:text-gray-400;
}

.services-grid {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-6;
}

.metrics-section {
  @apply w-full;
}

.performance-section {
  @apply w-full;
}

.charts-grid {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-6;
}
</style> 
