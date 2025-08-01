import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Pages principales
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import PatientsView from '@/views/PatientsView.vue'
import PatientDetailView from '@/views/PatientDetailView.vue'
import CallsView from '@/views/CallsView.vue'
import CallsEnhancedView from '@/views/CallsEnhancedView.vue'

import AccountSettingsView from '@/views/AccountSettingsView.vue'

// Pages admin
import AdminUsersView from '@/views/admin/AdminUsersView.vue'
import AdminSystemView from '@/views/admin/AdminSystemView.vue'
import AdminMonitoringView from '@/views/admin/AdminMonitoringView.vue'

// Page 404
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
      title: 'Connexion - HelloJADE',
      layout: 'auth'
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: { 
      requiresAuth: true,
      title: 'Tableau de bord - HelloJADE',
      icon: 'HomeIcon'
    }
  },
  {
    path: '/patients',
    name: 'Patients',
    component: PatientsView,
    meta: { 
      requiresAuth: true,
      title: 'Gestion des patients - HelloJADE',
      icon: 'UsersIcon'
    }
  },
  {
    path: '/patients/:id',
    name: 'PatientDetail',
    component: PatientDetailView,
    meta: { 
      requiresAuth: true,
      title: 'Détails du patient - HelloJADE',
      icon: 'UserIcon'
    },
    props: true
  },
  {
    path: '/calls',
    name: 'Calls',
    component: CallsView,
    meta: { 
      requiresAuth: true,
      title: 'Gestion des appels - HelloJADE',
      icon: 'PhoneIcon'
    }
  },
  {
    path: '/calls-enhanced',
    name: 'CallsEnhanced',
    component: CallsEnhancedView,
    meta: { 
      requiresAuth: true,
      title: 'Gestion des appels JADE - HelloJADE',
      icon: 'PhoneIcon'
    }
  },

  {
    path: '/account',
    name: 'Account',
    component: AccountSettingsView,
    meta: { 
      requiresAuth: true,
      title: 'Paramètres du compte - HelloJADE',
      icon: 'UserIcon'
    }
  },
  // Routes admin
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: AdminUsersView,
    meta: { 
      requiresAuth: true,
      requiresAdmin: true,
      title: 'Gestion utilisateurs - HelloJADE',
      icon: 'ShieldCheckIcon'
    }
  },
  {
    path: '/admin/system',
    name: 'AdminSystem',
    component: AdminSystemView,
    meta: { 
      requiresAuth: true,
      requiresAdmin: true,
      title: 'Configuration système - HelloJADE',
      icon: 'CogIcon'
    }
  },
  {
    path: '/monitoring',
    name: 'Monitoring',
    component: AdminMonitoringView,
    meta: { 
      requiresAuth: true,
      requiresAdmin: false,
      title: 'Monitoring - HelloJADE',
      icon: 'CircleStackIcon'
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

// Création du router
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

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

// Fonction pour obtenir les routes de navigation
export function getNavigationRoutes() {
  return routes.filter(route => 
    route.meta?.icon && 
    !route.meta?.requiresAdmin
  )
}

// Fonction pour obtenir les routes admin
export function getAdminRoutes() {
  return routes.filter(route => 
    route.meta?.requiresAdmin
  )
}

// Fonction pour obtenir une route par nom
export function getRouteByName(name: string) {
  return routes.find(route => route.name === name)
}

// Fonction pour obtenir les routes accessibles par l'utilisateur
export function getAccessibleRoutes(userRole: string) {
  return routes.filter(route => {
    if (!route.meta?.requiresAuth) return true
    if (route.meta?.requiresAdmin && userRole !== 'admin') return false
    return true
  })
}

export default router 