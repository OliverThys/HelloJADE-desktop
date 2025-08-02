<template>
  <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-slate-800 dark:text-white">
        Admissions par Jour/Heure
      </h3>
      <div class="flex items-center space-x-2">
        <button
          v-for="view in views"
          :key="view.value"
          @click="selectedView = view.value"
          :class="[
            'px-3 py-1 text-sm rounded-lg transition-colors',
            selectedView === view.value
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
          ]"
        >
          {{ view.label }}
        </button>
      </div>
    </div>
    
    <div class="relative h-80">
      <canvas ref="chartCanvas"></canvas>
    </div>
    
    <div class="mt-4 flex items-center justify-center space-x-4">
      <div class="flex items-center space-x-2">
        <div class="w-4 h-4 bg-gray-100 dark:bg-gray-700 rounded"></div>
        <span class="text-sm text-gray-600 dark:text-gray-400">0</span>
      </div>
      <div class="flex items-center space-x-2">
        <div class="w-4 h-4 bg-blue-200 dark:bg-blue-800 rounded"></div>
        <span class="text-sm text-gray-600 dark:text-gray-400">1-3</span>
      </div>
      <div class="flex items-center space-x-2">
        <div class="w-4 h-4 bg-blue-400 dark:bg-blue-600 rounded"></div>
        <span class="text-sm text-gray-600 dark:text-gray-400">4-6</span>
      </div>
      <div class="flex items-center space-x-2">
        <div class="w-4 h-4 bg-blue-600 dark:bg-blue-400 rounded"></div>
        <span class="text-sm text-gray-600 dark:text-gray-400">7-9</span>
      </div>
      <div class="flex items-center space-x-2">
        <div class="w-4 h-4 bg-blue-800 dark:bg-blue-200 rounded"></div>
        <span class="text-sm text-gray-600 dark:text-gray-400">10+</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import Chart from 'chart.js/auto'
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix'

// Enregistrer le plugin Matrix
Chart.register(MatrixController, MatrixElement)

interface Props {
  patients: Array<{
    created_date: string
    sync_timestamp: string
  }>
}

const props = defineProps<Props>()

const chartCanvas = ref<HTMLCanvasElement>()
let chart: Chart | null = null

const selectedView = ref('week')
const views = [
  { label: 'Semaine', value: 'week' },
  { label: 'Mois', value: 'month' }
]

// Générer les données de la heatmap
const generateHeatmapData = () => {
  const days = selectedView.value === 'week' 
    ? ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
    : ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4']
  
  const hours = selectedView.value === 'week'
    ? ['8h', '10h', '12h', '14h', '16h', '18h', '20h']
    : ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  // Simuler des données d'admission (à remplacer par de vraies données)
  const data = []
  for (let i = 0; i < days.length; i++) {
    for (let j = 0; j < hours.length; j++) {
      // Générer des données aléatoires pour la démo
      const count = Math.floor(Math.random() * 12)
      data.push({
        x: j,
        y: i,
        v: count
      })
    }
  }

  return { data, days, hours }
}

// Créer la heatmap
const createHeatmap = () => {
  if (!chartCanvas.value) return

  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return

  if (chart) {
    chart.destroy()
  }

  const { data, days, hours } = generateHeatmapData()

  // Créer la matrice de données
  const matrix = []
  for (let i = 0; i < days.length; i++) {
    const row = []
    for (let j = 0; j < hours.length; j++) {
      const point = data.find(d => d.x === j && d.y === i)
      row.push(point ? point.v : 0)
    }
    matrix.push(row)
  }

  chart = new Chart(ctx, {
    type: 'matrix',
    data: {
      datasets: [{
        label: 'Admissions',
        data: data,
        backgroundColor(context) {
          const value = context.dataset.data[context.dataIndex].v
          const alpha = Math.min(value / 10, 1)
          return `rgba(59, 130, 246, ${alpha})`
        },
        borderColor: 'rgba(59, 130, 246, 0.3)',
        borderWidth: 1,
        width: ({ chart }) => (chart.chartArea || {}).width / hours.length - 1,
        height: ({ chart }) => (chart.chartArea || {}).height / days.length - 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            title() {
              return ''
            },
            label(context) {
              const point = context.dataset.data[context.dataIndex]
              const day = days[point.y]
              const hour = hours[point.x]
              return `${day} ${hour}: ${point.v} admissions`
            }
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          min: 0,
          max: hours.length - 1,
          ticks: {
            stepSize: 1,
            callback(value) {
              return hours[value]
            }
          },
          grid: {
            display: false
          }
        },
        y: {
          type: 'linear',
          min: 0,
          max: days.length - 1,
          ticks: {
            stepSize: 1,
            callback(value) {
              return days[value]
            }
          },
          grid: {
            display: false
          }
        }
      }
    }
  })
}

// Surveiller les changements
watch([() => props.patients, selectedView], () => {
  nextTick(() => {
    createHeatmap()
  })
}, { deep: true })

onMounted(() => {
  createHeatmap()
})
</script> 