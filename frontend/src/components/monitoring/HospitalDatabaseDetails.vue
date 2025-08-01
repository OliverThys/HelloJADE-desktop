<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Détails Base de données Hôpital
      </h3>
      <div class="flex items-center space-x-2">
        <div class="w-2 h-2 bg-green-500 rounded-full"></div>
        <span class="text-sm text-gray-600 dark:text-gray-400">Oracle Database</span>
      </div>
    </div>

    <div v-if="service?.details" class="space-y-4">
      <!-- Statistiques générales -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {{ service.details.totalRecords?.toLocaleString() }}
          </div>
          <div class="text-sm text-blue-600 dark:text-blue-400">Enregistrements totaux</div>
        </div>
        
        <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div class="text-2xl font-bold text-green-600 dark:text-green-400">
            {{ service.details.occupiedRooms || 0 }}
          </div>
          <div class="text-sm text-green-600 dark:text-green-400">Chambres occupées</div>
        </div>
        
        <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {{ service.details.activeHospitalizations || 0 }}
          </div>
          <div class="text-sm text-purple-600 dark:text-purple-400">Hospitalisations actives</div>
        </div>
      </div>

      <!-- Détails par table -->
      <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h4 class="text-md font-medium text-gray-900 dark:text-white mb-3">
          Statistiques par table
        </h4>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div 
            v-for="(count, tableName) in service.details.tableStats" 
            :key="tableName"
            class="flex justify-between items-center p-2 bg-white dark:bg-gray-600 rounded border"
          >
            <span class="text-sm text-gray-600 dark:text-gray-300">
              {{ getTableDisplayName(tableName) }}
            </span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ count.toLocaleString() }}
            </span>
          </div>
        </div>
      </div>

      <!-- Informations système -->
      <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h4 class="text-md font-medium text-gray-900 dark:text-white mb-3">
          Informations système
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span class="text-sm text-gray-600 dark:text-gray-400">Temps de réponse:</span>
            <span class="ml-2 text-sm font-medium text-gray-900 dark:text-white">
              {{ service.responseTime }}ms
            </span>
          </div>
          <div>
            <span class="text-sm text-gray-600 dark:text-gray-400">Uptime:</span>
            <span class="ml-2 text-sm font-medium text-gray-900 dark:text-white">
              {{ service.uptime }}%
            </span>
          </div>
          <div v-if="service.details.currentTime">
            <span class="text-sm text-gray-600 dark:text-gray-400">Heure serveur:</span>
            <span class="ml-2 text-sm font-medium text-gray-900 dark:text-white">
              {{ formatOracleDate(service.details.currentTime) }}
            </span>
          </div>
          <div>
            <span class="text-sm text-gray-600 dark:text-gray-400">Dernière vérification:</span>
            <span class="ml-2 text-sm font-medium text-gray-900 dark:text-white">
              {{ formatDate(service.lastCheck) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-8">
      <div class="text-gray-500 dark:text-gray-400">
        Aucune donnée disponible
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ServiceStatus } from '@/stores/monitoring'

interface Props {
  service?: ServiceStatus
}

const props = defineProps<Props>()

const getTableDisplayName = (tableName: string): string => {
  const displayNames: Record<string, string> = {
    'PATIENTS': 'Patients',
    'MEDECINS': 'Médecins',
    'SERVICES': 'Services',
    'CHAMBRES': 'Chambres',
    'HOSPITALISATIONS': 'Hospitalisations',
    'RENDEZ_VOUS': 'Rendez-vous',
    'TELEPHONES': 'Téléphones'
  }
  return displayNames[tableName] || tableName
}

const formatOracleDate = (dateString: string): string => {
  try {
    // Oracle retourne souvent une date au format spécifique
    const date = new Date(dateString)
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return dateString
  }
}

const formatDate = (date?: Date): string => {
  if (!date) return 'N/A'
  return date.toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script> 