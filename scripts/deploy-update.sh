#!/bin/bash

###############################################################################
# Script de déploiement rapide pour mises à jour
# Usage: ./deploy-update.sh
# À utiliser après un git push depuis Replit
###############################################################################

set -e

PROJECT_DIR="/home/keylor/keylor-vitrine"
APP_NAME="keylor"

echo "🚀 Déploiement mise à jour KEYLOR"
echo "================================="
echo ""

# Vérifier qu'on est dans le bon dossier
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Dossier $PROJECT_DIR introuvable"
    exit 1
fi

cd $PROJECT_DIR

# Récupérer les dernières modifications
echo "📥 Récupération du code depuis GitHub..."
git pull origin main
echo "✅ Code à jour"
echo ""

# Installer les nouvelles dépendances
echo "📦 Installation des dépendances..."
npm install
echo "✅ Dépendances installées"
echo ""

# Compiler le frontend
echo "🔨 Compilation du frontend..."
npm run build
echo "✅ Build terminé"
echo ""

# Redémarrer l'application
echo "🔄 Redémarrage de l'application..."
pm2 restart $APP_NAME
echo "✅ Application redémarrée"
echo ""

# Afficher le statut
echo "📊 Statut de l'application:"
pm2 status $APP_NAME
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Déploiement terminé avec succès!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Votre site: https://keylor.fr"
echo "📋 Voir les logs: pm2 logs $APP_NAME"
echo ""
