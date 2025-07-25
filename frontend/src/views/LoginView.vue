<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Logo et titre -->
      <div class="text-center">
        <div class="flex justify-center">
          <div class="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center">
            <svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
          </div>
        </div>
        <h2 class="mt-6 text-3xl font-bold text-gray-900">
          HelloJADE Manager
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Connectez-vous à votre compte
        </p>
      </div>

      <!-- Formulaire de connexion -->
      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div class="space-y-4">
          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              Adresse email
            </label>
            <div class="mt-1">
              <input
                id="email"
                v-model="form.email"
                name="email"
                type="email"
                autocomplete="email"
                required
                class="input-field"
                :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500': errors.email }"
                placeholder="votre.email@exemple.com"
              />
            </div>
            <p v-if="errors.email" class="mt-1 text-sm text-red-600">
              {{ errors.email }}
            </p>
          </div>

          <!-- Mot de passe -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <div class="mt-1 relative">
              <input
                id="password"
                v-model="form.password"
                name="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                required
                class="input-field pr-10"
                :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500': errors.password }"
                placeholder="Votre mot de passe"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <EyeIcon v-if="!showPassword" class="h-5 w-5 text-gray-400 hover:text-gray-600" />
                <EyeSlashIcon v-else class="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <p v-if="errors.password" class="mt-1 text-sm text-red-600">
              {{ errors.password }}
            </p>
          </div>
        </div>

        <!-- Options -->
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <input
              id="remember-me"
              v-model="form.rememberMe"
              name="remember-me"
              type="checkbox"
              class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label for="remember-me" class="ml-2 block text-sm text-gray-900">
              Se souvenir de moi
            </label>
          </div>

          <div class="text-sm">
            <button
              type="button"
              @click="showForgotPassword = true"
              class="font-medium text-green-600 hover:text-green-500"
            >
              Mot de passe oublié ?
            </button>
          </div>
        </div>

        <!-- Bouton de connexion -->
        <div>
          <button
            type="submit"
            :disabled="isLoading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <span v-if="isLoading" class="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            {{ isLoading ? 'Connexion en cours...' : 'Se connecter' }}
          </button>
        </div>

        <!-- Message d'erreur général -->
        <div v-if="generalError" class="rounded-md bg-red-50 p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">
                Erreur de connexion
              </h3>
              <div class="mt-2 text-sm text-red-700">
                <p>{{ generalError }}</p>
              </div>
            </div>
          </div>
        </div>
      </form>

      <!-- Informations supplémentaires -->
      <div class="text-center">
        <p class="text-xs text-gray-500">
          © 2025 HelloJADE. Tous droits réservés.
        </p>
        <p class="text-xs text-gray-400 mt-1">
          Développé en Belgique
        </p>
      </div>
    </div>

    <!-- Modal Mot de passe oublié -->
    <div v-if="showForgotPassword" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <div class="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div class="mt-2 text-center">
            <h3 class="text-lg font-medium text-gray-900">Mot de passe oublié</h3>
            <div class="mt-2 px-7 py-3">
              <p class="text-sm text-gray-500">
                Entrez votre adresse email pour recevoir un lien de réinitialisation.
              </p>
            </div>
            <div class="mt-4">
              <input
                v-model="forgotPasswordEmail"
                type="email"
                placeholder="votre.email@exemple.com"
                class="input-field"
              />
            </div>
          </div>
          <div class="items-center px-4 py-3">
            <button
              @click="handleForgotPassword"
              :disabled="!forgotPasswordEmail || isLoading"
              class="w-full btn-primary"
            >
              {{ isLoading ? 'Envoi en cours...' : 'Envoyer le lien' }}
            </button>
            <button
              @click="showForgotPassword = false"
              class="w-full btn-secondary mt-2"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { EyeIcon, EyeSlashIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// État du formulaire
const form = reactive({
  email: '',
  password: '',
  rememberMe: false
})

// État de l'interface
const isLoading = ref(false)
const showPassword = ref(false)
const showForgotPassword = ref(false)
const forgotPasswordEmail = ref('')

// Erreurs de validation
const errors = reactive({
  email: '',
  password: ''
})

const generalError = ref('')

// Validation du formulaire
const validateForm = () => {
  errors.email = ''
  errors.password = ''
  generalError.value = ''
  
  if (!form.email) {
    errors.email = 'L\'adresse email est requise'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'L\'adresse email n\'est pas valide'
  }
  
  if (!form.password) {
    errors.password = 'Le mot de passe est requis'
  }
  
  return !errors.email && !errors.password
}

// Gestion de la connexion
const handleLogin = async () => {
  if (!validateForm()) return
  
  try {
    isLoading.value = true
    
    const success = await authStore.login({
      username: form.email,
      password: form.password
    })
    
    if (success) {
      toast.success('Connexion réussie')
      router.push('/dashboard')
    }
    
  } catch (error: any) {
    console.error('Erreur de connexion:', error)
    generalError.value = error.response?.data?.message || 'Erreur de connexion'
  } finally {
    isLoading.value = false
  }
}

// Gestion du mot de passe oublié
const handleForgotPassword = async () => {
  if (!forgotPasswordEmail.value) {
    toast.error('Veuillez entrer votre adresse email')
    return
  }
  
  try {
    isLoading.value = true
    
    // Appel API pour mot de passe oublié
    // await apiClient.auth.forgotPassword(forgotPasswordEmail.value)
    
    toast.success('Un email de réinitialisation a été envoyé')
    showForgotPassword.value = false
    forgotPasswordEmail.value = ''
    
  } catch (error: any) {
    console.error('Erreur mot de passe oublié:', error)
    toast.error('Erreur lors de l\'envoi de l\'email')
  } finally {
    isLoading.value = false
  }
}
</script> 