#!/bin/bash

###############################################################################
# Script de migration de base de données Replit -> VPS
# Usage: ./migrate-database.sh keylor-database-export.sql
###############################################################################

set -e

if [ "$#" -ne 1 ]; then
    echo "Usage: ./migrate-database.sh <fichier-export.sql>"
    echo "Exemple: ./migrate-database.sh keylor-database-export.sql"
    exit 1
fi

EXPORT_FILE=$1
DB_NAME="keylor_db"
DB_USER="keylor"

echo "🗄️  Migration de la base de données"
echo "==================================="
echo ""

# Vérifier que le fichier existe
if [ ! -f "$EXPORT_FILE" ]; then
    echo "❌ Fichier '$EXPORT_FILE' introuvable"
    exit 1
fi

echo "✅ Fichier export trouvé: $EXPORT_FILE"
echo "📊 Taille: $(du -h $EXPORT_FILE | cut -f1)"
echo ""

# Demander le mot de passe
echo "Entrez le mot de passe PostgreSQL pour l'utilisateur '$DB_USER':"
read -s DB_PASSWORD
echo ""

# Créer la base de données si elle n'existe pas
echo "📦 Création de la base de données '$DB_NAME'..."
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Base de données existe déjà"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null
echo ""

# Importer les données
echo "📥 Import des données (peut prendre quelques minutes)..."
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d $DB_NAME -f $EXPORT_FILE

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Migration terminée avec succès!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔗 Connexion à la base:"
echo "   Base: $DB_NAME"
echo "   Utilisateur: $DB_USER"
echo "   Host: localhost"
echo "   Port: 5432"
echo ""
echo "📋 Mettez à jour votre .env avec:"
echo "DATABASE_URL=postgresql://$DB_USER:VOTRE_MOT_DE_PASSE@localhost:5432/$DB_NAME"
echo ""
