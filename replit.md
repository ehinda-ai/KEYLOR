# KEYLOR - Gestion Immobilière Sur Mesure

## Overview
KEYLOR is a unified real estate platform combining public vitrine + private admin dashboard. Built with React, TypeScript, Express, and Tailwind CSS, it features an elegant design (black, gold, off-white) to highlight personalized real estate services.

**Architecture**: MERGED - Single app (vitrine + intranet admin combined)
- Public routes: `/` (homepage), `/nos-offres` (listings), `/contact`, etc.
- Admin routes: `/admin/mon-compte` (private dashboard with password auth)
- Database: PostgreSQL Neon (shared between vitrine and admin)
- Images: Will be served from VPS `/var/www/keylor/storage/` (no Object Storage needed)

**Important positioning**: 
- Agency is in STARTUP phase - no mentions of "recognized expertise", years of experience, or fake statistics
- National agency (NOT Paris-focused, NOT "digital agency" to avoid limiting prospecting)
- Initial focus: Drôme and Ardèche regions, expanding nationwide
- Messaging must stay generic to capture leads everywhere

The primary business goal is lead generation through strategic capture of sales and rental management mandates.

## User Preferences
- Prefer clear and concise communication
- Focus on high-level architecture and key features
- Prioritize strategic lead generation points and user conversion flows
- Do NOT modify shared/schema.ts unless absolutely necessary
- User needs PRAGMATIC solutions, not complex implementations

**Content guidelines**:
- NO "expertise reconnue" / "recognized expertise" (agency is starting)
- NO specific statistics (95% occupation rate, 500 clients, 15 years experience)
- NO "spécialiste" / "expert" claims
- NO luxury/prestige terminology: "prestige", "exception", "luxe", "exclusive", "haut de gamme" (blocks prospecting)
- NO "agence digitale" / "digital agency" positioning (limits prospecting scope)
- Keep geographic mentions broad: "Drôme, Ardèche et toute la France" without being too specific
- Goal: capture leads nationwide while mentioning Drôme/Ardèche as starting region

**Recent Major Changes (Nov 22, 2025)**:
- ✅ MERGED intranet into KEYLOR vitrine (single app)
- ✅ Created `/admin/mon-compte` page with 8 admin modules
- ✅ Implemented admin auth routes (/api/admin/login, logout, check-auth)
- ✅ Created CRUD components: PropertiesAdmin, AppointmentsAdmin, ContactsAdmin, BookingsAdmin
- ✅ Created availability managers: VisitAvailabilityAdmin, SeasonalAvailabilityAdmin
- ✅ Integrated HeroImagesAdmin, ContactCarouselAdmin, PricingScalesAdmin, SocialReviewsAdmin
- ✅ All TypeScript checks pass (0 errors), Build: 144KB

## System Architecture

### UNIFIED APP STRUCTURE (Post-Merge, Nov 22)
```
KEYLOR (Single App)
├── PUBLIC ROUTES (vitrine)
│   ├── GET /                              Homepage
│   ├── GET /nos-offres                    Property listings (achat/location)
│   ├── GET /vendre                        Sell CTA page
│   ├── GET /gestion-location              Rental management CTA
│   ├── GET /estimation-ia                 AI property estimator
│   ├── GET /contact                       Contact form
│   └── GET /proprietes/:id                Property detail page
│
├── ADMIN ROUTES (private - password auth)
│   ├── GET  /admin/mon-compte             Dashboard (all modules in one page)
│   ├── POST /api/admin/login              Password authentication
│   ├── POST /api/admin/logout             Logout
│   └── GET  /api/admin/check-auth         Auth status
│
└── DATA ROUTES (public API)
    ├── /api/properties                    CRUD properties
    ├── /api/appointments                  CRUD appointments
    ├── /api/contacts                      CRUD contact form submissions
    ├── /api/seasonal-booking-requests     CRUD seasonal booking requests
    ├── /api/visit-availabilities          CRUD visit time slots
    ├── /api/seasonal-availabilities       CRUD seasonal availability blocks
    ├── /api/property-alerts               CRUD property alerts
    ├── /api/estimate-ai                   OpenAI property estimation
    ├── /api/hero-images                   CRUD homepage carousel
    ├── /api/contact-carousel-images       CRUD contact carousel
    ├── /api/pricing-scales                CRUD pricing/barèmes
    ├── /api/social-links                  CRUD social media links
    └── /api/client-reviews                CRUD client reviews
```

### Frontend (React + TypeScript)
-   **Framework**: React 18 with Vite
-   **Routing**: Wouter
-   **Styling**: Tailwind CSS + Shadcn UI, supporting Dark/Light mode with persistence.
-   **State Management**: TanStack Query (React Query)
-   **Forms**: React Hook Form with Zod validation.
-   **UI/UX**: Elegant design with refined color palette (black, gold, off-white).
-   **Admin Dashboard**: Single-page interface with 8 tabbed modules (Properties, Appointments, Contacts, Bookings, Images, IA Tools, Settings, Stats)

### Backend (Node.js + Express)
-   **Runtime**: Node.js 20
-   **Framework**: Express.js
-   **Storage**: In-memory storage (MemStorage) - will migrate to PostgreSQL Neon on VPS
-   **Validation**: Zod schemas, with shared TypeScript types between frontend and backend.
-   **Email Service**: Resend + Mailjet for transactional emails (booking confirmations, refusals, cancellations)
-   **AI**: OpenAI integration for property estimations (gpt-4o-mini)

### Feature Specifications (VITRINE)
-   **Strategic Navigation**: Prioritizes "Sell" and "Rental Management" pages for mandate acquisition.
-   **Lead Generation**: Multiple CTAs across site, property estimator form, appointment booking system with admin-managed time slots.
-   **Property Listings**: Unified "Nos offres" page combining achat, location, location saisonnière with advanced filtering.
-   **User Alerts**: Users can create and manage property alerts based on search criteria.
-   **Seasonal Booking System**: Unique confirmation codes, email notifications, minimum stay requirements, admin management interface.

### Feature Specifications (ADMIN DASHBOARD - /admin/mon-compte)
All in ONE private page with 8 tabbed modules:

1. **Tableau de bord** - Statistics (property count, bookings, appointments)
2. **Annonces** - Full CRUD for properties (vente, location, location saisonnière)
3. **Visites** - RDV management + visit time slot configuration (heures, durée visite, marge sécurité)
4. **Contacts** - View/manage contact form submissions
5. **Réservations** - Manage seasonal booking requests (confirm/refuse actions)
6. **Images** - Manage hero carousel + contact carousel images
7. **IA Tools** - Links to OpenAI estimation API + loan simulation calculators
8. **Config** - Barèmes/tarifs, réseaux sociaux, client reviews

### System Design Choices (Post-Merge)
-   **Single App Architecture**: Eliminates sync issues, simplifies deployment, reduces complexity
-   **Password-Protected Admin**: Simple session-based auth (env var: ADMIN_PASSWORD, default: keylor2024)
-   **No Object Storage Needed**: Images stored on VPS `/var/www/keylor/storage/` directly
-   **Shared Database**: One PostgreSQL Neon instance for vitrine + admin (automatic sync)
-   **Future VPS Deployment**: Single PM2 process, one Nginx config, zero complexity
-   **Emphasis on SEO**: Optimized key strategic pages (Sell, Rental Management)
-   **Intelligent Lead Capture**: Multiple forms for estimation and rental applications
-   **Scalable Schemas**: Properties, appointments, time slots, contacts, alerts, seasonal availability
-   **Preparation**: Ready for Hector API integration when needed

## External Dependencies
-   **Styling**: Tailwind CSS, Shadcn UI
-   **Data Fetching**: TanStack Query
-   **Form Management**: React Hook Form, Zod
-   **Icons**: Lucide React, React Icons
-   **Date Manipulation**: Date-fns
-   **AI**: OpenAI (gpt-4o-mini for property estimations)
-   **Email**: Resend + Mailjet for transactional emails
-   **Maps**: Leaflet + OpenRoute Service for routing calculations
-   **PDF**: jsPDF + jsPDF-autotable for document generation
-   **Future Integration**: Hector API (variables defined, integration pending)