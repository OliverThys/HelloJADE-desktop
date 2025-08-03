<template>
  <div id="app" class="min-h-screen bg-hellojade dark:bg-hellojade-dark font-hellojade relative">
    <!-- Indicateur de chargement global -->
    <div v-if="isInitializing" class="fixed inset-0 bg-white/90 dark:bg-gray-900/90 z-50 flex items-center justify-center">
      <div class="card-glass p-8 text-center animate-fade-in">
        <div class="relative w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
          <svg class="w-8 h-8 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-gray-800 dark:text-white mt-4 mb-2">Initialisation...</h2>
        <p class="text-gray-600 dark:text-gray-400">Chargement de l'application</p>
      </div>
    </div>

    <!-- Page de connexion -->
    <div v-else-if="$route.name === 'Login'" class="min-h-screen relative z-10">
      <router-view />
    </div>
    
    <!-- Application principale -->
    <div v-else class="flex h-screen relative z-10">
      <!-- Sidebar moderne -->
      <aside class="w-72 bg-white shadow-lg border-r border-gray-200 dark:bg-gray-900 dark:border-gray-700">
        <div class="flex items-center justify-center h-20 px-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center">
            <div class="relative w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-md transform hover:scale-110 transition-all duration-300">
              <svg class="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
            </div>
            <div class="ml-4">
              <h1 class="title-hellojade text-2xl">
                HelloJADE
              </h1>
              <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">Gestion Post-Hospitalisation</p>
            </div>
          </div>
        </div>
        
        <!-- Navigation principale -->
        <nav class="mt-8 px-4">
          <div class="space-y-2">
            <router-link
              v-for="item in navigation"
              :key="item.name"
              :to="item.href"
              :class="[
                $route.path === item.href
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm'
                  : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white hover:border-gray-300',
                'group flex items-center px-4 py-3 text-sm font-medium border-l-4 transition-hellojade'
              ]"
            >
              <component
                :is="item.icon"
                :class="[
                  $route.path === item.href ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300',
                  'mr-4 h-5 w-5 transition-hellojade'
                ]"
              />
              {{ item.name }}
              <span
                v-if="item.badge"
                :class="[
                  'ml-auto px-2 py-1 text-xs font-medium',
                  item.badge.type === 'warning' ? 'badge-warning' :
                  item.badge.type === 'error' ? 'badge-danger' :
                  'badge-info'
                ]"
              >
                {{ item.badge.count }}
              </span>
            </router-link>
          </div>
        </nav>

        <!-- Section monitoring accessible à tous -->
        <div class="mt-8 px-4">
          <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Monitoring
          </h3>
          <div class="space-y-2">
            <router-link
              to="/monitoring"
              :class="[
                $route.path === '/monitoring'
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm'
                  : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white hover:border-gray-300',
                'group flex items-center px-4 py-3 text-sm font-medium border-l-4 transition-hellojade'
              ]"
            >
              <svg class="mr-4 h-5 w-5 transition-hellojade" :class="$route.path === '/monitoring' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Monitoring Système
            </router-link>
          </div>
        </div>

        <!-- Section admin pour les administrateurs -->
        <div v-if="userStore.user?.role === 'admin'" class="mt-8 px-4">
          <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Administration
          </h3>
          <div class="space-y-2">
            <router-link
              to="/admin/users"
              :class="[
                $route.path === '/admin/users'
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm'
                  : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white hover:border-gray-300',
                'group flex items-center px-4 py-3 text-sm font-medium border-l-4 transition-hellojade'
              ]"
            >
              <svg class="mr-4 h-5 w-5 transition-hellojade" :class="$route.path === '/admin/users' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Gestion Utilisateurs
            </router-link>
            <router-link
              to="/admin/system"
              :class="[
                $route.path === '/admin/system'
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm'
                  : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white hover:border-gray-300',
                'group flex items-center px-4 py-3 text-sm font-medium border-l-4 transition-hellojade'
              ]"
            >
              <svg class="mr-4 h-5 w-5 transition-hellojade" :class="$route.path === '/admin/system' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Configuration Système
            </router-link>
            <router-link
              to="/admin/monitoring"
              :class="[
                $route.path === '/admin/monitoring'
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm'
                  : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white hover:border-gray-300',
                'group flex items-center px-4 py-3 text-sm font-medium border-l-4 transition-hellojade'
              ]"
            >
              <svg class="mr-4 h-5 w-5 transition-hellojade" :class="$route.path === '/admin/monitoring' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Monitoring Avancé
            </router-link>
          </div>
        </div>
      </aside>

      <!-- Contenu principal -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Header moderne -->
        <header class="bg-white shadow-sm border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700">
          <div class="flex items-center justify-between h-16 px-6">
            <div class="flex items-center">
              <h1 class="title-hellojade text-2xl">
                {{ getPageTitle() }}
              </h1>
            </div>
            
            <div class="flex items-center space-x-4">
              <!-- Bouton de basculement du thème -->
              <button
                @click="toggleTheme"
                class="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-hellojade focus:outline-none focus:ring-4 focus:ring-blue-500/30 rounded-lg"
              >
                <svg v-if="isDark" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </button>

              <!-- Menu utilisateur -->
              <div class="relative">
                <button
                  @click="showUserMenu = !showUserMenu"
                  @mouseenter="showUserMenu = true"
                  class="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-hellojade focus:outline-none focus:ring-4 focus:ring-blue-500/30"
                >
                  <div class="relative w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span class="text-white text-sm font-semibold">
                      {{ userStore.user?.username?.charAt(0).toUpperCase() || 'U' }}
                    </span>
                  </div>
                  <div class="hidden md:block text-left">
                    <p class="text-sm font-medium text-gray-800 dark:text-white">
                      {{ userStore.user?.username || 'Utilisateur' }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {{ userStore.user?.role || 'Utilisateur' }}
                    </p>
                  </div>
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <!-- Dropdown menu utilisateur -->
                <div
                  v-if="showUserMenu"
                  @mouseleave="showUserMenu = false"
                  class="absolute right-0 mt-2 w-48 card-glass rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
                >
                  <router-link
                    to="/account"
                    class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-hellojade"
                  >
                    Paramètres du compte
                  </router-link>
                  <button
                    @click="logout"
                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-hellojade"
                  >
                    Se déconnecter
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <!-- Contenu principal avec scroll -->
        <main class="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div class="p-6">
            <router-view />
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import {
  ChevronDownIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  HomeIcon,
  PhoneIcon,
  CogIcon,
  UsersIcon,
  ChartBarIcon,
  CpuChipIcon,
  DocumentTextIcon,
  SunIcon,
  MoonIcon,
  ShieldCheckIcon,
  ServerIcon,
  CircleStackIcon
} from '@heroicons/vue/24/outline'
import { useAuthStore, useUserStore, usePatientsStore, useCallsStore, useMonitoringStore } from '@/stores'
import { setupRouterGuards } from '@/router'
import ErrorBoundary from '@/components/ErrorBoundary.vue'
import NotificationToast from '@/components/NotificationToast.vue'
import { setNotificationInstance } from '@/composables/useNotifications'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const userStore = useUserStore()
const patientsStore = usePatientsStore()
const callsStore = useCallsStore()
const monitoringStore = useMonitoringStore()

const showUserMenu = ref(false)
const isDark = ref(false)
const isInitializing = ref(true)
const notificationRef = ref<InstanceType<typeof NotificationToast> | null>(null)

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: HomeIcon },
  { name: 'Patients', href: '/patients', icon: UsersIcon, badge: { count: 21, type: 'info' } },
  { name: 'Appels', href: '/calls', icon: PhoneIcon, badge: { count: 3, type: 'warning' } }
]

const adminNavigation = [
  { name: 'Gestion utilisateurs', href: '/admin/users', icon: ShieldCheckIcon },
  { name: 'Configuration système', href: '/admin/system', icon: CogIcon }
]

const getPageTitle = () => {
  const routeNames: Record<string, string> = {
    'Dashboard': 'Tableau de bord',
    'Patients': 'Gestion des patients',
    'PatientDetail': 'Détails du patient',
    'Calls': 'Gestion des appels',
    'Account': 'Paramètres du compte',
    'AdminUsers': 'Gestion utilisateurs',
    'AdminSystem': 'Configuration système',
    'AdminMonitoring': 'Monitoring'
  }
  return routeNames[route.name as string] || 'HelloJADE Manager'
}

const pageTitle = computed(() => getPageTitle())

const pageSubtitle = computed(() => {
  const subtitles: Record<string, string> = {
    'Dashboard': 'Vue d\'ensemble de l\'activité',
    'Patients': 'Gestion des dossiers patients',
    'Calls': 'Suivi des appels téléphoniques'
  }
  return subtitles[route.name as string] || ''
})

const userInitials = computed(() => {
  const user = authStore.user
  if (!user) return 'U'
  return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
})



const toggleTheme = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}



const logout = async () => {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error)
  }
}

// Initialisation globale de l'application
const initializeApp = async () => {
  try {
    console.log('🚀 Initialisation de l\'application...')
    isInitializing.value = true
    
    // Vérifier l'authentification
    const isAuthenticated = await authStore.checkAuth()
    
    if (isAuthenticated) {
      console.log('✅ Utilisateur authentifié, initialisation des stores...')
      
      // Initialiser les stores de données
      await Promise.all([
        patientsStore.initialize(),
        callsStore.initialize(),
        monitoringStore.initialize()
      ])
      
      console.log('✅ Application initialisée avec succès')
    } else {
      console.log('❌ Utilisateur non authentifié')
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error)
  } finally {
    isInitializing.value = false
  }
}

// Gestionnaire d'événements pour la persistance
const handleBeforeUnload = () => {
  console.log('💾 Sauvegarde de l\'état avant fermeture...')
  // Les stores sauvegardent automatiquement via les watchers
}

// Gestionnaire d'événements pour la restauration
const handleVisibilityChange = () => {
  if (!document.hidden) {
    console.log('🔄 Page redevenue visible, vérification de l\'état...')
    // Vérifier si les données sont toujours valides
    if (authStore.isAuthenticated) {
      patientsStore.initialize()
      callsStore.initialize()
    }
  }
}

// Configuration des guards de routage et thème
onMounted(async () => {
  setupRouterGuards(router)
  
  // Restaurer le thème
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
  
  // Initialiser le système de notifications
  if (notificationRef.value) {
    setNotificationInstance(notificationRef.value)
  }
  
  // Initialiser l'application
  await initializeApp()
  
  // Ajouter les gestionnaires d'événements
  window.addEventListener('beforeunload', handleBeforeUnload)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onBeforeUnmount(() => {
  // Nettoyer les gestionnaires d'événements
  window.removeEventListener('beforeunload', handleBeforeUnload)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style>
#app {
  font-family: 'Inter', system-ui, sans-serif;
}

/* Animations personnalisées */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in-up {
  animation: fadeInUp 0.3s ease-out;
}

/* Scrollbar personnalisée */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.3);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.5);
}

.dark ::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.2);
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.4);
}
</style> 
