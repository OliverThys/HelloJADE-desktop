import { I18nOptions } from 'vue-i18n'

export const i18nConfig: I18nOptions = {
  locale: 'fr',
  fallbackLocale: 'fr',
  messages: {
    fr: {
      // Navigation
      nav: {
        dashboard: 'Tableau de bord',
        calls: 'Appels',
        account: 'Compte',
        system: 'Système',
        logout: 'Déconnexion'
      },
      
      // Authentification
      auth: {
        login: 'Connexion',
        email: 'Adresse email',
        password: 'Mot de passe',
        forgotPassword: 'Mot de passe oublié ?',
        loginButton: 'Se connecter',
        loginError: 'Erreur de connexion',
        logout: 'Déconnexion',
        profile: 'Profil'
      },
      
      // Tableau de bord
      dashboard: {
        title: 'Tableau de bord',
        kpis: {
          plannedCalls: 'Appels prévus',
          completedCalls: 'Appels réalisés',
          successfulCalls: 'Appels réussis',
          failedCalls: 'Appels en échec',
          successRate: 'Taux de réussite',
          avgCallDuration: 'Durée moyenne d\'appel'
        },
        period: 'Période d\'analyse',
        from: 'Du',
        to: 'Au'
      },
      
      // Appels
      calls: {
        title: 'Gestion des appels',
        search: 'Rechercher...',
        filters: {
          dateRange: 'Période',
          status: 'Statut',
          all: 'Tous',
          pending: 'À appeler',
          called: 'Appelé',
          failed: 'Échec'
        },
        table: {
          patientNumber: 'N° Patient',
          patientName: 'Nom',
          patientFirstName: 'Prénom',
          birthDate: 'Date de naissance',
          phone: 'Téléphone',
          hospitalSite: 'Site d\'hospitalisation',
          dischargeDate: 'Date de sortie',
          scheduledCall: 'Appel prévu',
          status: 'Statut',
          doctor: 'Médecin référent',
          service: 'Service',
          actualCall: 'Appel réel',
          duration: 'Durée',
          summary: 'Résumé',
          score: 'Score',
          actions: 'Actions'
        },
        status: {
          pending: 'À appeler',
          called: 'Appelé',
          failed: 'Échec'
        },
        actions: {
          viewSummary: 'Voir le résumé',
          exportPDF: 'Exporter en PDF',
          reportIssue: 'Signaler un problème'
        }
      },
      
      // Paramètres du compte
      account: {
        title: 'Paramètres du compte',
        profile: 'Profil',
        email: 'Adresse email',
        changeEmail: 'Changer l\'email',
        password: 'Mot de passe',
        changePassword: 'Changer le mot de passe',
        currentPassword: 'Mot de passe actuel',
        newPassword: 'Nouveau mot de passe',
        confirmPassword: 'Confirmer le mot de passe',
        support: 'Support',
        documentation: 'Documentation',
        save: 'Enregistrer',
        cancel: 'Annuler'
      },
      
      // Paramétrage du système
      system: {
        title: 'Paramétrage du système',
        users: 'Utilisateurs',
        createUser: 'Créer un utilisateur',
        editUser: 'Modifier l\'utilisateur',
        deleteUser: 'Supprimer l\'utilisateur',
        pauseUser: 'Mettre en pause',
        activateUser: 'Activer',
        settings: 'Paramètres',
        defaultCallTime: 'Heure d\'appel par défaut',
        maxAttempts: 'Nombre de tentatives',
        callTiming: 'Moment de l\'appel',
        knowledgeBase: 'Base de connaissances',
        uploadKB: 'Charger un fichier KB',
        save: 'Enregistrer'
      },
      
      // Messages généraux
      common: {
        loading: 'Chargement...',
        error: 'Erreur',
        success: 'Succès',
        confirm: 'Confirmer',
        cancel: 'Annuler',
        save: 'Enregistrer',
        delete: 'Supprimer',
        edit: 'Modifier',
        view: 'Voir',
        export: 'Exporter',
        import: 'Importer',
        search: 'Rechercher',
        filter: 'Filtrer',
        sort: 'Trier',
        actions: 'Actions',
        noData: 'Aucune donnée',
        back: 'Retour',
        next: 'Suivant',
        previous: 'Précédent',
        close: 'Fermer',
        open: 'Ouvrir',
        yes: 'Oui',
        no: 'Non'
      },
      
      // Erreurs
      errors: {
        network: 'Erreur de réseau',
        unauthorized: 'Non autorisé',
        forbidden: 'Accès interdit',
        notFound: 'Page non trouvée',
        serverError: 'Erreur serveur',
        validation: 'Erreur de validation'
      }
    }
  }
} 