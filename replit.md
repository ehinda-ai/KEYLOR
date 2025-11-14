# KEYLOR - Gestion Immobilière Sur Mesure

## Overview
KEYLOR is a national real estate agency website specializing in tailored property management. Built with React, TypeScript, Express, and Tailwind CSS, it features an elegant design (black, gold, off-white) to highlight personalized real estate services. 

**Important positioning**: 
- Agency is in STARTUP phase - no mentions of "recognized expertise", years of experience, or fake statistics
- National agency (NOT Paris-focused, NOT "digital agency" to avoid limiting prospecting)
- Initial focus: Drôme and Ardèche regions, expanding nationwide
- Messaging must stay generic to capture leads everywhere

The primary business goal is lead generation through strategic capture of sales and rental management mandates.

## User Preferences
I prefer clear and concise communication. Focus on high-level architecture and key features. When making changes, prioritize strategic lead generation points and user conversion flows. Do not make changes to the shared/schema.ts file unless absolutely necessary.

**Content guidelines**:
- NO "expertise reconnue" / "recognized expertise" (agency is starting)
- NO specific statistics (95% occupation rate, 500 clients, 15 years experience)
- NO "spécialiste" / "expert" claims
- NO luxury/prestige terminology: "prestige", "exception", "luxe", "exclusive", "haut de gamme" (blocks prospecting)
- NO "agence digitale" / "digital agency" positioning (limits prospecting scope)
- Keep geographic mentions broad: "Drôme, Ardèche et toute la France" without being too specific
- Goal: capture leads nationwide while mentioning Drôme/Ardèche as starting region

## System Architecture
The project utilizes a client-server architecture.

### Frontend (React + TypeScript)
-   **Framework**: React 18 with Vite
-   **Routing**: Wouter
-   **Styling**: Tailwind CSS + Shadcn UI, supporting Dark/Light mode with persistence.
-   **State Management**: TanStack Query (React Query)
-   **Forms**: React Hook Form with Zod validation.
-   **UI/UX**: Elegant design with a refined color palette (black, gold, off-white). Typography uses Playfair Display for headings and Inter for body text. UI components include cards with subtle hover effects, varied buttons, elegant sliders for filters, and real-time form validation.

### Backend (Node.js + Express)
-   **Runtime**: Node.js 20
-   **Framework**: Express.js
-   **Stockage**: In-memory storage (MemStorage)
-   **Validation**: Zod schemas, with shared TypeScript types between frontend and backend.
-   **Email Service**: Resend for transactional emails (booking confirmations, refusals, cancellations)

### Feature Specifications
-   **Strategic Navigation**: Prioritizes "Sell" and "Rental Management" pages for mandate acquisition.
-   **Lead Generation**: Features multiple CTAs across the site, a comprehensive property estimator form, and a smart appointment booking system with admin-managed time slots.
-   **Property Listings**: Unified "Nos offres" page combining achat, location, and location saisonnière with advanced filtering, detailed property pages with legal mentions, and specific handling for seasonal rentals with weekly pricing.
-   **User Alerts**: Users can create and manage property alerts based on search criteria.
-   **Seasonal Booking System**: Comprehensive reservation management with:
    - Unique confirmation codes for client tracking
    - Email notifications at each stage (request received, confirmed, refused, cancelled)
    - Minimum stay requirements and arrival/departure day/time restrictions per property
    - Admin interface for managing all booking requests with status filtering
    - Client self-service cancellation capability
-   **Admin Interface**: Comprehensive CRUD for properties, availability management (visit slots and seasonal availability), booking request management, and initial setup for future API integrations.

### System Design Choices
-   Emphasis on SEO optimization for key strategic pages (Sell, Rental Management).
-   Intelligent lead capture mechanisms, including specific forms for estimation and rental applications.
-   Scalable data schemas for properties, appointments, time slots, contacts, and property alerts.
-   Unified property browsing experience with smart tab filtering (achat, location, location saisonnière).
-   Adaptive price filtering with transaction-specific ranges (10M€ for vente, 10k€ for locations).
-   Seasonal rental support with weekly pricing (basse/moyenne/haute saison).
-   Preparation for future external API integration (Hector).

## External Dependencies
-   **Styling**: Tailwind CSS, Shadcn UI
-   **Data Fetching**: TanStack Query
-   **Form Management**: React Hook Form, Zod
-   **Icons**: Lucide React
-   **Date Manipulation**: Date-fns
-   **Future Integration**: Hector API (variables defined, integration pending)