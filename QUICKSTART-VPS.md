# ⚡ Démarrage Rapide VPS - KEYLOR.fr

Guide ultra-condensé pour déployer sur votre VPS OVH en **30 minutes**.

---

## 📋 Prérequis

- VPS OVH Ubuntu avec SSH configuré
- Domaine keylor.fr chez OVH
- Compte GitHub

---

## 🚀 Étapes (5 blocs)

### 1️⃣ REPLIT → GITHUB (5 min)

Shell Replit :
```bash
git config --global user.name "Votre Nom"
git config --global user.email "votre@email.com"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/VOTRE-USERNAME/keylor-vitrine.git
git push -u origin main
```

### 2️⃣ INSTALLER VPS (10 min)

SSH sur VPS :
```bash
# Télécharger et lancer le script
curl -o setup.sh https://raw.githubusercontent.com/VOTRE-USERNAME/keylor-vitrine/main/scripts/setup-vps.sh
chmod +x setup.sh
sudo ./setup.sh

# Passer en utilisateur keylor
su - keylor

# Cloner le projet
git clone https://github.com/VOTRE-USERNAME/keylor-vitrine.git
cd keylor-vitrine
npm install
npm run build
```

### 3️⃣ BASE DE DONNÉES (5 min)

```bash
# Créer la BDD
sudo -u postgres psql
CREATE DATABASE keylor_db;
CREATE USER keylor WITH PASSWORD 'VotreMotDePasse123';
GRANT ALL PRIVILEGES ON DATABASE keylor_db TO keylor;
\q

# Importer vos données (si vous avez un export)
psql -U keylor -d keylor_db -f votre-export.sql
```

### 4️⃣ CONFIGURER (5 min)

```bash
# Créer .env
cp .env.example .env
nano .env
```

Remplir :
```env
DATABASE_URL=postgresql://keylor:VotreMotDePasse123@localhost:5432/keylor_db
DEFAULT_OBJECT_STORAGE_BUCKET_ID=local
PUBLIC_OBJECT_SEARCH_PATHS=/var/www/keylor/uploads/public
PRIVATE_OBJECT_DIR=/var/www/keylor/uploads/private
INTRANET_SHARED_SECRET=keylor-intranet-secret-2024-shared-upload
RESEND_API_KEY=votre-cle-resend
```

```bash
# Configurer Nginx
sudo cp scripts/nginx-keylor.conf /etc/nginx/sites-available/keylor.fr
sudo ln -s /etc/nginx/sites-available/keylor.fr /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### 5️⃣ LANCER (5 min)

```bash
# Démarrer l'app
pm2 start npm --name "keylor" -- start
pm2 save
pm2 startup

# Pointer le domaine (manager.ovh.com)
# Zone DNS → A → @ → VOTRE-IP-VPS
# Zone DNS → A → www → VOTRE-IP-VPS

# Attendre 5-10 min, puis installer SSL
sudo certbot --nginx -d keylor.fr -d www.keylor.fr
```

---

## ✅ Vérification

```bash
pm2 status                    # App doit être "online"
sudo systemctl status nginx   # Nginx doit être "active"
curl https://keylor.fr        # Doit afficher du HTML
```

**Ouvrir dans un navigateur** : https://keylor.fr 🎉

---

## 🔄 Mises à jour futures

Sur Replit (après modifications) :
```bash
git add .
git commit -m "Description"
git push
```

Sur VPS :
```bash
cd /home/keylor/keylor-vitrine
./scripts/deploy-update.sh
```

---

## 📖 Guide complet

Pour plus de détails, consultez **GUIDE-DEPLOY-VPS.md**

---

## 🆘 Problèmes ?

**Site inaccessible** :
```bash
pm2 restart keylor
sudo systemctl restart nginx
```

**Erreur BDD** :
```bash
sudo systemctl status postgresql
psql -U keylor -d keylor_db -c "SELECT 1;"
```

**Logs** :
```bash
pm2 logs keylor
sudo tail -f /var/log/nginx/error.log
```
