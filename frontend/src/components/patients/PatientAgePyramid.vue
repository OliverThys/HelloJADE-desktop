<template>
  <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-slate-800 dark:text-white">
        Pyramide des Âges
      </h3>
      <div class="flex items-center space-x-2">
        <button
          v-for="period in periods"
          :key="period.value"
          @click="selectedPeriod = period.value"
          :class="[
            'px-3 py-1 text-sm rounded-lg transition-colors',
            selectedPeriod === period.value
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
          ]"
        >
          {{ period.label }}
        </button>
      </div>
    </div>
    
    <div class="relative h-80">
      <canvas ref="chartCanvas"></canvas>
    </div>
    
    <div class="mt-4 grid grid-cols-3 gap-4 text-center">
      <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ stats.jeunes }}</div>
        <div class="text-sm text-blue-600 dark:text-blue-400">0-18 ans</div>
      </div>
      <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ stats.adultes }}</div>
        <div class="text-sm text-green-600 dark:text-green-400">19-65 ans</div>
      </div>
      <div class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
        <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ stats.seniors }}</div>
        <div class="text-sm text-purple-600 dark:text-purple-400">65+ ans</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import Chart from 'chart.js/auto'

interface Props {
  patients: Array<{
    age: number
    sexe: string
  }>
}

const props = defineProps<Props>()

const chartCanvas = ref<HTMLCanvasElement>()
let chart: Chart | null = null

const selectedPeriod = ref('all')
const periods = [
  { label: 'Tous', value: 'all' },
  { label: 'Hommes', value: 'M' },
  { label: 'Femmes', value: 'F' }
]

// Calculer les statistiques par tranche d'âge
const stats = computed(() => {
  const filteredPatients = selectedPeriod.value === 'all' 
    ? props.patients 
    : props.patients.filter(p => p.sexe === selectedPeriod.value)

  const jeunes = filteredPatients.filter(p => p.age <= 18).length
  const adultes = filteredPatients.filter(p => p.age > 18 && p.age <= 65).length
  const seniors = filteredPatients.filter(p => p.age > 65).length

  return { jeunes, adultes, seniors }
})

// Créer la pyramide des âges
const createPyramid = () => {
  if (!chartCanvas.value) return

  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return

  if (chart) {
    chart.destroy()
  }

  // Grouper les patients par tranche d'âge et sexe
  const ageGroups = [
    { label: '0-18', min: 0, max: 18 },
    { label: '19-30', min: 19, max: 30 },
    { label: '31-45', min: 31, max: 45 },
    { label: '46-65', min: 46, max: 65 },
    { label: '65+', min: 66, max: 120 }
  ]

  const filteredPatients = selectedPeriod.value === 'all' 
    ? props.patients 
    : props.patients.filter(p => p.sexe === selectedPeriod.value)

  const maleData = ageGroups.map(group => {
    const count = filteredPatients.filter(p => 
      p.age >= group.min && p.age <= group.max && p.sexe === 'M'
    ).length
    return selectedPeriod.value === 'all' ? count : count
  })

  const femaleData = ageGroups.map(group => {
    const count = filteredPatients.filter(p => 
      p.age >= group.min && p.age <= group.max && p.sexe === 'F'
    ).length
    return selectedPeriod.value === 'all' ? -count : 0
  })

  const labels = ageGroups.map(g => g.label)

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Hommes',
          data: maleData,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1
        },
        {
          label: 'Femmes',
          data: femaleData,
          backgroundColor: 'rgba(236, 72, 153, 0.8)',
          borderColor: 'rgba(236, 72, 153, 1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: {
          display: selectedPeriod.value === 'all',
          position: 'top'
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = Math.abs(context.parsed.x)
              return `${context.dataset.label}: ${value} patients`
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          grid: {
            display: false
          },
          ticks: {
            callback: (value) => Math.abs(Number(value))
          }
        },
        y: {
          display: true,
          grid: {
            display: false
          }
        }
      }
    }
  })
}

// Surveiller les changements
watch([() => props.patients, selectedPeriod], () => {
  nextTick(() => {
    createPyramid()
  })
}, { deep: true })

onMounted(() => {
  createPyramid()
})
</script> 