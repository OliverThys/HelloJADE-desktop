import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '@/utils/api'
import { useToast } from 'vue-toastification'

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: 'admin' | 'user'
  is_active: boolean
  last_login?: string
  avatar?: string
}

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const toast = useToast()

  // Computed properties
  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const userFullName = computed(() => {
    if (!user.value) return ''
    return `${user.value.first_name} ${user.value.last_name}`
  })
  const userInitials = computed(() => {
    if (!user.value) return 'U'
    return `${user.value.first_name?.[0] || ''}${user.value.last_name?.[0] || ''}`.toUpperCase()
  })

  // Actions
  const setUser = (userData: User) => {
    user.value = userData
  }

  const clearUser = () => {
    user.value = null
  }

  const updateUser = (userData: Partial<User>) => {
    if (user.value) {
      user.value = { ...user.value, ...userData }
    }
  }

  return {
    // State
    user,
    isLoading,
    
    // Computed
    isAuthenticated,
    isAdmin,
    userFullName,
    userInitials,
    
    // Actions
    setUser,
    clearUser,
    updateUser
  }
}) 