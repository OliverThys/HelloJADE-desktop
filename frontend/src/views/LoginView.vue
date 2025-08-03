<template>
  <div class="min-h-screen flex items-center justify-center bg-hellojade dark:bg-hellojade-dark py-12 px-4 sm:px-6 lg:px-8 relative">
    <!-- Conteneur principal -->
    <div class="relative max-w-md w-full space-y-8 z-10">
      <!-- Logo et titre avec animation -->
      <div class="text-center animate-fade-in">
        <div class="flex justify-center mb-6">
          <div class="relative w-20 h-20 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg transform hover:scale-110 transition-all duration-300">
            <svg class="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
          </div>
        </div>
        
        <h2 class="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
          HelloJADE
        </h2>
        <p class="text-lg text-gray-600 dark:text-gray-300 font-medium mb-1">
          Assistant vocal intelligent
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Connectez-vous à votre compte
        </p>
      </div>

      <!-- Formulaire de connexion -->
      <div class="card-glass p-8 animate-slide-up">
        <form class="space-y-6" @submit.prevent="handleLogin">
          <!-- Email -->
          <div class="space-y-2">
            <label for="email" class="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Adresse email
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                id="email"
                v-model="form.email"
                name="email"
                type="email"
                autocomplete="email"
                required
                @input="clearErrors"
                class="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-300 bg-white text-gray-800 placeholder-gray-400"
                :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500/30': errors.email }"
                placeholder="votre.email@exemple.com"
              />
            </div>
            <p v-if="errors.email" class="text-sm text-red-600 flex items-center">
              <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              {{ errors.email }}
            </p>
          </div>

          <!-- Mot de passe -->
          <div class="space-y-2">
            <label for="password" class="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Mot de passe
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                id="password"
                v-model="form.password"
                name="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                required
                @input="clearErrors"
                class="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-300 bg-white text-gray-800 placeholder-gray-400"
                :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500/30': errors.password }"
                placeholder="Votre mot de passe"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg v-if="showPassword" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
                <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
            <p v-if="errors.password" class="text-sm text-red-600 flex items-center">
              <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              {{ errors.password }}
            </p>
          </div>

          <!-- Options de connexion -->
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="remember-me"
                v-model="form.rememberMe"
                name="remember-me"
                type="checkbox"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label for="remember-me" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Se souvenir de moi
              </label>
            </div>
            <button
              type="button"
              @click="showForgotPassword = true"
              class="text-sm text-blue-600 hover:text-blue-500 transition-colors"
            >
              Mot de passe oublié ?
            </button>
          </div>

          <!-- Bouton de connexion -->
          <button
            type="submit"
            :disabled="loading"
            class="btn-primary w-full flex justify-center items-center"
          >
            <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ loading ? 'Connexion en cours...' : 'Se connecter' }}
          </button>

          <!-- Message d'erreur général -->
          <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div class="flex">
              <svg class="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
              <p class="text-sm text-red-700">{{ error }}</p>
            </div>
          </div>
        </form>
      </div>

      <!-- Lien vers l'aide -->
      <div class="text-center">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Besoin d'aide ? 
          <a href="#" class="text-blue-600 hover:text-blue-500 transition-colors">
            Contactez le support
          </a>
        </p>
      </div>
    </div>

    <!-- Modal mot de passe oublié -->
    <div v-if="showForgotPassword" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="card-glass p-6 max-w-md w-full animate-scale-in">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
            Mot de passe oublié
          </h3>
          <button
            @click="showForgotPassword = false"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Entrez votre adresse email pour recevoir un lien de réinitialisation.
        </p>
        
        <form @submit.prevent="handleForgotPassword" class="space-y-4">
          <input
            v-model="forgotPasswordEmail"
            type="email"
            placeholder="votre.email@exemple.com"
            required
            class="input-hellojade"
          />
          
          <div class="flex space-x-3">
            <button
              type="button"
              @click="showForgotPassword = false"
              class="btn-secondary flex-1"
            >
              Annuler
            </button>
            <button
              type="submit"
              :disabled="forgotPasswordLoading"
              class="btn-primary flex-1"
            >
              {{ forgotPasswordLoading ? 'Envoi...' : 'Envoyer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotifications } from '@/composables/useNotifications'

const router = useRouter()
const authStore = useAuthStore()
const { showSuccess, showError } = useNotifications()

// État du formulaire
const form = reactive({
  email: '',
  password: '',
  rememberMe: false
})

// État de l'interface
const loading = ref(false)
const showPassword = ref(false)
const showForgotPassword = ref(false)
const forgotPasswordEmail = ref('')
const forgotPasswordLoading = ref(false)

// Erreurs de validation
const errors = reactive({
  email: '',
  password: ''
})

const error = ref('')

  // Fonction pour effacer les erreurs
  const clearErrors = () => {
    if (error.value) {
      error.value = ''
    }
    if (errors.email) {
      errors.email = ''
    }
    if (errors.password) {
      errors.password = ''
    }
  }

  // Validation du formulaire
  const validateForm = () => {
    errors.email = ''
    errors.password = ''
    error.value = ''
    
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
      loading.value = true
      error.value = '' // Réinitialiser les erreurs
      
      console.log('🔐 Tentative de connexion avec:', { username: form.email })
      
      const success = await authStore.login({
        username: form.email,
        password: form.password
      })
      
      console.log('🔐 Résultat de connexion:', success)
      
      if (success) {
        showSuccess('Connexion réussie', 'Vous êtes maintenant connecté')
        router.push('/dashboard')
      } else {
        // L'authentification a échoué
        error.value = 'Identifiants incorrects. Vérifiez votre email et mot de passe.'
        showError('Échec de la connexion', 'Vérifiez vos identifiants')
      }
      
    } catch (error: any) {
      console.error('Erreur de connexion:', error)
      
      // Gérer différents types d'erreurs
      if (error.response?.status === 401) {
        error.value = 'Email ou mot de passe incorrect'
        showError('Identifiants invalides', 'Vérifiez votre email et mot de passe')
      } else if (error.response?.status === 0 || error.code === 'NETWORK_ERROR') {
        error.value = 'Impossible de se connecter au serveur. Vérifiez votre connexion réseau.'
        showError('Erreur de connexion réseau', 'Vérifiez votre connexion internet')
      } else if (error.response?.status >= 500) {
        error.value = 'Erreur serveur. Veuillez réessayer plus tard.'
        showError('Erreur serveur', 'Le serveur est temporairement indisponible')
      } else {
        error.value = error.response?.data?.message || 'Une erreur inattendue s\'est produite'
        showError('Erreur de connexion', 'Une erreur inattendue s\'est produite')
      }
    } finally {
      loading.value = false
    }
  }

// Gestion du mot de passe oublié
const handleForgotPassword = async () => {
  if (!forgotPasswordEmail.value) {
    showError('Email requis', 'Veuillez entrer votre adresse email')
    return
  }
  
  try {
    forgotPasswordLoading.value = true
    
    // Appel API pour mot de passe oublié
    // await apiClient.auth.forgotPassword(forgotPasswordEmail.value)
    
    showSuccess('Email envoyé', 'Un email de réinitialisation a été envoyé')
    showForgotPassword.value = false
    forgotPasswordEmail.value = ''
    
  } catch (error: any) {
    console.error('Erreur mot de passe oublié:', error)
    showError('Erreur d\'envoi', 'Erreur lors de l\'envoi de l\'email')
  } finally {
    forgotPasswordLoading.value = false
  }
}
</script>

<style scoped>
@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}

.animate-fade-in {
  animation: fadeIn 0.8s ease-out;
}

.animate-slide-up {
  animation: slideUp 0.8s ease-out;
}

.animate-scale-in {
  animation: scaleIn 0.3s ease-out;
}

.animate-bounce-in {
  animation: bounceIn 0.6s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes bounceIn {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style> 