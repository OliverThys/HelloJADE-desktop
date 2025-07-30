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
    incoming: number
    outgoing: number
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
  const incomingData = props.data.map(item => item.incoming)
  const outgoingData = props.data.map(item => item.outgoing)

  // Créer le nouveau graphique
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Trafic entrant (Mbps)',
          data: incomingData,
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 1
        },
        {
          label: 'Trafic sortant (Mbps)',
          data: outgoingData,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
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
            text: 'Heure'
          }
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Débit (Mbps)'
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
  const labels = props.data.map(item => item.time)
  const incomingData = props.data.map(item => item.incoming)
  const outgoingData = props.data.map(item => item.outgoing)

  chart.data.labels = labels
  chart.data.datasets[0].data = incomingData
  chart.data.datasets[1].data = outgoingData

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
