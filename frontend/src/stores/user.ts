import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/utils/api'

export interface UserProfile {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: string
  avatar?: string
  preferences: {
    theme: 'light' | 'dark' | 'auto'
    language: string
    notifications: boolean
  }
}

export const useUserStore = defineStore('user', () => {
  const profile = ref<UserProfile | null>(null)
  const isLoading = ref(false)

  const fetchProfile = async () => {
    try {
      isLoading.value = true
      
      // Simulation de données
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      profile.value = {
        id: 1,
        username: 'admin',
        email: 'admin@hellojade.fr',
        first_name: 'Administrateur',
        last_name: 'HelloJADE',
        role: 'admin',
        avatar: '/default-avatar.png',
        preferences: {
          theme: 'light',
          language: 'fr',
          notifications: true
        }
      }
      
      console.log('Profil utilisateur chargé avec succès')
      
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error)
    } finally {
      isLoading.value = false
    }
  }

  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      isLoading.value = true
      
      // Simulation de mise à jour
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (profile.value) {
        profile.value = { ...profile.value, ...data }
      }
      
      console.log('Profil mis à jour avec succès')
      return true
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  return {
    profile,
    isLoading,
    fetchProfile,
    updateProfile
  }
}) 