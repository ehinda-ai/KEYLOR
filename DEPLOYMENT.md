# 🚀 Guide de Déploiement - KEYLOR.fr

Ce guide vous explique comment déployer le site vitrine KEYLOR sur différentes plateformes.

## 📋 Prérequis généraux

Avant de déployer, assurez-vous d'avoir :

- ✅ Une base de données PostgreSQL configurée (partagée avec l'intranet)
- ✅ Un bucket Object Storage pour les images
- ✅ Les secrets `INTRANET_SHARED_SECRET` identiques sur vitrine et intranet
- ✅ Un compte email (Resend ou Mailjet) pour les notifications
- ✅ Node.js 20+ installé sur votre serveur

---

## 🖥️ Option 1 : Déploiement sur VPS (OVH, Scaleway, DigitalOcean)

### Étape 1 : Préparation du serveur

```bash
# Se connecter en SSH
ssh root@votre-ip-serveur

# Mettre à jour le système
apt update && apt upgrade -y

# Installer Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Installer PM2 (gestionnaire de processus)
npm install -g pm2

# Installer Nginx
apt install -y nginx

# Installer Certbot pour SSL
apt install -y certbot python3-certbot-nginx
```

### Étape 2 : Déployer l'application

```bash
# Créer un utilisateur dédié
adduser keylor
usermod -aG sudo keylor
su - keylor

# Cloner le projet
cd /home/keylor
git clone https://github.com/votre-username/keylor.git
cd keylor

# Installer les dépendances
npm install

# Créer le fichier .env
nano .env
# Coller vos variables d'environnement (voir .env.example)

# Compiler l'application
npm run build

# Démarrer avec PM2
pm2 start npm --name "keylor" -- start
pm2 save
pm2 startup
```

### Étape 3 : Configurer Nginx

```bash
# Créer la configuration Nginx
sudo nano /etc/nginx/sites-available/keylor.fr
```

Contenu du fichier :

```nginx
server {
    listen 80;
    server_name keylor.fr www.keylor.fr;

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
}
```

```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/keylor.fr /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Étape 4 : Configurer SSL avec Let's Encrypt

```bash
sudo certbot --nginx -d keylor.fr -d www.keylor.fr
```

### Étape 5 : Automatiser les redémarrages

```bash
# PM2 redémarre automatiquement au reboot
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u keylor --hp /home/keylor
```

### Maintenance

```bash
# Voir les logs
pm2 logs keylor

# Redémarrer l'application
pm2 restart keylor

# Mettre à jour l'application
cd /home/keylor/keylor
git pull
npm install
npm run build
pm2 restart keylor
```

---

## 🐳 Option 2 : Déploiement avec Docker

### Créer le Dockerfile

Créez `Dockerfile` à la racine :

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copier package.json et installer les dépendances
COPY package*.json ./
RUN npm ci --only=production

# Copier le reste de l'application
COPY . .

# Compiler le frontend
RUN npm run build

# Exposer le port
EXPOSE 5000

# Variables d'environnement par défaut (à surcharger)
ENV NODE_ENV=production

# Démarrer l'application
CMD ["npm", "start"]
```

### Créer docker-compose.yml

```yaml
version: '3.8'

services:
  keylor-vitrine:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - DEFAULT_OBJECT_STORAGE_BUCKET_ID=${DEFAULT_OBJECT_STORAGE_BUCKET_ID}
      - INTRANET_SHARED_SECRET=${INTRANET_SHARED_SECRET}
      - RESEND_API_KEY=${RESEND_API_KEY}
    restart: unless-stopped
    depends_on:
      - postgres

  postgres:
    image: postgres:14-alpine
    environment:
      - POSTGRES_USER=${PGUSER}
      - POSTGRES_PASSWORD=${PGPASSWORD}
      - POSTGRES_DB=${PGDATABASE}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - keylor-vitrine
    restart: unless-stopped

volumes:
  postgres_data:
```

### Déployer avec Docker

```bash
# Créer le fichier .env avec vos variables
cp .env.example .env
nano .env

# Construire et démarrer
docker-compose up -d

# Voir les logs
docker-compose logs -f keylor-vitrine

# Arrêter
docker-compose down

# Mettre à jour
git pull
docker-compose up -d --build
```

---

## ☁️ Option 3 : Déploiement sur Railway

[Railway](https://railway.app) offre un déploiement simple depuis GitHub.

### Étapes

1. **Créer un compte sur Railway**
2. **Connecter votre dépôt GitHub**
3. **Créer un nouveau projet** → "Deploy from GitHub repo"
4. **Sélectionner** le dépôt `keylor`
5. **Ajouter les variables d'environnement** (Settings → Variables)
   - Coller toutes les variables de `.env.example`
6. **Déployer** → Railway détecte automatiquement Node.js

### Configuration Railway

Créez `railway.json` :

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## 🌊 Option 4 : Déploiement sur Render

[Render](https://render.com) est une excellente alternative à Heroku.

### Étapes

1. **Créer un compte Render**
2. **New Web Service** → Connect GitHub
3. **Configurer** :
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node
4. **Ajouter les variables d'environnement**
5. **Déployer**

---

## ✈️ Option 5 : Déploiement sur Fly.io

[Fly.io](https://fly.io) permet de déployer près de vos utilisateurs.

### Installation

```bash
# Installer Fly CLI
curl -L https://fly.io/install.sh | sh

# Se connecter
fly auth login
```

### Configuration

```bash
# Initialiser Fly.io
fly launch

# Suivre les instructions, puis :
fly deploy
```

Créez `fly.toml` :

```toml
app = "keylor-vitrine"

[build]
  builder = "heroku/buildpacks:20"

[env]
  NODE_ENV = "production"

[[services]]
  http_checks = []
  internal_port = 5000
  processes = ["app"]
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

---

## 🔐 Configuration Object Storage

### Option A : Google Cloud Storage

1. Créer un bucket sur Google Cloud
2. Créer une clé de service
3. Configurer les variables :

```env
DEFAULT_OBJECT_STORAGE_BUCKET_ID=your-bucket-id
PUBLIC_OBJECT_SEARCH_PATHS=/public
PRIVATE_OBJECT_DIR=/.private
```

### Option B : AWS S3

```bash
npm install @aws-sdk/client-s3
```

Configurer :

```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=eu-west-3
AWS_BUCKET_NAME=keylor-images
```

---

## 📧 Configuration Email

### Option A : Resend (recommandé)

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

### Option B : Mailjet

```env
MAILJET_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MAILJET_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🔄 Mise à jour en production

### Sur VPS

```bash
cd /home/keylor/keylor
git pull origin main
npm install
npm run build
pm2 restart keylor
```

### Sur Docker

```bash
git pull origin main
docker-compose up -d --build
```

### Sur Railway/Render/Fly.io

Poussez simplement sur GitHub, le déploiement est automatique :

```bash
git push origin main
```

---

## 🔍 Monitoring et Logs

### PM2 (VPS)

```bash
pm2 logs keylor          # Voir les logs en temps réel
pm2 monit                # Dashboard de monitoring
pm2 status               # État des processus
```

### Docker

```bash
docker-compose logs -f keylor-vitrine
```

### Plateformes cloud

Les logs sont accessibles directement sur le dashboard de chaque plateforme.

---

## ⚠️ Checklist avant déploiement

- [ ] `.env` configuré avec toutes les variables
- [ ] Base de données PostgreSQL accessible
- [ ] Object Storage configuré
- [ ] `INTRANET_SHARED_SECRET` identique sur vitrine et intranet
- [ ] Domaine DNS pointé vers le serveur
- [ ] SSL/TLS configuré (Let's Encrypt)
- [ ] Sauvegarde de la base de données configurée
- [ ] Monitoring configuré (Uptime Robot, etc.)

---

## 🆘 Dépannage

### L'application ne démarre pas

```bash
# Vérifier les logs
pm2 logs keylor

# Vérifier les variables d'environnement
printenv | grep DATABASE

# Tester la connexion DB
node -e "require('pg').Pool({ connectionString: process.env.DATABASE_URL }).query('SELECT NOW()')"
```

### Erreur 502 Bad Gateway

```bash
# Vérifier que l'app tourne
pm2 status

# Redémarrer Nginx
sudo systemctl restart nginx

# Vérifier les logs Nginx
sudo tail -f /var/log/nginx/error.log
```

### Images ne s'affichent pas

1. Vérifier que `DEFAULT_OBJECT_STORAGE_BUCKET_ID` est correctement configuré
2. Vérifier que `INTRANET_SHARED_SECRET` est identique sur les 2 apps
3. Tester l'accès aux images : `curl https://keylor.fr/objects/uploads/test.jpg`

---

## 📞 Support

Pour toute aide sur le déploiement :
- 📧 contact@keylor.fr
- 📞 01 23 45 67 89
