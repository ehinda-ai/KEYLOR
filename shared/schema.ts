import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const properties = pgTable("properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  titre: text("titre").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // "appartement", "maison", "terrain", "commercial", "mobilhome"
  transactionType: text("transaction_type").notNull().default('vente'), // "vente", "location", "location_saisonniere"
  prix: decimal("prix", { precision: 12, scale: 2 }).notNull(),
  surface: integer("surface").notNull(), // en m²
  pieces: integer("pieces"), // nombre de pièces
  chambres: integer("chambres"), // nombre de chambres
  numeroRue: text("numero_rue"), // Numéro de rue (privé, pour calcul trajets uniquement)
  localisation: text("localisation").notNull(), // Adresse publique SANS numéro
  ville: text("ville").notNull(),
  codePostal: text("code_postal").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }), // Coordonnées GPS pour la carte
  longitude: decimal("longitude", { precision: 10, scale: 7 }), // Coordonnées GPS pour la carte
  photos: text("photos").array().notNull().default(sql`ARRAY[]::text[]`),
  featured: boolean("featured").notNull().default(false),
  statut: text("statut").notNull().default('disponible'), // "disponible", "vendu", "loué"
  
  // Mentions légales obligatoires
  dpe: text("dpe"), // Classe énergétique: A, B, C, D, E, F, G
  ges: text("ges"), // Classe GES: A, B, C, D, E, F, G
  honoraires: text("honoraires"), // "acquéreur" ou "vendeur"
  montantHonoraires: decimal("montant_honoraires", { precision: 12, scale: 2 }),
  copropriete: boolean("copropriete").default(false),
  nombreLots: integer("nombre_lots"),
  chargesAnnuelles: decimal("charges_annuelles", { precision: 12, scale: 2 }),
  taxeFonciere: decimal("taxe_fonciere", { precision: 12, scale: 2 }),
  anneeConstruction: integer("annee_construction"),
  
  // Champs spécifiques location saisonnière
  prixBasseSaison: decimal("prix_basse_saison", { precision: 12, scale: 2 }),
  prixMoyenneSaison: decimal("prix_moyenne_saison", { precision: 12, scale: 2 }),
  prixHauteSaison: decimal("prix_haute_saison", { precision: 12, scale: 2 }),
  depotGarantie: decimal("depot_garantie", { precision: 12, scale: 2 }),
  taxeSejour: decimal("taxe_sejour", { precision: 12, scale: 2 }),
  personnesMax: integer("personnes_max"),
  animauxAcceptes: boolean("animaux_acceptes").default(false),
  fumeurAccepte: boolean("fumeur_accepte").default(false),
  
  // Équipements (tous optionnels)
  wifi: boolean("wifi").default(false),
  tv: boolean("tv").default(false),
  laveLinge: boolean("lave_linge").default(false),
  laveVaisselle: boolean("lave_vaisselle").default(false),
  parking: boolean("parking").default(false),
  piscine: boolean("piscine").default(false),
  climatisation: boolean("climatisation").default(false),
  chauffage: boolean("chauffage").default(false),
  jardin: boolean("jardin").default(false),
  terrasse: boolean("terrasse").default(false),
  balcon: boolean("balcon").default(false),
  cheminee: boolean("cheminee").default(false),
  barbecue: boolean("barbecue").default(false),
  jacuzzi: boolean("jacuzzi").default(false),
  secheLinge: boolean("seche_linge").default(false),
  fer: boolean("fer").default(false),
  coffre: boolean("coffre").default(false),
  alarme: boolean("alarme").default(false),
  ascenseur: boolean("ascenseur").default(false),
  
  // Services inclus
  menageInclus: boolean("menage_inclus").default(false),
  lingeInclus: boolean("linge_inclus").default(false),
  conciergerieIncluse: boolean("conciergerie_incluse").default(false),
  
  // Badges
  badge: text("badge"), // "exclusivite", "nouveaute", "coup_de_coeur"
  
  // Paramètres de réservation pour location saisonnière
  dureeMinimaleNuits: integer("duree_minimale_nuits").default(1), // nombre minimum de nuitées
  heureArriveeDebut: text("heure_arrivee_debut").default("14:00"), // heure début arrivée (format HH:mm)
  heureArriveeFin: text("heure_arrivee_fin").default("20:00"), // heure fin arrivée
  heureDepartDebut: text("heure_depart_debut").default("08:00"), // heure début départ
  heureDepartFin: text("heure_depart_fin").default("11:00"), // heure fin départ
  joursArriveeAutorises: text("jours_arrivee_autorises").array().default(sql`ARRAY['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']::text[]`), // jours autorisés pour arrivée
  joursDepartAutorises: text("jours_depart_autorises").array().default(sql`ARRAY['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']::text[]`), // jours autorisés pour départ
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  nom: text("nom").notNull(),
  email: text("email").notNull(),
  telephone: text("telephone").notNull(),
  date: text("date").notNull(), // format ISO date
  heure: text("heure").notNull(),
  message: text("message"),
  motif: text("motif").notNull().default('visite_bien'), // "visite_bien", "visite_location", "visite_vente", "rdv_gerer", "rdv_vendre", "rdv_acquereur", "autre"
  consentRGPD: boolean("consent_rgpd").notNull().default(false), // consentement RGPD
  statut: text("statut").notNull().default('en_attente'), // "en_attente", "confirme", "annule"
  delegueA: text("delegue_a"), // Nom de la personne à qui la visite est déléguée
  delegueEmail: text("delegue_email"), // Email de la personne déléguée
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nom: text("nom").notNull(),
  email: text("email").notNull(),
  telephone: text("telephone").notNull(),
  sujet: text("sujet").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // "information", "estimation", "general"
  propertyId: varchar("property_id"), // optionnel, si lié à une propriété
  consentRGPD: boolean("consent_rgpd").notNull().default(false), // consentement RGPD
  statut: text("statut").notNull().default('nouveau'), // "nouveau", "traité"
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  statut: true,
}).extend({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  telephone: z.string().min(10, "Téléphone invalide").regex(/^[\d\s\.\-\+\(\)]+$/, "Format de téléphone invalide"),
  consentRGPD: z.boolean().refine((val) => val === true, {
    message: "Vous devez accepter la politique de confidentialité pour continuer",
  }),
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
  statut: true,
}).extend({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  telephone: z.string().min(10, "Téléphone invalide").regex(/^[\d\s\.\-\+\(\)]+$/, "Format de téléphone invalide"),
  consentRGPD: z.boolean().refine((val) => val === true, {
    message: "Vous devez accepter la politique de confidentialité pour continuer",
  }),
});

export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

// Estimations de prix et de loyer
export const estimations = pgTable("estimations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // "vente" ou "location"
  nom: text("nom").notNull(),
  email: text("email").notNull(),
  telephone: text("telephone").notNull(),
  adresse: text("adresse").notNull(),
  typeProprietePropriete: text("type_propriete").notNull(), // "appartement", "maison", etc.
  surface: integer("surface").notNull(),
  pieces: integer("pieces"),
  chambres: integer("chambres"),
  anneeConstruction: integer("annee_construction"),
  etat: text("etat"), // "neuf", "bon", "à rénover"
  estimationAuto: decimal("estimation_auto", { precision: 12, scale: 2 }), // estimation automatique
  consentRGPD: boolean("consent_rgpd").notNull().default(false), // consentement RGPD
  statut: text("statut").notNull().default('en_attente'), // "en_attente", "traité"
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Simulations de prêt
export const loanSimulations = pgTable("loan_simulations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  montantPret: decimal("montant_pret", { precision: 12, scale: 2 }).notNull(),
  tauxInteret: decimal("taux_interet", { precision: 5, scale: 2 }).notNull(), // en %
  dureeAnnees: integer("duree_annees").notNull(),
  apport: decimal("apport", { precision: 12, scale: 2 }),
  nom: text("nom").notNull(),
  email: text("email").notNull(),
  telephone: text("telephone").notNull(),
  mensualite: decimal("mensualite", { precision: 12, scale: 2 }), // calculée
  coutTotal: decimal("cout_total", { precision: 12, scale: 2 }), // calculé
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEstimationSchema = createInsertSchema(estimations).omit({
  id: true,
  createdAt: true,
  statut: true,
}).extend({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  telephone: z.string().min(10, "Téléphone invalide").regex(/^[\d\s\.\-\+\(\)]+$/, "Format de téléphone invalide"),
  consentRGPD: z.boolean().refine((val) => val === true, {
    message: "Vous devez accepter la politique de confidentialité pour continuer",
  }),
});

export const insertLoanSimulationSchema = createInsertSchema(loanSimulations).omit({
  id: true,
  createdAt: true,
}).extend({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  telephone: z.string().min(10, "Téléphone invalide").regex(/^[\d\s\.\-\+\(\)]+$/, "Format de téléphone invalide"),
});

export type InsertEstimation = z.infer<typeof insertEstimationSchema>;
export type Estimation = typeof estimations.$inferSelect;

export type InsertLoanSimulation = z.infer<typeof insertLoanSimulationSchema>;
export type LoanSimulation = typeof loanSimulations.$inferSelect;

// Disponibilités de visite (système simplifié par jour)
export const visitAvailability = pgTable("visit_availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull(), // format ISO date (YYYY-MM-DD)
  jourSemaine: text("jour_semaine").notNull(), // lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche
  heureDebut: text("heure_debut").notNull(), // Première heure disponible (ex: "09:00")
  heureFin: text("heure_fin").notNull(), // Dernière heure disponible (ex: "18:00")
  intervalleCreneaux: integer("intervalle_creneaux").notNull().default(30), // Intervalle entre créneaux en minutes (15, 30, 45, 60)
  dureeVisite: integer("duree_visite").notNull().default(45), // Durée d'une visite en minutes
  margeSecurite: integer("marge_securite").notNull().default(15), // Marge entre visites en minutes
  actif: boolean("actif").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVisitAvailabilitySchema = createInsertSchema(visitAvailability).omit({
  id: true,
  createdAt: true,
});

export type InsertVisitAvailability = z.infer<typeof insertVisitAvailabilitySchema>;
export type VisitAvailability = typeof visitAvailability.$inferSelect;

// Alertes immobilières
export const propertyAlerts = pgTable("property_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nom: text("nom").notNull(),
  email: text("email").notNull(),
  telephone: text("telephone").notNull(),
  // Critères de recherche
  transactionType: text("transaction_type"), // "vente", "location", "location_saisonniere"
  type: text("type"), // "appartement", "maison", "terrain", "commercial", "mobilhome"
  ville: text("ville"),
  prixMax: decimal("prix_max", { precision: 12, scale: 2 }),
  surfaceMin: integer("surface_min"),
  chambresMin: integer("chambres_min"),
  // Statut de l'alerte
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPropertyAlertSchema = createInsertSchema(propertyAlerts).omit({
  id: true,
  createdAt: true,
}).extend({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  telephone: z.string().min(10, "Téléphone invalide").regex(/^[\d\s\.\-\+\(\)]+$/, "Format de téléphone invalide"),
});

export type InsertPropertyAlert = z.infer<typeof insertPropertyAlertSchema>;
export type PropertyAlert = typeof propertyAlerts.$inferSelect;

// Barèmes tarifaires
export const pricingScales = pgTable("pricing_scales", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // "vente", "location", "location_services"
  categorie: text("categorie"), // "mandat", "zone_alur", "baux_civil", "stationnement", "commercial", etc.
  nom: text("nom").notNull(), // "Mandat Simple", "Zone très tendue", "Baux code civil - Bailleur", etc.
  description: text("description"),
  elementsDifferenciants: text("elements_differenciants").array(), // Liste d'éléments différenciants pour les mandats
  avantagesExclusifs: text("avantages_exclusifs").array(), // Liste d'avantages exclusifs pour Mandat Exclusif
  factureA: text("facture_a"), // "proprietaire", "locataire", "les_deux" - qui paie?
  trancheMin: decimal("tranche_min", { precision: 12, scale: 2 }), // Prix min de la tranche (null = illimité)
  trancheMax: decimal("tranche_max", { precision: 12, scale: 2 }), // Prix max de la tranche (null = illimité)
  honoraires: decimal("honoraires", { precision: 12, scale: 2 }), // Montant fixe en €
  tauxPourcentage: decimal("taux_pourcentage", { precision: 5, scale: 2 }), // Pourcentage
  unite: text("unite"), // "€", "€/m²", "mois_loyer", "%", etc.
  minimum: decimal("minimum", { precision: 12, scale: 2 }), // Minimum de facturation
  annee: integer("annee").notNull(), // Année d'application
  ordre: integer("ordre").notNull().default(0), // Ordre d'affichage
  actif: boolean("actif").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPricingScaleSchema = createInsertSchema(pricingScales).omit({
  id: true,
  createdAt: true,
});

export type InsertPricingScale = z.infer<typeof insertPricingScaleSchema>;
export type PricingScale = typeof pricingScales.$inferSelect;

// Images du carrousel hero sur la page d'accueil
export const heroImages = pgTable("hero_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  imageUrl: text("image_url").notNull(), // URL de l'image
  titre: text("titre"), // Titre affiché sur l'image (optionnel)
  sousTitre: text("sous_titre"), // Sous-titre affiché sur l'image (optionnel)
  ordre: integer("ordre").notNull().default(0), // Ordre d'affichage dans le carrousel
  actif: boolean("actif").notNull().default(true), // Si l'image est active dans le carrousel
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertHeroImageSchema = createInsertSchema(heroImages).omit({
  id: true,
  createdAt: true,
});

export type InsertHeroImage = z.infer<typeof insertHeroImageSchema>;
export type HeroImage = typeof heroImages.$inferSelect;

// Images du carrousel de la page Contact
export const contactCarouselImages = pgTable("contact_carousel_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  imageUrl: text("image_url").notNull(), // URL de l'image
  titre: text("titre"), // Titre affiché sur l'image (optionnel)
  sousTitre: text("sous_titre"), // Sous-titre affiché sur l'image (optionnel)
  ordre: integer("ordre").notNull().default(0), // Ordre d'affichage dans le carrousel
  actif: boolean("actif").notNull().default(true), // Si l'image est active dans le carrousel
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertContactCarouselImageSchema = createInsertSchema(contactCarouselImages).omit({
  id: true,
  createdAt: true,
});

export type InsertContactCarouselImage = z.infer<typeof insertContactCarouselImageSchema>;
export type ContactCarouselImage = typeof contactCarouselImages.$inferSelect;

// Demandes de réservation pour location saisonnière
export const seasonalBookingRequests = pgTable("seasonal_booking_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  confirmationCode: varchar("confirmation_code").notNull().unique(),
  propertyId: varchar("property_id").notNull(),
  guestName: varchar("guest_name").notNull(),
  guestEmail: varchar("guest_email").notNull(),
  guestPhone: varchar("guest_phone").notNull(),
  checkIn: date("check_in").notNull(),
  checkOut: date("check_out").notNull(),
  numAdults: integer("num_adults").notNull(),
  numChildren: integer("num_children").notNull().default(0),
  message: text("message"),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }),
  status: varchar("status").notNull().default('en_attente'), // en_attente, confirmee, refusee, annulee
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSeasonalBookingRequestSchema = createInsertSchema(seasonalBookingRequests).omit({
  id: true,
  confirmationCode: true,
  createdAt: true,
  status: true,
}).extend({
  guestName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  guestEmail: z.string().email("Email invalide"),
  guestPhone: z.string().min(10, "Téléphone invalide"),
});

export type InsertSeasonalBookingRequest = z.infer<typeof insertSeasonalBookingRequestSchema>;
export type SeasonalBookingRequest = typeof seasonalBookingRequests.$inferSelect;

// Disponibilités pour les locations saisonnières (périodes bloquées/réservées)
export const seasonalAvailability = pgTable("seasonal_availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  dateDebut: date("date_debut").notNull(),
  dateFin: date("date_fin").notNull(),
  bloque: boolean("bloque").notNull().default(true), // true = période bloquée (indisponible), false = période disponible
  motif: text("motif").notNull().default('Période bloquée'),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSeasonalAvailabilitySchema = createInsertSchema(seasonalAvailability).omit({
  id: true,
  createdAt: true,
});

export type InsertSeasonalAvailability = z.infer<typeof insertSeasonalAvailabilitySchema>;
export type SeasonalAvailability = typeof seasonalAvailability.$inferSelect;

// Liens vers les réseaux sociaux
export const socialMediaLinks = pgTable("social_media_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nom: text("nom").notNull(), // "Facebook", "Instagram", "LinkedIn", etc.
  plateforme: text("plateforme").notNull(), // "facebook", "instagram", "linkedin", "twitter", "youtube", "tiktok"
  url: text("url").notNull(), // URL complète du profil
  ordre: integer("ordre").notNull().default(0), // Ordre d'affichage
  actif: boolean("actif").notNull().default(true), // Si le lien est actif
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSocialMediaLinkSchema = createInsertSchema(socialMediaLinks).omit({
  id: true,
  createdAt: true,
}).extend({
  url: z.string().url("L'URL doit être valide"),
});

export type InsertSocialMediaLink = z.infer<typeof insertSocialMediaLinkSchema>;
export type SocialMediaLink = typeof socialMediaLinks.$inferSelect;

// Avis clients
export const clientReviews = pgTable("client_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nomComplet: text("nom_complet").notNull(), // Nom complet du client
  photoUrl: text("photo_url"), // URL de la photo du client (optionnelle)
  ville: text("ville"), // Ville du client (optionnelle)
  note: integer("note").notNull(), // Note sur 5
  commentaire: text("commentaire").notNull(), // Avis/témoignage du client
  typeService: text("type_service"), // "vente", "location", "gestion_locative", etc.
  ordre: integer("ordre").notNull().default(0), // Ordre d'affichage dans le carrousel
  actif: boolean("actif").notNull().default(true), // Si l'avis est visible
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertClientReviewSchema = createInsertSchema(clientReviews).omit({
  id: true,
  createdAt: true,
}).extend({
  nomComplet: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  note: z.number().min(1, "La note doit être entre 1 et 5").max(5, "La note doit être entre 1 et 5"),
  commentaire: z.string().min(10, "Le commentaire doit contenir au moins 10 caractères"),
});

export type InsertClientReview = z.infer<typeof insertClientReviewSchema>;
export type ClientReview = typeof clientReviews.$inferSelect;

// Applications de location (étude de dossiers)
export const rentalApplications = pgTable("rental_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(), // Annonce concernée
  propertyTitle: text("property_title").notNull(),
  monthlyRent: decimal("monthly_rent", { precision: 10, scale: 2 }).notNull(), // Loyer mensuel de l'annonce
  
  // Identité
  civilite: text("civilite").notNull(), // M, Mme, Mlle
  nom: text("nom").notNull(),
  prenom: text("prenom").notNull(),
  dateNaissance: text("date_naissance"), // format ISO date
  lieuNaissance: text("lieu_naissance"),
  
  // Contact
  telephone: text("telephone").notNull(),
  email: text("email").notNull(),
  adresseActuelle: text("adresse_actuelle").notNull(),
  
  // Situation familiale
  situationFamiliale: text("situation_familiale"), // Célibataire, Marié, Concubin, PACS, Séparé, Divorcé, Veuf
  nombrePersonnesCharge: integer("nombre_personnes_charge").default(0),
  
  // Situation professionnelle
  profession: text("profession"),
  typeContrat: text("type_contrat"), // CDI, CDD, Autres
  dateEmbauche: text("date_embauche"),
  entreprise: text("entreprise"),
  adresseEntreprise: text("adresse_entreprise"),
  
  // Revenus (montants en euros)
  salaireMensuel: decimal("salaire_mensuel", { precision: 10, scale: 2 }).default("0"),
  allocations: decimal("allocations", { precision: 10, scale: 2 }).default("0"),
  autresRevenus: decimal("autres_revenus", { precision: 10, scale: 2 }).default("0"),
  totalRevenusMenuels: decimal("total_revenus_mensuels", { precision: 10, scale: 2 }).notNull(), // Calculé automatiquement
  
  // Garanties
  typeGarantie: text("type_garantie"), // "caution_solidaire", "visale", "autre"
  garantieDetail: text("garantie_detail"),
  
  // Scoring
  score: integer("score").default(0), // 0-100
  scoreDetail: text("score_detail"), // JSON des critères de scoring
  
  // Solvabilité
  tauxEffort: decimal("taux_effort", { precision: 5, scale: 2 }), // Multiple du loyer (revenus / loyer)
  statutSolvabilite: text("statut_solvabilite"), // "excellent", "bon", "acceptable", "risque"
  
  // Pièces jointes (en base64)
  piecesCandidature: text("pieces_candidature").array().default(sql`ARRAY[]::text[]`), // noms des fichiers
  
  // Suivi
  statut: text("statut").notNull().default('nouveau'), // "nouveau", "en_etude", "demande_pieces", "refuse", "accepte"
  notesAdmin: text("notes_admin"), // Notes libres de l'admin
  
  // Historique emails
  emailsEnvoyes: text("emails_envoyes").array().default(sql`ARRAY[]::text[]`), // IDs des emails envoyés
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertRentalApplicationSchema = createInsertSchema(rentalApplications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  score: true,
  scoreDetail: true,
  tauxEffort: true,
  statutSolvabilite: true,
  totalRevenusMenuels: true,
}).extend({
  email: z.string().email("Email invalide"),
  telephone: z.string().min(10, "Téléphone invalide"),
  nom: z.string().min(2, "Nom requis"),
  prenom: z.string().min(2, "Prénom requis"),
  totalRevenusMenuels: z.string().or(z.number()).transform(val => typeof val === 'string' ? parseFloat(val) : val),
});

export type InsertRentalApplication = z.infer<typeof insertRentalApplicationSchema>;
export type RentalApplication = typeof rentalApplications.$inferSelect;

// Settings globales
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").unique().notNull(), // "minimum_vente_fee", etc.
  value: text("value"), // Stocké en string, à parser au besoin
  type: varchar("type").default("text"), // "text", "number", "currency"
  description: text("description"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;
