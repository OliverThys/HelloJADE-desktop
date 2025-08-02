import { ref } from 'vue'
import type { Notification } from '@/components/NotificationToast.vue'

// Instance globale du composant de notification
let notificationInstance: any = null

// Fonction pour définir l'instance de notification
export const setNotificationInstance = (instance: any) => {
  notificationInstance = instance
}

// Fonction pour obtenir l'instance de notification
const getNotificationInstance = () => {
  if (!notificationInstance) {
    console.warn('Notification instance not set. Make sure NotificationToast component is mounted.')
    return null
  }
  return notificationInstance
}

// Fonctions utilitaires pour les différents types de notifications
export const useNotifications = () => {
  const showNotification = (notification: Omit<Notification, 'id'>) => {
    const instance = getNotificationInstance()
    if (instance) {
      instance.addNotification(notification)
    }
  }

  const showSuccess = (title: string, message: string, duration?: number) => {
    showNotification({
      type: 'success',
      title,
      message,
      duration
    })
  }

  const showError = (title: string, message: string, duration?: number) => {
    showNotification({
      type: 'error',
      title,
      message,
      duration
    })
  }

  const showWarning = (title: string, message: string, duration?: number) => {
    showNotification({
      type: 'warning',
      title,
      message,
      duration
    })
  }

  const showInfo = (title: string, message: string, duration?: number) => {
    showNotification({
      type: 'info',
      title,
      message,
      duration
    })
  }

  const removeNotification = (id: string) => {
    const instance = getNotificationInstance()
    if (instance) {
      instance.removeNotification(id)
    }
  }

  return {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification
  }
}

// Fonctions globales pour utilisation directe
export const notify = {
  success: (title: string, message: string, duration?: number) => {
    const { showSuccess } = useNotifications()
    showSuccess(title, message, duration)
  },
  
  error: (title: string, message: string, duration?: number) => {
    const { showError } = useNotifications()
    showError(title, message, duration)
  },
  
  warning: (title: string, message: string, duration?: number) => {
    const { showWarning } = useNotifications()
    showWarning(title, message, duration)
  },
  
  info: (title: string, message: string, duration?: number) => {
    const { showInfo } = useNotifications()
    showInfo(title, message, duration)
  }
} 