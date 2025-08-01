<template>
  <div class="service-status-card">
    <div class="card-header">
      <div class="service-icon">
        <component :is="icon" class="w-6 h-6" />
      </div>
      <div class="service-info">
        <h3 class="service-name">{{ name }}</h3>
        <p class="service-description">{{ description }}</p>
      </div>
      <div class="status-indicator" :class="statusClass">
        <div class="status-dot"></div>
        <span class="status-text">{{ statusText }}</span>
      </div>
    </div>
    
    <div class="card-body" v-if="showDetails">
      <div class="metrics-grid">
        <div class="metric" v-if="responseTime">
          <span class="metric-label">Temps de réponse</span>
          <span class="metric-value">{{ responseTime }}ms</span>
        </div>
        <div class="metric" v-if="lastCheck">
          <span class="metric-label">Dernière vérification</span>
          <span class="metric-value">{{ formatTime(lastCheck) }}</span>
        </div>
        <div class="metric" v-if="uptime">
          <span class="metric-label">Disponibilité</span>
          <span class="metric-value">{{ uptime }}%</span>
        </div>
      </div>
      
      <div class="error-message" v-if="errorMessage">
        <span class="error-icon">⚠️</span>
        <span class="error-text">{{ errorMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { 
  ServerIcon, 
  CircleStackIcon, 
  UserGroupIcon, 
  PhoneIcon,
  GlobeAltIcon,
  CogIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    validator: (value) => ['online', 'offline', 'warning', 'maintenance'].includes(value)
  },
  icon: {
    type: String,
    default: 'ServerIcon'
  },
  responseTime: {
    type: Number,
    default: null
  },
  lastCheck: {
    type: Date,
    default: null
  },
  uptime: {
    type: Number,
    default: null
  },
  errorMessage: {
    type: String,
    default: null
  },
  showDetails: {
    type: Boolean,
    default: true
  }
})

const iconMap = {
  ServerIcon,
  CircleStackIcon,
  UserGroupIcon,
  PhoneIcon,
  GlobeAltIcon,
  CogIcon
}

const icon = computed(() => iconMap[props.icon] || ServerIcon)

const statusClass = computed(() => {
  return {
    'status-online': props.status === 'online',
    'status-offline': props.status === 'offline',
    'status-warning': props.status === 'warning',
    'status-maintenance': props.status === 'maintenance'
  }
})

const statusText = computed(() => {
  const statusMap = {
    online: 'Fonctionne',
    offline: 'Hors service',
    warning: 'Problème',
    maintenance: 'Maintenance'
  }
  return statusMap[props.status] || 'Inconnu'
})

const formatTime = (date) => {
  if (!date) return 'N/A'
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date)
}
</script>

<style scoped>
.service-status-card {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 hover:shadow-xl;
}

.card-header {
  @apply flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700;
}

.service-icon {
  @apply flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white;
}

.service-info {
  @apply flex-1 ml-4;
}

.service-name {
  @apply text-lg font-semibold text-gray-900 dark:text-white mb-1;
}

.service-description {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.status-indicator {
  @apply flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium;
}

.status-dot {
  @apply w-3 h-3 rounded-full;
}

.status-online {
  @apply bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200;
}

.status-online .status-dot {
  @apply bg-green-500;
}

.status-offline {
  @apply bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200;
}

.status-offline .status-dot {
  @apply bg-red-500;
}

.status-warning {
  @apply bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200;
}

.status-warning .status-dot {
  @apply bg-yellow-500;
}

.status-maintenance {
  @apply bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200;
}

.status-maintenance .status-dot {
  @apply bg-blue-500;
}

.card-body {
  @apply p-6;
}

.metrics-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-4 mb-4;
}

.metric {
  @apply flex flex-col;
}

.metric-label {
  @apply text-xs text-gray-500 dark:text-gray-400 mb-1;
}

.metric-value {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.error-message {
  @apply flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg;
}

.error-icon {
  @apply text-red-500;
}

.error-text {
  @apply text-sm text-red-700 dark:text-red-300;
}
</style> 