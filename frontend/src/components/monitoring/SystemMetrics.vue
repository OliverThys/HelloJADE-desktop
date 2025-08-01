<template>
  <div class="system-metrics">
    <div class="metrics-grid">
      <div class="metric-card" v-for="metric in metrics" :key="metric.key">
        <div class="metric-header">
          <div class="metric-icon" :class="metric.colorClass">
            <component :is="metric.icon" class="w-5 h-5" />
          </div>
          <div class="metric-info">
            <h4 class="metric-title">{{ metric.title }}</h4>
            <p class="metric-description">{{ metric.description }}</p>
          </div>
        </div>
        
        <div class="metric-value-section">
          <div class="metric-value">{{ metric.value }}</div>
          <div class="metric-unit">{{ metric.unit }}</div>
        </div>
        
        <div class="metric-progress" v-if="metric.showProgress">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :class="metric.progressColorClass"
              :style="{ width: `${metric.percentage}%` }"
            ></div>
          </div>
          <span class="progress-text">{{ metric.percentage }}%</span>
        </div>
        
        <div class="metric-trend" v-if="metric.trend">
          <span 
            class="trend-indicator"
            :class="metric.trend > 0 ? 'trend-up' : 'trend-down'"
          >
            {{ metric.trend > 0 ? '↗' : '↘' }}
            {{ Math.abs(metric.trend) }}%
          </span>
          <span class="trend-period">vs hier</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { 
  CpuChipIcon, 
  ServerIcon, 
  WifiIcon, 
  ClockIcon,
  CircleStackIcon,
  UserGroupIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
  metrics: {
    type: Array,
    default: () => [
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
    ]
  }
})

const iconMap = {
  CpuChipIcon,
  ServerIcon,
  WifiIcon,
  ClockIcon,
  CircleStackIcon,
  UserGroupIcon
}

// Mapper les icônes
props.metrics.forEach(metric => {
  metric.icon = iconMap[metric.icon] || CpuChipIcon
})
</script>

<style scoped>
.system-metrics {
  @apply w-full;
}

.metrics-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}

.metric-card {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 hover:shadow-xl;
}

.metric-header {
  @apply flex items-start space-x-3 mb-4;
}

.metric-icon {
  @apply flex items-center justify-center w-10 h-10 rounded-lg;
}

.metric-info {
  @apply flex-1;
}

.metric-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white mb-1;
}

.metric-description {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.metric-value-section {
  @apply flex items-baseline space-x-1 mb-4;
}

.metric-value {
  @apply text-3xl font-bold text-gray-900 dark:text-white;
}

.metric-unit {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.metric-progress {
  @apply flex items-center space-x-3 mb-3;
}

.progress-bar {
  @apply flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full rounded-full transition-all duration-500 ease-out;
}

.progress-text {
  @apply text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[3rem];
}

.metric-trend {
  @apply flex items-center space-x-2;
}

.trend-indicator {
  @apply text-sm font-medium;
}

.trend-up {
  @apply text-green-600 dark:text-green-400;
}

.trend-down {
  @apply text-red-600 dark:text-red-400;
}

.trend-period {
  @apply text-xs text-gray-500 dark:text-gray-400;
}
</style> 