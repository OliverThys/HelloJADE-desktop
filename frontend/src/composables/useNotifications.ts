import { ref, onMounted, onUnmounted } from 'vue'
import { useToast } from 'vue-toastification'

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    callback: () => void
  }
  createdAt: Date
  read: boolean
}

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  meta?: boolean
  description: string
  action: () => void
  global?: boolean
}

export function useNotifications() {
  const toast = useToast()
  const notifications = ref<Notification[]>([])
  const shortcuts = ref<KeyboardShortcut[]>([])
  const isMuted = ref(false)

  // Fonction pour créer une notification
  const createNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: new Date(),
      read: false
    }

    notifications.value.unshift(newNotification)

    // Afficher la notification toast si pas en mode silencieux
    if (!isMuted.value) {
      const toastOptions = {
        timeout: notification.duration || 5000,
        closeOnClick: true,
        pauseOnFocusLoss: true,
        pauseOnHover: true
      }

      switch (notification.type) {
        case 'success':
          toast.success(notification.message, toastOptions)
          break
        case 'error':
          toast.error(notification.message, toastOptions)
          break
        case 'warning':
          toast.warning(notification.message, toastOptions)
          break
        default:
          toast.info(notification.message, toastOptions)
      }
    }

    return id
  }

  // Fonctions de raccourci pour les notifications courantes
  const notifySuccess = (title: string, message: string, duration?: number) => {
    return createNotification({
      type: 'success',
      title,
      message,
      duration
    })
  }

  const notifyError = (title: string, message: string, duration?: number) => {
    return createNotification({
      type: 'error',
      title,
      message,
      duration
    })
  }

  const notifyWarning = (title: string, message: string, duration?: number) => {
    return createNotification({
      type: 'warning',
      title,
      message,
      duration
    })
  }

  const notifyInfo = (title: string, message: string, duration?: number) => {
    return createNotification({
      type: 'info',
      title,
      message,
      duration
    })
  }

  // Fonction showNotification pour compatibilité
  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration?: number) => {
    switch (type) {
      case 'success':
        return notifySuccess('Succès', message, duration)
      case 'error':
        return notifyError('Erreur', message, duration)
      case 'warning':
        return notifyWarning('Attention', message, duration)
      default:
        return notifyInfo('Information', message, duration)
    }
  }

  // Fonction pour marquer une notification comme lue
  const markAsRead = (id: string) => {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.read = true
    }
  }

  // Fonction pour marquer toutes les notifications comme lues
  const markAllAsRead = () => {
    notifications.value.forEach(notification => {
      notification.read = true
    })
  }

  // Fonction pour supprimer une notification
  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  // Fonction pour supprimer toutes les notifications
  const clearNotifications = () => {
    notifications.value = []
  }

  // Fonction pour supprimer les notifications lues
  const clearReadNotifications = () => {
    notifications.value = notifications.value.filter(n => !n.read)
  }

  // Fonction pour basculer le mode silencieux
  const toggleMute = () => {
    isMuted.value = !isMuted.value
    if (isMuted.value) {
      notifyInfo('Notifications', 'Mode silencieux activé')
    } else {
      notifyInfo('Notifications', 'Mode silencieux désactivé')
    }
  }

  // Fonction pour ajouter un raccourci clavier
  const addShortcut = (shortcut: KeyboardShortcut) => {
    shortcuts.value.push(shortcut)
  }

  // Fonction pour supprimer un raccourci clavier
  const removeShortcut = (key: string) => {
    const index = shortcuts.value.findIndex(s => s.key === key)
    if (index !== -1) {
      shortcuts.value.splice(index, 1)
    }
  }

  // Fonction pour gérer les événements clavier
  const handleKeydown = (event: KeyboardEvent) => {
    const pressedKey = event.key.toLowerCase()
    const ctrl = event.ctrlKey
    const alt = event.altKey
    const shift = event.shiftKey
    const meta = event.metaKey

    // Chercher un raccourci correspondant
    const shortcut = shortcuts.value.find(s => {
      return s.key.toLowerCase() === pressedKey &&
             s.ctrl === ctrl &&
             s.alt === alt &&
             s.shift === shift &&
             s.meta === meta
    })

    if (shortcut) {
      event.preventDefault()
      shortcut.action()
    }
  }

  // Fonction pour obtenir les notifications non lues
  const getUnreadNotifications = () => {
    return notifications.value.filter(n => !n.read)
  }

  // Fonction pour obtenir les notifications par type
  const getNotificationsByType = (type: Notification['type']) => {
    return notifications.value.filter(n => n.type === type)
  }

  // Fonction pour obtenir les notifications récentes
  const getRecentNotifications = (hours: number = 24) => {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
    return notifications.value.filter(n => n.createdAt > cutoff)
  }

  // Fonction pour exporter les notifications
  const exportNotifications = () => {
    const data = notifications.value.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      createdAt: n.createdAt.toISOString(),
      read: n.read
    }))

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `notifications_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Fonction pour importer des notifications
  const importNotifications = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        data.forEach((item: any) => {
          createNotification({
            type: item.type,
            title: item.title,
            message: item.message,
            duration: 3000
          })
        })
        notifySuccess('Import', `${data.length} notifications importées`)
      } catch (error) {
        notifyError('Import', 'Erreur lors de l\'import des notifications')
      }
    }
    reader.readAsText(file)
  }

  // Raccourcis clavier par défaut
  const setupDefaultShortcuts = () => {
    addShortcut({
      key: 'n',
      ctrl: true,
      description: 'Nouvelle notification',
      action: () => {
        notifyInfo('Raccourci', 'Ctrl+N pressé')
      }
    })

    addShortcut({
      key: 'm',
      ctrl: true,
      description: 'Basculer mode silencieux',
      action: toggleMute
    })

    addShortcut({
      key: 'r',
      ctrl: true,
      description: 'Marquer tout comme lu',
      action: markAllAsRead
    })

    addShortcut({
      key: 'c',
      ctrl: true,
      description: 'Effacer toutes les notifications',
      action: clearNotifications
    })

    addShortcut({
      key: 'Escape',
      description: 'Fermer les modales',
      action: () => {
        // Cette action sera gérée par les composants
      }
    })
  }

  // Lifecycle hooks
  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
    setupDefaultShortcuts()
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })

  return {
    // State
    notifications,
    shortcuts,
    isMuted,

    // Actions
    createNotification,
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    showNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearNotifications,
    clearReadNotifications,
    toggleMute,
    addShortcut,
    removeShortcut,
    getUnreadNotifications,
    getNotificationsByType,
    getRecentNotifications,
    exportNotifications,
    importNotifications
  }
} 