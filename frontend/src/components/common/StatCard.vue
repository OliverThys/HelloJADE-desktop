<template>
  <div 
    class="stat-card group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl shadow-lg border border-gray-100 dark:bg-slate-800/80 dark:border-slate-700/50 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1"
    :class="cardClasses"
  >
    <!-- Gradient de fond -->
    <div 
      class="absolute inset-0 opacity-10 transition-opacity duration-300 group-hover:opacity-20"
      :class="gradientClasses"
    ></div>
    
    <!-- Contenu -->
    <div class="relative p-6">
      <!-- En-tête -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center">
          <!-- Icône -->
          <div 
            class="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110"
            :class="iconContainerClasses"
          >
            <component 
              :is="icon" 
              class="w-6 h-6"
              :class="iconClasses"
            />
          </div>
          
          <!-- Titre -->
          <div class="ml-4">
            <h3 class="text-sm font-semibold text-slate-600 dark:text-green-400 uppercase tracking-wider">
              {{ title }}
            </h3>
            <p v-if="subtitle" class="text-xs text-slate-500 dark:text-green-400 mt-1">
              {{ subtitle }}
            </p>
          </div>
        </div>
        
        <!-- Badge optionnel -->
        <div v-if="badge" class="flex items-center">
          <span 
            class="px-3 py-1 text-xs font-semibold rounded-full transition-colors duration-200 border"
            :class="badgeClasses"
          >
            {{ badge }}
          </span>
        </div>
      </div>
      
      <!-- Valeur principale -->
      <div class="mb-2">
        <p 
          class="text-4xl font-bold"
          :class="valueClasses"
        >
          {{ value }}
        </p>
      </div>
      
      <!-- Changement et description -->
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <component 
            v-if="changeIcon" 
            :is="changeIcon" 
            class="w-4 h-4"
            :class="changeIconClasses"
          />
          <span 
            v-if="change !== null"
            class="text-sm font-semibold"
            :class="changeClasses"
          >
            {{ formatChange(change) }}
          </span>
        </div>
        
        <p v-if="description" class="text-xs text-slate-500 dark:text-slate-400">
          {{ description }}
        </p>
      </div>
      
      <!-- Indicateur de tendance -->
      <div v-if="trend" class="mt-4">
        <div class="flex items-center space-x-2">
          <div class="flex-1 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
            <div 
              class="h-2 rounded-full transition-all duration-500"
              :class="trendColorClasses"
              :style="{ width: `${Math.min(Math.abs(trend), 100)}%` }"
            ></div>
          </div>
          <span class="text-xs font-medium text-slate-600 dark:text-slate-400">
            {{ Math.abs(trend) }}%
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/vue/24/outline'

interface Props {
  title: string
  value: string | number
  subtitle?: string
  description?: string
  change?: number | null
  badge?: string
  trend?: number
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  icon: any
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'neutral',
  change: null,
  trend: undefined
})

const cardClasses = computed(() => {
  switch (props.variant) {
    case 'success':
      return 'hover:border-green-200 dark:hover:border-green-700'
    case 'warning':
      return 'hover:border-yellow-200 dark:hover:border-yellow-700'
    case 'danger':
      return 'hover:border-red-200 dark:hover:border-red-700'
    case 'info':
      return 'hover:border-blue-200 dark:hover:border-blue-700'
    case 'neutral':
      return 'hover:border-slate-200 dark:hover:border-slate-700'
    default:
      return 'hover:border-slate-200 dark:hover:border-slate-700'
  }
})

const gradientClasses = computed(() => {
  switch (props.variant) {
    case 'success':
      return 'bg-gradient-to-br from-green-400 to-green-600'
    case 'warning':
      return 'bg-gradient-to-br from-yellow-400 to-yellow-600'
    case 'danger':
      return 'bg-gradient-to-br from-red-400 to-red-600'
    case 'info':
      return 'bg-gradient-to-br from-blue-400 to-blue-600'
    case 'neutral':
      return 'bg-gradient-to-br from-slate-400 to-slate-600'
    default:
      return 'bg-gradient-to-br from-slate-400 to-slate-600'
  }
})

const iconContainerClasses = computed(() => {
  switch (props.variant) {
    case 'success':
      return 'bg-green-100 dark:bg-green-900/50'
    case 'warning':
      return 'bg-yellow-100 dark:bg-yellow-900/50'
    case 'danger':
      return 'bg-red-100 dark:bg-red-900/50'
    case 'info':
      return 'bg-blue-100 dark:bg-blue-900/50'
    case 'neutral':
      return 'bg-slate-100 dark:bg-slate-900/50'
    default:
      return 'bg-indigo-100 dark:bg-indigo-900/50'
  }
})

const iconClasses = computed(() => {
  switch (props.variant) {
    case 'success':
      return 'text-green-600 dark:text-green-400'
    case 'warning':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'danger':
      return 'text-red-600 dark:text-red-400'
    case 'info':
      return 'text-blue-600 dark:text-blue-400'
    case 'neutral':
      return 'text-slate-600 dark:text-slate-400'
    default:
      return 'text-indigo-600 dark:text-indigo-400'
  }
})

const valueClasses = computed(() => {
  switch (props.variant) {
    case 'success':
      return 'text-green-700 dark:text-green-300'
    case 'warning':
      return 'text-yellow-700 dark:text-yellow-300'
    case 'danger':
      return 'text-red-700 dark:text-red-300'
    case 'info':
      return 'text-blue-700 dark:text-blue-300'
    case 'neutral':
      return 'text-slate-700 dark:text-slate-300'
    default:
      return 'text-indigo-700 dark:text-indigo-300'
  }
})

const badgeClasses = computed(() => {
  switch (props.variant) {
    case 'success':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700'
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700'
    case 'danger':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700'
    case 'info':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700'
    case 'neutral':
      return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/50 dark:text-slate-300 dark:border-slate-700'
    default:
      return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-700'
  }
})

const changeIcon = computed(() => {
  if (props.change === null) return null
  if (props.change > 0) return ArrowUpIcon
  if (props.change < 0) return ArrowDownIcon
  return MinusIcon
})

const changeIconClasses = computed(() => {
  if (props.change === null) return ''
  if (props.change > 0) return 'text-green-600 dark:text-green-400'
  if (props.change < 0) return 'text-red-600 dark:text-red-400'
  return 'text-slate-600 dark:text-slate-400'
})

const changeClasses = computed(() => {
  if (props.change === null) return ''
  if (props.change > 0) return 'text-green-600 dark:text-green-400'
  if (props.change < 0) return 'text-red-600 dark:text-red-400'
  return 'text-slate-600 dark:text-slate-400'
})

const trendColorClasses = computed(() => {
  if (!props.trend) return 'bg-slate-400'
  if (props.trend > 0) return 'bg-green-500'
  return 'bg-red-500'
})

const formatChange = (change: number | null): string => {
  if (change === null) return ''
  const sign = change > 0 ? '+' : ''
  return `${sign}${change.toFixed(1)}%`
}
</script>

<style scoped>
.stat-card {
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

/* Animation d'entrée */
.stat-card {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Effet de brillance au survol */
.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  transition: left 0.5s;
}

.stat-card:hover::before {
  left: 100%;
}
</style> 
