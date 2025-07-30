<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- En-tête -->
      <div class="mb-8">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Gestion des utilisateurs</h1>
            <p class="mt-2 text-gray-600">
              Gérez les comptes utilisateurs et leurs permissions
            </p>
          </div>
          <button
            @click="showAddUserModal = true"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon class="mr-2 h-4 w-4" />
            Nouvel utilisateur
          </button>
        </div>
      </div>

      <!-- Filtres -->
      <div class="bg-[#36454F] rounded-lg shadow p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Recherche
            </label>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Nom, email, rôle..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Rôle
            </label>
            <select
              v-model="roleFilter"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les rôles</option>
              <option value="admin">Administrateur</option>
              <option value="user">Utilisateur</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              v-model="statusFilter"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
              <option value="suspended">Suspendu</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Tableau des utilisateurs -->
      <div class="bg-[#36454F] rounded-lg shadow overflow-hidden">
        <DataTable
          :data="filteredUsers"
          :columns="columns"
          :loading="loading"
          @row-click="handleUserClick"
          @edit="handleEditUser"
          @delete="handleDeleteUser"
        >
          <template #cell-role="{ row }">
            <span
              :class="[
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                getRoleClass(row.role)
              ]"
            >
              {{ getRoleLabel(row.role) }}
            </span>
          </template>
          
          <template #cell-status="{ row }">
            <span
              :class="[
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                getStatusClass(row.status)
              ]"
            >
              {{ getStatusLabel(row.status) }}
            </span>
          </template>
          
          <template #cell-actions="{ row }">
            <div class="flex space-x-2">
              <button
                @click.stop="handleEditUser(row)"
                class="text-blue-600 hover:text-blue-900"
              >
                <PencilIcon class="h-4 w-4" />
              </button>
              <button
                @click.stop="toggleUserStatus(row)"
                :class="row.status === 'active' ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'"
              >
                <component :is="row.status === 'active' ? PauseIcon : PlayIcon" class="h-4 w-4" />
              </button>
              <button
                @click.stop="handleDeleteUser(row)"
                class="text-red-600 hover:text-red-900"
              >
                <TrashIcon class="h-4 w-4" />
              </button>
            </div>
          </template>
        </DataTable>
      </div>
    </div>

    <!-- Modal d'ajout/édition d'utilisateur -->
    <UserModal
      v-if="showAddUserModal"
      :user="selectedUser"
      @close="closeUserModal"
      @save="handleSaveUser"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PauseIcon,
  PlayIcon
} from '@heroicons/vue/24/outline'
import DataTable from '@/components/common/DataTable.vue'
import UserModal from '@/components/UserModal.vue'
import { useUserStore } from '@/stores/user'
import { useNotifications } from '@/composables/useNotifications'

const userStore = useUserStore()
const { showNotification } = useNotifications()

// État local
const loading = ref(false)
const searchQuery = ref('')
const roleFilter = ref('')
const statusFilter = ref('')
const showAddUserModal = ref(false)
const selectedUser = ref(null)

// Colonnes du tableau
const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Nom', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'role', label: 'Rôle', sortable: true },
  { key: 'status', label: 'Statut', sortable: true },
  { key: 'lastLogin', label: 'Dernière connexion', sortable: true },
  { key: 'createdAt', label: 'Date création', sortable: true },
  { key: 'actions', label: 'Actions', sortable: false }
]

// Computed
const filteredUsers = computed(() => {
  let users = userStore.users

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    users = users.filter(user => 
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    )
  }

  if (roleFilter.value) {
    users = users.filter(user => user.role === roleFilter.value)
  }

  if (statusFilter.value) {
    users = users.filter(user => user.status === statusFilter.value)
  }

  return users
})

// Méthodes
const loadUsers = async () => {
  loading.value = true
  try {
    await userStore.fetchUsers()
  } catch (error) {
    showNotification('Erreur lors du chargement des utilisateurs', 'error')
  } finally {
    loading.value = false
  }
}

const handleUserClick = (user: any) => {
  // Navigation vers le détail de l'utilisateur
  // TODO: Implémenter la navigation vers le détail
}

const handleEditUser = (user: any) => {
  selectedUser.value = user
  showAddUserModal.value = true
}

const handleDeleteUser = async (user: any) => {
  if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.name} ?`)) {
    try {
      await userStore.deleteUser(user.id)
      showNotification('Utilisateur supprimé avec succès', 'success')
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error')
    }
  }
}

const toggleUserStatus = async (user: any) => {
  const newStatus = user.status === 'active' ? 'inactive' : 'active'
  try {
    await userStore.updateUser(user.id, { status: newStatus })
    showNotification(`Statut de l'utilisateur mis à jour`, 'success')
  } catch (error) {
    showNotification('Erreur lors de la mise à jour', 'error')
  }
}

const handleSaveUser = async (userData: any) => {
  try {
    if (selectedUser.value) {
      await userStore.updateUser(selectedUser.value.id, userData)
      showNotification('Utilisateur mis à jour avec succès', 'success')
    } else {
      await userStore.createUser(userData)
      showNotification('Utilisateur créé avec succès', 'success')
    }
    closeUserModal()
  } catch (error) {
    showNotification('Erreur lors de la sauvegarde', 'error')
  }
}

const closeUserModal = () => {
  showAddUserModal.value = false
  selectedUser.value = null
}

const getRoleClass = (role: string) => {
  switch (role) {
    case 'admin':
      return 'bg-red-100 text-red-800'
    case 'manager':
      return 'bg-purple-100 text-purple-800'
    case 'user':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'admin':
      return 'Administrateur'
    case 'manager':
      return 'Manager'
    case 'user':
      return 'Utilisateur'
    default:
      return 'Inconnu'
  }
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'inactive':
      return 'bg-gray-100 text-gray-800'
    case 'suspended':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active':
      return 'Actif'
    case 'inactive':
      return 'Inactif'
    case 'suspended':
      return 'Suspendu'
    default:
      return 'Inconnu'
  }
}

// Lifecycle
onMounted(() => {
  loadUsers()
})
</script> 
