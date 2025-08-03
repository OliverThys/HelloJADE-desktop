<template>
  <div class="flex items-center space-x-1">
    <span :class="statusClasses">
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
    return 'text-xs font-semibold px-2 py-1 rounded-md bg-white/80 dark:bg-slate-700/80 shadow-sm'
  }
  return 'text-gray-500 dark:text-slate-400 text-xs'
})

const statusIcon = computed(() => {
  if (isValidCallStatus(props.status)) {
    return getCallStatusIcon(props.status as CallStatus)
  }
  return '❓'
})
</script> 