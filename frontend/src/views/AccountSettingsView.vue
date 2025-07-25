<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Paramètres du compte</h1>
      <p class="text-gray-600">Gérez vos informations personnelles et préférences</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Menu latéral -->
      <div class="lg:col-span-1">
        <nav class="space-y-1">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              activeTab === tab.id
                ? 'bg-green-50 border-green-500 text-green-700'
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              'group flex items-center px-3 py-2 text-sm font-medium border-l-4 transition-colors duration-200'
            ]"
          >
            <component
              :is="tab.icon"
              :class="[
                activeTab === tab.id ? 'text-green-500' : 'text-gray-400 group-hover:text-gray-500',
                'mr-3 h-5 w-5 transition-colors duration-200'
              ]"
            />
            {{ tab.name }}
          </button>
        </nav>
      </div>

      <!-- Contenu -->
      <div class="lg:col-span-2">
        <!-- Profil -->
        <div v-if="activeTab === 'profile'" class="card">
          <h3 class="text-lg font-semibold text-gray-900 mb-6">Informations du profil</h3>
          
          <form @submit.prevent="updateProfile" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Prénom
                </label>
                <input
                  v-model="profileForm.first_name"
                  type="text"
                  class="input-field"
                  :class="{ 'border-red-500': errors.first_name }"
                />
                <p v-if="errors.first_name" class="mt-1 text-sm text-red-600">
                  {{ errors.first_name }}
                </p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  v-model="profileForm.last_name"
                  type="text"
                  class="input-field"
                  :class="{ 'border-red-500': errors.last_name }"
                />
                <p v-if="errors.last_name" class="mt-1 text-sm text-red-600">
                  {{ errors.last_name }}
                </p>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Adresse email
              </label>
              <input
                v-model="profileForm.email"
                type="email"
                class="input-field"
                :class="{ 'border-red-500': errors.email }"
              />
              <p v-if="errors.email" class="mt-1 text-sm text-red-600">
                {{ errors.email }}
              </p>
            </div>
            
            <div class="flex items-center justify-end space-x-3">
              <button
                type="button"
                @click="resetProfileForm"
                class="btn-secondary"
              >
                Annuler
              </button>
              <button
                type="submit"
                :disabled="isLoading"
                class="btn-primary"
              >
                {{ isLoading ? 'Enregistrement...' : 'Enregistrer' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Mot de passe -->
        <div v-if="activeTab === 'password'" class="card">
          <h3 class="text-lg font-semibold text-gray-900 mb-6">Changer le mot de passe</h3>
          
          <form @submit.prevent="changePassword" class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe actuel
              </label>
              <div class="relative">
                <input
                  v-model="passwordForm.current_password"
                  :type="showCurrentPassword ? 'text' : 'password'"
                  class="input-field pr-10"
                  :class="{ 'border-red-500': errors.current_password }"
                />
                <button
                  type="button"
                  @click="showCurrentPassword = !showCurrentPassword"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <EyeIcon v-if="!showCurrentPassword" class="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  <EyeSlashIcon v-else class="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              <p v-if="errors.current_password" class="mt-1 text-sm text-red-600">
                {{ errors.current_password }}
              </p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Nouveau mot de passe
              </label>
              <div class="relative">
                <input
                  v-model="passwordForm.new_password"
                  :type="showNewPassword ? 'text' : 'password'"
                  class="input-field pr-10"
                  :class="{ 'border-red-500': errors.new_password }"
                />
                <button
                  type="button"
                  @click="showNewPassword = !showNewPassword"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <EyeIcon v-if="!showNewPassword" class="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  <EyeSlashIcon v-else class="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              <p v-if="errors.new_password" class="mt-1 text-sm text-red-600">
                {{ errors.new_password }}
              </p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le nouveau mot de passe
              </label>
              <div class="relative">
                <input
                  v-model="passwordForm.confirm_password"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  class="input-field pr-10"
                  :class="{ 'border-red-500': errors.confirm_password }"
                />
                <button
                  type="button"
                  @click="showConfirmPassword = !showConfirmPassword"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <EyeIcon v-if="!showConfirmPassword" class="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  <EyeSlashIcon v-else class="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              <p v-if="errors.confirm_password" class="mt-1 text-sm text-red-600">
                {{ errors.confirm_password }}
              </p>
            </div>
            
            <div class="flex items-center justify-end space-x-3">
              <button
                type="button"
                @click="resetPasswordForm"
                class="btn-secondary"
              >
                Annuler
              </button>
              <button
                type="submit"
                :disabled="isLoading"
                class="btn-primary"
              >
                {{ isLoading ? 'Modification...' : 'Modifier le mot de passe' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Support -->
        <div v-if="activeTab === 'support'" class="card">
          <h3 class="text-lg font-semibold text-gray-900 mb-6">Support et assistance</h3>
          
          <div class="space-y-6">
            <div>
              <h4 class="font-medium text-gray-900 mb-3">Contacter le support</h4>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-center space-x-3 mb-3">
                  <EnvelopeIcon class="h-5 w-5 text-gray-400" />
                  <span class="text-sm text-gray-600">support@hellojade.be</span>
                </div>
                <div class="flex items-center space-x-3 mb-3">
                  <PhoneIcon class="h-5 w-5 text-gray-400" />
                  <span class="text-sm text-gray-600">+32 2 123 45 67</span>
                </div>
                <div class="flex items-center space-x-3">
                  <ClockIcon class="h-5 w-5 text-gray-400" />
                  <span class="text-sm text-gray-600">Lun-Ven 9h-17h</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 class="font-medium text-gray-900 mb-3">Documentation</h4>
              <div class="space-y-2">
                <a
                  href="#"
                  class="flex items-center space-x-2 text-green-600 hover:text-green-700"
                >
                  <DocumentTextIcon class="h-4 w-4" />
                  <span>Guide utilisateur</span>
                </a>
                <a
                  href="#"
                  class="flex items-center space-x-2 text-green-600 hover:text-green-700"
                >
                  <DocumentTextIcon class="h-4 w-4" />
                  <span>FAQ</span>
                </a>
                <a
                  href="#"
                  class="flex items-center space-x-2 text-green-600 hover:text-green-700"
                >
                  <DocumentTextIcon class="h-4 w-4" />
                  <span>Vidéos tutorielles</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  UserIcon,
  KeyIcon,
  QuestionMarkCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  PhoneIcon,
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

const authStore = useAuthStore()
const toast = useToast()

// Onglets
const tabs = [
  { id: 'profile', name: 'Profil', icon: UserIcon },
  { id: 'password', name: 'Mot de passe', icon: KeyIcon },
  { id: 'support', name: 'Support', icon: QuestionMarkCircleIcon }
]

const activeTab = ref('profile')
const isLoading = ref(false)

// Formulaires
const profileForm = reactive({
  first_name: '',
  last_name: '',
  email: ''
})

const passwordForm = reactive({
  current_password: '',
  new_password: '',
  confirm_password: ''
})

// État des champs de mot de passe
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// Erreurs
const errors = reactive({
  first_name: '',
  last_name: '',
  email: '',
  current_password: '',
  new_password: '',
  confirm_password: ''
})

// Charger les données du profil
const loadProfile = () => {
  const user = authStore.user
  if (user) {
    profileForm.first_name = user.first_name || ''
    profileForm.last_name = user.last_name || ''
    profileForm.email = user.email || ''
  }
}

// Mettre à jour le profil
const updateProfile = async () => {
  // Validation
  errors.first_name = ''
  errors.last_name = ''
  errors.email = ''
  
  if (!profileForm.first_name) {
    errors.first_name = 'Le prénom est requis'
  }
  if (!profileForm.last_name) {
    errors.last_name = 'Le nom est requis'
  }
  if (!profileForm.email) {
    errors.email = 'L\'email est requis'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email)) {
    errors.email = 'L\'email n\'est pas valide'
  }
  
  if (errors.first_name || errors.last_name || errors.email) {
    return
  }
  
  try {
    isLoading.value = true
    
    const success = await authStore.updateProfile({
      first_name: profileForm.first_name,
      last_name: profileForm.last_name,
      email: profileForm.email
    })
    
    if (success) {
      toast.success('Profil mis à jour avec succès')
    }
    
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du profil:', error)
    toast.error('Erreur lors de la mise à jour du profil')
  } finally {
    isLoading.value = false
  }
}

// Changer le mot de passe
const changePassword = async () => {
  // Validation
  errors.current_password = ''
  errors.new_password = ''
  errors.confirm_password = ''
  
  if (!passwordForm.current_password) {
    errors.current_password = 'Le mot de passe actuel est requis'
  }
  if (!passwordForm.new_password) {
    errors.new_password = 'Le nouveau mot de passe est requis'
  } else if (passwordForm.new_password.length < 8) {
    errors.new_password = 'Le mot de passe doit contenir au moins 8 caractères'
  }
  if (!passwordForm.confirm_password) {
    errors.confirm_password = 'La confirmation du mot de passe est requise'
  } else if (passwordForm.new_password !== passwordForm.confirm_password) {
    errors.confirm_password = 'Les mots de passe ne correspondent pas'
  }
  
  if (errors.current_password || errors.new_password || errors.confirm_password) {
    return
  }
  
  try {
    isLoading.value = true
    
    const success = await authStore.changePassword({
      current_password: passwordForm.current_password,
      new_password: passwordForm.new_password,
      confirm_password: passwordForm.confirm_password
    })
    
    if (success) {
      toast.success('Mot de passe modifié avec succès')
      resetPasswordForm()
    }
    
  } catch (error: any) {
    console.error('Erreur lors du changement de mot de passe:', error)
    toast.error('Erreur lors du changement de mot de passe')
  } finally {
    isLoading.value = false
  }
}

// Réinitialiser les formulaires
const resetProfileForm = () => {
  loadProfile()
}

const resetPasswordForm = () => {
  passwordForm.current_password = ''
  passwordForm.new_password = ''
  passwordForm.confirm_password = ''
  showCurrentPassword.value = false
  showNewPassword.value = false
  showConfirmPassword.value = false
}

// Initialisation
onMounted(() => {
  loadProfile()
})
</script> 