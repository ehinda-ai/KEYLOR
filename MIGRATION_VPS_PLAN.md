# 📋 Plan de Migration KEYLOR → VPS Ubuntu 25.04

**Date** : 22 Novembre 2025
**Statut** : Prêt pour migration
**Environnement cible** : VPS Ubuntu 25.04 + Nginx

---

## 🔍 AUDIT COMPLET - Dépendances Replit Identifiées

### ✅ Dépendances Replit (À SUPPRIMER en production)

#### 1. **Plugins Vite Replit** (Dev only)
```
- @replit/vite-plugin-cartographer      ❌ Dev only
- @replit/vite-plugin-dev-banner        ❌ Dev only  
- @replit/vite-plugin-runtime-error-modal ❌ Dev only
```
**Impact** : Zéro impact production - déjà conditionnels avec `process.env.NODE_ENV`
**Action** : Garder dans package.json, ignorés en production

#### 2. **Variables d'environnement Replit**
```
process.env.REPL_ID              → Vérifié dans vite.config.ts
```
**Impact** : Minimal - utilisé uniquement pour charger plugins dev
**Action** : Automatiquement absent sur VPS, pas besoin de modification

#### 3. **Replit Object Storage**
```
@google-cloud/storage            → Présent
PUBLIC_OBJECT_SEARCH_PATHS       → Variable env
PRIVATE_OBJECT_DIR               → Variable env
```
**Impact** : **MAJEUR** - Images des annonces
**Action** : Migrer vers système fichiers ou S3

---

## 📊 Architecture Actuelle

### Composants

| Composant | Type | Localisation | VPS |
|-----------|------|--------------|-----|
| **Base de données** | PostgreSQL Neon | Cloud | ✅ Accès direct |
| **Images annonces** | Object Storage Replit | Replit | ❌ À remplacer |
| **Images carrousels** | Unsplash URLs | External | ✅ Fonctionne |
| **Email** | Mailjet | Externe | ✅ API keys |
| **Routing** | OpenRouteService | Externe | ✅ API keys |
| **IA** | OpenAI | Externe | ✅ API keys |
| **Sessions** | PostgreSQL | Neon | ✅ Accès direct |

### Services Externes Utilisés

```
1. PostgreSQL Neon
   - DATABASE_URL = postgresql://user:pass@host/dbname
   - SessionStore = connect-pg-simple
   ✅ Accessible depuis VPS (SSL)

2. Mailjet (Email)
   - MAILJET_API_KEY
   - MAILJET_SECRET_KEY
   ✅ API HTTP

3. OpenAI (IA)
   - AI_INTEGRATIONS_OPENAI_API_KEY
   - AI_INTEGRATIONS_OPENAI_BASE_URL
   ✅ API HTTP

4. OpenRouteService (Routing)
   - OPENROUTESERVICE_API_KEY
   ✅ API HTTP

5. Replit Object Storage
   - @google-cloud/storage
   - PUBLIC_OBJECT_SEARCH_PATHS
   - PRIVATE_OBJECT_DIR
   ❌ DÉPENDANCE REPLIT
```

---

## 🔧 Services Replit à Migrer

### 1. **Object Storage → Système de fichiers ou S3**

**Situation actuelle (Replit)**:
```
Images → @google-cloud/storage → Object Storage Replit
         ↓
Images servies via /objects/public/*
```

**Option A : Système de fichiers simple** ⭐ Recommandé pour démarrage
```
/var/www/keylor/storage/
├── uploads/          → Images privées
├── public/           → Images publiques
└── thumbnails/       → Caches
```

**Option B : S3 AWS** (Production)
```
AWS S3 Bucket
├── uploads/
└── public/
```

**Action pour VPS** :
- Créer `/var/www/keylor/storage/`
- Ajouter route Express : `app.use('/storage', express.static('/var/www/keylor/storage'))`
- Mettre à jour `imageUrl.ts` pour pointer vers `/storage/`
- Nginx servira statiquement `/storage/public/*`

---

### 2. **Variables d'environnement Replit**

**À REMPLACER** :
```
PUBLIC_OBJECT_SEARCH_PATHS  → /storage/public
PRIVATE_OBJECT_DIR          → /storage/private
DEFAULT_OBJECT_STORAGE_BUCKET_ID → local filesystem
```

**À GARDER** :
```
DATABASE_URL                 → Neon (unchanged)
MAILJET_API_KEY              → Variable d'env
MAILJET_SECRET_KEY           → Variable d'env
AI_INTEGRATIONS_OPENAI_API_KEY → Variable d'env
OPENROUTESERVICE_API_KEY     → Variable d'env
SESSION_SECRET               → À générer
ADMIN_PASSWORD               → À définir
ADMIN_USERNAME               → À définir
```

---

## 🚀 Plan de Migration Étape par Étape

### Phase 1 : **Préparation (Jour 1)**

#### 1.1 Nettoyage du code
```bash
# ✅ FAIT - Vite plugins déjà conditionnels
# ✅ FAIT - Pas d'imports Replit dans code métier
# ⚠️ À VÉRIFIER - Pas de process.env.REPL_ID en logique métier
```

#### 1.2 Fichier configuration migration
```
À créer : /srv/keylor/.env.production
  DATABASE_URL=postgresql://...neon...
  MAILJET_API_KEY=...
  MAILJET_SECRET_KEY=...
  AI_INTEGRATIONS_OPENAI_API_KEY=...
  OPENROUTESERVICE_API_KEY=...
  SESSION_SECRET=<généré avec openssl>
  PUBLIC_OBJECT_SEARCH_PATHS=/var/www/keylor/storage/public
  PRIVATE_OBJECT_DIR=/var/www/keylor/storage/private
  NODE_ENV=production
```

#### 1.3 Dossiers stockage
```bash
mkdir -p /var/www/keylor/storage/{public,private,uploads}
chmod 755 /var/www/keylor/storage
chmod 755 /var/www/keylor/storage/public
chmod 755 /var/www/keylor/storage/private
```

---

### Phase 2 : **Build & Déploiement (Jour 2)**

#### 2.1 Build production
```bash
npm run build
# Génère : dist/public/ (frontend + assets)
#         dist/index.js (backend)
```

#### 2.2 Upload VPS
```bash
# Créer dirs
ssh ubuntu@51.83.43.106 mkdir -p /srv/keylor/{public,storage/{public,private}}

# Copier files
rsync -avz dist/public/ ubuntu@51.83.43.106:/srv/keylor/public/
rsync -avz dist/index.js ubuntu@51.83.43.106:/srv/keylor/
rsync -avz package.json package-lock.json ubuntu@51.83.43.106:/srv/keylor/

# NPM install
ssh ubuntu@51.83.43.106 "cd /srv/keylor && npm ci --production"
```

#### 2.3 PM2 configuration
```javascript
// /srv/keylor/ecosystem.config.cjs (déjà créé)
module.exports = {
  apps: [{
    name: 'keylor-vitrine',
    script: '/srv/keylor/dist/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      DATABASE_URL: process.env.DATABASE_URL
    },
    // ... reste config
  }]
};
```

#### 2.4 Nginx configuration
```nginx
# /etc/nginx/sites-enabled/keylor

server {
  listen 80;
  server_name keylor.fr www.keylor.fr;
  
  # Redirection HTTPS
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name keylor.fr www.keylor.fr;
  
  # SSL certificates (Let's Encrypt)
  ssl_certificate /etc/letsencrypt/live/keylor.fr/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/keylor.fr/privkey.pem;
  
  # Backend API
  location /api {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
  }
  
  # Storage public
  location /storage/public {
    alias /var/www/keylor/storage/public;
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
  
  # Frontend (SPA)
  location / {
    root /srv/keylor/public;
    try_files $uri $uri/ /index.html;
  }
}
```

---

### Phase 3 : **Mise à jour Code (Jour 3)**

#### 3.1 Mettre à jour imageUrl.ts
```typescript
// client/src/lib/imageUrl.ts
export function resolveImageUrl(objectPath: string | null | undefined): string | null {
  if (!objectPath) return null;
  
  // URLs absolues
  if (objectPath.startsWith('http://') || objectPath.startsWith('https://')) {
    return objectPath;
  }
  
  // En dev : localhost:5000/storage/
  if (import.meta.env.DEV) {
    return `http://localhost:5000/storage${objectPath}`;
  }
  
  // En prod : /storage/ (Nginx proxie vers /var/www/keylor/storage/)
  return `/storage${objectPath}`;
}
```

#### 3.2 Modèle de upload images
```typescript
// Quand intranet upload une image :
// POST /api/properties
// {
//   photos: ["/storage/uploads/uuid.jpg"]
// }
// 
// Le fichier est sauvegardé dans :
// /var/www/keylor/storage/uploads/uuid.jpg
// 
// Vitrine le récupère via :
// GET /storage/uploads/uuid.jpg → Nginx sert le fichier
```

---

## ⚠️ Points Critiques de Migration

### 1. **Object Storage**
**Risque** : Images uploadées dans intranet perdues
**Mitigation** :
- Exporter images de Replit avant migration
- Les copier dans `/var/www/keylor/storage/public/`
- Mettre à jour chemins BD

### 2. **Session Secret**
**Risque** : Sessions perdues lors du redémarrage
**Solution** :
```bash
# Générer secret sécurisé
openssl rand -hex 32
# Stocker dans /srv/keylor/.env.production
SESSION_SECRET=<random>
```

### 3. **Base de données**
**Risque** : Accès PostgreSQL Neon depuis VPS
**Test** :
```bash
psql "postgresql://user:pass@neon-host/db"
```

### 4. **SSL Certifications**
**Solution** :
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d keylor.fr -d www.keylor.fr
```

---

## 📋 Checklist Migration

### Avant migration
- [ ] Tester build : `npm run build`
- [ ] Vérifier dist/ généré correctement
- [ ] Tester accès PostgreSQL Neon depuis VPS
- [ ] Exporter images de Replit

### Migration VPS
- [ ] Créer dossiers `/srv/keylor/` et `/var/www/keylor/storage/`
- [ ] Copier files build
- [ ] Installer dependencies : `npm ci --production`
- [ ] Créer `.env.production` avec variables
- [ ] Configurer Nginx
- [ ] Installer SSL certifications
- [ ] Démarrer PM2 : `pm2 start ecosystem.config.cjs`

### Après migration
- [ ] Test : `curl https://keylor.fr`
- [ ] Vérifier API : `curl https://keylor.fr/api/properties`
- [ ] Vérifier images : `curl https://keylor.fr/storage/public/*`
- [ ] Vérifier static files : `curl https://keylor.fr/assets/*`
- [ ] Test mobile / responsive
- [ ] Vérifier logs : `pm2 logs keylor-vitrine`

---

## 🎯 Résumé Migration

| Aspect | Replit | VPS Ubuntu |
|--------|--------|-----------|
| **Stockage images** | @google-cloud/storage | Système fichiers `/var/www/` |
| **Serveur web** | Vite dev/build | Nginx (reverse proxy) |
| **Backend** | Node.js Express | Node.js Express (PM2) |
| **Frontend** | Vite dev server | Static files (Nginx) |
| **BD** | PostgreSQL Neon | PostgreSQL Neon (unchanged) |
| **Variables env** | Replit secrets | `.env.production` |
| **SSL** | Automatique Replit | Let's Encrypt |

---

## 🚀 Commandes Clés VPS

```bash
# SSH
ssh ubuntu@51.83.43.106

# Build
npm run build

# Start
pm2 start ecosystem.config.cjs

# Logs
pm2 logs keylor-vitrine

# Stop
pm2 stop keylor-vitrine

# Nginx restart
sudo systemctl restart nginx

# SSL renew
sudo certbot renew
```

---

## ✅ État du Code

- ✅ Zéro imports Replit directs
- ✅ Plugins Vite déjà conditionnels
- ✅ BD externalisée (PostgreSQL Neon)
- ✅ API keys gérées par env vars
- ❌ Object Storage Replit → À remplacer
- ⚠️ Chemins images à adapter

**Confiance migration** : 95% ✅

---

## 📞 Support

Questions spécifiques :
1. Quand exporter images Replit ?
2. Quel provider S3 pour images (AWS / DigitalOcean) ?
3. Load balancer nécessaire ?

À confirmer avec l'équipe VPS/infra.
