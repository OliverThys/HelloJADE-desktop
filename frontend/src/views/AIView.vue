<template>
  <div class="min-h-screen bg-gray-50 dark:bg-slate-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- En-tête -->
      <div class="mb-8">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="title-light">Intelligence Artificielle</h1>
            <p class="subtitle-light mt-2">
              Transcription et analyse automatique des appels
            </p>
          </div>
        </div>
      </div>

      <!-- Contenu principal -->
      <div class="chart-container-light">
        <div class="text-center">
          <div class="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
            <CpuChipIcon class="w-10 h-10 text-white" />
          </div>
          <h2 class="chart-title-light mb-4">Intelligence Artificielle HelloJADE</h2>
          <p class="text-light-muted mb-8">
            Découvrez nos outils d'IA avancés pour améliorer le suivi des patients
          </p>
          
          <div class="bg-white rounded-lg p-6 border border-gray-200">
            <h3 class="text-lg font-semibold text-slate-800 mb-4">Fonctionnalités disponibles</h3>
            <ul class="space-y-3">
              <li class="flex items-center space-x-3">
                <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                <span class="text-slate-700">Analyse prédictive des risques</span>
              </li>
              <li class="flex items-center space-x-3">
                <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                <span class="text-slate-700">Optimisation des plannings d'appels</span>
              </li>
              <li class="flex items-center space-x-3">
                <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                <span class="text-slate-700">Détection automatique des anomalies</span>
              </li>
              <li class="flex items-center space-x-3">
                <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                <span class="text-slate-700">Recommandations personnalisées</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CpuChipIcon } from '@heroicons/vue/24/outline'
</script> 
