<template>
  <div class="performance-chart">
    <div class="chart-header">
      <h3 class="chart-title">{{ title }}</h3>
      <div class="chart-controls">
        <button 
          v-for="period in periods" 
          :key="period.value"
          @click="selectedPeriod = period.value"
          :class="['period-btn', { active: selectedPeriod === period.value }]"
        >
          {{ period.label }}
        </button>
      </div>
    </div>
    
    <div class="chart-container">
      <canvas ref="chartCanvas" class="chart-canvas"></canvas>
    </div>
    
    <div class="chart-stats">
      <div class="stat-item">
        <span class="stat-label">Moyenne</span>
        <span class="stat-value">{{ averageValue }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Maximum</span>
        <span class="stat-value">{{ maxValue }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Minimum</span>
        <span class="stat-value">{{ minValue }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import Chart from 'chart.js/auto'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  data: {
    type: Array,
    required: true
  },
  type: {
    type: String,
    default: 'line',
    validator: (value) => ['line', 'bar', 'doughnut'].includes(value)
  },
  color: {
    type: String,
    default: '#3B82F6'
  }
})

const chartCanvas = ref(null)
const selectedPeriod = ref('24h')
let chart = null

const periods = [
  { label: '1H', value: '1h' },
  { label: '24H', value: '24h' },
  { label: '7J', value: '7d' },
  { label: '30J', value: '30d' }
]

const averageValue = computed(() => {
  if (!props.data.length) return '0'
  const sum = props.data.reduce((acc, val) => acc + val, 0)
  return Math.round(sum / props.data.length)
})

const maxValue = computed(() => {
  if (!props.data.length) return '0'
  return Math.max(...props.data)
})

const minValue = computed(() => {
  if (!props.data.length) return '0'
  return Math.min(...props.data)
})

const createChart = () => {
  if (chart) {
    chart.destroy()
  }

  const ctx = chartCanvas.value.getContext('2d')
  
  chart = new Chart(ctx, {
    type: props.type,
    data: {
      labels: generateLabels(),
      datasets: [{
        label: props.title,
        data: props.data,
        borderColor: props.color,
        backgroundColor: props.type === 'line' ? 'transparent' : props.color + '40',
        borderWidth: 2,
        fill: props.type === 'line',
        tension: 0.4,
        pointBackgroundColor: props.color,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          display: true,
          grid: {
            display: false
          },
          ticks: {
            color: '#6B7280',
            font: {
              size: 12
            }
          }
        },
        y: {
          display: true,
          grid: {
            color: '#E5E7EB',
            drawBorder: false
          },
          ticks: {
            color: '#6B7280',
            font: {
              size: 12
            }
          }
        }
      },
      elements: {
        point: {
          hoverBackgroundColor: props.color
        }
      }
    }
  })
}

const generateLabels = () => {
  const count = props.data.length
  const labels = []
  
  for (let i = 0; i < count; i++) {
    if (selectedPeriod.value === '1h') {
      labels.push(`${i * 5}min`)
    } else if (selectedPeriod.value === '24h') {
      labels.push(`${i}:00`)
    } else if (selectedPeriod.value === '7d') {
      const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
      labels.push(days[i % 7])
    } else {
      labels.push(`J${i + 1}`)
    }
  }
  
  return labels
}

onMounted(() => {
  createChart()
})

watch(() => [props.data, selectedPeriod], () => {
  createChart()
}, { deep: true })
</script>

<style scoped>
.performance-chart {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6;
}

.chart-header {
  @apply flex items-center justify-between mb-6;
}

.chart-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.chart-controls {
  @apply flex space-x-1;
}

.period-btn {
  @apply px-3 py-1 text-sm font-medium rounded-lg transition-colors duration-200;
  @apply text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white;
}

.period-btn.active {
  @apply bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300;
}

.chart-container {
  @apply relative h-64 mb-6;
}

.chart-canvas {
  @apply w-full h-full;
}

.chart-stats {
  @apply grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700;
}

.stat-item {
  @apply text-center;
}

.stat-label {
  @apply block text-xs text-gray-500 dark:text-gray-400 mb-1;
}

.stat-value {
  @apply block text-lg font-semibold text-gray-900 dark:text-white;
}
</style> 