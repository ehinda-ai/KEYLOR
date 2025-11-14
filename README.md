# 🏡 KEYLOR - Site Vitrine

Site vitrine national pour l'agence immobilière KEYLOR, spécialisée dans la gestion immobilière sur mesure.

## 📋 Vue d'ensemble

**KEYLOR.fr** est le site public de l'agence, permettant aux visiteurs de :
- Consulter les biens immobiliers (vente, location, location saisonnière)
- Rechercher des propriétés avec filtres avancés
- Visualiser les biens sur une carte interactive
- Réserver des visites et locations saisonnières
- Estimer la valeur de leur bien
- Créer des alertes personnalisées

## 🏗️ Architecture

### Stack technique
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express
- **Base de données**: PostgreSQL (partagée avec l'intranet en **lecture seule**)
- **Styling**: Tailwind CSS + Shadcn UI
- **State Management**: TanStack Query (React Query)
- **Formulaires**: React Hook Form + Zod
- **Carte**: React Leaflet
- **Object Storage**: Replit Object Storage / Google Cloud Storage

### Design
- **Palette**: Bleu marine (#202c45), Or (#aa8a53), Beige (#e7e5e2)
- **Typographie**: Cormorant Garamond (headings), Poppins (body)
- **Mode**: Light/Dark avec persistence

## 🔗 Relation avec l'intranet

Ce projet fonctionne **en tandem** avec [keylor-intranet](https://github.com/votre-username/keylor-intranet) :

| Aspect | Vitrine (keylor.fr) | Intranet |
|--------|---------------------|----------|
| Base de données | **Lecture seule** | **Lecture + Écriture** |
| Object Storage | Reçoit les images | Upload les images |
| Authentification | Non | Oui (admin) |
| Objectif | Site public | Gestion back-office |

**Important** : Les deux applications partagent :
- La même base de données PostgreSQL
- Le secret `INTRANET_SHARED_SECRET` pour les uploads d'images

## 📦 Installation locale

### Prérequis
- Node.js 20+
- PostgreSQL 14+
- npm ou yarn

### Étapes

1. **Cloner le projet**
```bash
git clone https://github.com/votre-username/keylor.git
cd keylor
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**
```bash
cp .env.example .env
# Puis éditez .env avec vos vraies valeurs
```

4. **Configurer la base de données**
```bash
# La base de données doit déjà exister (créée par l'intranet)
# Vérifier la connexion
npm run db:check
```

5. **Lancer le serveur de développement**
```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5000`

## 🚀 Scripts disponibles

```bash
npm run dev          # Lancer en mode développement
npm run build        # Compiler pour production
npm run start        # Lancer en mode production
npm run db:check     # Vérifier la connexion DB
```

## 📂 Structure du projet

```
keylor/
├── client/              # Application React (frontend)
│   ├── src/
│   │   ├── components/  # Composants réutilisables
│   │   ├── pages/       # Pages de l'application
│   │   ├── lib/         # Utilitaires et configuration
│   │   └── hooks/       # Hooks React personnalisés
│   └── index.html
│
├── server/              # Backend Express
│   ├── routes.ts        # Routes API
│   ├── storage.ts       # Interface de stockage (read-only)
│   ├── objectStorage.ts # Gestion Object Storage
│   └── index.ts         # Point d'entrée
│
├── shared/              # Code partagé frontend/backend
│   └── schema.ts        # Schémas Drizzle + Zod
│
└── attached_assets/     # Assets (non committé)
```

## 🔐 Variables d'environnement essentielles

Consultez `.env.example` pour la liste complète. Les plus importantes :

```env
# Base de données (PARTAGÉE avec l'intranet)
DATABASE_URL=postgresql://...

# Object Storage (pour les images des biens)
DEFAULT_OBJECT_STORAGE_BUCKET_ID=...

# Secret partagé (DOIT être identique à l'intranet)
INTRANET_SHARED_SECRET=...

# Email (Resend ou Mailjet)
RESEND_API_KEY=...
```

## 🌐 Déploiement

Consultez [DEPLOYMENT.md](./DEPLOYMENT.md) pour des guides détaillés sur :
- Déploiement sur VPS (OVH, Scaleway, DigitalOcean)
- Déploiement avec Docker
- Déploiement sur plateformes cloud (Railway, Render, Fly.io)
- Configuration SSL/TLS avec Let's Encrypt

## 🧪 Tests

```bash
# Lancer les tests (à venir)
npm test
```

## 📝 Notes importantes

### Mode lecture seule
La vitrine accède à la base de données en **lecture seule**. Toutes les modifications (création/modification de biens, gestion des réservations, etc.) se font via l'intranet.

### Upload d'images
Les images sont uploadées depuis l'intranet vers l'Object Storage de keylor.fr via l'endpoint sécurisé `/api/shared/upload/get-url`.

### Synchronisation
Les données affichées sur la vitrine sont automatiquement synchronisées avec l'intranet car ils partagent la même base de données.

## 🛠️ Technologies utilisées

- [React](https://react.dev/) - Framework UI
- [TypeScript](https://www.typescriptlang.org/) - Typage statique
- [Vite](https://vitejs.dev/) - Build tool
- [Express](https://expressjs.com/) - Backend framework
- [Drizzle ORM](https://orm.drizzle.team/) - ORM TypeScript
- [TanStack Query](https://tanstack.com/query) - Data fetching
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Shadcn UI](https://ui.shadcn.com/) - Composants UI
- [React Leaflet](https://react-leaflet.js.org/) - Cartes interactives
- [Zod](https://zod.dev/) - Validation de schémas

## 📄 Licence

Projet privé - Tous droits réservés © KEYLOR 2024

## 👥 Support

Pour toute question ou assistance :
- 📧 Email: contact@keylor.fr
- 📞 Téléphone: 01 23 45 67 89
