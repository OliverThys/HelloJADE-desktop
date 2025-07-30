<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-[#36454F]">
      <div class="mt-3">
        <!-- En-tête -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-medium text-gray-900">
            {{ user ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur' }}
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
          <!-- Informations de base -->
          <div>
            <h4 class="text-md font-medium text-gray-900 mb-4">Informations de base</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet *
                </label>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  v-model="form.email"
                  type="email"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div v-if="!user">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe *
                </label>
                <input
                  v-model="form.password"
                  type="password"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div v-if="!user">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le mot de passe *
                </label>
                <input
                  v-model="form.confirmPassword"
                  type="password"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <!-- Rôle et permissions -->
          <div>
            <h4 class="text-md font-medium text-gray-900 mb-4">Rôle et permissions</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Rôle *
                </label>
                <select
                  v-model="form.role"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un rôle</option>
                  <option value="admin">Administrateur</option>
                  <option value="manager">Manager</option>
                  <option value="user">Utilisateur</option>
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
                  <option value="suspended">Suspendu</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Permissions détaillées -->
          <div>
            <h4 class="text-md font-medium text-gray-900 mb-4">Permissions</h4>
            <div class="space-y-3">
              <div class="flex items-center">
                <input
                  v-model="form.permissions.patients"
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label class="ml-2 block text-sm text-gray-900">
                  Gestion des patients
                </label>
              </div>
              
              <div class="flex items-center">
                <input
                  v-model="form.permissions.calls"
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label class="ml-2 block text-sm text-gray-900">
                  Gestion des appels
                </label>
              </div>
              
              <div class="flex items-center">
                <input
                  v-model="form.permissions.reports"
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label class="ml-2 block text-sm text-gray-900">
                  Accès aux rapports
                </label>
              </div>
              
              <div class="flex items-center">
                <input
                  v-model="form.permissions.admin"
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label class="ml-2 block text-sm text-gray-900">
                  Accès administrateur
                </label>
              </div>
            </div>
          </div>

          <!-- Informations supplémentaires -->
          <div>
            <h4 class="text-md font-medium text-gray-900 mb-4">Informations supplémentaires</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <input
                  v-model="form.phone"
                  type="tel"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Département
                </label>
                <input
                  v-model="form.department"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
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
                {{ user ? 'Mettre à jour' : 'Créer' }}
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
  user?: any
}

const props = withDefaults(defineProps<Props>(), {
  user: null
})

// Emits
const emit = defineEmits<{
  close: []
  save: [data: any]
}>()

// État local
const loading = ref(false)
const form = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: '',
  status: '',
  phone: '',
  department: '',
  permissions: {
    patients: false,
    calls: false,
    reports: false,
    admin: false
  }
})

// Méthodes
const handleSubmit = async () => {
  loading.value = true
  try {
    // Validation
    if (!form.value.name || !form.value.email || !form.value.role || !form.value.status) {
      throw new Error('Veuillez remplir tous les champs obligatoires')
    }

    if (!props.user && (!form.value.password || form.value.password !== form.value.confirmPassword)) {
      throw new Error('Les mots de passe ne correspondent pas')
    }

    // Préparer les données
    const userData = {
      name: form.value.name,
      email: form.value.email,
      role: form.value.role,
      status: form.value.status,
      phone: form.value.phone,
      department: form.value.department,
      permissions: form.value.permissions
    }

    // Ajouter le mot de passe seulement pour les nouveaux utilisateurs
    if (!props.user && form.value.password) {
      userData.password = form.value.password
    }

    emit('save', userData)
  } catch (error) {
    console.error('Erreur lors de la validation:', error)
  } finally {
    loading.value = false
  }
}

const initializeForm = () => {
  if (props.user) {
    // Mode édition
    form.value = {
      name: props.user.name || '',
      email: props.user.email || '',
      password: '',
      confirmPassword: '',
      role: props.user.role || '',
      status: props.user.status || '',
      phone: props.user.phone || '',
      department: props.user.department || '',
      permissions: {
        patients: props.user.permissions?.patients || false,
        calls: props.user.permissions?.calls || false,
        reports: props.user.permissions?.reports || false,
        admin: props.user.permissions?.admin || false
      }
    }
  } else {
    // Mode création
    form.value = {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: '',
      status: 'active',
      phone: '',
      department: '',
      permissions: {
        patients: false,
        calls: false,
        reports: false,
        admin: false
      }
    }
  }
}

// Lifecycle
onMounted(() => {
  initializeForm()
})

// Watcher pour réinitialiser le formulaire quand l'utilisateur change
watch(() => props.user, () => {
  initializeForm()
}, { immediate: true })
</script> 
