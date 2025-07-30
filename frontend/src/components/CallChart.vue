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
    date: string
    calls: number
    successful: number
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
  const labels = props.data.map(item => item.date)
  const callsData = props.data.map(item => item.calls)
  const successfulData = props.data.map(item => item.successful)

  // Créer le nouveau graphique
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Total des appels',
          data: callsData,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: false
        },
        {
          label: 'Appels réussis',
          data: successfulData,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          fill: false
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
            text: 'Date'
          }
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Nombre d\'appels'
          },
          beginAtZero: true
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
  const labels = props.data.map(item => item.date)
  const callsData = props.data.map(item => item.calls)
  const successfulData = props.data.map(item => item.successful)

  chart.data.labels = labels
  chart.data.datasets[0].data = callsData
  chart.data.datasets[1].data = successfulData

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
