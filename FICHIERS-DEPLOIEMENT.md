# 📦 Fichiers de Déploiement - KEYLOR.fr

Récapitulatif de tous les fichiers créés pour vous rendre autonome.

---

## 📚 Guides de documentation

### 📖 **GUIDE-DEPLOY-VPS.md** ⭐ PRINCIPAL
Guide complet pas-à-pas avec toutes les commandes détaillées.
- Installation VPS
- Configuration base de données
- Migration des photos
- Configuration domaine + SSL
- Dépannage

➡️ **Lisez ce fichier en premier !**

### ⚡ **QUICKSTART-VPS.md** ⭐ VERSION RAPIDE
Version condensée en 5 étapes (30 min).
Parfait si vous connaissez déjà un peu Linux.

### 📖 **README.md**
Présentation générale du projet.
Installation locale pour développement.

### 🚀 **DEPLOYMENT.md**
Guide alternatif pour autres plateformes :
- Docker
- Railway, Render, Fly.io
- Autres VPS

---

## 🔧 Scripts automatiques (dossier `scripts/`)

### **setup-vps.sh** ⭐ À LANCER EN PREMIER
Script d'installation automatique qui installe :
- Node.js 20
- PostgreSQL 14
- Nginx
- PM2
- Certbot (SSL)
- Utilisateur 'keylor'
- Dossiers uploads

**Usage** :
```bash
sudo ./setup-vps.sh
```

### **migrate-database.sh**
Importe votre base de données depuis Replit.

**Usage** :
```bash
./migrate-database.sh keylor-database-export.sql
```

### **deploy-update.sh** ⭐ POUR MISES À JOUR
Script pour déployer rapidement après modifications.

**Usage** :
```bash
./deploy-update.sh
```

### **nginx-keylor.conf**
Configuration Nginx prête à l'emploi.

**Usage** :
```bash
sudo cp scripts/nginx-keylor.conf /etc/nginx/sites-available/keylor.fr
```

---

## ⚙️ Fichiers de configuration

### **.gitignore** ⭐ SÉCURITÉ
Empêche d'envoyer des fichiers sensibles sur GitHub :
- `.env` (vos secrets)
- `node_modules/`
- Fichiers Replit
- Fichiers temporaires

### **.env.example** ⭐ MODÈLE
Modèle de configuration avec :
- Variables Replit (pour rester sur Replit)
- Variables VPS (pour déploiement autonome)

**À copier en `.env` et remplir avec vos vraies valeurs.**

---

## 📋 Workflow recommandé

### 🔹 Première fois (Replit → GitHub → VPS)

1. **Sur Replit** : Pousser le code sur GitHub
   ```bash
   # Suivre GUIDE-DEPLOY-VPS.md - Partie 1
   ```

2. **Sur VPS** : Installer l'environnement
   ```bash
   sudo ./setup-vps.sh
   ```

3. **Sur VPS** : Cloner et configurer
   ```bash
   # Suivre GUIDE-DEPLOY-VPS.md - Parties 3-9
   ```

4. **Résultat** : Site en ligne sur https://keylor.fr ✅

### 🔹 Mises à jour (après modifications)

1. **Sur Replit** : Pousser les changements
   ```bash
   git add .
   git commit -m "Description"
   git push
   ```

2. **Sur VPS** : Déployer
   ```bash
   ./deploy-update.sh
   ```

---

## 💰 Coût total

| Élément | Prix |
|---------|------|
| VPS OVH | ~5-10€/mois |
| Node.js, PostgreSQL, Nginx, PM2 | **GRATUIT** ✅ |
| SSL Let's Encrypt | **GRATUIT** ✅ |
| GitHub (privé) | **GRATUIT** ✅ |
| Domaine keylor.fr | Déjà payé |
| **TOTAL EXTRA** | **0€** 🎉 |

Vous payez juste votre VPS OVH, rien d'autre !

---

## 📞 Ordre de lecture recommandé

1. ✅ **Ce fichier** (vous y êtes !)
2. 📖 **QUICKSTART-VPS.md** (aperçu rapide)
3. 📖 **GUIDE-DEPLOY-VPS.md** (guide détaillé)
4. 🔧 Lancer les scripts dans l'ordre

---

## 🆘 En cas de problème

1. Consultez **GUIDE-DEPLOY-VPS.md** section "Dépannage"
2. Vérifiez les logs :
   ```bash
   pm2 logs keylor
   sudo tail -f /var/log/nginx/error.log
   ```
3. Redémarrez les services :
   ```bash
   pm2 restart keylor
   sudo systemctl restart nginx
   ```

---

**Vous êtes prête à déployer ! 🚀**

Commencez par **QUICKSTART-VPS.md** ou **GUIDE-DEPLOY-VPS.md** selon votre niveau.
