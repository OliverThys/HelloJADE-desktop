<template>
  <header class="bg-[#36454F] shadow-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo et titre -->
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <img
              class="h-8 w-8"
              src="@/assets/logo.svg"
              alt="HelloJADE"
            />
          </div>
          <div class="ml-3">
            <h1 class="text-xl font-semibold text-gray-900">
              HelloJADE
            </h1>
            <p class="text-sm text-gray-500">
              Gestion Post-Hospitalisation
            </p>
          </div>
        </div>

        <!-- Navigation principale -->
        <nav class="hidden md:flex space-x-8">
          <router-link
            v-for="item in navigation"
            :key="item.name"
            :to="item.href"
            :class="[
              $route.path === item.href
                ? 'border-blue-500 text-gray-900'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
              'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium'
            ]"
          >
            <component :is="item.icon" class="mr-2 h-4 w-4" />
            {{ item.name }}
          </router-link>
        </nav>

        <!-- Actions utilisateur -->
        <div class="flex items-center space-x-4">
          <!-- Notifications -->
          <button
            @click="showNotifications = !showNotifications"
            class="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <BellIcon class="h-6 w-6" />
            <span
              v-if="notificationCount > 0"
              class="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"
            />
          </button>

          <!-- Menu utilisateur -->
          <Menu as="div" class="relative">
            <MenuButton
              class="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <img
                class="h-8 w-8 rounded-full"
                :src="userAvatar"
                :alt="userStore.user?.name"
              />
              <span class="ml-2 text-gray-700">{{ userStore.user?.name }}</span>
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
                class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-[#36454F] py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
              >
                <MenuItem v-slot="{ active }">
                  <router-link
                    to="/profile"
                    :class="[
                      active ? 'bg-gray-100' : '',
                      'block px-4 py-2 text-sm text-gray-700'
                    ]"
                  >
                    <UserIcon class="mr-2 h-4 w-4 inline" />
                    Profil
                  </router-link>
                </MenuItem>
                <MenuItem v-slot="{ active }">
                  <router-link
                    to="/settings"
                    :class="[
                      active ? 'bg-gray-100' : '',
                      'block px-4 py-2 text-sm text-gray-700'
                    ]"
                  >
                    <CogIcon class="mr-2 h-4 w-4 inline" />
                    Paramètres
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
    </div>

    <!-- Notifications dropdown -->
    <div
      v-if="showNotifications"
      class="absolute right-0 mt-2 w-80 bg-[#36454F] rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20"
    >
      <div class="py-1">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="px-4 py-2 hover:bg-gray-50 cursor-pointer"
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
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import {
  BellIcon,
  ChevronDownIcon,
  UserIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  CircleStackIcon
} from '@heroicons/vue/24/outline'
import { useUserStore } from '@/stores/user'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const userStore = useUserStore()
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
  { name: 'Tableau de bord', href: '/', icon: 'HomeIcon' },
  { name: 'Patients', href: '/patients', icon: 'UsersIcon' },
  { name: 'Appels', href: '/calls', icon: 'PhoneIcon' },
  { name: 'Monitoring', href: '/monitoring', icon: 'CircleStackIcon' }
]

const userAvatar = computed(() => {
  return userStore.user?.avatar || '/default-avatar.png'
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
</script> 
