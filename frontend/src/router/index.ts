import { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Pages
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import CallsView from '@/views/CallsView.vue'
import AccountSettingsView from '@/views/AccountSettingsView.vue'
import SystemSettingsView from '@/views/SystemSettingsView.vue'
import NotFoundView from '@/views/NotFoundView.vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { 
      requiresAuth: false,
      title: 'Connexion - HelloJADE'
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: { 
      requiresAuth: true,
      title: 'Tableau de bord - HelloJADE'
    }
  },
  {
    path: '/calls',
    name: 'Calls',
    component: CallsView,
    meta: { 
      requiresAuth: true,
      title: 'Gestion des appels - HelloJADE'
    }
  },
  {
    path: '/account',
    name: 'Account',
    component: AccountSettingsView,
    meta: { 
      requiresAuth: true,
      title: 'Paramètres du compte - HelloJADE'
    }
  },
  {
    path: '/system',
    name: 'System',
    component: SystemSettingsView,
    meta: { 
      requiresAuth: true,
      requiresAdmin: true,
      title: 'Paramétrage du système - HelloJADE'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFoundView,
    meta: { 
      requiresAuth: false,
      title: 'Page non trouvée - HelloJADE'
    }
  }
]

// Navigation guard
export function setupRouterGuards(router: any) {
  router.beforeEach(async (to: any, from: any, next: any) => {
    const authStore = useAuthStore()
    
    // Vérifier l'authentification si nécessaire
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      // Essayer de restaurer la session
      const isAuthenticated = await authStore.checkAuth()
      if (!isAuthenticated) {
        next('/login')
        return
      }
    }
    
    // Vérifier les permissions admin si nécessaire
    if (to.meta.requiresAdmin && !authStore.isAdmin) {
      next('/dashboard')
      return
    }
    
    // Rediriger vers le dashboard si déjà connecté et sur login
    if (to.path === '/login' && authStore.isAuthenticated) {
      next('/dashboard')
      return
    }
    
    // Mettre à jour le titre de la page
    if (to.meta.title) {
      document.title = to.meta.title
    }
    
    next()
  })
} 