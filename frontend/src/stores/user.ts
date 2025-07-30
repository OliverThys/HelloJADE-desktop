import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/utils/api'
import { useToast } from 'vue-toastification'

export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'manager' | 'user'
  status: 'active' | 'inactive' | 'suspended'
  phone?: string
  department?: string
  lastLogin?: string
  createdAt?: string
  permissions?: {
    patients: boolean
    calls: boolean
    reports: boolean
    admin: boolean
  }
}

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const users = ref<User[]>([])
  const isLoading = ref(false)
  const toast = useToast()

  // Computed properties
  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const userFullName = computed(() => {
    if (!user.value) return ''
    return user.value.name
  })
  const userInitials = computed(() => {
    if (!user.value) return 'U'
    return user.value.name.split(' ').map(n => n[0]).join('').toUpperCase()
  })

  // Actions pour l'utilisateur courant
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

  // Actions pour la gestion des utilisateurs (admin)
  const fetchUsers = async () => {
    isLoading.value = true
    try {
      const response = await api.get('/users')
      users.value = response.data
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error)
      toast.error('Erreur lors du chargement des utilisateurs')
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const fetchUser = async (id: number) => {
    isLoading.value = true
    try {
      const response = await api.get(`/users/${id}`)
      return response.data
    } catch (error) {
      console.error('Erreur lors du chargement de l\'utilisateur:', error)
      toast.error('Erreur lors du chargement de l\'utilisateur')
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const createUser = async (userData: Partial<User>) => {
    isLoading.value = true
    try {
      const response = await api.post('/users', userData)
      users.value.push(response.data)
      toast.success('Utilisateur créé avec succès')
      return response.data
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error)
      toast.error('Erreur lors de la création de l\'utilisateur')
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const updateUserById = async (id: number, userData: Partial<User>) => {
    isLoading.value = true
    try {
      const response = await api.put(`/users/${id}`, userData)
      const index = users.value.findIndex(u => u.id === id)
      if (index !== -1) {
        users.value[index] = response.data
      }
      toast.success('Utilisateur mis à jour avec succès')
      return response.data
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error)
      toast.error('Erreur lors de la mise à jour de l\'utilisateur')
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const deleteUser = async (id: number) => {
    isLoading.value = true
    try {
      await api.delete(`/users/${id}`)
      users.value = users.value.filter(u => u.id !== id)
      toast.success('Utilisateur supprimé avec succès')
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error)
      toast.error('Erreur lors de la suppression de l\'utilisateur')
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const toggleUserStatus = async (id: number, status: User['status']) => {
    try {
      await updateUserById(id, { status })
      toast.success('Statut de l\'utilisateur mis à jour')
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error)
      toast.error('Erreur lors de la mise à jour du statut')
      throw error
    }
  }

  return {
    // State
    user,
    users,
    isLoading,
    
    // Computed
    isAuthenticated,
    isAdmin,
    userFullName,
    userInitials,
    
    // Actions pour l'utilisateur courant
    setUser,
    clearUser,
    updateUser,
    
    // Actions pour la gestion des utilisateurs (admin)
    fetchUsers,
    fetchUser,
    createUser,
    updateUserById,
    deleteUser,
    toggleUserStatus
  }
}) 