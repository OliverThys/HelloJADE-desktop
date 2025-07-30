<template>
  <div class="relative">
    <label v-if="label" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
    </label>
    <select
      :value="modelValue"
      @change="$emit('update:modelValue', $event.target.value)"
      class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
    >
      <option value="">Tous les statuts</option>
      <option
        v-for="status in availableStatuses"
        :key="status"
        :value="status"
      >
        {{ translateCallStatus(status) }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { translateCallStatus, getAllCallStatuses } from '@/utils/statusTranslations'
import type { CallStatus } from '@/utils/statusTranslations'

interface Props {
  modelValue: string
  label?: string
  includeAll?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Statut',
  includeAll: true
})

defineEmits<{
  'update:modelValue': [value: string]
}>()

const availableStatuses = computed(() => {
  return getAllCallStatuses()
})
</script> 