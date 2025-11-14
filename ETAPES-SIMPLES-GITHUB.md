# 🎯 Guide Ultra-Simple - Mettre votre code sur GitHub

## Où est le Shell dans Replit ?

1. **Regardez en bas de votre écran Replit**
2. Vous voyez 3 onglets : `Console`, `Shell`, `Secrets`
3. **Cliquez sur l'onglet `Shell`** (celui du milieu)

Vous devriez voir quelque chose comme :
```
~/keylor.fr$ _
```

C'est là qu'on va taper les commandes !

---

## ✋ STOP - Avant de commencer

### Avez-vous créé un dépôt sur GitHub ?

**NON** → Allez d'abord sur https://github.com et :
1. Cliquez sur le **+ en haut à droite**
2. Choisissez **"New repository"**
3. Donnez un nom : `keylor-vitrine`
4. Choisissez **PRIVATE** (important !)
5. **NE COCHEZ RIEN** d'autre
6. Cliquez **"Create repository"**
7. **Gardez cette page ouverte** (vous allez en avoir besoin)

**OUI** → Parfait, continuons !

---

## 📝 Les commandes (une par une)

### ➡️ Commande 1 : Dire votre nom à Git

Dans le **Shell** (en bas), copiez-collez ceci (en mettant VOTRE nom) :

```bash
git config --global user.name "Votre Nom"
```

**Puis appuyez sur ENTRÉE** ⏎

**Exemple** :
```bash
git config --global user.name "Marie Dupont"
```

---

### ➡️ Commande 2 : Dire votre email à Git

Copiez-collez (avec VOTRE email, celui de GitHub) :

```bash
git config --global user.email "votre-email@exemple.com"
```

**Puis appuyez sur ENTRÉE** ⏎

**Exemple** :
```bash
git config --global user.email "marie.dupont@gmail.com"
```

---

### ➡️ Commande 3 : Démarrer Git

Copiez-collez :

```bash
git init
```

**Puis appuyez sur ENTRÉE** ⏎

Vous verrez : `Initialized empty Git repository`
✅ C'est bon !

---

### ➡️ Commande 4 : Ajouter tous vos fichiers

Copiez-collez :

```bash
git add .
```

**Puis appuyez sur ENTRÉE** ⏎

*(Le point `.` signifie "tout")*

---

### ➡️ Commande 5 : VÉRIFICATION IMPORTANTE ⚠️

Copiez-collez :

```bash
git status
```

**Puis appuyez sur ENTRÉE** ⏎

Vous allez voir une liste de fichiers **en vert**.

**VÉRIFIEZ** : Le fichier `.env` **NE DOIT PAS** apparaître !
- ✅ Si vous NE voyez PAS `.env` → Parfait, continuez
- ❌ Si vous VOYEZ `.env` → **ARRÊTEZ**, dites-le moi !

---

### ➡️ Commande 6 : Sauvegarder (faire un "commit")

Copiez-collez :

```bash
git commit -m "Initial commit - KEYLOR Vitrine"
```

**Puis appuyez sur ENTRÉE** ⏎

Ça va défiler plein de lignes : c'est normal !

---

### ➡️ Commande 7 : Préparer la branche

Copiez-collez :

```bash
git branch -M main
```

**Puis appuyez sur ENTRÉE** ⏎

---

### ➡️ Commande 8 : Connecter à votre GitHub

**ATTENTION** : Il faut remplacer `VOTRE-USERNAME` par votre vrai nom d'utilisateur GitHub !

Sur la page GitHub que vous avez gardée ouverte, vous voyez une URL qui ressemble à :
```
https://github.com/marie-dupont/keylor-vitrine.git
```

**Copiez cette URL complète**, puis tapez dans le Shell :

```bash
git remote add origin https://github.com/VOTRE-URL-ICI.git
```

**Puis appuyez sur ENTRÉE** ⏎

**Exemple** :
```bash
git remote add origin https://github.com/marie-dupont/keylor-vitrine.git
```

---

### ➡️ Commande 9 : Envoyer sur GitHub ! 🚀

Copiez-collez :

```bash
git push -u origin main
```

**Puis appuyez sur ENTRÉE** ⏎

**Replit va vous demander de vous connecter à GitHub** :
- Une fenêtre va s'ouvrir
- Connectez-vous avec votre compte GitHub
- Autorisez Replit

Ensuite ça va télécharger... et c'est bon ! ✅

---

## ✅ Vérifier que ça a marché

1. Retournez sur **GitHub.com**
2. Allez sur **votre profil** (cliquez sur votre photo en haut à droite)
3. Cliquez sur **"Your repositories"**
4. Vous devriez voir **keylor-vitrine** ! 🎉

Cliquez dessus, vous verrez tous vos fichiers !

---

## 🆘 En cas de problème

### "git: command not found"
→ Attendez 30 secondes et réessayez (Replit charge Git)

### "Please tell me who you are"
→ Vous avez oublié les commandes 1 et 2 (nom et email)

### "Permission denied"
→ Vérifiez que vous vous êtes bien connecté à GitHub quand Replit l'a demandé

### Autre problème
→ Dites-moi exactement le message d'erreur que vous voyez !

---

## 📞 Besoin d'aide ?

Dites-moi à quelle commande vous êtes bloquée et quel message vous voyez, je vais vous aider ! 😊
