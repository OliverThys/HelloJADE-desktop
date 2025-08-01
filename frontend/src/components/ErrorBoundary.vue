<template>
  <div v-if="error" class="error-boundary">
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
      <div class="flex items-center mb-4">
        <ExclamationTriangleIcon class="h-6 w-6 text-red-500 mr-3" />
        <h3 class="text-lg font-semibold text-red-800 dark:text-red-200">
          Une erreur est survenue
        </h3>
      </div>
      <p class="text-red-700 dark:text-red-300 mb-4">
        {{ error.message || 'Une erreur inattendue s\'est produite' }}
      </p>
      <div class="flex space-x-3">
        <button
          @click="retry"
          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
        >
          Réessayer
        </button>
        <button
          @click="reset"
          class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
        >
          Réinitialiser
        </button>
      </div>
    </div>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

interface Props {
  onRetry?: () => void
  onReset?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  onRetry: () => window.location.reload(),
  onReset: () => {
    localStorage.clear()
    window.location.reload()
  }
})

const error = ref<Error | null>(null)

onErrorCaptured((err: Error) => {
  console.error('Erreur capturée par ErrorBoundary:', err)
  error.value = err
  return false // Empêcher la propagation
})

const retry = () => {
  error.value = null
  props.onRetry()
}

const reset = () => {
  error.value = null
  props.onReset()
}
</script>

<style scoped>
.error-boundary {
  @apply w-full;
}
</style> 