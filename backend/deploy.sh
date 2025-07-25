#!/bin/bash

# Script de déploiement pour HelloJADE Backend
set -e

echo "🚀 Démarrage du déploiement HelloJADE Backend..."

# Variables
APP_NAME="hellojade-backend"
DOCKER_IMAGE="hellojade/backend:latest"
CONTAINER_NAME="hellojade-backend"
NETWORK_NAME="hellojade-network"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérification des prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    # Vérifier Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé"
        exit 1
    fi
    
    # Vérifier Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose n'est pas installé"
        exit 1
    fi
    
    # Vérifier les variables d'environnement
    if [ ! -f ".env" ]; then
        log_warn "Fichier .env non trouvé, création d'un template..."
        create_env_template
    fi
    
    log_info "Prérequis vérifiés ✓"
}

# Création du template .env
create_env_template() {
    cat > .env << EOF
# Configuration HelloJADE Backend
HELLOJADE_SECRET_KEY=change-me-in-production
JWT_SECRET_KEY=change-jwt-key-in-production

# Base de données Oracle
ORACLE_HOST=localhost
ORACLE_PORT=1521
ORACLE_SERVICE=XE
ORACLE_USER=hellojade
ORACLE_PASSWORD=secure_password

# LDAP
LDAP_SERVER=ldap.epicura.be
LDAP_PORT=389
LDAP_BASE_DN=dc=epicura,dc=be
LDAP_BIND_DN=cn=hellojade,ou=services,dc=epicura,dc=be
LDAP_BIND_PASSWORD=ldap_password

# Redis
REDIS_URL=redis://localhost:6379/0

# CORS
CORS_ORIGINS=http://localhost:1420

# IA
WHISPER_MODEL=base
PIPER_MODEL_PATH=./ai/models/piper/fr_FR-amy-medium.onnx
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama2

# Téléphonie
ASTERISK_HOST=localhost
ASTERISK_PORT=5038
ASTERISK_USERNAME=hellojade
ASTERISK_PASSWORD=asterisk_password

ZADARMA_API_KEY=your_zadarma_key
ZADARMA_SECRET_KEY=your_zadarma_secret

# Logs
LOG_LEVEL=INFO
LOG_FILE=/app/logs/hellojade.log
EOF
    
    log_warn "Fichier .env créé. Veuillez le configurer avant de continuer."
    exit 1
}

# Construction de l'image Docker
build_image() {
    log_info "Construction de l'image Docker..."
    
    docker build -t $DOCKER_IMAGE .
    
    if [ $? -eq 0 ]; then
        log_info "Image Docker construite avec succès ✓"
    else
        log_error "Erreur lors de la construction de l'image Docker"
        exit 1
    fi
}

# Création du réseau Docker
create_network() {
    log_info "Création du réseau Docker..."
    
    if ! docker network ls | grep -q $NETWORK_NAME; then
        docker network create $NETWORK_NAME
        log_info "Réseau $NETWORK_NAME créé ✓"
    else
        log_info "Réseau $NETWORK_NAME existe déjà ✓"
    fi
}

# Arrêt du conteneur existant
stop_container() {
    log_info "Arrêt du conteneur existant..."
    
    if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
        docker stop $CONTAINER_NAME
        docker rm $CONTAINER_NAME
        log_info "Conteneur existant arrêté et supprimé ✓"
    else
        log_info "Aucun conteneur existant à arrêter ✓"
    fi
}

# Démarrage du conteneur
start_container() {
    log_info "Démarrage du conteneur..."
    
    docker run -d \
        --name $CONTAINER_NAME \
        --network $NETWORK_NAME \
        --restart unless-stopped \
        -p 5000:5000 \
        --env-file .env \
        -v $(pwd)/logs:/app/logs \
        -v $(pwd)/uploads:/app/uploads \
        -v $(pwd)/recordings:/app/recordings \
        -v $(pwd)/cache:/app/cache \
        $DOCKER_IMAGE
    
    if [ $? -eq 0 ]; then
        log_info "Conteneur démarré avec succès ✓"
    else
        log_error "Erreur lors du démarrage du conteneur"
        exit 1
    fi
}

# Vérification du statut
check_status() {
    log_info "Vérification du statut..."
    
    # Attendre que le conteneur soit prêt
    sleep 10
    
    # Vérifier que le conteneur fonctionne
    if docker ps | grep -q $CONTAINER_NAME; then
        log_info "Conteneur en cours d'exécution ✓"
    else
        log_error "Le conteneur n'est pas en cours d'exécution"
        exit 1
    fi
    
    # Vérifier l'endpoint de santé
    if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
        log_info "Application accessible ✓"
    else
        log_warn "Application pas encore accessible, vérifiez les logs"
    fi
}

# Affichage des logs
show_logs() {
    log_info "Affichage des logs du conteneur..."
    docker logs $CONTAINER_NAME
}

# Nettoyage
cleanup() {
    log_info "Nettoyage des images non utilisées..."
    docker image prune -f
}

# Fonction principale
main() {
    log_info "Déploiement de HelloJADE Backend"
    
    check_prerequisites
    build_image
    create_network
    stop_container
    start_container
    check_status
    cleanup
    
    log_info "🎉 Déploiement terminé avec succès!"
    log_info "Application accessible sur: http://localhost:5000"
    log_info "Health check: http://localhost:5000/api/health"
    log_info "Logs: docker logs $CONTAINER_NAME"
}

# Gestion des arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "build")
        check_prerequisites
        build_image
        ;;
    "start")
        start_container
        check_status
        ;;
    "stop")
        stop_container
        ;;
    "restart")
        stop_container
        start_container
        check_status
        ;;
    "logs")
        show_logs
        ;;
    "status")
        docker ps | grep $CONTAINER_NAME || echo "Conteneur non trouvé"
        ;;
    "cleanup")
        cleanup
        ;;
    *)
        echo "Usage: $0 {deploy|build|start|stop|restart|logs|status|cleanup}"
        exit 1
        ;;
esac 