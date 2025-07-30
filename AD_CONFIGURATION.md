Windows PowerShell
Copyright (C) Microsoft Corporation. Tous droits réservés.
                                                                                                                        Installez la dernière version de PowerShell pour de nouvelles fonctionnalités et améliorations ! https://aka.ms/PSWindows                                                                                                                                                                                                                                               PS C:\Users\Administrateur>                                                                                             PS C:\Users\Administrateur> Get-ADUser -Filter * | Select-Object Name, SamAccountName, UserPrincipalName, Enabled

Name            SamAccountName UserPrincipalName     Enabled
----            -------------- -----------------     -------
Administrateur  Administrateur                          True
Invité          Invité                                 False
krbtgt          krbtgt                                 False
Admin HelloJADE admin          admin@hellojade.local    True
User Standard   user           user@hellojade.local     True


PS C:\Users\Administrateur> Get-ADGroup -Filter * | Select-Object Name, GroupCategory, GroupScope

Name                                                         GroupCategory  GroupScope
----                                                         -------------  ----------
USERS                                                             Security DomainLocal
Backup Operators                                                  Security DomainLocal
ORA_INSTALL                                                       Security DomainLocal
ORA_DBA                                                           Security DomainLocal
ORA_OraDB21Home1_DBA                                              Security DomainLocal
ORA_OraDB21Home1_OPER                                             Security DomainLocal
ORA_GRID_LISTENERS                                                Security DomainLocal
ORA_OPER                                                          Security DomainLocal
ORA_CLIENT_LISTENERS                                              Security DomainLocal
ORA_OraDB21Home1_SYSBACKUP                                        Security DomainLocal
ORA_OraDB21Home1_SYSDG                                            Security DomainLocal
ORA_OraDB21Home1_SYSKM                                            Security DomainLocal
ORA_ASMDBA                                                        Security DomainLocal
ORA_ASMOPER                                                       Security DomainLocal
ORA_DBSVCACCTS                                                    Security DomainLocal
ORA_OraDB21Home1_SVCACCTS                                         Security DomainLocal
ORA_ASMADMIN                                                      Security DomainLocal
Administrateurs                                                   Security DomainLocal
Utilisateurs                                                      Security DomainLocal
Invités                                                           Security DomainLocal
Opérateurs d’impression                                           Security DomainLocal
Opérateurs de sauvegarde                                          Security DomainLocal
Duplicateurs                                                      Security DomainLocal
Utilisateurs du Bureau à distance                                 Security DomainLocal
Opérateurs de configuration réseau                                Security DomainLocal
Utilisateurs de l’Analyseur de performances                       Security DomainLocal
Utilisateurs du journal de performances                           Security DomainLocal
Utilisateurs du modèle COM distribué                              Security DomainLocal
IIS_IUSRS                                                         Security DomainLocal
Opérateurs de chiffrement                                         Security DomainLocal
Lecteurs des journaux d’événements                                Security DomainLocal
Accès DCOM service de certificats                                 Security DomainLocal
Serveurs Accès Distant RDS                                        Security DomainLocal
Serveurs RDS Endpoint                                             Security DomainLocal
Serveurs Gestion RDS                                              Security DomainLocal
Administrateurs Hyper-V                                           Security DomainLocal
Opérateurs d'assistance de contrôle d'accès                       Security DomainLocal
Utilisateurs de gestion à distance                                Security DomainLocal
Storage Replica Administrators                                    Security DomainLocal
Ordinateurs du domaine                                            Security      Global
Contrôleurs de domaine                                            Security      Global
Administrateurs du schéma                                         Security   Universal
Administrateurs de l’entreprise                                   Security   Universal
Éditeurs de certificats                                           Security DomainLocal
Admins du domaine                                                 Security      Global
Utilisateurs du domaine                                           Security      Global
Invités du domaine                                                Security      Global
Propriétaires créateurs de la stratégie de groupe                 Security      Global
Serveurs RAS et IAS                                               Security DomainLocal
Opérateurs de serveur                                             Security DomainLocal
Opérateurs de compte                                              Security DomainLocal
Accès compatible pré-Windows 2000                                 Security DomainLocal
Générateurs d’approbations de forêt entrante                      Security DomainLocal
Groupe d’accès d’autorisation Windows                             Security DomainLocal
Serveurs de licences des services Terminal Server                 Security DomainLocal
Groupe de réplication dont le mot de passe RODC est autorisé      Security DomainLocal
Groupe de réplication dont le mot de passe RODC est refusé        Security DomainLocal
Contrôleurs de domaine en lecture seule                           Security      Global
Contrôleurs de domaine d’entreprise en lecture seule              Security   Universal
Contrôleurs de domaine clonables                                  Security      Global
Protected Users                                                   Security      Global
Administrateurs clés                                              Security      Global
Administrateurs clés Enterprise                                   Security   Universal
DnsAdmins                                                         Security DomainLocal
DnsUpdateProxy                                                    Security      Global
HelloJADE-Admins                                                  Security      Global
HelloJADE-Users                                                   Security      Global


PS C:\Users\Administrateur> Get-ADGroup -Filter "Name -like '*HelloJADE*'" | Select-Object Name, Members

Name             Members
----             -------
HelloJADE-Admins {}
HelloJADE-Users  {}


PS C:\Users\Administrateur> Get-ADGroupMember -Identity "HelloJADE-Admins" | Select-Object Name, SamAccountName

Name            SamAccountName
----            --------------
Admin HelloJADE admin


PS C:\Users\Administrateur> Get-ADGroupMember -Identity "HelloJADE-Admins" | Select-Object Name, SamAccountName

Name            SamAccountName
----            --------------
Admin HelloJADE admin


PS C:\Users\Administrateur> Get-ADGroupMember -Identity "HelloJADE-Users" | Select-Object Name, SamAccountName

Name          SamAccountName
----          --------------
User Standard user


PS C:\Users\Administrateur> Get-ADGroupMember -Identity "HelloJADE-Users" | Select-Object Name, SamAccountName

Name          SamAccountName
----          --------------
User Standard user


PS C:\Users\Administrateur> Get-ADGroupMember -Identity "HelloJADE-Users" | Select-Object Name, SamAccountName

Name          SamAccountName
----          --------------
User Standard user


PS C:\Users\Administrateur> $ldap = [ADSI]"LDAP://192.168.129.46:389/dc=hellojade,dc=local"
>> $ldap.Children | Select-Object Name, Class

Name                        Class
----                        -----
{Builtin}                   builtinDomain
{Computers}                 container
{Domain Controllers}        organizationalUnit
{ForeignSecurityPrincipals} container
{Infrastructure}            infrastructureUpdate
{Keys}                      container
{LostAndFound}              lostAndFound
{Managed Service Accounts}  container
{NTDS Quotas}               msDS-QuotaContainer
{Program Data}              container
{System}                    container
{TPM Devices}               msTPM-InformationObjectsContainer
{Users}                     container


PS C:\Users\Administrateur> $user = [ADSI]"LDAP://192.168.129.46:389/cn=admin,cn=users,dc=hellojade,dc=local"
>> $user.Properties | Format-List
PS C:\Users\Administrateur> ipconfig /all

Configuration IP de Windows

   Nom de l’hôte . . . . . . . . . . : WIN-5VGE46GO84N
   Suffixe DNS principal . . . . . . : hellojade.local
   Type de noeud. . . . . . . . . .  : Mixte
   Routage IP activé . . . . . . . . : Non
   Proxy WINS activé . . . . . . . . : Non
   Liste de recherche du suffixe DNS.: hellojade.local
                                       home

Carte Ethernet Ethernet 2 :

   Suffixe DNS propre à la connexion. . . : home
   Description. . . . . . . . . . . . . . : Microsoft Hyper-V Network Adapter #2
   Adresse physique . . . . . . . . . . . : 00-15-5D-81-05-01
   DHCP activé. . . . . . . . . . . . . . : Non
   Configuration automatique activée. . . : Oui                                                                            Adresse IPv6. . . . . . . . . . . . . .: 2a02:a03f:c33d:ec00:bc89:3e5d:3148:9d5f(préféré)                               Adresse IPv6 de liaison locale. . . . .: fe80::bc89:3e5d:3148:9d5f%9(préféré)                                           Adresse IPv4. . . . . . . . . . . . . .: 192.168.100.10(préféré)                                                        Masque de sous-réseau. . . . . . . . . : 255.255.255.0                                                                  Adresse IPv4. . . . . . . . . . . . . .: 192.168.129.46(préféré)                                                        Masque de sous-réseau. . . . . . . . . : 255.255.255.0                                                                  Passerelle par défaut. . . . . . . . . : fe80::5a68:7aff:fe63:ede2%9                                                                                        192.168.100.1                                                                                                           192.168.129.1                                                                       IAID DHCPv6 . . . . . . . . . . . : 117445981                                                                           DUID de client DHCPv6. . . . . . . . : 00-01-00-01-30-18-8D-AB-00-15-5D-81-05-00                                        Serveurs DNS. . .  . . . . . . . . . . : ::1                                                                                                                127.0.0.1                                                                           NetBIOS sur Tcpip. . . . . . . . . . . : Activé                                                                         Liste de recherche de suffixes DNS propres à la connexion :                                                                                                 home                                                                             PS C:\Users\Administrateur> Get-Service -Name "NTDS", "DNS", "KDC" | Select-Object Name, Status

Name  Status
----  ------
DNS  Running
KDC  Running
NTDS Running


PS C:\Users\Administrateur> Test-NetConnection -ComputerName 192.168.129.46 -Port 389


ComputerName     : 192.168.129.46
RemoteAddress    : 192.168.129.46
RemotePort       : 389
InterfaceAlias   : Ethernet 2
SourceAddress    : 192.168.100.10
TcpTestSucceeded : True



PS C:\Users\Administrateur>