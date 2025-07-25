#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HelloJADE v1.0 - Tests d'authentification
Tests unitaires pour le module d'authentification
"""

import pytest
import json
from datetime import datetime, timezone, timedelta
from unittest.mock import Mock, patch, MagicMock

from backend.core.auth import LDAPManager, authenticate_user, get_current_user
from backend.core.database import User
from backend.app import create_app

@pytest.fixture
def app():
    """Fixture pour l'application Flask de test"""
    app = create_app('testing')
    return app

@pytest.fixture
def client(app):
    """Fixture pour le client de test"""
    return app.test_client()

@pytest.fixture
def db_session(app):
    """Fixture pour la session de base de données"""
    with app.app_context():
        from backend.core.database import get_db
        db = get_db()
        yield db
        db.rollback()

class TestLDAPManager:
    """Tests pour le gestionnaire LDAP"""
    
    def test_ldap_connection_success(self):
        """Test de connexion LDAP réussie"""
        config = {
            'server': 'ldap.test.com',
            'port': 389,
            'use_ssl': False,
            'use_tls': True,
            'base_dn': 'dc=test,dc=com',
            'bind_dn': 'cn=test,dc=test,dc=com',
            'bind_password': 'password123'
        }
        
        with patch('backend.core.auth.ldap.initialize') as mock_ldap:
            mock_conn = Mock()
            mock_ldap.return_value = mock_conn
            mock_conn.simple_bind_s.return_value = (97, [])
            
            ldap_manager = LDAPManager(config)
            
            assert ldap_manager.connection is not None
            mock_conn.simple_bind_s.assert_called_once()
    
    def test_ldap_connection_failure(self):
        """Test de connexion LDAP échouée"""
        config = {
            'server': 'ldap.test.com',
            'port': 389,
            'use_ssl': False,
            'use_tls': True,
            'base_dn': 'dc=test,dc=com',
            'bind_dn': 'cn=test,dc=test,dc=com',
            'bind_password': 'wrong_password'
        }
        
        with patch('backend.core.auth.ldap.initialize') as mock_ldap:
            mock_conn = Mock()
            mock_ldap.return_value = mock_conn
            mock_conn.simple_bind_s.side_effect = Exception("Authentication failed")
            
            with pytest.raises(Exception):
                LDAPManager(config)
    
    def test_authenticate_user_success(self):
        """Test d'authentification utilisateur réussie"""
        config = {
            'server': 'ldap.test.com',
            'port': 389,
            'use_ssl': False,
            'use_tls': True,
            'base_dn': 'dc=test,dc=com',
            'bind_dn': 'cn=test,dc=test,dc=com',
            'bind_password': 'password123',
            'user_search_base': 'ou=users,dc=test,dc=com',
            'group_search_base': 'ou=groups,dc=test,dc=com'
        }
        
        with patch('backend.core.auth.ldap.initialize') as mock_ldap:
            mock_conn = Mock()
            mock_ldap.return_value = mock_conn
            
            # Mock de la recherche utilisateur
            mock_conn.search_s.return_value = [
                ('cn=testuser,ou=users,dc=test,dc=com', {
                    'cn': [b'testuser'],
                    'mail': [b'test@test.com'],
                    'givenName': [b'Test'],
                    'sn': [b'User'],
                    'memberOf': [b'cn=medecin,ou=groups,dc=test,dc=com']
                })
            ]
            
            ldap_manager = LDAPManager(config)
            result = ldap_manager.authenticate_user('testuser', 'password123')
            
            assert result['success'] is True
            assert result['user']['username'] == 'testuser'
            assert result['user']['email'] == 'test@test.com'
            assert result['user']['role'] == 'medecin'
    
    def test_authenticate_user_invalid_credentials(self):
        """Test d'authentification avec des identifiants invalides"""
        config = {
            'server': 'ldap.test.com',
            'port': 389,
            'use_ssl': False,
            'use_tls': True,
            'base_dn': 'dc=test,dc=com',
            'bind_dn': 'cn=test,dc=test,dc=com',
            'bind_password': 'password123',
            'user_search_base': 'ou=users,dc=test,dc=com',
            'group_search_base': 'ou=groups,dc=test,dc=com'
        }
        
        with patch('backend.core.auth.ldap.initialize') as mock_ldap:
            mock_conn = Mock()
            mock_ldap.return_value = mock_conn
            
            # Mock de la recherche utilisateur
            mock_conn.search_s.return_value = [
                ('cn=testuser,ou=users,dc=test,dc=com', {
                    'cn': [b'testuser'],
                    'mail': [b'test@test.com'],
                    'givenName': [b'Test'],
                    'sn': [b'User']
                })
            ]
            
            # Mock de l'échec d'authentification
            mock_conn.simple_bind_s.side_effect = Exception("Invalid credentials")
            
            ldap_manager = LDAPManager(config)
            result = ldap_manager.authenticate_user('testuser', 'wrong_password')
            
            assert result['success'] is False
            assert 'Invalid credentials' in result['error']

class TestAuthAPI:
    """Tests pour l'API d'authentification"""
    
    def test_login_success(self, client, db_session):
        """Test de connexion API réussie"""
        # Créer un utilisateur de test
        user = User(
            username='testuser',
            email='test@test.com',
            first_name='Test',
            last_name='User',
            role='medecin',
            is_active=True
        )
        db_session.add(user)
        db_session.commit()
        
        with patch('backend.core.auth.LDAPManager') as mock_ldap_class:
            mock_ldap = Mock()
            mock_ldap_class.return_value = mock_ldap
            mock_ldap.authenticate_user.return_value = {
                'success': True,
                'user': {
                    'username': 'testuser',
                    'email': 'test@test.com',
                    'first_name': 'Test',
                    'last_name': 'User',
                    'role': 'medecin'
                }
            }
            
            response = client.post('/api/auth/login', json={
                'username': 'testuser',
                'password': 'password123'
            })
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert data['message'] == 'Connexion réussie'
            assert 'access_token' in data['data']['tokens']
            assert 'refresh_token' in data['data']['tokens']
    
    def test_login_invalid_credentials(self, client):
        """Test de connexion API avec des identifiants invalides"""
        with patch('backend.core.auth.LDAPManager') as mock_ldap_class:
            mock_ldap = Mock()
            mock_ldap_class.return_value = mock_ldap
            mock_ldap.authenticate_user.return_value = {
                'success': False,
                'error': 'Invalid credentials'
            }
            
            response = client.post('/api/auth/login', json={
                'username': 'testuser',
                'password': 'wrong_password'
            })
            
            assert response.status_code == 401
            data = json.loads(response.data)
            assert 'Invalid credentials' in data['message']
    
    def test_login_missing_fields(self, client):
        """Test de connexion API avec des champs manquants"""
        response = client.post('/api/auth/login', json={
            'username': 'testuser'
            # password manquant
        })
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'password' in data['details']
    
    def test_logout_success(self, client):
        """Test de déconnexion API réussie"""
        # Simuler un utilisateur connecté
        with patch('backend.core.auth.get_current_user') as mock_get_user:
            mock_user = Mock()
            mock_user.id = 1
            mock_get_user.return_value = mock_user
            
            response = client.post('/api/auth/logout')
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert data['message'] == 'Déconnexion réussie'
    
    def test_refresh_token_success(self, client, db_session):
        """Test de rafraîchissement de token réussie"""
        # Créer un utilisateur de test
        user = User(
            username='testuser',
            email='test@test.com',
            first_name='Test',
            last_name='User',
            role='medecin',
            is_active=True
        )
        db_session.add(user)
        db_session.commit()
        
        with patch('backend.core.auth.decode_token') as mock_decode:
            mock_decode.return_value = {'sub': user.id, 'type': 'refresh'}
            
            response = client.post('/api/auth/refresh', json={
                'refresh_token': 'valid_refresh_token'
            })
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert 'access_token' in data['data']['tokens']
    
    def test_refresh_token_invalid(self, client):
        """Test de rafraîchissement de token invalide"""
        with patch('backend.core.auth.decode_token') as mock_decode:
            mock_decode.side_effect = Exception("Invalid token")
            
            response = client.post('/api/auth/refresh', json={
                'refresh_token': 'invalid_refresh_token'
            })
            
            assert response.status_code == 401
            data = json.loads(response.data)
            assert 'Invalid token' in data['message']
    
    def test_get_profile_success(self, client, db_session):
        """Test de récupération du profil utilisateur"""
        # Créer un utilisateur de test
        user = User(
            username='testuser',
            email='test@test.com',
            first_name='Test',
            last_name='User',
            role='medecin',
            is_active=True
        )
        db_session.add(user)
        db_session.commit()
        
        with patch('backend.core.auth.get_current_user') as mock_get_user:
            mock_get_user.return_value = user
            
            response = client.get('/api/auth/profile')
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert data['data']['username'] == 'testuser'
            assert data['data']['email'] == 'test@test.com'
            assert data['data']['role'] == 'medecin'
    
    def test_get_profile_unauthorized(self, client):
        """Test de récupération du profil sans authentification"""
        with patch('backend.core.auth.get_current_user') as mock_get_user:
            mock_get_user.return_value = None
            
            response = client.get('/api/auth/profile')
            
            assert response.status_code == 401
            data = json.loads(response.data)
            assert 'Non autorisé' in data['message']

class TestPermissions:
    """Tests pour les permissions et rôles"""
    
    def test_admin_permissions(self, app):
        """Test des permissions administrateur"""
        with app.app_context():
            user = User(
                username='admin',
                email='admin@test.com',
                first_name='Admin',
                last_name='User',
                role='admin',
                is_active=True
            )
            
            assert user.role == 'admin'
            # Vérifier que l'admin a toutes les permissions
            # (à implémenter selon la logique de permissions)
    
    def test_medical_staff_permissions(self, app):
        """Test des permissions personnel médical"""
        with app.app_context():
            medecin = User(
                username='medecin',
                email='medecin@test.com',
                first_name='Medecin',
                last_name='User',
                role='medecin',
                is_active=True
            )
            
            infirmier = User(
                username='infirmier',
                email='infirmier@test.com',
                first_name='Infirmier',
                last_name='User',
                role='infirmier',
                is_active=True
            )
            
            assert medecin.role == 'medecin'
            assert infirmier.role == 'infirmier'
            # Vérifier les permissions spécifiques
            # (à implémenter selon la logique de permissions)

if __name__ == '__main__':
    pytest.main([__file__]) 