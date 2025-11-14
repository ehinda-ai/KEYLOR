# 🔧 Guide de Configuration : Intranet Keylor

Ce guide vous explique comment configurer votre projet **intranet.keylor.fr** pour qu'il fonctionne en tant qu'interface d'administration autonome, tout en partageant la base de données avec le site vitrine **www.keylor.fr**.

---

## 📋 Vue d'ensemble de l'architecture

```
┌─────────────────────────────────┐
│   www.keylor.fr (VITRINE)       │
│   - Pages publiques uniquement  │
│   - Routes GET (lecture seule)  │
│   - Pas d'authentification      │
└──────────────┬──────────────────┘
               │
               │ DATABASE_URL (partagée)
               │
┌──────────────▼──────────────────┐
│ www.intranet.keylor.fr (ADMIN)  │
│   - Authentification requise    │
│   - Toutes les routes CRUD      │
│   - Gestion complète données    │
│   - Envoi emails (Mailjet)      │
└─────────────────────────────────┘
```

**Principe :** Les deux projets partagent la même base PostgreSQL. Toutes les modifications faites dans l'intranet sont immédiatement visibles sur le site vitrine.

---

## ✅ ÉTAPE 1 : Configuration des Secrets

Dans votre projet **intranet.keylor.fr** sur Replit, ajoutez ces secrets (onglet "Secrets" dans la barre latérale) :

### Secrets de Base de Données (OBLIGATOIRES)
Copiez ces valeurs EXACTES depuis le projet keylor.fr :

```
DATABASE_URL=<valeur du projet keylor.fr>
PGHOST=<valeur du projet keylor.fr>
PGUSER=<valeur du projet keylor.fr>
PGPASSWORD=<valeur du projet keylor.fr>
PGDATABASE=<valeur du projet keylor.fr>
PGPORT=<valeur du projet keylor.fr>
```

⚠️ **IMPORTANT :** Ces valeurs DOIVENT être IDENTIQUES entre les deux projets pour partager la même base de données.

### Secrets Email Mailjet (OBLIGATOIRES)
```
MAILJET_API_KEY=<valeur du projet keylor.fr>
MAILJET_SECRET_KEY=<valeur du projet keylor.fr>
```

### Secrets Object Storage (si utilisés)
```
DEFAULT_OBJECT_STORAGE_BUCKET_ID=<valeur du projet keylor.fr>
PUBLIC_OBJECT_SEARCH_PATHS=<valeur du projet keylor.fr>
PRIVATE_OBJECT_DIR=<valeur du projet keylor.fr>
```

---

## ✅ ÉTAPE 2 : Nettoyer l'Intranet (Supprimer les Pages Publiques)

Le projet intranet est une copie complète de keylor.fr. Vous devez **supprimer toutes les pages publiques** pour ne garder que l'administration.

### Pages à SUPPRIMER dans `client/src/pages/` :
```bash
❌ home.tsx              # Page d'accueil publique
❌ vendre.tsx            # Page "Vendre votre bien"
❌ gestion-location.tsx  # Page "Gestion locative"
❌ nos-offres.tsx        # Catalogue propriétés publiques
❌ property-detail.tsx   # Détail propriété public
❌ contact.tsx           # Formulaire contact public
❌ estimation-ia.tsx     # Estimation IA publique
❌ bareme.tsx            # Barème honoraires public
❌ rendez-vous.tsx       # Prise RDV publique
```

### Pages à CONSERVER dans `client/src/pages/` :
```bash
✅ admin.tsx             # Interface administration
✅ login.tsx             # Page de connexion
✅ not-found.tsx         # Page 404
```

### Commandes pour supprimer les pages publiques :
```bash
cd client/src/pages
rm home.tsx vendre.tsx gestion-location.tsx nos-offres.tsx property-detail.tsx contact.tsx estimation-ia.tsx bareme.tsx rendez-vous.tsx
```

---

## ✅ ÉTAPE 3 : Modifier le Router (App.tsx)

Ouvrez `client/src/App.tsx` et **supprimez toutes les routes publiques**.

### AVANT (avec toutes les routes) :
```tsx
<Switch>
  <Route path="/" component={Home}/>
  <Route path="/vendre" component={Vendre}/>
  <Route path="/gestion-location" component={GestionLocation}/>
  <Route path="/nos-offres" component={NosOffres}/>
  <Route path="/property/:id" component={PropertyDetail}/>
  <Route path="/contact" component={Contact}/>
  <Route path="/estimation" component={EstimationIA}/>
  <Route path="/bareme" component={Bareme}/>
  <Route path="/rendez-vous" component={RendezVous}/>
  <Route path="/login" component={Login}/>
  <Route path="/admin" component={Admin}/>
  <Route component={NotFound} />
</Switch>
```

### APRÈS (intranet uniquement) :
```tsx
<Switch>
  <Route path="/" component={Admin}/>
  <Route path="/login" component={Login}/>
  <Route component={NotFound} />
</Switch>
```

⚠️ **Note :** La route `/` redirige directement vers l'admin. Le login protègera l'accès.

---

## ✅ ÉTAPE 4 : Supprimer les Composants Publics Inutilisés

Ces composants ne sont plus nécessaires dans l'intranet. Vous pouvez les supprimer pour alléger le projet :

### Dans `client/src/components/` :
```bash
❌ navbar.tsx                    # Navigation publique
❌ hero.tsx                      # Section hero page accueil
❌ property-card.tsx             # Carte propriété publique
❌ appointment-form.tsx          # Formulaire RDV public
❌ contact-form.tsx              # Formulaire contact public
❌ estimation-form.tsx           # Formulaire estimation public
```

⚠️ **À garder :** Les composants d'administration comme `AppointmentsCalendar.tsx`, etc.

---

## ✅ ÉTAPE 5 : Vérifier les Routes Backend

Le fichier `server/routes.ts` dans l'intranet doit contenir **TOUTES les routes** (GET, POST, PATCH, DELETE).

✅ **Aucune modification n'est nécessaire** - le fichier est déjà complet dans la copie.

---

## ✅ ÉTAPE 6 : Tester la Configuration

### 1. Démarrer l'intranet
```bash
npm run dev
```

### 2. Se connecter
- Accédez à votre URL Replit (ex: `https://<votre-repl>.replit.dev`)
- Connectez-vous avec les identifiants admin

### 3. Tester les fonctionnalités
Vérifiez que vous pouvez :
- ✅ Voir toutes les propriétés
- ✅ Créer/modifier/supprimer des propriétés
- ✅ Gérer les rendez-vous
- ✅ Gérer les réservations saisonnières
- ✅ Modifier les barèmes, images hero, carrousel
- ✅ Envoyer des emails (confirmation RDV, etc.)

### 4. Vérifier la synchronisation
- Modifiez une propriété dans l'intranet
- Allez sur www.keylor.fr
- ✅ La modification doit apparaître instantanément

---

## ✅ ÉTAPE 7 : Configuration DNS (Domaine Personnalisé)

Pour que votre intranet soit accessible via **intranet.keylor.fr** :

### Sur Replit :
1. Allez dans les **Settings** de votre projet intranet
2. Section **Domains**
3. Cliquez sur **Link a domain**
4. Entrez : `intranet.keylor.fr`

### Chez votre registrar de domaine (OVH, Gandi, etc.) :
Ajoutez un enregistrement DNS de type **CNAME** :

```
Type: CNAME
Nom: intranet
Valeur: <votre-url-replit>.replit.dev
TTL: 3600
```

⏱️ **Délai de propagation :** 1 à 24h selon votre registrar

---

## 🎯 Résumé : Projet Vitrine vs Intranet

| Fonctionnalité | www.keylor.fr (Vitrine) | intranet.keylor.fr (Admin) |
|---|---|---|
| **Pages publiques** | ✅ Toutes | ❌ Aucune |
| **Interface admin** | ❌ Supprimée | ✅ Complète |
| **Authentification** | ❌ Non | ✅ Obligatoire |
| **Routes GET** | ✅ Lecture seule | ✅ Lecture complète |
| **Routes POST/PATCH/DELETE** | ❌ Supprimées | ✅ Toutes |
| **Envoi emails** | ❌ Non | ✅ Mailjet |
| **Base de données** | 🔗 Partagée (lecture) | 🔗 Partagée (lecture + écriture) |

---

## 🆘 En cas de problème

### Erreur de connexion DB
- Vérifiez que `DATABASE_URL` est identique entre les deux projets
- Les 6 variables PG* doivent toutes correspondre

### Les modifications ne s'affichent pas sur keylor.fr
- Vérifiez que les deux projets utilisent bien la même `DATABASE_URL`
- Rafraîchissez le cache du navigateur (Ctrl+Shift+R)

### Emails ne partent pas
- Vérifiez `MAILJET_API_KEY` et `MAILJET_SECRET_KEY`
- Les secrets doivent être identiques au projet vitrine

---

## ✅ Checklist Finale

Avant de considérer la migration terminée :

- [ ] Tous les secrets sont configurés dans l'intranet
- [ ] Les pages publiques sont supprimées
- [ ] Le router (App.tsx) ne contient que `/` (admin) et `/login`
- [ ] L'intranet démarre sans erreur
- [ ] La connexion admin fonctionne
- [ ] Les modifications dans l'intranet apparaissent sur keylor.fr
- [ ] Les emails partent correctement
- [ ] Le domaine `intranet.keylor.fr` est configuré (DNS)

---

**🎉 Félicitations !** Votre infrastructure est maintenant séparée en deux projets autonomes mais interconnectés.
