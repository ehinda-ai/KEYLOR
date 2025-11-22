# 🏗️ Architecture API & Liaisons - KEYLOR

## 1️⃣ Architecture Globale

```
┌─────────────────────────────────────────────────────────────────┐
│                          NAVIGATION                              │
│  Utilisateur → Browser (React) → API Express → PostgreSQL Neon   │
└─────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────┐
│       VITRINE KEYLOR (Vous)         │
│  Replit (Dev) / VPS Ubuntu (Prod)   │
└────────────────────────────────────┘
           ↓
  ┌─────────────────────┐
  │  React Frontend     │
  │  (client/src/*)     │
  └─────────────────────┘
           ↓
  ┌─────────────────────────────────────────┐
  │  Express.js Backend (server/*)          │
  │  - GET /api/properties                  │
  │  - GET /api/hero-images                 │
  │  - POST /api/contact (formulaire)       │
  │  - etc.                                 │
  └─────────────────────────────────────────┘
           ↓
  ┌─────────────────────────────────────────┐
  │  PostgreSQL Neon (BD Partagée)          │
  │  neondb_owner@ep-wild-truth-...         │
  │  - properties                           │
  │  - hero_images                          │
  │  - contact_carousel_images              │
  │  - sessions                             │
  └─────────────────────────────────────────┘
```

---

## 2️⃣ Services Externes Connectés

```
KEYLOR (Vitrine) ← → API Externes
                 │
        ┌────────┼────────┬────────┬──────────┐
        │        │        │        │          │
        ↓        ↓        ↓        ↓          ↓
    Neon   Mailjet   OpenAI  OpenRoute  Images
     DB     (Email)    (IA)   Service   Unsplash
                              (Routing)
```

### Service 1 : PostgreSQL Neon
**URL** : `postgresql://neondb_owner:npg_7OTkZdBsj6gu@ep-wild-truth-afzlpxog.c-2.us-west-2.aws.neon.tech/neondb`
**Utilisé pour** :
- Stockage annonces (properties)
- Images carrousels (hero_images)
- Sessions utilisateur
- Données administrateur

**Accès depuis VPS** : ✅ SSL direct

### Service 2 : Mailjet
**Type** : Email transactionnel
**Utilisé pour** :
- Confirmations de réservation
- Notifications administrateur
- Confirmation de contact

**Variables env** :
```
MAILJET_API_KEY=<api_key>
MAILJET_SECRET_KEY=<secret_key>
```

### Service 3 : OpenAI
**Type** : Intelligence Artificielle
**Utilisé pour** :
- Chatbot client
- Analyses descriptions

**Variables env** :
```
AI_INTEGRATIONS_OPENAI_API_KEY=<api_key>
AI_INTEGRATIONS_OPENAI_BASE_URL=<url>
```

### Service 4 : OpenRouteService
**Type** : Calcul distances
**Utilisé pour** :
- Temps trajet depuis annonce
- Calculs géographiques

**Variables env** :
```
OPENROUTESERVICE_API_KEY=<api_key>
```

### Service 5 : Images Annonces
**Replit (Dev)** : `@google-cloud/storage` → Replit bucket
**VPS (Prod)** : Système fichiers `/var/www/keylor/storage/`

---

## 3️⃣ Routes API Vitrine

```
GET  /api/properties                 → Toutes annonces (BD)
GET  /api/properties/:id             → Détail annonce
GET  /api/properties?type=location   → Filtrées par type
GET  /api/hero-images                → Images carrousel
GET  /api/contact-carousel-images    → Images carrousel contact
GET  /api/social-links               → Liens réseaux sociaux
GET  /api/pricing-scales             → Barèmes
GET  /api/client-reviews             → Avis clients
GET  /api/contact-info               → Infos contact

POST /api/contacts                   → Soumettre contact
POST /api/property-alerts            → Créer alerte propriété
POST /api/appointments               → Demander visite
POST /api/seasonal-booking-requests  → Réserver location saisonnière
```

---

## 4️⃣ Flux de Données : Annonce Ajoutée → Vitrine

```
JOUR 1 : Vous ajoutez une annonce dans INTRANET
─────────────────────────────────────────────────
Intranet (5001)
  ↓
  Ajoute propriété dans PostgreSQL Neon
    INSERT INTO properties (titre, photos, ...)
  ↓
PostgreSQL Neon (BD Partagée)
  ↓
  Propriété sauvegardée
  

JOUR 1 : Vitrine la récupère (Automatique)
──────────────────────────────────────────
Vitrine (5000)
  ↓
  GET /api/properties
  ↓
  Drizzle ORM lit PostgreSQL Neon
  ↓
  Retourne JSON
  ↓
React Frontend
  ↓
  Affiche dans "Nos offres"
  ↓
Utilisateur voit l'annonce ✅
```

**Délai** : < 1 seconde après ajout dans intranet

---

## 5️⃣ Flux Images

### En Développement (Replit)
```
Utilisateur upload photo dans Intranet
  ↓
@google-cloud/storage (Replit Object Storage)
  ↓
Sauvegardée : /objects/uploads/uuid.jpg
  ↓
Vitrine récupère : resolveImageUrl()
  ↓
En dev : https://keylor-intranet-Keyvalor.replit.app/objects/uploads/uuid.jpg
  ↓
Utilisateur voit image ✅ (si intranet expose /objects/)
```

### En Production (VPS)
```
Utilisateur upload photo dans Intranet
  ↓
Fichier système : /var/www/keylor/storage/uploads/uuid.jpg
  ↓
Vitrine récupère : resolveImageUrl()
  ↓
Chemin : /storage/uploads/uuid.jpg
  ↓
Nginx (VPS) sert : /var/www/keylor/storage/uploads/uuid.jpg
  ↓
Utilisateur voit image ✅
```

---

## 6️⃣ Liaisons Base de Données

### Tables Principales

```
properties
├── id (UUID primary)
├── titre
├── description
├── photos (array JSON) → Chemins images
├── prix
├── ville
├── latitude / longitude
├── type (appartement, maison)
├── transactionType (vente, location, location_saisonniere)
└── ... (30+ colonnes)

hero_images
├── id (UUID primary)
├── imageUrl → Chemin ou URL Unsplash
├── titre
└── ordre

contact_carousel_images
├── id (UUID primary)
├── imageUrl → Chemin ou URL Unsplash
└── titre

seasonal_booking_requests
├── id
├── propertyId → FK properties
├── status (pending, confirmed, refused, cancelled)
└── ...
```

### Synchronisation BD

```
Intranet (même DB)
  ↓ PostgreSQL Neon
  ↓
Vitrine (même DB)
  ↓
Lecture-seule (vitrine)

Toute modification dans intranet 
→ Immédiatement visible dans vitrine ✅
```

---

## 7️⃣ Stack Technologique

### Frontend
```
React 18
  ↓
React Query (TanStack)
  ↓
Wouter (Routing)
  ↓
Tailwind CSS + Shadcn
  ↓
Vite (Build)
```

### Backend
```
Node.js 20
  ↓
Express.js
  ↓
Drizzle ORM
  ↓
PostgreSQL (via pg)
  ↓
Mailjet, OpenAI, OpenRouteService
```

### Infrastructure
```
Replit (Dev)
  - Vite dev server (5000)
  - HMR websockets
  
VPS Ubuntu (Prod)
  - Nginx (reverse proxy)
  - PM2 (process manager)
  - Node.js Express (5000 internal)
  - Let's Encrypt SSL
```

---

## 8️⃣ Variables d'Environnement

### ✅ Portables (Replit → VPS)
```
DATABASE_URL              → PostgreSQL Neon
MAILJET_API_KEY           → Mailjet
MAILJET_SECRET_KEY        → Mailjet
OPENROUTESERVICE_API_KEY  → OpenRouteService
AI_INTEGRATIONS_OPENAI_API_KEY    → OpenAI
AI_INTEGRATIONS_OPENAI_BASE_URL   → OpenAI
SESSION_SECRET            → À générer
ADMIN_USERNAME            → À définir
ADMIN_PASSWORD            → À définir
PORT                      → 5000
NODE_ENV                  → production
```

### ❌ Spécifiques Replit (À ignorer en prod)
```
REPL_ID                   → Détecté automatiquement absent
PUBLIC_OBJECT_SEARCH_PATHS → /storage/public (VPS)
PRIVATE_OBJECT_DIR        → /storage/private (VPS)
DEFAULT_OBJECT_STORAGE_BUCKET_ID → Unused (VPS)
INTRANET_SHARED_SECRET    → Entre vitrine & intranet
```

---

## 9️⃣ Sécurité & Authentification

### Authentification Actuelle
```
Vitrine (Publique)
  - Aucune auth requise pour consultation
  - Formulaires publics (contact, réservation)
  - Pas de login utilisateur
  
Admin (Pas concerné vitrine)
  - Login/Password (backend only)
```

### SSL/TLS
```
Replit      → HTTPS automatique (Replit CDN)
VPS Ubuntu  → Let's Encrypt (gratuit)
BD Neon     → SSL natif
API externes → HTTPS
```

---

## 🔟 Monitoring & Logs

### Replit Dev
```
Logs Express  → Console terminal
Logs React    → Browser console
Logs Vite     → Terminal + Browser
```

### VPS Prod
```
PM2 logs      → pm2 logs keylor-vitrine
Nginx logs    → /var/log/nginx/
App logs      → stdout/stderr vers fichier
Session logs  → PostgreSQL
```

---

## Schéma Complet Interaction

```
┌──────────────────────────────────────────────────────────────────────┐
│                       UTILISATEUR (Browser)                          │
└──────────────────────────────────────────────────────────────────────┘
                              ↓ HTTPS
        ┌─────────────────────────────────────┐
        │    NGINX (VPS Ubuntu Port 443)      │
        │  • SSL/TLS termination              │
        │  • Reverse proxy vers Express       │
        │  • Sert static files                │
        │  • Sert /storage/public/            │
        └─────────────────────────────────────┘
                              ↓
        ┌──────────────────────────────────────┐
        │  Express.js (VPS Port 5000)          │
        │  • API /api/*                        │
        │  • Sessions                          │
        │  • Upload gestion                    │
        └──────────────────────────────────────┘
                    ↓ (Drizzle ORM)
        ┌──────────────────────────────────────┐
        │   PostgreSQL Neon (Cloud)            │
        │   • Properties                       │
        │   • Hero images                      │
        │   • Contact images                   │
        │   • Sessions                         │
        └──────────────────────────────────────┘
                ↓ (External APIs)
    ┌───────────────────────────────────────┐
    │   Mailjet    OpenAI    OpenRoute      │
    │   (Email)    (IA)      Service        │
    │                        (Routing)      │
    └───────────────────────────────────────┘
```

---

## 📝 Résumé pour Migration

| Élément | Replit | VPS | Action |
|---------|--------|-----|--------|
| Code | Vite dev + Express | Node/Nginx | Copy files |
| BD | PostgreSQL Neon | PostgreSQL Neon | Aucune |
| Images | @google-cloud/storage | Fichiers /var/www | Migrer files |
| Email | Mailjet | Mailjet | Copy API keys |
| IA | OpenAI | OpenAI | Copy API keys |
| Routing | OpenRouteService | OpenRouteService | Copy API keys |
| SSL | Auto Replit | Let's Encrypt | Setup |
| PM2 | N/A | Process manager | Install & config |
