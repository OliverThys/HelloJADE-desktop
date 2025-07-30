<template>
  <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Overlay -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="handleClose"></div>

      <!-- Modal -->
      <div class="inline-block align-bottom bg-[#36454F] rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                  <div class="bg-[#36454F] px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
              <ArrowDownTrayIcon class="h-6 w-6 text-green-600" />
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 class="text-lg leading-6 font-medium text-gray-900">
                Exporter les patients sélectionnés
              </h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500">
                  {{ selectedCount }} patient(s) sélectionné(s) sur {{ totalCount }} patient(s) affiché(s)
                </p>
              </div>
              
              <!-- Format d'export -->
              <div class="mt-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Format d'export
                </label>
                <div class="space-y-2">
                  <label class="flex items-center">
                    <input
                      type="radio"
                      v-model="exportFormat"
                      value="xlsx"
                      class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                    />
                    <span class="ml-2 text-sm text-gray-700">Excel (.xlsx)</span>
                  </label>
                  <label class="flex items-center">
                    <input
                      type="radio"
                      v-model="exportFormat"
                      value="pdf"
                      class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                    />
                    <span class="ml-2 text-sm text-gray-700">PDF (.pdf)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            @click="handleExport"
            :disabled="selectedCount === 0"
            class="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Exporter
          </button>
          <button
            type="button"
            @click="handleClose"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-[#36454F] text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ArrowDownTrayIcon } from '@heroicons/vue/24/outline'

interface Props {
  show: boolean
  selectedCount: number
  totalCount: number
}

interface Emits {
  (e: 'close'): void
  (e: 'export', format: 'xlsx' | 'pdf'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const exportFormat = ref<'xlsx' | 'pdf'>('xlsx')

const handleClose = () => {
  emit('close')
}

const handleExport = () => {
  if (props.selectedCount > 0) {
    emit('export', exportFormat.value)
  }
}
</script> 
