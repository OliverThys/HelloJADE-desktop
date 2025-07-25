"""
Module de sécurité pour HelloJADE : middlewares, protections OWASP, CORS, rate limiting, validation stricte, audit trail.
"""
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from marshmallow import ValidationError
from functools import wraps
from typing import Callable, Any
import logging

# Importation des loggers spécialisés
from .logging import security_logger, log_structured
from .database import log_audit

# --- Initialisation Sécurité ---
def init_security(app: Flask) -> None:
    """
    Initialise la sécurité de l'application Flask : CORS, rate limiting, gestion des erreurs, validation globale.
    """
    # CORS pour Tauri
    CORS(app, origins=app.config.get("CORS_ORIGINS", ["http://localhost:1420"]))

    # Rate Limiting (Flask-Limiter avec Redis)
    limiter = Limiter(
        get_remote_address,
        app=app,
        storage_uri=app.config.get("RATE_LIMIT_STORAGE_URL", "redis://localhost:6379"),
        default_limits=[app.config.get("RATE_LIMIT_DEFAULT", "100/minute")],
    )
    app.limiter = limiter

    # Gestion globale des erreurs de validation Marshmallow
    @app.errorhandler(ValidationError)
    def handle_marshmallow_error(err):
        security_logger.log_validation_error(request.path, err.messages)
        return jsonify({"error": "Validation des données échouée", "details": err.messages}), 400

    # Gestion des erreurs CSRF (si activé)
    @app.errorhandler(400)
    def handle_bad_request(err):
        if hasattr(err, "description") and "CSRF" in str(err.description):
            security_logger.log_csrf_error(request.path)
            return jsonify({"error": "Requête rejetée (CSRF)"}), 403
        return jsonify({"error": "Requête invalide"}), 400

    # Gestion des erreurs 403 (accès refusé)
    @app.errorhandler(403)
    def handle_forbidden(err):
        security_logger.log_forbidden(request.path)
        return jsonify({"error": "Accès refusé"}), 403

    # Gestion des erreurs 429 (rate limit)
    @app.errorhandler(429)
    def handle_rate_limit(err):
        security_logger.log_rate_limit(request.path)
        return jsonify({"error": "Trop de requêtes, veuillez réessayer plus tard."}), 429

    # Middleware d'audit trail (journalisation de chaque requête critique)
    @app.before_request
    def audit_trail():
        if request.method in ["POST", "PUT", "DELETE"]:
            user = getattr(g, "current_user", None)
            log_audit(
                user_id=getattr(user, "id", None),
                action=f"{request.method} {request.path}",
                resource=request.path,
                old_values=None,
                new_values=request.get_json(silent=True),
            )

# --- Décorateurs de sécurité ---
def validate_schema(schema_class):
    """
    Décorateur pour valider les données d'entrée avec Marshmallow.
    """
    def decorator(fn: Callable) -> Callable:
        @wraps(fn)
        def wrapper(*args, **kwargs):
            json_data = request.get_json(force=True, silent=True)
            if not json_data:
                return jsonify({"error": "Aucune donnée fournie"}), 400
            schema = schema_class()
            try:
                validated = schema.load(json_data)
            except ValidationError as err:
                security_logger.log_validation_error(request.path, err.messages)
                return jsonify({"error": "Validation échouée", "details": err.messages}), 400
            g.validated_data = validated
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def audit_access(action: str):
    """
    Décorateur pour journaliser l'accès à une ressource sensible.
    """
    def decorator(fn: Callable) -> Callable:
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = getattr(g, "current_user", None)
            log_audit(
                user_id=getattr(user, "id", None),
                action=action,
                resource=request.path,
                old_values=None,
                new_values=request.get_json(silent=True),
            )
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def owasp_protect(fn: Callable) -> Callable:
    """
    Décorateur pour appliquer des protections OWASP basiques (headers, XSS, etc).
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        resp = fn(*args, **kwargs)
        if hasattr(resp, "headers"):
            resp.headers["X-Content-Type-Options"] = "nosniff"
            resp.headers["X-Frame-Options"] = "DENY"
            resp.headers["X-XSS-Protection"] = "1; mode=block"
            resp.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
            resp.headers["Content-Security-Policy"] = "default-src 'self'"
        return resp
    return wrapper

# --- Utilitaires de sécurité ---
def is_safe_input(value: Any) -> bool:
    """
    Vérifie si une entrée utilisateur est sûre (anti-injection basique).
    """
    if not isinstance(value, str):
        return True
    blacklist = [";", "--", "'", '"', "/*", "*/", "xp_", " or ", " and "]
    for item in blacklist:
        if item in value.lower():
            return False
    return True

def enforce_strict_validation(data: dict) -> bool:
    """
    Valide récursivement toutes les entrées d'un dictionnaire.
    """
    for k, v in data.items():
        if isinstance(v, dict):
            if not enforce_strict_validation(v):
                return False
        elif isinstance(v, list):
            for item in v:
                if isinstance(item, dict):
                    if not enforce_strict_validation(item):
                        return False
                elif not is_safe_input(item):
                    return False
        elif not is_safe_input(v):
            return False
    return True 