<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full text-center">
      <!-- Icône -->
      <div class="flex justify-center">
        <div class="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
          <ExclamationTriangleIcon class="w-12 h-12 text-gray-400" />
        </div>
      </div>
      
      <!-- Titre -->
      <h1 class="mt-6 text-3xl font-bold text-gray-900">
        Page non trouvée
      </h1>
      
      <!-- Description -->
      <p class="mt-2 text-gray-600">
        Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      
      <!-- Actions -->
      <div class="mt-8 space-y-4">
        <button
          @click="goBack"
          class="btn-secondary w-full"
        >
          <ArrowLeftIcon class="h-4 w-4 mr-2" />
          Retour en arrière
        </button>
        
        <router-link
          to="/dashboard"
          class="btn-primary w-full inline-flex items-center justify-center"
        >
          <HomeIcon class="h-4 w-4 mr-2" />
          Retour au tableau de bord
        </router-link>
      </div>
      
      <!-- Code d'erreur -->
      <div class="mt-8 text-center">
        <p class="text-sm text-gray-500">
          Code d'erreur : 404
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  HomeIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()

const goBack = () => {
  router.go(-1)
}
</script> 
