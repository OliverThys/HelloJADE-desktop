#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HelloJADE v1.0 - Script de téléchargement des modèles IA
Télécharge Whisper, Piper et Ollama models
"""

import os
import sys
import requests
import subprocess
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def download_whisper_models():
    """Télécharge les modèles Whisper"""
    models = ['base', 'small', 'medium']
    models_dir = Path('models/whisper')
    models_dir.mkdir(parents=True, exist_ok=True)
    
    for model in models:
        logger.info(f"Téléchargement du modèle Whisper: {model}")
        try:
            subprocess.run([
                'python', '-c', 
                f'import whisper; whisper.load_model("{model}")'
            ], check=True)
            logger.info(f"Modèle {model} téléchargé avec succès")
        except Exception as e:
            logger.error(f"Erreur lors du téléchargement de {model}: {e}")

def download_piper_models():
    """Télécharge les modèles Piper"""
    models_dir = Path('models/piper')
    models_dir.mkdir(parents=True, exist_ok=True)
    
    # Modèle français
    model_url = "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/fr/fr_FR-amy-medium.onnx"
    config_url = "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/fr/fr_FR-amy-medium.onnx.json"
    
    try:
        logger.info("Téléchargement du modèle Piper français")
        response = requests.get(model_url)
        with open(models_dir / "fr_FR-amy-medium.onnx", "wb") as f:
            f.write(response.content)
        
        response = requests.get(config_url)
        with open(models_dir / "fr_FR-amy-medium.onnx.json", "wb") as f:
            f.write(response.content)
        
        logger.info("Modèle Piper téléchargé avec succès")
    except Exception as e:
        logger.error(f"Erreur lors du téléchargement Piper: {e}")

def download_ollama_models():
    """Télécharge les modèles Ollama"""
    models = ['llama2:7b', 'llama2:13b']
    
    for model in models:
        logger.info(f"Téléchargement du modèle Ollama: {model}")
        try:
            subprocess.run(['ollama', 'pull', model], check=True)
            logger.info(f"Modèle {model} téléchargé avec succès")
        except Exception as e:
            logger.error(f"Erreur lors du téléchargement de {model}: {e}")

def main():
    """Fonction principale"""
    logger.info("Début du téléchargement des modèles IA")
    
    download_whisper_models()
    download_piper_models()
    download_ollama_models()
    
    logger.info("Téléchargement des modèles IA terminé")

if __name__ == "__main__":
    main() 