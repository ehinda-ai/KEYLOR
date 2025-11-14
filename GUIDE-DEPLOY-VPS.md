# 🚀 Guide Déploiement VPS OVH - KEYLOR.fr (GRATUIT)

Guide complet pour déployer votre site vitrine sur votre VPS OVH Ubuntu 25.04.
**Coût total : 0€** (en plus de votre abonnement VPS).

---

## 📋 Ce que vous avez

✅ VPS OVH Ubuntu 25.04 (IP + clé SSH configurée)
✅ Nom de domaine keylor.fr chez OVH
✅ Compte GitHub
✅ Site vitrine fonctionnel sur Replit

## 🎯 Ce qu'on va installer (TOUT GRATUIT)

- Node.js 20 (runtime)
- PostgreSQL 14 (base de données)
- Nginx (serveur web)
- PM2 (gestionnaire de processus)
- Let's Encrypt (SSL gratuit)

---

## PARTIE 1 : PRÉPARATION (sur Replit)

### 1.1 - Pousser votre code sur GitHub

Ouvrez le **Shell** dans Replit et copiez-collez ces commandes **une par une** :

```bash
# 1. Configurer Git (REMPLACEZ par vos vraies infos)
git config --global user.name "Votre Nom"
git config --global user.email "votre-email@exemple.com"

# 2. Initialiser Git
git init

# 3. Ajouter tous les fichiers
git add .

# 4. VÉRIFICATION CRITIQUE : .env ne doit PAS apparaître !
git status

# 5. Premier commit
git commit -m "Initial commit - KEYLOR Vitrine"

# 6. Préparer la branche main
git branch -M main

# 7. Connecter à GitHub (REMPLACEZ par votre username)
git remote add origin https://github.com/VOTRE-USERNAME/keylor-vitrine.git

# 8. Pousser sur GitHub
git push -u origin main
```

**Note** : GitHub va demander de vous connecter. Suivez les instructions.

### 1.2 - Exporter la base de données

Dans le Shell Replit :

```bash
# Créer un export SQL de votre base de données
pg_dump $DATABASE_URL > keylor-database-export.sql

# Vérifier que le fichier existe
ls -lh keylor-database-export.sql
```

**Téléchargez ce fichier** depuis Replit (clic droit → Download).

### 1.3 - Télécharger vos photos

**Option A - Manuel** :
1. Allez dans l'onglet "Object Storage" de Replit
2. Téléchargez tous les dossiers `/public` et `/.private`

**Option B - Automatique** (script fourni plus bas)

---

## PARTIE 2 : INSTALLATION VPS

### 2.1 - Se connecter au VPS

Depuis votre ordinateur :

```bash
ssh root@VOTRE-IP-VPS
```

### 2.2 - Installation automatique

```bash
# Télécharger le script d'installation
curl -o setup-vps.sh https://raw.githubusercontent.com/VOTRE-USERNAME/keylor-vitrine/main/scripts/setup-vps.sh

# Rendre exécutable
chmod +x setup-vps.sh

# Lancer l'installation (prend 5-10 min)
./setup-vps.sh
```

**Ce script installe** : Node.js, PostgreSQL, Nginx, PM2, et configure le pare-feu.

### 2.3 - Installation manuelle (si vous préférez)

<details>
<summary>Cliquez pour voir les commandes manuelles</summary>

```bash
# Mise à jour système
apt update && apt upgrade -y

# Installer Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Installer PostgreSQL
apt install -y postgresql postgresql-contrib

# Installer Nginx
apt install -y nginx

# Installer PM2
npm install -g pm2

# Installer Certbot (pour SSL)
apt install -y certbot python3-certbot-nginx

# Configurer pare-feu
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# Créer utilisateur dédié
adduser keylor --disabled-password --gecos ""
usermod -aG sudo keylor
```
</details>

---

## PARTIE 3 : DÉPLOYER L'APPLICATION

### 3.1 - Cloner le projet

```bash
# Passer en utilisateur keylor
su - keylor

# Cloner depuis GitHub (REMPLACEZ par votre URL)
git clone https://github.com/VOTRE-USERNAME/keylor-vitrine.git
cd keylor-vitrine

# Installer les dépendances
npm install

# Compiler le frontend
npm run build
```

### 3.2 - Configurer les variables d'environnement

```bash
# Copier le modèle
cp .env.example .env

# Éditer avec nano
nano .env
```

Remplissez avec vos valeurs :

```env
# Base de données locale sur le VPS
DATABASE_URL=postgresql://keylor:MOTDEPASSE@localhost:5432/keylor_db

# Object Storage local
DEFAULT_OBJECT_STORAGE_BUCKET_ID=local
PUBLIC_OBJECT_SEARCH_PATHS=/var/www/keylor/uploads/public
PRIVATE_OBJECT_DIR=/var/www/keylor/uploads/private

# Secret partagé (identique à l'intranet)
INTRANET_SHARED_SECRET=keylor-intranet-secret-2024-shared-upload

# Email (Resend ou Mailjet)
RESEND_API_KEY=votre-cle-resend
```

Sauvegardez : `Ctrl+X` → `Y` → `Enter`

---

## PARTIE 4 : CONFIGURER LA BASE DE DONNÉES

### 4.1 - Créer la base de données

```bash
# Passer en utilisateur postgres
sudo -u postgres psql

# Depuis psql :
CREATE DATABASE keylor_db;
CREATE USER keylor WITH PASSWORD 'ChoisissezUnMotDePasseSecurise';
GRANT ALL PRIVILEGES ON DATABASE keylor_db TO keylor;
\q
```

### 4.2 - Importer vos données

```bash
# Uploader le fichier keylor-database-export.sql sur le VPS
# (utilisez scp, sftp, ou l'interface OVH)

# Puis importer :
psql -U keylor -d keylor_db -f keylor-database-export.sql
```

---

## PARTIE 5 : CONFIGURER LES IMAGES

### 5.1 - Créer les dossiers

```bash
# Créer la structure
sudo mkdir -p /var/www/keylor/uploads/public
sudo mkdir -p /var/www/keylor/uploads/private

# Donner les permissions
sudo chown -R keylor:keylor /var/www/keylor
chmod -R 755 /var/www/keylor/uploads
```

### 5.2 - Uploader vos photos

**Option A - Manuel** :
Utilisez FileZilla ou WinSCP pour uploader les photos dans :
- `/var/www/keylor/uploads/public/`
- `/var/www/keylor/uploads/private/`

**Option B - Script** (si vos photos sont encore sur Replit) :
```bash
# À créer selon votre configuration
```

---

## PARTIE 6 : CONFIGURER NGINX

### 6.1 - Créer la configuration

```bash
sudo nano /etc/nginx/sites-available/keylor.fr
```

Copiez cette configuration :

```nginx
server {
    listen 80;
    server_name keylor.fr www.keylor.fr;

    # Redirection vers HTTPS (après installation SSL)
    # return 301 https://$server_name$request_uri;

    # Pour l'instant, proxy vers Node.js
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Servir les images uploadées
    location /objects/uploads/ {
        alias /var/www/keylor/uploads/public/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 6.2 - Activer le site

```bash
# Créer le lien symbolique
sudo ln -s /etc/nginx/sites-available/keylor.fr /etc/nginx/sites-enabled/

# Supprimer le site par défaut
sudo rm /etc/nginx/sites-enabled/default

# Tester la configuration
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
```

---

## PARTIE 7 : CONFIGURER LE DOMAINE

### 7.1 - Pointer keylor.fr vers votre VPS

1. Connectez-vous sur **manager.ovh.com**
2. Allez dans **Domaines** → **keylor.fr** → **Zone DNS**
3. Modifiez (ou ajoutez) ces enregistrements :

```
Type  | Sous-domaine | Cible           | TTL
------|--------------|-----------------|------
A     | @            | VOTRE-IP-VPS    | 3600
A     | www          | VOTRE-IP-VPS    | 3600
```

4. Sauvegardez (propagation : 5 min à 24h)

### 7.2 - Vérifier la propagation

```bash
# Depuis votre ordinateur
ping keylor.fr
ping www.keylor.fr

# Doit afficher l'IP de votre VPS
```

---

## PARTIE 8 : INSTALLER SSL (HTTPS GRATUIT)

### 8.1 - Obtenir le certificat Let's Encrypt

```bash
# Sur le VPS
sudo certbot --nginx -d keylor.fr -d www.keylor.fr
```

Suivez les instructions :
- Entrez votre email
- Acceptez les conditions
- Choisissez "Redirect" (2) pour forcer HTTPS

**Certbot configure automatiquement Nginx avec HTTPS !**

### 8.2 - Renouvellement automatique

```bash
# Tester le renouvellement
sudo certbot renew --dry-run

# C'est déjà configuré automatiquement !
```

---

## PARTIE 9 : DÉMARRER L'APPLICATION

### 9.1 - Lancer avec PM2

```bash
# En tant qu'utilisateur keylor
cd /home/keylor/keylor-vitrine

# Démarrer l'app
pm2 start npm --name "keylor" -- start

# Configurer redémarrage automatique
pm2 startup
pm2 save
```

### 9.2 - Vérifier que tout fonctionne

```bash
# Statut PM2
pm2 status

# Logs en direct
pm2 logs keylor

# Depuis votre navigateur
https://keylor.fr
```

---

## PARTIE 10 : MISES À JOUR FUTURES

### 10.1 - Déployer une mise à jour

Depuis Replit, après modifications :

```bash
git add .
git commit -m "Description des changements"
git push
```

Sur le VPS :

```bash
cd /home/keylor/keylor-vitrine
git pull
npm install
npm run build
pm2 restart keylor
```

### 10.2 - Script automatique

```bash
# Créer un script de déploiement
nano ~/deploy.sh
```

Contenu :

```bash
#!/bin/bash
cd /home/keylor/keylor-vitrine
git pull
npm install
npm run build
pm2 restart keylor
echo "✅ Déploiement terminé !"
```

```bash
chmod +x ~/deploy.sh

# Pour mettre à jour : une seule commande !
~/deploy.sh
```

---

## 🔧 MAINTENANCE

### Voir les logs

```bash
pm2 logs keylor                    # Logs temps réel
sudo tail -f /var/log/nginx/error.log  # Logs Nginx
```

### Redémarrer les services

```bash
pm2 restart keylor      # Application
sudo systemctl restart nginx    # Nginx
sudo systemctl restart postgresql  # PostgreSQL
```

### Sauvegardes

```bash
# Backup base de données
pg_dump -U keylor keylor_db > backup-$(date +%Y%m%d).sql

# Backup photos
tar -czf photos-backup-$(date +%Y%m%d).tar.gz /var/www/keylor/uploads/
```

---

## ⚠️ DÉPANNAGE

### Site inaccessible

```bash
# Vérifier que l'app tourne
pm2 status

# Vérifier Nginx
sudo systemctl status nginx

# Vérifier les ports
sudo netstat -tlnp | grep :5000
```

### Erreur 502 Bad Gateway

```bash
# Redémarrer l'app
pm2 restart keylor

# Vérifier les logs
pm2 logs keylor
```

### Base de données inaccessible

```bash
# Vérifier PostgreSQL
sudo systemctl status postgresql

# Tester connexion
psql -U keylor -d keylor_db -c "SELECT 1;"
```

---

## ✅ CHECKLIST FINALE

- [ ] Code sur GitHub
- [ ] Node.js, PostgreSQL, Nginx installés
- [ ] Application clonée et dépendances installées
- [ ] `.env` configuré avec toutes les variables
- [ ] Base de données créée et données importées
- [ ] Photos uploadées dans `/var/www/keylor/uploads/`
- [ ] Nginx configuré et actif
- [ ] Domaine keylor.fr pointé vers le VPS
- [ ] SSL Let's Encrypt installé
- [ ] Application lancée avec PM2
- [ ] Site accessible sur https://keylor.fr ✅

---

## 🎉 RÉSULTAT

Vous avez maintenant :
- ✅ Site vitrine sur VOTRE VPS (autonome)
- ✅ Base de données PostgreSQL locale (gratuite)
- ✅ Photos hébergées localement (gratuites)
- ✅ SSL/HTTPS activé (gratuit)
- ✅ Redémarrage automatique (PM2)
- ✅ **Coût total : 0€** (en plus du VPS)

**Plus besoin de Replit !** 🚀
