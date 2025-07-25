<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Paramétrage du système</h1>
      <p class="text-gray-600">Configuration avancée pour les administrateurs</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Menu latéral -->
      <div class="lg:col-span-1">
        <nav class="space-y-1">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              activeTab === tab.id
                ? 'bg-green-50 border-green-500 text-green-700'
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              'group flex items-center px-3 py-2 text-sm font-medium border-l-4 transition-colors duration-200'
            ]"
          >
            <component
              :is="tab.icon"
              :class="[
                activeTab === tab.id ? 'text-green-500' : 'text-gray-400 group-hover:text-gray-500',
                'mr-3 h-5 w-5 transition-colors duration-200'
              ]"
            />
            {{ tab.name }}
          </button>
        </nav>
      </div>

      <!-- Contenu -->
      <div class="lg:col-span-2">
        <!-- Gestion des utilisateurs -->
        <div v-if="activeTab === 'users'" class="space-y-6">
          <!-- En-tête avec bouton d'ajout -->
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Gestion des utilisateurs</h3>
            <button
              @click="showCreateUserModal = true"
              class="btn-primary"
            >
              <PlusIcon class="h-4 w-4 mr-2" />
              Créer un utilisateur
            </button>
          </div>

          <!-- Filtres -->
          <div class="card">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Recherche
                </label>
                <input
                  v-model="userFilters.search"
                  type="text"
                  placeholder="Nom, email..."
                  class="input-field"
                  @input="debouncedUserSearch"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Rôle
                </label>
                <select
                  v-model="userFilters.role"
                  @change="loadUsers"
                  class="input-field"
                >
                  <option value="">Tous les rôles</option>
                  <option value="admin">Administrateur</option>
                  <option value="user">Utilisateur standard</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <select
                  v-model="userFilters.status"
                  @change="loadUsers"
                  class="input-field"
                >
                  <option value="">Tous les statuts</option>
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Tableau des utilisateurs -->
          <div class="card">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="table-header">Nom</th>
                    <th class="table-header">Email</th>
                    <th class="table-header">Rôle</th>
                    <th class="table-header">Statut</th>
                    <th class="table-header">Dernière connexion</th>
                    <th class="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr
                    v-for="user in users"
                    :key="user.id"
                    class="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td class="table-cell">
                      <div>
                        <div class="font-medium text-gray-900">
                          {{ user.first_name }} {{ user.last_name }}
                        </div>
                      </div>
                    </td>
                    <td class="table-cell">
                      {{ user.email }}
                    </td>
                    <td class="table-cell">
                      <span
                        :class="[
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        ]"
                      >
                        {{ user.role === 'admin' ? 'Administrateur' : 'Utilisateur' }}
                      </span>
                    </td>
                    <td class="table-cell">
                      <span
                        :class="[
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        ]"
                      >
                        {{ user.is_active ? 'Actif' : 'Inactif' }}
                      </span>
                    </td>
                    <td class="table-cell">
                      {{ user.last_login ? formatDate(user.last_login) : 'Jamais' }}
                    </td>
                    <td class="table-cell">
                      <div class="flex items-center space-x-2">
                        <button
                          @click="editUser(user)"
                          class="text-gray-400 hover:text-gray-600"
                          title="Modifier"
                        >
                          <PencilIcon class="h-4 w-4" />
                        </button>
                        <button
                          @click="toggleUserStatus(user)"
                          :class="[
                            'text-gray-400 hover:text-gray-600',
                            user.is_active ? 'hover:text-red-600' : 'hover:text-green-600'
                          ]"
                          :title="user.is_active ? 'Désactiver' : 'Activer'"
                        >
                          <component :is="user.is_active ? PauseIcon : PlayIcon" class="h-4 w-4" />
                        </button>
                        <button
                          v-if="user.role !== 'admin'"
                          @click="deleteUser(user)"
                          class="text-gray-400 hover:text-red-600"
                          title="Supprimer"
                        >
                          <TrashIcon class="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Paramètres système -->
        <div v-if="activeTab === 'settings'" class="space-y-6">
          <h3 class="text-lg font-semibold text-gray-900">Paramètres système</h3>
          
          <form @submit.prevent="updateSystemSettings" class="space-y-6">
            <div class="card">
              <h4 class="font-medium text-gray-900 mb-4">Configuration des appels</h4>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Heure d'appel par défaut
                  </label>
                  <input
                    v-model="systemSettings.default_call_time"
                    type="time"
                    class="input-field"
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de tentatives
                  </label>
                  <input
                    v-model="systemSettings.max_attempts"
                    type="number"
                    min="1"
                    max="10"
                    class="input-field"
                  />
                </div>
              </div>
              
              <div class="mt-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Moment de l'appel
                </label>
                <select
                  v-model="systemSettings.call_timing"
                  class="input-field"
                >
                  <option value="J+12h">J+12h</option>
                  <option value="J+24h">J+24h</option>
                  <option value="J+36h">J+36h</option>
                  <option value="J+48h">J+48h</option>
                  <option value="J+72h">J+72h</option>
                </select>
              </div>
            </div>

            <div class="card">
              <h4 class="font-medium text-gray-900 mb-4">Base de connaissances</h4>
              
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Fichier KB actuel
                  </label>
                  <div class="flex items-center space-x-3">
                    <DocumentIcon class="h-5 w-5 text-gray-400" />
                    <span class="text-sm text-gray-600">
                      {{ currentKBFile || 'Aucun fichier chargé' }}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Charger un nouveau fichier KB
                  </label>
                  <input
                    ref="kbFileInput"
                    type="file"
                    accept=".json,.txt,.md"
                    @change="handleKBFileUpload"
                    class="hidden"
                  />
                  <button
                    type="button"
                    @click="$refs.kbFileInput.click()"
                    class="btn-secondary"
                  >
                    <ArrowUpTrayIcon class="h-4 w-4 mr-2" />
                    Sélectionner un fichier
                  </button>
                  <p v-if="selectedKBFile" class="mt-1 text-sm text-gray-500">
                    Fichier sélectionné : {{ selectedKBFile.name }}
                  </p>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-end space-x-3">
              <button
                type="button"
                @click="resetSystemSettings"
                class="btn-secondary"
              >
                Annuler
              </button>
              <button
                type="submit"
                :disabled="isLoading"
                class="btn-primary"
              >
                {{ isLoading ? 'Enregistrement...' : 'Enregistrer' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal Création/Modification utilisateur -->
    <div v-if="showCreateUserModal || showEditUserModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ showEditUserModal ? 'Modifier l\'utilisateur' : 'Créer un utilisateur' }}
          </h3>
          <button
            @click="closeUserModal"
            class="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>
        
        <form @submit.prevent="saveUser" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Prénom
              </label>
              <input
                v-model="userForm.first_name"
                type="text"
                required
                class="input-field"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Nom
              </label>
              <input
                v-model="userForm.last_name"
                type="text"
                required
                class="input-field"
              />
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              v-model="userForm.email"
              type="email"
              required
              class="input-field"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Rôle
            </label>
            <select
              v-model="userForm.role"
              required
              class="input-field"
            >
              <option value="user">Utilisateur standard</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
          
          <div class="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              @click="closeUserModal"
              class="btn-secondary"
            >
              Annuler
            </button>
            <button
              type="submit"
              :disabled="isLoading"
              class="btn-primary"
            >
              {{ isLoading ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  UsersIcon,
  CogIcon,
  PlusIcon,
  PencilIcon,
  PauseIcon,
  PlayIcon,
  TrashIcon,
  DocumentIcon,
  ArrowUpTrayIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'
import { useToast } from 'vue-toastification'

const toast = useToast()

// Onglets
const tabs = [
  { id: 'users', name: 'Gestion des utilisateurs', icon: UsersIcon },
  { id: 'settings', name: 'Paramètres système', icon: CogIcon }
]

const activeTab = ref('users')
const isLoading = ref(false)

// Gestion des utilisateurs
const showCreateUserModal = ref(false)
const showEditUserModal = ref(false)
const editingUser = ref(null)

const userFilters = reactive({
  search: '',
  role: '',
  status: ''
})

const users = ref([
  {
    id: 1,
    first_name: 'Jean',
    last_name: 'Dupont',
    email: 'jean.dupont@hospital.be',
    role: 'admin',
    is_active: true,
    last_login: '2024-01-18T14:30:00'
  },
  {
    id: 2,
    first_name: 'Marie',
    last_name: 'Martin',
    email: 'marie.martin@hospital.be',
    role: 'user',
    is_active: true,
    last_login: '2024-01-17T09:15:00'
  },
  {
    id: 3,
    first_name: 'Pierre',
    last_name: 'Bernard',
    email: 'pierre.bernard@hospital.be',
    role: 'user',
    is_active: false,
    last_login: '2024-01-15T16:45:00'
  }
])

const userForm = reactive({
  first_name: '',
  last_name: '',
  email: '',
  role: 'user'
})

// Paramètres système
const systemSettings = reactive({
  default_call_time: '14:00',
  max_attempts: 3,
  call_timing: 'J+24h'
})

const currentKBFile = ref('hellojade-kb-v1.2.json')
const selectedKBFile = ref(null)

// Recherche avec debounce
let userSearchTimeout: NodeJS.Timeout
const debouncedUserSearch = () => {
  clearTimeout(userSearchTimeout)
  userSearchTimeout = setTimeout(() => {
    loadUsers()
  }, 300)
}

// Charger les utilisateurs
const loadUsers = async () => {
  try {
    isLoading.value = true
    // Simuler un appel API
    await new Promise(resolve => setTimeout(resolve, 500))
  } catch (error) {
    console.error('Erreur lors du chargement des utilisateurs:', error)
    toast.error('Erreur lors du chargement des utilisateurs')
  } finally {
    isLoading.value = false
  }
}

// Créer un utilisateur
const createUser = () => {
  showCreateUserModal.value = true
  resetUserForm()
}

// Modifier un utilisateur
const editUser = (user: any) => {
  editingUser.value = user
  userForm.first_name = user.first_name
  userForm.last_name = user.last_name
  userForm.email = user.email
  userForm.role = user.role
  showEditUserModal.value = true
}

// Sauvegarder un utilisateur
const saveUser = async () => {
  try {
    isLoading.value = true
    
    if (showEditUserModal.value && editingUser.value) {
      // Mise à jour
      const index = users.value.findIndex(u => u.id === editingUser.value.id)
      if (index !== -1) {
        users.value[index] = { ...editingUser.value, ...userForm }
      }
      toast.success('Utilisateur modifié avec succès')
    } else {
      // Création
      const newUser = {
        id: Date.now(),
        ...userForm,
        is_active: true,
        last_login: null
      }
      users.value.push(newUser)
      toast.success('Utilisateur créé avec succès')
    }
    
    closeUserModal()
    
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
    toast.error('Erreur lors de la sauvegarde')
  } finally {
    isLoading.value = false
  }
}

// Basculer le statut d'un utilisateur
const toggleUserStatus = async (user: any) => {
  try {
    user.is_active = !user.is_active
    toast.success(`Utilisateur ${user.is_active ? 'activé' : 'désactivé'} avec succès`)
  } catch (error) {
    console.error('Erreur lors du changement de statut:', error)
    toast.error('Erreur lors du changement de statut')
  }
}

// Supprimer un utilisateur
const deleteUser = async (user: any) => {
  if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.first_name} ${user.last_name} ?`)) {
    try {
      const index = users.value.findIndex(u => u.id === user.id)
      if (index !== -1) {
        users.value.splice(index, 1)
        toast.success('Utilisateur supprimé avec succès')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast.error('Erreur lors de la suppression')
    }
  }
}

// Fermer le modal utilisateur
const closeUserModal = () => {
  showCreateUserModal.value = false
  showEditUserModal.value = false
  editingUser.value = null
  resetUserForm()
}

// Réinitialiser le formulaire utilisateur
const resetUserForm = () => {
  userForm.first_name = ''
  userForm.last_name = ''
  userForm.email = ''
  userForm.role = 'user'
}

// Gestion du fichier KB
const handleKBFileUpload = (event: any) => {
  const file = event.target.files[0]
  if (file) {
    selectedKBFile.value = file
  }
}

// Mettre à jour les paramètres système
const updateSystemSettings = async () => {
  try {
    isLoading.value = true
    
    // Simuler un appel API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (selectedKBFile.value) {
      currentKBFile.value = selectedKBFile.value.name
      selectedKBFile.value = null
    }
    
    toast.success('Paramètres mis à jour avec succès')
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error)
    toast.error('Erreur lors de la mise à jour')
  } finally {
    isLoading.value = false
  }
}

// Réinitialiser les paramètres système
const resetSystemSettings = () => {
  systemSettings.default_call_time = '14:00'
  systemSettings.max_attempts = 3
  systemSettings.call_timing = 'J+24h'
  selectedKBFile.value = null
}

// Formater une date
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Initialisation
onMounted(() => {
  loadUsers()
})
</script> 