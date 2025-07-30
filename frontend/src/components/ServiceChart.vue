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
    service: string
    calls: number
    patients: number
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
  const labels = props.data.map(item => item.service)
  const callsData = props.data.map(item => item.calls)
  const patientsData = props.data.map(item => item.patients)

  // Couleurs pour les services
  const colors = [
    'rgb(59, 130, 246)',   // Bleu
    'rgb(16, 185, 129)',   // Vert
    'rgb(245, 158, 11)',   // Orange
    'rgb(239, 68, 68)',    // Rouge
    'rgb(139, 92, 246)',   // Violet
    'rgb(236, 72, 153)'    // Rose
  ]

  // Créer le nouveau graphique
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Appels',
          data: callsData,
          backgroundColor: colors.slice(0, callsData.length),
          borderColor: colors.slice(0, callsData.length),
          borderWidth: 1
        },
        {
          label: 'Patients',
          data: patientsData,
          backgroundColor: colors.slice(0, patientsData.length).map(color => color.replace('rgb', 'rgba').replace(')', ', 0.5)')),
          borderColor: colors.slice(0, patientsData.length),
          borderWidth: 1
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
            text: 'Service'
          }
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Nombre'
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
  const labels = props.data.map(item => item.service)
  const callsData = props.data.map(item => item.calls)
  const patientsData = props.data.map(item => item.patients)

  chart.data.labels = labels
  chart.data.datasets[0].data = callsData
  chart.data.datasets[1].data = patientsData

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
