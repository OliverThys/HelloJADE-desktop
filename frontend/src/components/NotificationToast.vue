<template>
  <TransitionGroup
    tag="div"
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="transform translate-x-full opacity-0"
    enter-to-class="transform translate-x-0 opacity-100"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="transform translate-x-0 opacity-100"
    leave-to-class="transform translate-x-full opacity-0"
    class="fixed top-4 right-4 z-50 space-y-2"
  >
    <div
      v-for="notification in notifications"
      :key="notification.id"
      class="flex items-center p-4 rounded-lg shadow-lg border-l-4 min-w-80 max-w-md"
      :class="getNotificationClasses(notification.type)"
    >
      <!-- Icône -->
      <div class="flex-shrink-0 mr-3">
        <CheckCircleIcon v-if="notification.type === 'success'" class="h-6 w-6 text-green-500" />
        <XCircleIcon v-else-if="notification.type === 'error'" class="h-6 w-6 text-red-500" />
        <ExclamationTriangleIcon v-else-if="notification.type === 'warning'" class="h-6 w-6 text-yellow-500" />
        <InformationCircleIcon v-else class="h-6 w-6 text-blue-500" />
      </div>

      <!-- Contenu -->
      <div class="flex-1">
        <h4 class="text-sm font-semibold" :class="getTitleClasses(notification.type)">
          {{ notification.title }}
        </h4>
        <p class="text-sm mt-1" :class="getMessageClasses(notification.type)">
          {{ notification.message }}
        </p>
      </div>

      <!-- Bouton fermer -->
      <button
        @click="removeNotification(notification.id)"
        class="flex-shrink-0 ml-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <XMarkIcon class="h-5 w-5" />
      </button>
    </div>
  </TransitionGroup>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
}

const notifications = ref<Notification[]>([])

// Fonction pour ajouter une notification
const addNotification = (notification: Omit<Notification, 'id'>) => {
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
  const newNotification: Notification = {
    ...notification,
    id,
    duration: notification.duration ?? 5000
  }

  notifications.value.push(newNotification)

  // Auto-remove après la durée spécifiée
  if (newNotification.duration > 0) {
    setTimeout(() => {
      removeNotification(id)
    }, newNotification.duration)
  }
}

// Fonction pour supprimer une notification
const removeNotification = (id: string) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

// Classes CSS pour les différents types de notifications
const getNotificationClasses = (type: Notification['type']) => {
  const baseClasses = 'bg-white dark:bg-slate-800 border'
  
  switch (type) {
    case 'success':
      return `${baseClasses} border-green-200 dark:border-green-700`
    case 'error':
      return `${baseClasses} border-red-200 dark:border-red-700`
    case 'warning':
      return `${baseClasses} border-yellow-200 dark:border-yellow-700`
    case 'info':
      return `${baseClasses} border-blue-200 dark:border-blue-700`
    default:
      return baseClasses
  }
}

const getTitleClasses = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return 'text-green-800 dark:text-green-200'
    case 'error':
      return 'text-red-800 dark:text-red-200'
    case 'warning':
      return 'text-yellow-800 dark:text-yellow-200'
    case 'info':
      return 'text-blue-800 dark:text-blue-200'
    default:
      return 'text-gray-800 dark:text-gray-200'
  }
}

const getMessageClasses = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return 'text-green-600 dark:text-green-300'
    case 'error':
      return 'text-red-600 dark:text-red-300'
    case 'warning':
      return 'text-yellow-600 dark:text-yellow-300'
    case 'info':
      return 'text-blue-600 dark:text-blue-300'
    default:
      return 'text-gray-600 dark:text-gray-300'
  }
}

// Exposer les fonctions pour utilisation globale
defineExpose({
  addNotification,
  removeNotification
})
</script> 