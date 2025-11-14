#!/bin/bash

###############################################################################
# Script d'installation automatique VPS pour KEYLOR.fr
# Usage: ./setup-vps.sh
# Testé sur: Ubuntu 25.04, 24.04, 22.04
###############################################################################

set -e  # Arrêter si une commande échoue

echo "🚀 Installation VPS pour KEYLOR.fr"
echo "=================================="
echo ""

# Vérification root
if [ "$EUID" -ne 0 ]; then
  echo "❌ Ce script doit être exécuté en tant que root"
  echo "Utilisez: sudo ./setup-vps.sh"
  exit 1
fi

echo "✅ Exécution en tant que root"
echo ""

# Mise à jour système
echo "📦 Mise à jour du système..."
apt update -qq
apt upgrade -y -qq
echo "✅ Système à jour"
echo ""

# Installation Node.js 20
echo "📦 Installation Node.js 20..."
if command -v node &> /dev/null; then
    echo "Node.js déjà installé: $(node -v)"
else
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    echo "✅ Node.js installé: $(node -v)"
fi
echo ""

# Installation PostgreSQL
echo "📦 Installation PostgreSQL..."
if command -v psql &> /dev/null; then
    echo "PostgreSQL déjà installé"
else
    apt install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
    echo "✅ PostgreSQL installé"
fi
echo ""

# Installation Nginx
echo "📦 Installation Nginx..."
if command -v nginx &> /dev/null; then
    echo "Nginx déjà installé"
else
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
    echo "✅ Nginx installé"
fi
echo ""

# Installation PM2
echo "📦 Installation PM2..."
if command -v pm2 &> /dev/null; then
    echo "PM2 déjà installé: $(pm2 -v)"
else
    npm install -g pm2
    echo "✅ PM2 installé"
fi
echo ""

# Installation Certbot (SSL)
echo "📦 Installation Certbot (Let's Encrypt)..."
if command -v certbot &> /dev/null; then
    echo "Certbot déjà installé"
else
    apt install -y certbot python3-certbot-nginx
    echo "✅ Certbot installé"
fi
echo ""

# Configuration pare-feu
echo "🔒 Configuration du pare-feu..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
echo "✅ Pare-feu configuré"
echo ""

# Créer utilisateur keylor (si n'existe pas)
echo "👤 Création utilisateur 'keylor'..."
if id "keylor" &>/dev/null; then
    echo "Utilisateur 'keylor' existe déjà"
else
    adduser keylor --disabled-password --gecos ""
    usermod -aG sudo keylor
    echo "✅ Utilisateur 'keylor' créé"
fi
echo ""

# Créer les dossiers pour les uploads
echo "📁 Création des dossiers uploads..."
mkdir -p /var/www/keylor/uploads/public
mkdir -p /var/www/keylor/uploads/private
chown -R keylor:keylor /var/www/keylor
chmod -R 755 /var/www/keylor/uploads
echo "✅ Dossiers créés"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Installation terminée avec succès!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Passez en utilisateur keylor: su - keylor"
echo "2. Clonez le projet: git clone https://github.com/VOTRE-USERNAME/keylor-vitrine.git"
echo "3. Configurez la base de données (voir GUIDE-DEPLOY-VPS.md)"
echo "4. Configurez Nginx (voir GUIDE-DEPLOY-VPS.md)"
echo "5. Installez SSL: sudo certbot --nginx -d keylor.fr -d www.keylor.fr"
echo ""
echo "📖 Consultez GUIDE-DEPLOY-VPS.md pour les détails complets"
echo ""
