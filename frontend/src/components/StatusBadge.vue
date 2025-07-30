<template>
  <div class="flex items-center space-x-1">
    <span
      :class="[
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        statusClasses
      ]"
    >
      <span class="mr-1">{{ statusIcon }}</span>
      {{ statusText }}
    </span>
    <span
      v-if="attempts > 0"
      class="text-xs text-gray-500"
      :title="`${attempts} tentative${attempts > 1 ? 's' : ''}`"
    >
      ({{ attempts }})
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { translateCallStatus, getCallStatusColor, getCallStatusIcon, isValidCallStatus } from '@/utils/statusTranslations'
import type { CallStatus } from '@/utils/statusTranslations'

interface Props {
  status: string
  attempts?: number
}

const props = withDefaults(defineProps<Props>(), {
  attempts: 0
})

const statusText = computed(() => {
  if (isValidCallStatus(props.status)) {
    return translateCallStatus(props.status as CallStatus)
  }
  return 'Inconnu'
})

const statusClasses = computed(() => {
  if (isValidCallStatus(props.status)) {
    return getCallStatusColor(props.status as CallStatus)
  }
  return 'bg-gray-100 text-gray-800 border-gray-200'
})

const statusIcon = computed(() => {
  if (isValidCallStatus(props.status)) {
    return getCallStatusIcon(props.status as CallStatus)
  }
  return '❓'
})
</script> 