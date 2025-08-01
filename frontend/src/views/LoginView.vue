<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
    <!-- Éléments de fond décoratifs -->
    <div class="absolute inset-0 overflow-hidden">
      <!-- Cercles décoratifs -->
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div class="absolute top-40 left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      
      <!-- Grille subtile -->
      <div class="absolute inset-0 opacity-30" style="background-image: url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%239C92AC%22 fill-opacity=%220.05%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"></div>
    </div>

    <!-- Conteneur principal -->
    <div class="relative max-w-md w-full space-y-8 z-10">
      <!-- Logo et titre avec animation -->
      <div class="text-center animate-fade-in">
        <div class="flex justify-center mb-6">
          <div class="relative">
            <!-- Cercle de fond animé -->
            <div class="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl blur-lg opacity-75 animate-pulse"></div>
            <!-- Logo principal -->
            <div class="relative w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-110 transition-all duration-300">
              <svg class="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
            </div>
          </div>
        </div>
        
        <h2 class="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-2">
          HelloJADE
        </h2>
        <p class="text-lg text-slate-600 font-medium mb-1">
          Assistant vocal intelligent
        </p>
        <p class="text-sm text-slate-500">
          Connectez-vous à votre compte
        </p>
      </div>

      <!-- Formulaire de connexion avec glassmorphism -->
      <div class="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 animate-slide-up">
        <form class="space-y-6" @submit.prevent="handleLogin">
          <!-- Email -->
          <div class="space-y-2">
            <label for="email" class="block text-sm font-semibold text-slate-700">
              Adresse email
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                class="w-full pl-10 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/30 focus:border-green-500 transition-all duration-300 bg-white/50 backdrop-blur-sm text-slate-800 placeholder-gray-400"
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
            <label for="password" class="block text-sm font-semibold text-slate-700">
              Mot de passe
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                class="w-full pl-10 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/30 focus:border-green-500 transition-all duration-300 bg-white/50 backdrop-blur-sm text-slate-800 placeholder-gray-400"
                :class="{ 'border-red-500 focus:border-red-500 focus:ring-red-500/30': errors.password }"
                placeholder="Votre mot de passe"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors duration-200"
              >
                <svg v-if="!showPassword" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
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

          <!-- Options -->
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="remember-me"
                v-model="form.rememberMe"
                name="remember-me"
                type="checkbox"
                class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded transition-colors duration-200"
              />
              <label for="remember-me" class="ml-2 block text-sm text-slate-600">
                Se souvenir de moi
              </label>
            </div>

            <button
              type="button"
              @click="showForgotPassword = true"
              class="text-sm font-semibold text-green-600 hover:text-green-700 transition-colors duration-200 hover:underline"
            >
              Mot de passe oublié ?
            </button>
          </div>

          <!-- Bouton de connexion -->
          <div class="pt-4">
            <button
              type="submit"
              :disabled="isLoading"
              class="group relative w-full flex justify-center py-4 px-6 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-4 focus:ring-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <span v-if="isLoading" class="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
              <span v-else class="flex items-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                {{ isLoading ? 'Connexion en cours...' : 'Se connecter' }}
              </span>
            </button>
          </div>

          <!-- Message d'erreur général -->
          <div v-if="generalError" class="rounded-xl bg-red-50 border border-red-200 p-4 animate-bounce-in shadow-lg">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3 flex-1">
                <h3 class="text-sm font-semibold text-red-800">
                  Échec de la connexion
                </h3>
                <div class="mt-2 text-sm text-red-700">
                  <p>{{ generalError }}</p>
                </div>
                <div class="mt-3 text-xs text-red-600">
                  <p class="font-medium">Conseils :</p>
                  <ul class="list-disc list-inside mt-1 space-y-1">
                    <li>Vérifiez que votre email est correct</li>
                    <li>Assurez-vous que votre mot de passe est exact</li>
                    <li>Vérifiez que votre compte Active Directory est actif</li>
                  </ul>
                </div>
              </div>
              <div class="flex-shrink-0">
                <button
                  @click="generalError = ''"
                  class="text-red-400 hover:text-red-600 transition-colors duration-200"
                >
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <!-- Informations supplémentaires -->
      <div class="text-center animate-fade-in" style="animation-delay: 0.5s;">
        <p class="text-xs text-slate-500">
          © 2025 HelloJADE. Tous droits réservés.
        </p>
        <p class="text-xs text-slate-400 mt-1">
          Développé en Belgique avec ❤️
        </p>
      </div>
    </div>

    <!-- Modal Mot de passe oublié -->
    <div v-if="showForgotPassword" class="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div class="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
        <div class="text-center">
          <div class="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-2xl mb-4">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-slate-800 mb-2">Mot de passe oublié</h3>
          <p class="text-sm text-slate-600 mb-6">
            Entrez votre adresse email pour recevoir un lien de réinitialisation.
          </p>
          
          <div class="space-y-4">
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                v-model="forgotPasswordEmail"
                type="email"
                placeholder="votre.email@exemple.com"
                class="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/30 focus:border-green-500 transition-all duration-300 bg-white text-slate-800 placeholder-gray-400"
              />
            </div>
            
            <div class="flex space-x-3">
              <button
                @click="handleForgotPassword"
                :disabled="!forgotPasswordEmail || isLoading"
                class="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ isLoading ? 'Envoi en cours...' : 'Envoyer le lien' }}
              </button>
              <button
                @click="showForgotPassword = false"
                class="flex-1 bg-white hover:bg-gray-50 text-slate-700 font-semibold py-3 px-6 rounded-xl border-2 border-gray-200 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
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

  // Fonction pour effacer les erreurs
  const clearErrors = () => {
    if (generalError.value) {
      generalError.value = ''
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
      generalError.value = '' // Réinitialiser les erreurs
      
      console.log('🔐 Tentative de connexion avec:', { username: form.email })
      
      const success = await authStore.login({
        username: form.email,
        password: form.password
      })
      
      console.log('🔐 Résultat de connexion:', success)
      
      if (success) {
        toast.success('Connexion réussie')
        router.push('/dashboard')
      } else {
        // L'authentification a échoué
        generalError.value = 'Identifiants incorrects. Vérifiez votre email et mot de passe.'
        toast.error('Échec de la connexion')
      }
      
    } catch (error: any) {
      console.error('Erreur de connexion:', error)
      
      // Gérer différents types d'erreurs
      if (error.response?.status === 401) {
        generalError.value = 'Email ou mot de passe incorrect'
        toast.error('Identifiants invalides')
      } else if (error.response?.status === 0 || error.code === 'NETWORK_ERROR') {
        generalError.value = 'Impossible de se connecter au serveur. Vérifiez votre connexion réseau.'
        toast.error('Erreur de connexion réseau')
      } else if (error.response?.status >= 500) {
        generalError.value = 'Erreur serveur. Veuillez réessayer plus tard.'
        toast.error('Erreur serveur')
      } else {
        generalError.value = error.response?.data?.message || 'Une erreur inattendue s\'est produite'
        toast.error('Erreur de connexion')
      }
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