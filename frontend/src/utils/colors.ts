// Configuration des couleurs HelloJADE
export const colors = {
  // Couleurs principales
  primary: {
    green: '#10B981',
    greenLight: '#34D399',
    greenDark: '#059669',
    blue: '#1E40AF',
    blueLight: '#3B82F6'
  },
  
  // Couleurs de fond
  background: {
    light: '#ffffff',
    lightSecondary: '#f8fafc',
    lightTertiary: '#e2e8f0',
    dark: '#1e293b',
    darkSecondary: '#334155',
    darkTertiary: '#475569'
  },
  
  // Couleurs de texte
  text: {
    primary: '#1e293b',
    secondary: '#64748b',
    muted: '#94a3b8',
    light: '#ffffff',
    dark: '#0f172a'
  },
  
  // Couleurs de bordure
  border: {
    light: '#e2e8f0',
    lightSecondary: '#cbd5e1',
    dark: '#475569',
    darkSecondary: '#64748b'
  },
  
  // Couleurs d'état
  status: {
    success: {
      light: '#dcfce7',
      main: '#22c55e',
      dark: '#16a34a',
      text: '#166534'
    },
    warning: {
      light: '#fef3c7',
      main: '#f59e0b',
      dark: '#d97706',
      text: '#92400e'
    },
    error: {
      light: '#fee2e2',
      main: '#ef4444',
      dark: '#dc2626',
      text: '#991b1b'
    },
    info: {
      light: '#dbeafe',
      main: '#3b82f6',
      dark: '#2563eb',
      text: '#1e40af'
    }
  },
  
  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    secondary: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
    card: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    glass: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%)'
  },
  
  // Ombres
  shadows: {
    light: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    medium: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    large: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
  }
}

// Classes Tailwind pour les couleurs HelloJADE
export const colorClasses = {
  // Couleurs de fond
  bgPrimary: 'bg-green-600',
  bgPrimaryLight: 'bg-green-500',
  bgPrimaryDark: 'bg-green-700',
  bgSecondary: 'bg-blue-600',
  bgSecondaryLight: 'bg-blue-500',
  bgSecondaryDark: 'bg-blue-700',
  
  // Couleurs de texte
  textPrimary: 'text-green-600',
  textPrimaryLight: 'text-green-500',
  textPrimaryDark: 'text-green-700',
  textSecondary: 'text-blue-600',
  textSecondaryLight: 'text-blue-500',
  textSecondaryDark: 'text-blue-700',
  
  // Couleurs de bordure
  borderPrimary: 'border-green-600',
  borderPrimaryLight: 'border-green-500',
  borderPrimaryDark: 'border-green-700',
  borderSecondary: 'border-blue-600',
  borderSecondaryLight: 'border-blue-500',
  borderSecondaryDark: 'border-blue-700',
  
  // Couleurs d'état
  success: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
    dark: {
      bg: 'dark:bg-green-900/50',
      text: 'dark:text-green-300',
      border: 'dark:border-green-700'
    }
  },
  warning: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    dark: {
      bg: 'dark:bg-yellow-900/50',
      text: 'dark:text-yellow-300',
      border: 'dark:border-yellow-700'
    }
  },
  error: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
    dark: {
      bg: 'dark:bg-red-900/50',
      text: 'dark:text-red-300',
      border: 'dark:border-red-700'
    }
  },
  info: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200',
    dark: {
      bg: 'dark:bg-blue-900/50',
      text: 'dark:text-blue-300',
      border: 'dark:border-blue-700'
    }
  }
}

// Fonctions utilitaires pour les couleurs
export const getStatusColor = (status: string, variant: 'bg' | 'text' | 'border' = 'bg') => {
  const statusColors = {
    success: colorClasses.success,
    warning: colorClasses.warning,
    error: colorClasses.error,
    info: colorClasses.info
  }
  
  const statusColor = statusColors[status as keyof typeof statusColors]
  if (!statusColor) return ''
  
  return statusColor[variant]
}

export const getGradientClass = (type: 'primary' | 'secondary' | 'background' | 'card' | 'glass') => {
  const gradientClasses = {
    primary: 'bg-gradient-to-br from-green-600 to-green-700',
    secondary: 'bg-gradient-to-br from-blue-600 to-blue-700',
    background: 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100',
    card: 'bg-gradient-to-br from-white via-gray-50 to-gray-100',
    glass: 'bg-white/80 backdrop-blur-xl'
  }
  
  return gradientClasses[type] || gradientClasses.primary
}

export const getShadowClass = (size: 'light' | 'medium' | 'large' | 'xl') => {
  const shadowClasses = {
    light: 'shadow-lg',
    medium: 'shadow-xl',
    large: 'shadow-2xl',
    xl: 'shadow-2xl'
  }
  
  return shadowClasses[size] || shadowClasses.light
} 