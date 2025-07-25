# Dockerfile pour HelloJADE Backend
FROM python:3.11-slim

# Variables d'environnement
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV FLASK_APP=app.py
ENV FLASK_ENV=production

# Installation des dépendances système
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libldap2-dev \
    libsasl2-dev \
    libssl-dev \
    libffi-dev \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Création de l'utilisateur non-root
RUN groupadd -r hellojade && useradd -r -g hellojade hellojade

# Création du répertoire de travail
WORKDIR /app

# Copie des fichiers de dépendances
COPY requirements.txt .

# Installation des dépendances Python
RUN pip install --no-cache-dir -r requirements.txt

# Copie du code source
COPY . .

# Création des répertoires nécessaires
RUN mkdir -p /app/logs /app/uploads /app/recordings /app/cache

# Changement des permissions
RUN chown -R hellojade:hellojade /app

# Passage à l'utilisateur non-root
USER hellojade

# Exposition du port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Commande de démarrage
CMD ["python", "app.py"] 