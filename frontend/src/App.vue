<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Page de connexion -->
    <div v-if="$route.name === 'Login'" class="min-h-screen">
      <router-view />
    </div>
    
    <!-- Application principale -->
    <div v-else class="flex h-screen">
      <!-- Sidebar -->
      <aside class="w-64 bg-white shadow-sm border-r border-gray-200">
        <div class="flex items-center justify-center h-16 px-4 border-b border-gray-200">
          <div class="flex items-center">
            <div class="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
            </div>
            <div class="ml-3">
              <h1 class="text-xl font-bold text-gray-900">HelloJADE</h1>
              <p class="text-xs text-gray-500">Manager</p>
            </div>
          </div>
        </div>
        
        <!-- Navigation -->
        <nav class="mt-6 px-3">
          <div class="space-y-1">
            <router-link
              v-for="item in navigation"
              :key="item.name"
              :to="item.href"
              :class="[
                $route.path === item.href
                  ? 'bg-green-50 border-green-500 text-green-700'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                'group flex items-center px-3 py-2 text-sm font-medium border-l-4 transition-colors duration-200'
              ]"
            >
              <component
                :is="item.icon"
                :class="[
                  $route.path === item.href ? 'text-green-500' : 'text-gray-400 group-hover:text-gray-500',
                  'mr-3 h-5 w-5 transition-colors duration-200'
                ]"
              />
              {{ item.name }}
            </router-link>
          </div>
        </nav>
      </aside>
      
      <!-- Contenu principal -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Header -->
        <header class="bg-white shadow-sm border-b border-gray-200">
          <div class="flex items-center justify-between h-16 px-6">
            <div class="flex items-center">
              <h2 class="text-lg font-semibold text-gray-900">
                {{ pageTitle }}
              </h2>
            </div>
            
            <div class="flex items-center space-x-4">
              <!-- Notifications -->
              <button
                @click="showNotifications = !showNotifications"
                class="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-lg"
              >
                <BellIcon class="h-6 w-6" />
                <span
                  v-if="notificationCount > 0"
                  class="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"
                />
              </button>
              
              <!-- Menu utilisateur -->
              <Menu as="div" class="relative">
                <MenuButton
                  class="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <div class="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <span class="text-white font-medium text-sm">
                      {{ userInitials }}
                    </span>
                  </div>
                  <span class="ml-2 text-gray-700">{{ authStore.user?.first_name }} {{ authStore.user?.last_name }}</span>
                  <ChevronDownIcon class="ml-1 h-4 w-4 text-gray-400" />
                </MenuButton>
                
                <transition
                  enter-active-class="transition ease-out duration-100"
                  enter-from-class="transform opacity-0 scale-95"
                  enter-to-class="transform opacity-100 scale-100"
                  leave-active-class="transition ease-in duration-75"
                  leave-from-class="transform opacity-100 scale-100"
                  leave-to-class="transform opacity-0 scale-95"
                >
                  <MenuItems
                    class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                  >
                    <MenuItem v-slot="{ active }">
                      <router-link
                        to="/account"
                        :class="[
                          active ? 'bg-gray-100' : '',
                          'block px-4 py-2 text-sm text-gray-700'
                        ]"
                      >
                        <UserIcon class="mr-2 h-4 w-4 inline" />
                        Paramètres du compte
                      </router-link>
                    </MenuItem>
                    <MenuItem v-slot="{ active }">
                      <button
                        @click="logout"
                        :class="[
                          active ? 'bg-gray-100' : '',
                          'block w-full text-left px-4 py-2 text-sm text-gray-700'
                        ]"
                      >
                        <ArrowRightOnRectangleIcon class="mr-2 h-4 w-4 inline" />
                        Déconnexion
                      </button>
                    </MenuItem>
                  </MenuItems>
                </transition>
              </Menu>
            </div>
          </div>
        </header>
        
        <!-- Contenu de la page -->
        <main class="flex-1 overflow-auto">
          <div class="p-6">
            <router-view />
          </div>
        </main>
      </div>
    </div>
    
    <!-- Notifications dropdown -->
    <div
      v-if="showNotifications"
      class="fixed right-4 top-20 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50"
    >
      <div class="p-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">Notifications</h3>
      </div>
      <div class="max-h-96 overflow-y-auto">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
        >
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <component
                :is="getNotificationIcon(notification.type)"
                class="h-5 w-5 text-gray-400"
              />
            </div>
            <div class="ml-3 flex-1">
              <p class="text-sm font-medium text-gray-900">
                {{ notification.title }}
              </p>
              <p class="text-sm text-gray-500">
                {{ notification.message }}
              </p>
              <p class="text-xs text-gray-400 mt-1">
                {{ formatDate(notification.created_at) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Menu, MenuButton, MenuItem } from '@headlessui/vue'
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
  UsersIcon
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { setupRouterGuards } from '@/router'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const showNotifications = ref(false)
const notifications = ref([
  {
    id: 1,
    type: 'info',
    title: 'Nouveau patient',
    message: 'Le patient Jean Dupont a été ajouté au système',
    created_at: new Date()
  },
  {
    id: 2,
    type: 'warning',
    title: 'Appel en attente',
    message: '3 appels sont en attente de traitement',
    created_at: new Date(Date.now() - 3600000)
  }
])

const notificationCount = computed(() => notifications.value.length)

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: HomeIcon },
  { name: 'Appels', href: '/calls', icon: PhoneIcon },
  { name: 'Paramètres du compte', href: '/account', icon: UserIcon },
  ...(authStore.isAdmin ? [{ name: 'Paramétrage système', href: '/system', icon: CogIcon }] : [])
]

const pageTitle = computed(() => {
  const routeNames: Record<string, string> = {
    'Dashboard': 'Tableau de bord',
    'Calls': 'Gestion des appels',
    'Account': 'Paramètres du compte',
    'System': 'Paramétrage du système'
  }
  return routeNames[route.name as string] || 'HelloJADE Manager'
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
    default:
      return InformationCircleIcon
  }
}

const formatDate = (date: Date) => {
  return new Intl.RelativeTimeFormat('fr').format(
    Math.floor((date.getTime() - Date.now()) / (1000 * 60)),
    'minute'
  )
}

const logout = async () => {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error)
  }
}

// Configuration des guards de routage
onMounted(() => {
  setupRouterGuards(router)
})
</script>

<style>
#app {
  font-family: 'Inter', system-ui, sans-serif;
}
</style> 