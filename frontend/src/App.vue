<template>
  <div id="app" class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
    <!-- Indicateur de chargement global -->
    <div v-if="isInitializing" class="fixed inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
        <h2 class="text-xl font-semibold text-slate-800 dark:text-white mb-2">Initialisation...</h2>
        <p class="text-slate-600 dark:text-slate-400">Chargement de l'application</p>
      </div>
    </div>

    <!-- Page de connexion -->
    <div v-else-if="$route.name === 'Login'" class="min-h-screen">
      <router-view />
    </div>
    
    <!-- Application principale -->
    <div v-else class="flex h-screen">
      <!-- Sidebar moderne avec glassmorphism -->
      <aside class="w-72 bg-white/80 backdrop-blur-xl shadow-2xl border-r border-gray-200/50 dark:bg-slate-900/80 dark:border-slate-700/50">
        <div class="flex items-center justify-center h-20 px-6 border-b border-gray-200/50 dark:border-slate-700/50">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg class="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
            </div>
            <div class="ml-4">
              <h1 class="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                HelloJADE
              </h1>
              <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Gestion Post-Hospitalisation</p>
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
                  ? 'bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-500/50 text-green-700 dark:text-green-300 shadow-lg'
                  : 'border-transparent text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white hover:border-slate-300/50',
                'group flex items-center px-4 py-3 text-sm font-medium border-l-4 transition-all duration-300 rounded-r-xl backdrop-blur-sm hover:scale-105'
              ]"
            >
              <component
                :is="item.icon"
                :class="[
                  $route.path === item.href ? 'text-green-600 dark:text-green-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300',
                  'mr-4 h-5 w-5 transition-colors duration-300'
                ]"
              />
              {{ item.name }}
              <span
                v-if="item.badge"
                :class="[
                  'ml-auto px-2 py-1 text-xs font-medium rounded-full',
                  item.badge.type === 'warning' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' :
                  item.badge.type === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                  'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                ]"
              >
                {{ item.badge.count }}
              </span>
            </router-link>
          </div>
        </nav>

        <!-- Section monitoring accessible à tous -->
        <div class="mt-8 px-4">
          <h3 class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Monitoring
          </h3>
          <div class="space-y-2">
            <router-link
              to="/monitoring"
              :class="[
                $route.path === '/monitoring'
                  ? 'bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-500/50 text-blue-700 dark:text-blue-300 shadow-lg'
                  : 'border-transparent text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white hover:border-slate-300/50',
                'group flex items-center px-4 py-3 text-sm font-medium border-l-4 transition-all duration-300 rounded-r-xl backdrop-blur-sm hover:scale-105'
              ]"
            >
              <CircleStackIcon
                :class="[
                  $route.path === '/monitoring' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300',
                  'mr-4 h-5 w-5 transition-colors duration-300'
                ]"
              />
              Monitoring Système
            </router-link>
          </div>
        </div>

        <!-- Section admin si admin -->
        <div v-if="userStore.user?.role === 'admin'" class="mt-8 px-4">
          <h3 class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Administration
          </h3>
          <div class="space-y-2">
            <router-link
              v-for="item in adminNavigation"
              :key="item.name"
              :to="item.href"
              :class="[
                $route.path === item.href
                  ? 'bg-gradient-to-r from-red-500/10 to-red-600/10 border-red-500/50 text-red-700 dark:text-red-300 shadow-lg'
                  : 'border-transparent text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white hover:border-slate-300/50',
                'group flex items-center px-4 py-3 text-sm font-medium border-l-4 transition-all duration-300 rounded-r-xl backdrop-blur-sm hover:scale-105'
              ]"
            >
              <component
                :is="item.icon"
                :class="[
                  $route.path === item.href ? 'text-red-600 dark:text-red-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300',
                  'mr-4 h-5 w-5 transition-colors duration-300'
                ]"
              />
              {{ item.name }}
            </router-link>
          </div>
        </div>
      </aside>
      
      <!-- Contenu principal -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Header moderne -->
        <header class="bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-200/50 dark:bg-slate-900/80 dark:border-slate-700/50">
          <div class="flex items-center justify-between h-20 px-8">
            <div class="flex items-center">
              <h2 class="text-2xl font-bold text-slate-800 dark:text-white">
                {{ pageTitle }}
              </h2>
              <div v-if="pageSubtitle" class="ml-4 text-sm text-slate-600 dark:text-slate-400">
                {{ pageSubtitle }}
              </div>
            </div>
            
            <div class="flex items-center space-x-4">
              <!-- Toggle thème -->
              <button
                @click="toggleTheme"
                class="p-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none focus:ring-4 focus:ring-green-500/30 rounded-xl transition-all duration-300 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:scale-110"
              >
                <SunIcon v-if="isDark" class="h-6 w-6" />
                <MoonIcon v-else class="h-6 w-6" />
              </button>

              <!-- Notifications -->
              <button
                @click="showNotifications = !showNotifications"
                class="relative p-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none focus:ring-4 focus:ring-green-500/30 rounded-xl transition-all duration-300 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:scale-110"
              >
                <BellIcon class="h-6 w-6" />
                <span
                  v-if="notifications.length > 0"
                  class="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
                >
                  {{ notifications.length }}
                </span>
              </button>

              <!-- Menu utilisateur -->
              <div class="relative">
                <button
                  @click="showUserMenu = !showUserMenu"
                  class="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-500/30"
                >
                  <div class="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <span class="text-white text-sm font-semibold">
                      {{ userStore.user?.username?.charAt(0).toUpperCase() || 'U' }}
                    </span>
                  </div>
                  <div class="hidden md:block text-left">
                    <p class="text-sm font-medium text-slate-800 dark:text-white">
                      {{ userStore.user?.username || 'Utilisateur' }}
                    </p>
                    <p class="text-xs text-slate-500 dark:text-slate-400">
                      {{ userStore.user?.role || 'Utilisateur' }}
                    </p>
                  </div>
                  <ChevronDownIcon class="h-4 w-4 text-slate-400" />
                </button>

                <!-- Dropdown menu -->
                <div
                  v-if="showUserMenu"
                  class="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 py-2 z-50"
                >
                  <router-link
                    to="/account"
                    class="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors duration-200"
                  >
                    Paramètres du compte
                  </router-link>
                  <button
                    @click="logout"
                    class="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                  >
                    Se déconnecter
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <!-- Notifications dropdown -->
        <div
          v-if="showNotifications"
          class="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 py-2 z-50"
          style="top: 5rem; right: 1rem;"
        >
          <div class="px-4 py-2 border-b border-gray-200 dark:border-slate-700">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-slate-800 dark:text-white">Notifications</h3>
              <button
                @click="markAllAsRead"
                class="text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
              >
                Tout marquer comme lu
              </button>
            </div>
          </div>
          <div class="max-h-64 overflow-y-auto">
            <div
              v-for="notification in notifications"
              :key="notification.id"
              class="px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors duration-200"
            >
              <div class="flex items-start">
                <div class="flex-shrink-0">
                  <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <div class="ml-3 flex-1">
                  <p class="text-sm text-slate-800 dark:text-white">
                    {{ notification.message }}
                  </p>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {{ formatTimeAgo(notification.timestamp) }}
                  </p>
                </div>
              </div>
            </div>
            <div v-if="notifications.length === 0" class="px-4 py-8 text-center">
              <p class="text-sm text-slate-500 dark:text-slate-400">Aucune notification</p>
            </div>
          </div>
        </div>

        <!-- Contenu principal -->
        <main class="flex-1 overflow-auto p-6">
          <div class="max-w-7xl mx-auto">
            <ErrorBoundary>
              <router-view />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>

    <!-- Système de notifications global -->
    <NotificationToast ref="notificationRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import {
  BellIcon,
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

const showNotifications = ref(false)
const showUserMenu = ref(false)
const isDark = ref(false)
const isInitializing = ref(true)
const notificationRef = ref<InstanceType<typeof NotificationToast> | null>(null)

const notifications = ref([
  {
    id: 1,
    type: 'info',
    message: 'Le patient Jean Dupont a été ajouté au système',
    timestamp: new Date()
  },
  {
    id: 2,
    type: 'warning',
    message: '3 appels sont en attente de traitement',
    timestamp: new Date(Date.now() - 3600000)
  },
  {
    id: 3,
    type: 'success',
    message: 'La transcription de l\'appel #1234 est disponible',
    timestamp: new Date(Date.now() - 7200000)
  }
])

const notificationCount = computed(() => notifications.value.length)

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: HomeIcon },
  { name: 'Patients', href: '/patients', icon: UsersIcon, badge: { count: 21, type: 'info' } },
  { name: 'Appels', href: '/calls', icon: PhoneIcon, badge: { count: 3, type: 'warning' } }
]

const adminNavigation = [
  { name: 'Gestion utilisateurs', href: '/admin/users', icon: ShieldCheckIcon },
  { name: 'Configuration système', href: '/admin/system', icon: CogIcon }
]

const pageTitle = computed(() => {
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
})

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

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'warning':
      return ExclamationTriangleIcon
    case 'success':
      return CheckCircleIcon
    case 'error':
      return ExclamationTriangleIcon
    default:
      return InformationCircleIcon
  }
}

const formatTimeAgo = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 60) {
    return `Il y a ${minutes} min`
  } else if (hours < 24) {
    return `Il y a ${hours}h`
  } else {
    return `Il y a ${days}j`
  }
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

const markAllAsRead = () => {
  notifications.value = []
  showNotifications.value = false
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
