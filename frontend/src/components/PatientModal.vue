<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-[#36454F]">
      <div class="mt-3">
        <!-- En-tête -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-medium text-gray-900">
            {{ patient ? 'Modifier le patient' : 'Nouveau patient' }}
          </h3>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>

        <!-- Formulaire -->
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Informations personnelles -->
          <div>
            <h4 class="text-md font-medium text-gray-900 mb-4">Informations personnelles</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Prénom *
                </label>
                <input
                  v-model="form.firstName"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  v-model="form.lastName"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Date de naissance *
                </label>
                <input
                  v-model="form.birthDate"
                  type="date"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone *
                </label>
                <input
                  v-model="form.phone"
                  type="tel"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  v-model="form.email"
                  type="email"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Adresse
                </label>
                <input
                  v-model="form.address"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <!-- Informations médicales -->
          <div>
            <h4 class="text-md font-medium text-gray-900 mb-4">Informations médicales</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Service *
                </label>
                <select
                  v-model="form.service"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un service</option>
                  <option value="cardiology">Cardiologie</option>
                  <option value="neurology">Neurologie</option>
                  <option value="orthopedics">Orthopédie</option>
                  <option value="general">Médecine générale</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Statut *
                </label>
                <select
                  v-model="form.status"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un statut</option>
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                  <option value="completed">Terminé</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Date d'admission
                </label>
                <input
                  v-model="form.admissionDate"
                  type="date"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Date de sortie
                </label>
                <input
                  v-model="form.dischargeDate"
                  type="date"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Notes médicales
            </label>
            <textarea
              v-model="form.notes"
              rows="4"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Notes médicales, observations, etc."
            />
          </div>

          <!-- Actions -->
          <div class="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-[#36454F] hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="loading" class="inline-flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sauvegarde...
              </span>
              <span v-else>
                {{ patient ? 'Mettre à jour' : 'Créer' }}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'

// Props
interface Props {
  patient?: any
}

const props = withDefaults(defineProps<Props>(), {
  patient: null
})

// Emits
const emit = defineEmits<{
  close: []
  save: [data: any]
}>()

// État local
const loading = ref(false)
const form = ref({
  firstName: '',
  lastName: '',
  birthDate: '',
  phone: '',
  email: '',
  address: '',
  service: '',
  status: '',
  admissionDate: '',
  dischargeDate: '',
  notes: ''
})

// Méthodes
const handleSubmit = async () => {
  loading.value = true
  try {
    // Validation
    if (!form.value.firstName || !form.value.lastName || !form.value.phone || !form.value.service || !form.value.status) {
      throw new Error('Veuillez remplir tous les champs obligatoires')
    }

    // Préparer les données
    const patientData = {
      ...form.value,
      // Convertir les dates si nécessaire
      birthDate: form.value.birthDate ? new Date(form.value.birthDate).toISOString() : null,
      admissionDate: form.value.admissionDate ? new Date(form.value.admissionDate).toISOString() : null,
      dischargeDate: form.value.dischargeDate ? new Date(form.value.dischargeDate).toISOString() : null
    }

    emit('save', patientData)
  } catch (error) {
    console.error('Erreur lors de la validation:', error)
  } finally {
    loading.value = false
  }
}

const initializeForm = () => {
  if (props.patient) {
    // Mode édition
    form.value = {
      firstName: props.patient.firstName || '',
      lastName: props.patient.lastName || '',
      birthDate: props.patient.birthDate ? new Date(props.patient.birthDate).toISOString().split('T')[0] : '',
      phone: props.patient.phone || '',
      email: props.patient.email || '',
      address: props.patient.address || '',
      service: props.patient.service || '',
      status: props.patient.status || '',
      admissionDate: props.patient.admissionDate ? new Date(props.patient.admissionDate).toISOString().split('T')[0] : '',
      dischargeDate: props.patient.dischargeDate ? new Date(props.patient.dischargeDate).toISOString().split('T')[0] : '',
      notes: props.patient.notes || ''
    }
  } else {
    // Mode création
    form.value = {
      firstName: '',
      lastName: '',
      birthDate: '',
      phone: '',
      email: '',
      address: '',
      service: '',
      status: '',
      admissionDate: '',
      dischargeDate: '',
      notes: ''
    }
  }
}

// Lifecycle
onMounted(() => {
  initializeForm()
})

// Watcher pour réinitialiser le formulaire quand le patient change
watch(() => props.patient, () => {
  initializeForm()
}, { immediate: true })
</script> 
