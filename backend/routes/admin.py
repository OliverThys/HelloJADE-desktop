"""
Module d'administration système pour HelloJADE
Gestion des utilisateurs, configuration système, maintenance
"""

from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import text
import logging
from datetime import datetime, timedelta

from core.database import db
from core.auth import admin_required, get_current_user
from core.logging import log_structured
from core.monitoring import get_system_metrics
from core.security import audit_access

admin_bp = Blueprint('admin', __name__)

# --- Gestion des utilisateurs ---
@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@admin_required
@audit_access("Liste des utilisateurs")
def list_users():
    """Liste tous les utilisateurs du système"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        
        query = text("""
            SELECT id, username, email, role, is_active, 
                   last_login, created_at, updated_at
            FROM users 
            WHERE username ILIKE :search OR email ILIKE :search
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        """)
        
        result = db.session.execute(query, {
            'search': f'%{search}%',
            'limit': per_page,
            'offset': (page - 1) * per_page
        })
        
        users = [dict(row) for row in result]
        
        # Compte total
        count_query = text("""
            SELECT COUNT(*) as total
            FROM users 
            WHERE username ILIKE :search OR email ILIKE :search
        """)
        
        total = db.session.execute(count_query, {'search': f'%{search}%'}).scalar()
        
        return jsonify({
            'users': users,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page
            }
        }), 200
        
    except Exception as e:
        logging.error(f"Erreur lors de la récupération des utilisateurs: {e}")
        return jsonify({'error': 'Erreur interne du serveur'}), 500


@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
@admin_required
@audit_access("Détails utilisateur")
def get_user(user_id):
    """Récupère les détails d'un utilisateur"""
    try:
        query = text("""
            SELECT id, username, email, role, is_active, 
                   last_login, created_at, updated_at
            FROM users 
            WHERE id = :user_id
        """)
        
        result = db.session.execute(query, {'user_id': user_id})
        user = result.fetchone()
        
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
            
        return jsonify(dict(user)), 200
        
    except Exception as e:
        logging.error(f"Erreur lors de la récupération de l'utilisateur: {e}")
        return jsonify({'error': 'Erreur interne du serveur'}), 500


@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
@admin_required
@audit_access("Modification utilisateur")
def update_user(user_id):
    """Met à jour un utilisateur"""
    try:
        data = request.get_json()
        
        # Validation des données
        allowed_fields = ['role', 'is_active', 'email']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        if not update_data:
            return jsonify({'error': 'Aucune donnée valide fournie'}), 400
        
        # Vérification que l'utilisateur existe
        check_query = text("SELECT id FROM users WHERE id = :user_id")
        if not db.session.execute(check_query, {'user_id': user_id}).fetchone():
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
        
        # Mise à jour
        update_query = text("""
            UPDATE users 
            SET updated_at = NOW()
            WHERE id = :user_id
        """)
        
        for field, value in update_data.items():
            update_query = text(f"""
                UPDATE users 
                SET {field} = :{field}, updated_at = NOW()
                WHERE id = :user_id
            """)
            db.session.execute(update_query, {field: value, 'user_id': user_id})
        
        db.session.commit()
        
        log_structured(
            'user_updated',
            user_id=get_current_user().id,
            target_user_id=user_id,
            changes=update_data
        )
        
        return jsonify({'message': 'Utilisateur mis à jour avec succès'}), 200
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Erreur lors de la mise à jour de l'utilisateur: {e}")
        return jsonify({'error': 'Erreur interne du serveur'}), 500


@admin_bp.route('/users/<int:user_id>/reset-password', methods=['POST'])
@jwt_required()
@admin_required
@audit_access("Reset mot de passe utilisateur")
def reset_user_password(user_id):
    """Réinitialise le mot de passe d'un utilisateur"""
    try:
        # Vérification que l'utilisateur existe
        check_query = text("SELECT id FROM users WHERE id = :user_id")
        if not db.session.execute(check_query, {'user_id': user_id}).fetchone():
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
        
        # Génération d'un nouveau mot de passe temporaire
        import secrets
        import string
        temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
        
        # Hashage du mot de passe
        from werkzeug.security import generate_password_hash
        hashed_password = generate_password_hash(temp_password)
        
        # Mise à jour du mot de passe
        update_query = text("""
            UPDATE users 
            SET password_hash = :password_hash, 
                password_reset_required = TRUE,
                updated_at = NOW()
            WHERE id = :user_id
        """)
        
        db.session.execute(update_query, {
            'password_hash': hashed_password,
            'user_id': user_id
        })
        db.session.commit()
        
        log_structured(
            'password_reset',
            user_id=get_current_user().id,
            target_user_id=user_id
        )
        
        return jsonify({
            'message': 'Mot de passe réinitialisé avec succès',
            'temp_password': temp_password
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Erreur lors de la réinitialisation du mot de passe: {e}")
        return jsonify({'error': 'Erreur interne du serveur'}), 500


# --- Configuration système ---
@admin_bp.route('/config', methods=['GET'])
@jwt_required()
@admin_required
def get_system_config():
    """Récupère la configuration système"""
    try:
        # Configuration non sensible
        config = {
            'app_version': '1.0.0',
            'database_version': 'Oracle 19c',
            'ai_models': {
                'whisper': 'base',
                'piper': 'fr_FR-amy-medium',
                'ollama': 'llama2'
            },
            'telephony': {
                'asterisk_enabled': True,
                'zadarma_enabled': True
            },
            'security': {
                'rate_limiting': True,
                'cors_enabled': True,
                'jwt_expiration': '24h'
            }
        }
        
        return jsonify(config), 200
        
    except Exception as e:
        logging.error(f"Erreur lors de la récupération de la configuration: {e}")
        return jsonify({'error': 'Erreur interne du serveur'}), 500


@admin_bp.route('/config', methods=['PUT'])
@jwt_required()
@admin_required
@audit_access("Modification configuration système")
def update_system_config():
    """Met à jour la configuration système"""
    try:
        data = request.get_json()
        
        # Validation des données de configuration
        allowed_configs = ['ai_models', 'telephony', 'security']
        update_data = {k: v for k, v in data.items() if k in allowed_configs}
        
        if not update_data:
            return jsonify({'error': 'Aucune configuration valide fournie'}), 400
        
        # Ici, on pourrait sauvegarder dans une table de configuration
        # Pour l'instant, on log juste les changements
        
        log_structured(
            'config_updated',
            user_id=get_current_user().id,
            changes=update_data
        )
        
        return jsonify({'message': 'Configuration mise à jour avec succès'}), 200
        
    except Exception as e:
        logging.error(f"Erreur lors de la mise à jour de la configuration: {e}")
        return jsonify({'error': 'Erreur interne du serveur'}), 500


# --- Maintenance système ---
@admin_bp.route('/maintenance/backup', methods=['POST'])
@jwt_required()
@admin_required
@audit_access("Démarrage sauvegarde")
def start_backup():
    """Démarre une sauvegarde de la base de données"""
    try:
        # Simulation d'une sauvegarde
        # En production, on utiliserait des outils comme RMAN pour Oracle
        
        log_structured(
            'backup_started',
            user_id=get_current_user().id
        )
        
        return jsonify({
            'message': 'Sauvegarde démarrée',
            'backup_id': f'backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
        }), 200
        
    except Exception as e:
        logging.error(f"Erreur lors du démarrage de la sauvegarde: {e}")
        return jsonify({'error': 'Erreur interne du serveur'}), 500


@admin_bp.route('/maintenance/cleanup', methods=['POST'])
@jwt_required()
@admin_required
@audit_access("Nettoyage système")
def system_cleanup():
    """Nettoie les données temporaires et anciennes"""
    try:
        # Nettoyage des logs anciens (plus de 30 jours)
        cleanup_logs_query = text("""
            DELETE FROM audit_logs 
            WHERE created_at < NOW() - INTERVAL '30 days'
        """)
        
        # Nettoyage des sessions expirées
        cleanup_sessions_query = text("""
            DELETE FROM user_sessions 
            WHERE expires_at < NOW()
        """)
        
        # Nettoyage des fichiers temporaires
        cleanup_files_query = text("""
            DELETE FROM temporary_files 
            WHERE created_at < NOW() - INTERVAL '7 days'
        """)
        
        db.session.execute(cleanup_logs_query)
        db.session.execute(cleanup_sessions_query)
        db.session.execute(cleanup_files_query)
        db.session.commit()
        
        log_structured(
            'system_cleanup',
            user_id=get_current_user().id
        )
        
        return jsonify({'message': 'Nettoyage système terminé'}), 200
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Erreur lors du nettoyage système: {e}")
        return jsonify({'error': 'Erreur interne du serveur'}), 500


# --- Statistiques système ---
@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
@admin_required
def get_system_stats():
    """Récupère les statistiques système"""
    try:
        # Statistiques des utilisateurs
        users_stats_query = text("""
            SELECT 
                COUNT(*) as total_users,
                COUNT(CASE WHEN is_active THEN 1 END) as active_users,
                COUNT(CASE WHEN last_login > NOW() - INTERVAL '7 days' THEN 1 END) as recent_users
            FROM users
        """)
        
        # Statistiques des appels
        calls_stats_query = text("""
            SELECT 
                COUNT(*) as total_calls,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_calls,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_calls,
                AVG(duration) as avg_duration
            FROM calls
            WHERE created_at > NOW() - INTERVAL '30 days'
        """)
        
        # Statistiques des patients
        patients_stats_query = text("""
            SELECT COUNT(*) as total_patients
            FROM patients
        """)
        
        users_stats = db.session.execute(users_stats_query).fetchone()
        calls_stats = db.session.execute(calls_stats_query).fetchone()
        patients_stats = db.session.execute(patients_stats_query).fetchone()
        
        # Métriques système
        system_metrics = get_system_metrics()
        
        stats = {
            'users': dict(users_stats),
            'calls': dict(calls_stats),
            'patients': dict(patients_stats),
            'system': system_metrics
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        logging.error(f"Erreur lors de la récupération des statistiques: {e}")
        return jsonify({'error': 'Erreur interne du serveur'}), 500 