<template>
  <div v-if="score !== null && score !== undefined" class="flex items-center space-x-1">
    <span
      :class="[
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        scoreClasses
      ]"
    >
      {{ score }}/100
    </span>
    <span
      :class="[
        'w-2 h-2 rounded-full',
        scoreColor
      ]"
    ></span>
  </div>
  <span v-else class="text-gray-400 text-sm">-</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  score?: number | null
}

const props = withDefaults(defineProps<Props>(), {
  score: null
})

const scoreClasses = computed(() => {
  if (!props.score) return 'bg-gray-100 text-gray-800'
  
  if (props.score >= 80) {
    return 'bg-green-100 text-green-800'
  } else if (props.score >= 60) {
    return 'bg-yellow-100 text-yellow-800'
  } else if (props.score >= 40) {
    return 'bg-orange-100 text-orange-800'
  } else {
    return 'bg-red-100 text-red-800'
  }
})

const scoreColor = computed(() => {
  if (!props.score) return 'bg-gray-300'
  
  if (props.score >= 80) {
    return 'bg-green-500'
  } else if (props.score >= 60) {
    return 'bg-yellow-500'
  } else if (props.score >= 40) {
    return 'bg-orange-500'
  } else {
    return 'bg-red-500'
  }
})
</script> 