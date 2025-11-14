CREATE TABLE "appointments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" varchar NOT NULL,
	"nom" text NOT NULL,
	"email" text NOT NULL,
	"telephone" text NOT NULL,
	"date" text NOT NULL,
	"heure" text NOT NULL,
	"message" text,
	"consent_rgpd" boolean DEFAULT false NOT NULL,
	"statut" text DEFAULT 'en_attente' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nom" text NOT NULL,
	"email" text NOT NULL,
	"telephone" text NOT NULL,
	"sujet" text NOT NULL,
	"message" text NOT NULL,
	"type" text NOT NULL,
	"property_id" varchar,
	"consent_rgpd" boolean DEFAULT false NOT NULL,
	"statut" text DEFAULT 'nouveau' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "estimations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"nom" text NOT NULL,
	"email" text NOT NULL,
	"telephone" text NOT NULL,
	"adresse" text NOT NULL,
	"type_propriete" text NOT NULL,
	"surface" integer NOT NULL,
	"pieces" integer,
	"chambres" integer,
	"annee_construction" integer,
	"etat" text,
	"estimation_auto" numeric(12, 2),
	"consent_rgpd" boolean DEFAULT false NOT NULL,
	"statut" text DEFAULT 'en_attente' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loan_simulations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"montant_pret" numeric(12, 2) NOT NULL,
	"taux_interet" numeric(5, 2) NOT NULL,
	"duree_annees" integer NOT NULL,
	"apport" numeric(12, 2),
	"nom" text NOT NULL,
	"email" text NOT NULL,
	"telephone" text NOT NULL,
	"mensualite" numeric(12, 2),
	"cout_total" numeric(12, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pricing_scales" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"categorie" text,
	"nom" text NOT NULL,
	"description" text,
	"tranche_min" numeric(12, 2),
	"tranche_max" numeric(12, 2),
	"honoraires" numeric(12, 2),
	"taux_pourcentage" numeric(5, 2),
	"unite" text,
	"minimum" numeric(12, 2),
	"annee" integer NOT NULL,
	"ordre" integer DEFAULT 0 NOT NULL,
	"actif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"titre" text NOT NULL,
	"description" text NOT NULL,
	"type" text NOT NULL,
	"transaction_type" text DEFAULT 'vente' NOT NULL,
	"prix" numeric(12, 2) NOT NULL,
	"surface" integer NOT NULL,
	"pieces" integer,
	"chambres" integer,
	"localisation" text NOT NULL,
	"ville" text NOT NULL,
	"code_postal" text NOT NULL,
	"photos" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"statut" text DEFAULT 'disponible' NOT NULL,
	"dpe" text,
	"ges" text,
	"honoraires" text,
	"montant_honoraires" numeric(12, 2),
	"copropriete" boolean DEFAULT false,
	"nombre_lots" integer,
	"charges_annuelles" numeric(12, 2),
	"taxe_fonciere" numeric(12, 2),
	"annee_construction" integer,
	"prix_basse_saison" numeric(12, 2),
	"prix_moyenne_saison" numeric(12, 2),
	"prix_haute_saison" numeric(12, 2),
	"depot_garantie" numeric(12, 2),
	"taxe_sejour" numeric(12, 2),
	"personnes_max" integer,
	"animaux_acceptes" boolean DEFAULT false,
	"fumeur_accepte" boolean DEFAULT false,
	"wifi" boolean DEFAULT false,
	"tv" boolean DEFAULT false,
	"lave_linge" boolean DEFAULT false,
	"lave_vaisselle" boolean DEFAULT false,
	"parking" boolean DEFAULT false,
	"piscine" boolean DEFAULT false,
	"climatisation" boolean DEFAULT false,
	"menage_inclus" boolean DEFAULT false,
	"linge_inclus" boolean DEFAULT false,
	"conciergerie_incluse" boolean DEFAULT false,
	"badge" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_alerts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nom" text NOT NULL,
	"email" text NOT NULL,
	"telephone" text NOT NULL,
	"transaction_type" text,
	"type" text,
	"ville" text,
	"prix_max" numeric(12, 2),
	"surface_min" integer,
	"chambres_min" integer,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_slots" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" varchar NOT NULL,
	"date" text NOT NULL,
	"heure_debut" text NOT NULL,
	"heure_fin" text NOT NULL,
	"disponible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
