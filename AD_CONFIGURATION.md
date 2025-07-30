# Configuration Active Directory HelloJADE

## Informations du serveur
- **Nom de domaine** : hellojade.local
- **IP du serveur AD** : 192.168.129.46
- **Port LDAP** : 389
- **Port DNS** : 53

## Utilisateurs existants

| Nom | SamAccountName | UserPrincipalName | DistinguishedName | Enabled |
|-----|----------------|-------------------|-------------------|---------|
| Administrateur | Administrateur | - | CN=Administrateur,CN=Users,DC=hellojade,DC=local | True |
| Invité | Invité | - | CN=Invité,CN=Users,DC=hellojade,DC=local | False |
| krbtgt | krbtgt | - | CN=krbtgt,CN=Users,DC=hellojade,DC=local | False |
| Admin HelloJADE | admin | admin@hellojade.local | CN=Admin HelloJADE,CN=Users,DC=hellojade,DC=local | True |
| User Standard | user | user@hellojade.local | CN=User Standard,CN=Users,DC=hellojade,DC=local | True |

## Structure des OUs (Organizational Units)

| Nom | DistinguishedName |
|-----|-------------------|
| Domain Controllers | OU=Domain Controllers,DC=hellojade,DC=local |

## Groupes existants

### Groupes système
- USERS
- Backup Operators
- Administrateurs
- Utilisateurs
- Invités
- Opérateurs d'impression
- Opérateurs de sauvegarde
- Duplicateurs
- Utilisateurs du Bureau à distance
- Opérateurs de configuration réseau
- Utilisateurs de l'Analyseur de performances
- Utilisateurs du journal de performances
- Utilisateurs du modèle COM distribué
- IIS_IUSRS
- Opérateurs de chiffrement
- Lecteurs des journaux d'événements
- Accès DCOM service de certificats
- Serveurs Accès Distant RDS
- Serveurs RDS Endpoint
- Serveurs Gestion RDS
- Administrateurs Hyper-V
- Opérateurs d'assistance de contrôle d'accès
- Utilisateurs de gestion à distance
- Storage Replica Administrators
- Ordinateurs du domaine
- Contrôleurs de domaine
- Administrateurs du schéma
- Administrateurs de l'entreprise
- Éditeurs de certificats
- Admins du domaine
- Utilisateurs du domaine
- Invités du domaine
- Propriétaires créateurs de la stratégie de groupe
- Serveurs RAS et IAS
- Opérateurs de serveur
- Opérateurs de compte
- Accès compatible pré-Windows 2000
- Générateurs d'approbations de forêt entrante
- Groupe d'accès d'autorisation Windows
- Serveurs de licences des services Terminal Server
- Groupe de réplication dont le mot de passe RODC est autorisé
- Groupe de réplication dont le mot de passe RODC est refusé
- Contrôleurs de domaine en lecture seule
- Contrôleurs de domaine d'entreprise en lecture seule
- Contrôleurs de domaine clonables
- Protected Users
- Administrateurs clés
- Administrateurs clés Enterprise
- DnsAdmins
- DnsUpdateProxy

### Groupes Oracle
- ORA_INSTALL
- ORA_DBA
- ORA_OraDB21Home1_DBA
- ORA_OraDB21Home1_OPER
- ORA_GRID_LISTENERS
- ORA_OPER
- ORA_CLIENT_LISTENERS
- ORA_OraDB21Home1_SYSBACKUP
- ORA_OraDB21Home1_SYSDG
- ORA_OraDB21Home1_SYSKM
- ORA_ASMDBA
- ORA_ASMOPER
- ORA_DBSVCACCTS
- ORA_OraDB21Home1_SVCACCTS
- ORA_ASMADMIN

### Groupes HelloJADE
- HelloJADE-Admins
- HelloJADE-Users

## Configuration HelloJADE

### Variables d'environnement à utiliser
```bash
LDAP_SERVER=192.168.129.46
LDAP_BASE_DN=dc=hellojade,dc=local
LDAP_BIND_DN=admin@hellojade.local
LDAP_BIND_PASSWORD=MotDePasse123!
LDAP_USER_SEARCH_BASE=cn=users,dc=hellojade,dc=local
LDAP_GROUP_SEARCH_BASE=dc=hellojade,dc=local
```

### Utilisateurs de test disponibles
- **admin** (Admin HelloJADE) - admin@hellojade.local
- **user** (User Standard) - user@hellojade.local

## Notes importantes
- L'utilisateur de service `hellojade` n'existe pas encore
- Les groupes HelloJADE-Admins et HelloJADE-Users existent
- Oracle est installé sur le même serveur (groupes ORA_* présents)
- La connectivité réseau est fonctionnelle (ping et ports 389/53 accessibles)

## Prochaines étapes
1. Créer l'utilisateur de service HelloJADE
2. Configurer les permissions LDAP
3. Tester l'authentification depuis l'application
4. Assigner les utilisateurs aux groupes HelloJADE appropriés 