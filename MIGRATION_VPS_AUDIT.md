# AUDIT DE MIGRATION VPS - KEYLOR
**Date:** 22 Nov 2025  
**Statut:** ⚠️ DÉPENDANCES CRITIQUES IDENTIFIÉES

---

## 🚨 DÉPENDANCES REPLIT CRITIQUES

### 1. **SIDECAR REPLIT** (LIGNE 6 - server/objectStorage.ts) - BLOCAGE
```typescript
const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
```
**Problème:** Ce endpoint n'existe que sur Replit, cassera en production!  
**Solution:** Migrer vers stockage local VPS (`/var/www/keylor/storage/`)

### 2. **PLUGINS VITE REPLIT** (vite.config.ts) - NON-BLOQUANT
```typescript
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
// ... cartographer et devBanner chargés conditionnellement
```
**Problème:** Plugins de dev Replit utilisés en développement  
**Solution:** Déjà conditionnel avec `process.env.REPL_ID` - OK pour VPS (ne charge pas en prod)

---

## ✅ AUDIT DES VARIABLES D'ENVIRONNEMENT

### Variables utilisées (TOUTES GÉNÉRIQUES - OK):
- `process.env.PORT` → Configurable ✅
- `process.env.NODE_ENV` → Standard ✅
- `process.env.DATABASE_URL` → PostgreSQL Neon (migrerez vers local PostgreSQL) ✅
- `process.env.ADMIN_PASSWORD` → Configurable ✅
- `process.env.ADMIN_USERNAME` → Configurable ✅
- `process.env.SESSION_SECRET` → Configurable ✅
- `process.env.MAILJET_API_KEY` → Service externe ✅
- `process.env.MAILJET_SECRET_KEY` → Service externe ✅
- `process.env.OPENROUTESERVICE_API_KEY` → Service externe ✅
- `process.env.AI_INTEGRATIONS_OPENAI_API_KEY` → Service externe ✅
- `process.env.AI_INTEGRATIONS_OPENAI_BASE_URL` → Service externe ✅
- `process.env.PRIVATE_OBJECT_DIR` → À adapter ⚠️
- `process.env.PUBLIC_OBJECT_SEARCH_PATHS` → À adapter ⚠️
- `process.env.INTRANET_SHARED_SECRET` → Configurable ✅

---

## 📦 DÉPENDANCES REPLIT DANS package.json

Toutes les `@replit/*` packages sont pour la **DEV SEULEMENT**:
- `@replit/vite-plugin-runtime-error-modal` - Dev UI overlay
- `@replit/vite-plugin-cartographer` - Dev file navigator
- `@replit/vite-plugin-dev-banner` - Dev banner

**Impact VPS:** ✅ Aucun (pas utilisés en production)

---

## 🔍 FICHIERS FRONTEND

**Scan:** Aucune référence à localhost, replit.com ou repl.it  
**Hardcoded localhost:** Aucun trouvé  
**window.location usage:** Utilisé correctement (navigation relative, pas de hardcodes)  

✅ **Frontend complètement indépendant de Replit**

---

## 📋 PLAN DE MIGRATION VPS

### ÉTAPE 1: Remplacer le stockage objet (URGENT)
**Fichier:** `server/objectStorage.ts` (261 lignes)

**Actuellement:** Utilise Google Cloud Storage via sidecar Replit  
**À faire:** Implémenter stockage local VPS

```
/var/www/keylor/storage/
├── public/        (images publiques - accès web)
└── .private/      (uploads privés - sécurisés)
```

### ÉTAPE 2: Adapter les variables d'env
**Remplacer:**
- `PUBLIC_OBJECT_SEARCH_PATHS` → `/var/www/keylor/storage/public`
- `PRIVATE_OBJECT_DIR` → `/var/www/keylor/storage/.private`

**Nouvelle env:**
```env
STORAGE_PATH=/var/www/keylor/storage
```

### ÉTAPE 3: Build & déploiement
```bash
npm run build
# Produit: dist/ avec bundle Express + frontend
```

### ÉTAPE 4: Configuration Nginx (VPS)
```nginx
server {
  listen 80;
  server_name keylor.fr www.keylor.fr;
  
  location /storage/public/ {
    alias /var/www/keylor/storage/public/;
    expires 30d;
  }
  
  location / {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

### ÉTAPE 5: Configuration PM2 (VPS)
```bash
pm2 start dist/index.js --name keylor
pm2 save
pm2 startup
```

---

## 🚀 CHECKLIST MIGRATION

- [ ] Remplacer objectStorage.ts pour stockage local
- [ ] Adapter les env vars pour VPS
- [ ] Build production: `npm run build`
- [ ] Tester sur VPS dev environment
- [ ] Configurer Nginx reverse proxy
- [ ] Configurer PM2 pour auto-restart
- [ ] Tester uploads photos (admin)
- [ ] Vérifier logs des API
- [ ] Configurer SSL (Let's Encrypt)
- [ ] Migration base de données Neon → PostgreSQL local
- [ ] Backup strategy (cron jobs)

---

## 📊 RÉSUMÉ

| Aspect | Statut | Notes |
|--------|--------|-------|
| **Dépendances Replit** | 🔴 Critique | Sidecar dans objectStorage.ts |
| **Variables d'env** | ✅ OK | Toutes génériques, adaptables |
| **Frontend** | ✅ OK | Zéro dépendance Replit |
| **Backend** | 🟡 Partielle | Stockage objet à migrer |
| **Build** | ✅ OK | `npm run build` produit bundle autonome |
| **Prêt VPS** | 🟡 Presque | Nécessite remplacement stockage |

---

## 💡 NEXT STEPS (ORDRE DE PRIORITÉ)

1. **Créer StorageService local** - Remplacer le sidecar Replit
2. **Adapter objectStorage.ts** - Utiliser fs pour stockage local
3. **Tester build & run** - Valider sur VPS dev
4. **Déployer sur VPS** - Utiliser PM2 + Nginx
