<template>
  <div class="w-full h-full">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import Chart from 'chart.js/auto'

// Props
interface Props {
  data: Array<{
    time: string
    cpu: number
    memory: number
  }>
}

const props = defineProps<Props>()

// Références
const chartCanvas = ref<HTMLCanvasElement>()
let chart: Chart | null = null

// Méthodes
const createChart = () => {
  if (!chartCanvas.value) return

  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return

  // Détruire le graphique existant
  if (chart) {
    chart.destroy()
  }

  // Préparer les données
  const labels = props.data.map(item => item.time)
  const cpuData = props.data.map(item => item.cpu)
  const memoryData = props.data.map(item => item.memory)

  // Créer le nouveau graphique
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'CPU (%)',
          data: cpuData,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
          fill: false,
          yAxisID: 'y'
        },
        {
          label: 'Mémoire (%)',
          data: memoryData,
          borderColor: 'rgb(139, 92, 246)',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          tension: 0.4,
          fill: false,
          yAxisID: 'y'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            usePointStyle: true,
            padding: 20
          }
        },
        tooltip: {
          mode: 'index' as const,
          intersect: false
        }
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Heure'
          }
        },
        y: {
          type: 'linear' as const,
          display: true,
          position: 'left' as const,
          title: {
            display: true,
            text: 'Pourcentage (%)'
          },
          beginAtZero: true,
          max: 100
        }
      },
      interaction: {
        mode: 'nearest' as const,
        axis: 'x' as const,
        intersect: false
      }
    }
  })
}

const updateChart = () => {
  if (!chart) return

  // Mettre à jour les données
  const labels = props.data.map(item => item.time)
  const cpuData = props.data.map(item => item.cpu)
  const memoryData = props.data.map(item => item.memory)

  chart.data.labels = labels
  chart.data.datasets[0].data = cpuData
  chart.data.datasets[1].data = memoryData

  chart.update()
}

// Lifecycle
onMounted(async () => {
  await nextTick()
  createChart()
})

// Watcher pour mettre à jour le graphique quand les données changent
watch(() => props.data, () => {
  updateChart()
}, { deep: true })
</script> 
