import {
  type Property,
  type InsertProperty,
  type Appointment,
  type InsertAppointment,
  type Contact,
  type InsertContact,
  type Estimation,
  type InsertEstimation,
  type LoanSimulation,
  type InsertLoanSimulation,
  type VisitAvailability,
  type InsertVisitAvailability,
  type PropertyAlert,
  type InsertPropertyAlert,
  type PricingScale,
  type InsertPricingScale,
  type HeroImage,
  type InsertHeroImage,
  type ContactCarouselImage,
  type InsertContactCarouselImage,
  type SocialMediaLink,
  type InsertSocialMediaLink,
  type ClientReview,
  type InsertClientReview,
  type SeasonalBookingRequest,
  type InsertSeasonalBookingRequest,
  type SeasonalAvailability,
  type InsertSeasonalAvailability,
  type RentalApplication,
  type InsertRentalApplication,
  properties,
  appointments,
  contacts,
  estimations,
  loanSimulations,
  visitAvailability,
  propertyAlerts,
  pricingScales,
  heroImages,
  contactCarouselImages,
  socialMediaLinks,
  clientReviews,
  seasonalBookingRequests,
  seasonalAvailability,
  rentalApplications,
} from "@shared/schema";
import { randomUUID } from "crypto";
import session from "express-session";
import createMemoryStore from "memorystore";
import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import { eq, and, sql } from "drizzle-orm";
import connectPgSimple from "connect-pg-simple";

export interface IStorage {
  sessionStore: session.Store;
  
  getProperty(id: string): Promise<Property | undefined>;
  getAllProperties(): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: string, property: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: string): Promise<boolean>;

  getAppointment(id: string): Promise<Appointment | undefined>;
  getAllAppointments(): Promise<Appointment[]>;
  getAppointmentsByProperty(propertyId: string): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: string): Promise<boolean>;

  getContact(id: string): Promise<Contact | undefined>;
  getAllContacts(): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: string): Promise<boolean>;

  getAllEstimations(): Promise<Estimation[]>;
  createEstimation(estimation: InsertEstimation): Promise<Estimation>;
  updateEstimation(id: string, estimation: Partial<InsertEstimation>): Promise<Estimation | undefined>;
  deleteEstimation(id: string): Promise<boolean>;

  getAllLoanSimulations(): Promise<LoanSimulation[]>;
  createLoanSimulation(simulation: InsertLoanSimulation): Promise<LoanSimulation>;
  deleteLoanSimulation(id: string): Promise<boolean>;

  getVisitAvailability(id: string): Promise<VisitAvailability | undefined>;
  getAllVisitAvailabilities(): Promise<VisitAvailability[]>;
  getVisitAvailabilitiesByDate(date: string): Promise<VisitAvailability[]>;
  createVisitAvailability(availability: InsertVisitAvailability): Promise<VisitAvailability>;
  updateVisitAvailability(id: string, availability: Partial<InsertVisitAvailability>): Promise<VisitAvailability | undefined>;
  deleteVisitAvailability(id: string): Promise<boolean>;

  getPropertyAlert(id: string): Promise<PropertyAlert | undefined>;
  getAllPropertyAlerts(): Promise<PropertyAlert[]>;
  getActivePropertyAlerts(): Promise<PropertyAlert[]>;
  createPropertyAlert(alert: InsertPropertyAlert): Promise<PropertyAlert>;
  updatePropertyAlert(id: string, alert: Partial<InsertPropertyAlert>): Promise<PropertyAlert | undefined>;
  deletePropertyAlert(id: string): Promise<boolean>;

  getPricingScale(id: string): Promise<PricingScale | undefined>;
  getAllPricingScales(): Promise<PricingScale[]>;
  getActivePricingScales(): Promise<PricingScale[]>;
  getPricingScalesByType(type: string): Promise<PricingScale[]>;
  createPricingScale(scale: InsertPricingScale): Promise<PricingScale>;
  updatePricingScale(id: string, scale: Partial<InsertPricingScale>): Promise<PricingScale | undefined>;
  deletePricingScale(id: string): Promise<boolean>;

  getHeroImage(id: string): Promise<HeroImage | undefined>;
  getAllHeroImages(): Promise<HeroImage[]>;
  getActiveHeroImages(): Promise<HeroImage[]>;
  createHeroImage(image: InsertHeroImage): Promise<HeroImage>;
  updateHeroImage(id: string, image: Partial<InsertHeroImage>): Promise<HeroImage | undefined>;
  deleteHeroImage(id: string): Promise<boolean>;

  getContactCarouselImage(id: string): Promise<ContactCarouselImage | undefined>;
  getAllContactCarouselImages(): Promise<ContactCarouselImage[]>;
  getActiveContactCarouselImages(): Promise<ContactCarouselImage[]>;
  createContactCarouselImage(image: InsertContactCarouselImage): Promise<ContactCarouselImage>;
  updateContactCarouselImage(id: string, image: Partial<InsertContactCarouselImage>): Promise<ContactCarouselImage | undefined>;
  deleteContactCarouselImage(id: string): Promise<boolean>;

  getSocialMediaLink(id: string): Promise<SocialMediaLink | undefined>;
  getAllSocialMediaLinks(): Promise<SocialMediaLink[]>;
  getActiveSocialMediaLinks(): Promise<SocialMediaLink[]>;
  createSocialMediaLink(link: InsertSocialMediaLink): Promise<SocialMediaLink>;
  updateSocialMediaLink(id: string, link: Partial<InsertSocialMediaLink>): Promise<SocialMediaLink | undefined>;
  deleteSocialMediaLink(id: string): Promise<boolean>;

  getClientReview(id: string): Promise<ClientReview | undefined>;
  getAllClientReviews(): Promise<ClientReview[]>;
  getActiveClientReviews(): Promise<ClientReview[]>;
  createClientReview(review: InsertClientReview): Promise<ClientReview>;
  updateClientReview(id: string, review: Partial<InsertClientReview>): Promise<ClientReview | undefined>;
  deleteClientReview(id: string): Promise<boolean>;

  getSeasonalBookingRequest(id: string): Promise<SeasonalBookingRequest | undefined>;
  getSeasonalBookingRequestByCode(confirmationCode: string): Promise<SeasonalBookingRequest | undefined>;
  getAllSeasonalBookingRequests(): Promise<SeasonalBookingRequest[]>;
  getSeasonalBookingRequestsByProperty(propertyId: string): Promise<SeasonalBookingRequest[]>;
  createSeasonalBookingRequest(request: InsertSeasonalBookingRequest): Promise<SeasonalBookingRequest>;
  updateSeasonalBookingRequest(id: string, request: Partial<InsertSeasonalBookingRequest>): Promise<SeasonalBookingRequest | undefined>;
  confirmSeasonalBookingRequest(id: string): Promise<SeasonalBookingRequest | undefined>;
  refuseSeasonalBookingRequest(id: string): Promise<SeasonalBookingRequest | undefined>;
  cancelSeasonalBookingRequest(id: string): Promise<SeasonalBookingRequest | undefined>;
  deleteSeasonalBookingRequest(id: string): Promise<boolean>;

  getSeasonalAvailability(id: string): Promise<SeasonalAvailability | undefined>;
  getAllSeasonalAvailabilities(): Promise<SeasonalAvailability[]>;
  getSeasonalAvailabilitiesByProperty(propertyId: string): Promise<SeasonalAvailability[]>;
  createSeasonalAvailability(availability: InsertSeasonalAvailability): Promise<SeasonalAvailability>;
  updateSeasonalAvailability(id: string, availability: Partial<InsertSeasonalAvailability>): Promise<SeasonalAvailability | undefined>;
  deleteSeasonalAvailability(id: string): Promise<boolean>;

  getRentalApplication(id: string): Promise<RentalApplication | undefined>;
  getAllRentalApplications(): Promise<RentalApplication[]>;
  getRentalApplicationsByProperty(propertyId: string): Promise<RentalApplication[]>;
  getRentalApplicationsByStatus(status: string): Promise<RentalApplication[]>;
  createRentalApplication(app: InsertRentalApplication): Promise<RentalApplication>;
  updateRentalApplication(id: string, app: Partial<InsertRentalApplication & { score?: number; scoreDetail?: string; tauxEffort?: number; statutSolvabilite?: string }>): Promise<RentalApplication | undefined>;
  deleteRentalApplication(id: string): Promise<boolean>;
}

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  public sessionStore: session.Store;
  private properties: Map<string, Property>;
  private appointments: Map<string, Appointment>;
  private contacts: Map<string, Contact>;
  private estimations: Map<string, Estimation>;
  private loanSimulations: Map<string, LoanSimulation>;
  private visitAvailabilities: Map<string, VisitAvailability>;
  private propertyAlerts: Map<string, PropertyAlert>;
  private pricingScales: Map<string, PricingScale>;
  private heroImages: Map<string, HeroImage>;
  private contactCarouselImages: Map<string, ContactCarouselImage>;
  private socialMediaLinksMap: Map<string, SocialMediaLink>;
  private clientReviewsMap: Map<string, ClientReview>;
  private seasonalBookingRequestsMap: Map<string, SeasonalBookingRequest>;
  private seasonalAvailabilitiesMap: Map<string, SeasonalAvailability>;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 heures
    });
    this.properties = new Map();
    this.appointments = new Map();
    this.contacts = new Map();
    this.estimations = new Map();
    this.loanSimulations = new Map();
    this.visitAvailabilities = new Map();
    this.propertyAlerts = new Map();
    this.pricingScales = new Map();
    this.socialMediaLinksMap = new Map();
    this.clientReviewsMap = new Map();
    this.heroImages = new Map();
    this.contactCarouselImages = new Map();
    this.seasonalBookingRequestsMap = new Map();
    this.seasonalAvailabilitiesMap = new Map();
    this.seedData();
  }

  private seedData() {
    const sampleProperties: InsertProperty[] = [
      {
        titre: "Appartement avec vue panoramique",
        description: "Appartement de 180m² situé au dernier étage d'un immeuble haussmannien. Vue dégagée sur les monuments parisiens. Parquet massif, moulures d'époque, cheminées en marbre. Cuisine équipée, salles de bains en marbre.",
        type: "appartement",
        prix: "2850000",
        surface: 180,
        pieces: 5,
        chambres: 3,
        localisation: "Avenue Montaigne, 75008 Paris",
        ville: "Paris",
        codePostal: "75008",
        photos: [
          "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200",
          "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200",
          "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200",
        ],
        featured: true,
        statut: "disponible",
      },
      {
        titre: "Villa contemporaine avec piscine",
        description: "Villa d'architecte de 350m² sur un terrain de 2000m². Design contemporain avec de grandes baies vitrées offrant une luminosité optimale. Piscine à débordement chauffée, pool house, garage pour 3 véhicules. Domotique complète.",
        type: "maison",
        prix: "4500000",
        surface: 350,
        pieces: 8,
        chambres: 5,
        localisation: "Chemin des Collines, 06400 Cannes",
        ville: "Cannes",
        codePostal: "06400",
        photos: [
          "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200",
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200",
          "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=1200",
        ],
        featured: true,
        statut: "disponible",
      },
      {
        titre: "Grand appartement avec terrasse de 200m²",
        description: "Appartement de 280m² avec terrasse panoramique de 200m². Vue à 360° sur la ville. Home cinéma, cave à vin climatisée, ascenseur privatif. Parking pour 4 voitures.",
        type: "appartement",
        prix: "5800000",
        surface: 280,
        pieces: 6,
        chambres: 4,
        localisation: "Quai de la Tournelle, 75005 Paris",
        ville: "Paris",
        codePostal: "75005",
        photos: [
          "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200",
          "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1200",
          "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=1200",
        ],
        featured: true,
        statut: "disponible",
      },
      {
        titre: "Maison de maître rénovée",
        description: "Sublime maison de maître du XIXe siècle entièrement rénovée avec des matériaux nobles. Jardin paysager de 800m², piscine, dépendance aménagée. Proximité immédiate des commerces et écoles.",
        type: "maison",
        prix: "1950000",
        surface: 220,
        pieces: 7,
        chambres: 4,
        localisation: "Rue Victor Hugo, 69006 Lyon",
        ville: "Lyon",
        codePostal: "69006",
        photos: [
          "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200",
          "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1200",
        ],
        featured: false,
        statut: "disponible",
      },
      {
        titre: "Loft industriel rénové",
        description: "Loft atypique de 160m² dans ancienne usine réhabilitée. Hauteur sous plafond 4m, poutres apparentes, verrière d'atelier. Cuisine américaine design, mezzanine, terrasse privative de 40m².",
        type: "appartement",
        prix: "890000",
        surface: 160,
        pieces: 3,
        chambres: 2,
        localisation: "Rue de la République, 13002 Marseille",
        ville: "Marseille",
        codePostal: "13002",
        photos: [
          "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200",
          "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1200",
        ],
        featured: false,
        statut: "disponible",
      },
      {
        titre: "Appartement T3 moderne en location",
        description: "Bel appartement de 65m² rénové récemment. Cuisine équipée, salle de bain moderne, balcon, parking. Proche commerces et transports.",
        type: "appartement",
        transactionType: "location",
        prix: "1500",
        surface: 65,
        pieces: 3,
        chambres: 2,
        localisation: "Rue de la Paix, 75002 Paris",
        ville: "Paris",
        codePostal: "75002",
        photos: [
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200",
        ],
        featured: false,
        statut: "disponible",
      },
      {
        titre: "Maison familiale à louer",
        description: "Maison de 120m² avec jardin de 300m². 4 chambres, cuisine équipée, double garage. Quartier calme et recherché.",
        type: "maison",
        transactionType: "location",
        prix: "2200",
        surface: 120,
        pieces: 5,
        chambres: 4,
        localisation: "Avenue des Chênes, 69006 Lyon",
        ville: "Lyon",
        codePostal: "69006",
        photos: [
          "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200",
        ],
        featured: false,
        statut: "disponible",
      },
      {
        titre: "Villa vue mer - Location saisonnière",
        description: "Villa moderne avec vue panoramique sur la mer. 5 chambres, piscine chauffée, jardin aménagé. Idéale pour vos vacances en famille. Wifi, climatisation, tout équipé.",
        type: "maison",
        transactionType: "location_saisonniere",
        prix: "3500",
        prixBasseSaison: "2500",
        prixMoyenneSaison: "3500",
        prixHauteSaison: "5500",
        surface: 180,
        pieces: 7,
        chambres: 5,
        localisation: "Corniche des Issambres, 83380 Les Issambres",
        ville: "Les Issambres",
        codePostal: "83380",
        personnesMax: 10,
        animauxAcceptes: true,
        wifi: true,
        piscine: true,
        climatisation: true,
        parking: true,
        photos: [
          "https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=1200",
          "https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?w=1200",
        ],
        featured: true,
        statut: "disponible",
      },
      {
        titre: "Chalet montagne - Location saisonnière",
        description: "Chalet authentique au pied des pistes. 4 chambres, cheminée, terrasse avec vue sur les montagnes. Parfait pour vos vacances au ski. Lave-linge, lave-vaisselle, TV.",
        type: "maison",
        transactionType: "location_saisonniere",
        prix: "2800",
        prixBasseSaison: "1800",
        prixMoyenneSaison: "2800",
        prixHauteSaison: "4200",
        surface: 120,
        pieces: 5,
        chambres: 4,
        localisation: "Route des Chalets, 73120 Courchevel",
        ville: "Courchevel",
        codePostal: "73120",
        personnesMax: 8,
        animauxAcceptes: false,
        wifi: true,
        tv: true,
        laveLinge: true,
        laveVaisselle: true,
        parking: true,
        photos: [
          "https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=1200",
        ],
        featured: false,
        statut: "disponible",
      },
      {
        titre: "Appartement bord de mer - Location saisonnière",
        description: "Appartement lumineux avec vue mer directe. 2 chambres, terrasse, à 50m de la plage. Climatisation, wifi, parking privatif. Idéal pour des vacances reposantes.",
        type: "appartement",
        transactionType: "location_saisonniere",
        prix: "1500",
        prixBasseSaison: "900",
        prixMoyenneSaison: "1500",
        prixHauteSaison: "2200",
        surface: 65,
        pieces: 3,
        chambres: 2,
        localisation: "Boulevard de la Plage, 64200 Biarritz",
        ville: "Biarritz",
        codePostal: "64200",
        personnesMax: 4,
        animauxAcceptes: true,
        wifi: true,
        tv: true,
        climatisation: true,
        parking: true,
        photos: [
          "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=1200",
        ],
        featured: false,
        statut: "disponible",
      },
    ];

    sampleProperties.forEach((prop) => {
      const id = randomUUID();
      const property: Property = {
        ...(prop as any),
        id,
        pieces: prop.pieces ?? null,
        chambres: prop.chambres ?? null,
        photos: prop.photos ?? [],
        featured: prop.featured ?? false,
        statut: prop.statut ?? 'disponible',
        transactionType: prop.transactionType ?? 'vente',
        dpe: (prop as any).dpe ?? null,
        ges: (prop as any).ges ?? null,
        honoraires: (prop as any).honoraires ?? null,
        montantHonoraires: (prop as any).montantHonoraires ?? null,
        copropriete: (prop as any).copropriete ?? false,
        nombreLots: (prop as any).nombreLots ?? null,
        chargesAnnuelles: (prop as any).chargesAnnuelles ?? null,
        taxeFonciere: (prop as any).taxeFonciere ?? null,
        anneeConstruction: (prop as any).anneeConstruction ?? null,
        prixBasseSaison: (prop as any).prixBasseSaison ?? null,
        prixMoyenneSaison: (prop as any).prixMoyenneSaison ?? null,
        prixHauteSaison: (prop as any).prixHauteSaison ?? null,
        depotGarantie: (prop as any).depotGarantie ?? null,
        taxeSejour: (prop as any).taxeSejour ?? null,
        personnesMax: (prop as any).personnesMax ?? null,
        animauxAcceptes: (prop as any).animauxAcceptes ?? false,
        fumeurAccepte: (prop as any).fumeurAccepte ?? false,
        wifi: (prop as any).wifi ?? false,
        tv: (prop as any).tv ?? false,
        laveLinge: (prop as any).laveLinge ?? false,
        laveVaisselle: (prop as any).laveVaisselle ?? false,
        parking: (prop as any).parking ?? false,
        piscine: (prop as any).piscine ?? false,
        climatisation: (prop as any).climatisation ?? false,
        menageInclus: (prop as any).menageInclus ?? false,
        lingeInclus: (prop as any).lingeInclus ?? false,
        conciergerieIncluse: (prop as any).conciergerieIncluse ?? false,
        badge: (prop as any).badge ?? null,
        createdAt: new Date(),
      };
      this.properties.set(id, property);
    });

    // Seed pricing scales
    const currentYear = new Date().getFullYear();
    const sampleScales: InsertPricingScale[] = [
      // Barèmes vente
      { type: 'vente', nom: 'Mandat Simple', description: 'Liberté totale de vendre par vous-même ou plusieurs agences', trancheMin: '0', trancheMax: '20000', honoraires: '5000', tauxPourcentage: null, annee: currentYear, ordre: 1, actif: true },
      { type: 'vente', nom: 'Mandat Simple', description: null, trancheMin: '20000', trancheMax: '50000', honoraires: '8000', tauxPourcentage: null, annee: currentYear, ordre: 2, actif: true },
      { type: 'vente', nom: 'Mandat Simple', description: null, trancheMin: '50000', trancheMax: '100000', honoraires: '12000', tauxPourcentage: null, annee: currentYear, ordre: 3, actif: true },
      { type: 'vente', nom: 'Mandat Simple', description: null, trancheMin: '100000', trancheMax: '200000', honoraires: '16000', tauxPourcentage: null, annee: currentYear, ordre: 4, actif: true },
      { type: 'vente', nom: 'Mandat Simple', description: null, trancheMin: '200000', trancheMax: '350000', honoraires: '20000', tauxPourcentage: null, annee: currentYear, ordre: 5, actif: true },
      { type: 'vente', nom: 'Mandat Simple', description: null, trancheMin: '350000', trancheMax: null, honoraires: null, tauxPourcentage: '8', annee: currentYear, ordre: 6, actif: true },
      
      { type: 'vente', nom: 'Mandat Exclusif', description: 'Service premium avec engagement exclusif', trancheMin: '0', trancheMax: '20000', honoraires: '5000', tauxPourcentage: null, annee: currentYear, ordre: 11, actif: true },
      { type: 'vente', nom: 'Mandat Exclusif', description: null, trancheMin: '20000', trancheMax: '50000', honoraires: '8000', tauxPourcentage: null, annee: currentYear, ordre: 12, actif: true },
      { type: 'vente', nom: 'Mandat Exclusif', description: null, trancheMin: '50000', trancheMax: '100000', honoraires: '12000', tauxPourcentage: null, annee: currentYear, ordre: 13, actif: true },
      { type: 'vente', nom: 'Mandat Exclusif', description: null, trancheMin: '100000', trancheMax: '200000', honoraires: '16000', tauxPourcentage: null, annee: currentYear, ordre: 14, actif: true },
      { type: 'vente', nom: 'Mandat Exclusif', description: null, trancheMin: '200000', trancheMax: '350000', honoraires: '20000', tauxPourcentage: null, annee: currentYear, ordre: 15, actif: true },
      { type: 'vente', nom: 'Mandat Exclusif', description: null, trancheMin: '350000', trancheMax: null, honoraires: null, tauxPourcentage: '8', annee: currentYear, ordre: 16, actif: true },
      
      // Barèmes location - Mandats de gestion locative
      { type: 'location', categorie: 'mandat', nom: 'Gestion Premium', description: 'Service complet avec garantie loyers impayés', trancheMin: null, trancheMax: null, honoraires: null, tauxPourcentage: '10', unite: null, minimum: null, annee: currentYear, ordre: 1, actif: true },
      { type: 'location', categorie: 'mandat', nom: 'Gestion sur mesure', description: 'Formule personnalisée selon vos besoins', trancheMin: null, trancheMax: null, honoraires: null, tauxPourcentage: '8', unite: null, minimum: null, annee: currentYear, ordre: 2, actif: true },
      { type: 'location', categorie: 'mandat', nom: 'Gestion Standard', description: 'Gestion complète de votre bien locatif', trancheMin: null, trancheMax: null, honoraires: null, tauxPourcentage: '7', unite: null, minimum: null, annee: currentYear, ordre: 3, actif: true },
      { type: 'location', categorie: 'mandat', nom: 'Gestion Basique', description: 'Gestion essentielle et économique', trancheMin: null, trancheMax: null, honoraires: null, tauxPourcentage: '5', unite: null, minimum: null, annee: currentYear, ordre: 4, actif: true },
      
      // SERVICES LOCATION - LOCAUX D'HABITATION (LOI ALUR)
      { type: 'location_services', categorie: 'zone_alur', nom: 'Zone très tendue', honoraires: '12', unite: '€/m²', factureA: 'locataire', annee: currentYear, ordre: 1, actif: true },
      { type: 'location_services', categorie: 'zone_alur', nom: 'Zone tendue', honoraires: '10', unite: '€/m²', factureA: 'locataire', annee: currentYear, ordre: 2, actif: true },
      { type: 'location_services', categorie: 'zone_alur', nom: 'Hors zones', honoraires: '0.8', unite: '€/m²', factureA: 'locataire', annee: currentYear, ordre: 3, actif: true },
      { type: 'location_services', categorie: 'zone_alur', nom: 'État des lieux d\'entrée', honoraires: '3', unite: '€/m²', factureA: 'locataire', annee: currentYear, ordre: 4, actif: true },
      { type: 'location_services', categorie: 'zone_alur', nom: 'Zone très tendue', honoraires: '12', unite: '€/m²', factureA: 'proprietaire', minimum: '1', annee: currentYear, ordre: 5, actif: true },
      { type: 'location_services', categorie: 'zone_alur', nom: 'Zone tendue', honoraires: '10', unite: '€/m²', factureA: 'proprietaire', minimum: '1', annee: currentYear, ordre: 6, actif: true },
      { type: 'location_services', categorie: 'zone_alur', nom: 'État des lieux', honoraires: '3', unite: '€/m²', factureA: 'proprietaire', annee: currentYear, ordre: 7, actif: true },
      { type: 'location_services', categorie: 'zone_alur', nom: 'Expertise, négociation et entremise baux meublés', honoraires: '250', unite: '€', factureA: 'proprietaire', annee: currentYear, ordre: 8, actif: true },
      
      // BAUX CODE CIVIL
      { type: 'location_services', categorie: 'baux_civil', nom: 'Location, rédaction du bail, état des lieux', honoraires: '1', unite: 'mois_loyer', factureA: 'locataire', annee: currentYear, ordre: 1, actif: true },
      { type: 'location_services', categorie: 'baux_civil', nom: 'Location', honoraires: '1', unite: 'mois_loyer', factureA: 'proprietaire', annee: currentYear, ordre: 2, actif: true },
      { type: 'location_services', categorie: 'baux_civil', nom: 'Rédaction du bail', honoraires: '250', unite: '€', factureA: 'proprietaire', annee: currentYear, ordre: 3, actif: true },
      
      // STATIONNEMENT
      { type: 'location_services', categorie: 'stationnement', nom: 'Parking', honoraires: '100', unite: '€', factureA: 'locataire', minimum: '1', annee: currentYear, ordre: 1, actif: true },
      { type: 'location_services', categorie: 'stationnement', nom: 'Garage', honoraires: '150', unite: '€', factureA: 'locataire', minimum: '1', annee: currentYear, ordre: 2, actif: true },
      { type: 'location_services', categorie: 'stationnement', nom: 'Parking', honoraires: '100', unite: '€', factureA: 'proprietaire', minimum: '1', annee: currentYear, ordre: 3, actif: true },
      { type: 'location_services', categorie: 'stationnement', nom: 'Garage', honoraires: '150', unite: '€', factureA: 'proprietaire', minimum: '1', annee: currentYear, ordre: 4, actif: true },
      
      // RÉDACTION DIVERS ACTES
      { type: 'location_services', categorie: 'divers_actes', nom: 'Rédaction avenant au bail en cours', honoraires: '300', unite: '€', factureA: 'les_deux', annee: currentYear, ordre: 1, actif: true },
      
      // LOCAUX COMMERCIAUX
      { type: 'location_services', categorie: 'commercial', nom: 'Recherche et sélection locataires', tauxPourcentage: '36', unite: '%', factureA: 'les_deux', annee: currentYear, ordre: 1, actif: true },
      { type: 'location_services', categorie: 'commercial', nom: 'Bail, renouvellement, avenant, subrogation', tauxPourcentage: '6', unite: '%', factureA: 'proprietaire', minimum: '1200', annee: currentYear, ordre: 2, actif: true },
      { type: 'location_services', categorie: 'commercial', nom: 'Avenant de révision', tauxPourcentage: '1.80', unite: '%', factureA: 'proprietaire', minimum: '350', annee: currentYear, ordre: 3, actif: true },
      { type: 'location_services', categorie: 'commercial', nom: 'État des lieux local commercial', honoraires: '1.40', unite: '€/m²', factureA: 'les_deux', annee: currentYear, ordre: 4, actif: true },
    ];

    sampleScales.forEach((scale) => {
      const id = randomUUID();
      const pricingScale: PricingScale = {
        id,
        type: scale.type,
        categorie: scale.categorie ?? null,
        nom: scale.nom,
        description: scale.description ?? null,
        elementsDifferenciants: null,
        avantagesExclusifs: null,
        trancheMin: scale.trancheMin ?? null,
        trancheMax: scale.trancheMax ?? null,
        honoraires: scale.honoraires ?? null,
        tauxPourcentage: scale.tauxPourcentage ?? null,
        unite: scale.unite ?? null,
        minimum: scale.minimum ?? null,
        factureA: scale.factureA ?? null,
        annee: scale.annee,
        ordre: scale.ordre ?? 0,
        actif: scale.actif ?? true,
        createdAt: new Date(),
      };
      this.pricingScales.set(id, pricingScale);
    });

    // Hero Images par défaut
    const sampleHeroImages: InsertHeroImage[] = [
      {
        imageUrl: "/assets/stock_images/modern_luxury_house__28e541f9.jpg",
        titre: "Bienvenue chez KEYLOR",
        sousTitre: "Votre partenaire immobilier de confiance en Drôme, Ardèche et toute la France",
        ordre: 1,
        actif: true,
      },
      {
        imageUrl: "/assets/stock_images/modern_luxury_house__a62d2804.jpg",
        titre: "Des propriétés d'exception",
        sousTitre: "Découvrez notre sélection de biens immobiliers",
        ordre: 2,
        actif: true,
      },
      {
        imageUrl: "/assets/stock_images/modern_luxury_house__7da36a17.jpg",
        titre: "Un accompagnement sur mesure",
        sousTitre: "Vendre, louer, acheter ou faire gérer avec sérénité",
        ordre: 3,
        actif: true,
      },
    ];

    sampleHeroImages.forEach((image) => {
      const id = randomUUID();
      const heroImage: HeroImage = {
        id,
        imageUrl: image.imageUrl,
        titre: image.titre ?? null,
        sousTitre: image.sousTitre ?? null,
        ordre: image.ordre ?? 0,
        actif: image.actif ?? true,
        createdAt: new Date(),
      };
      this.heroImages.set(id, heroImage);
    });
  }

  async getProperty(id: string): Promise<Property | undefined> {
    return this.properties.get(id);
  }

  async getAllProperties(): Promise<Property[]> {
    return Array.from(this.properties.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const id = randomUUID();
    const property: Property = {
      ...(insertProperty as any),
      id,
      pieces: insertProperty.pieces ?? null,
      chambres: insertProperty.chambres ?? null,
      photos: insertProperty.photos ?? [],
      featured: insertProperty.featured ?? false,
      statut: insertProperty.statut ?? 'disponible',
      transactionType: insertProperty.transactionType ?? 'vente',
      dpe: insertProperty.dpe ?? null,
      ges: insertProperty.ges ?? null,
      honoraires: insertProperty.honoraires ?? null,
      montantHonoraires: insertProperty.montantHonoraires ?? null,
      copropriete: insertProperty.copropriete ?? false,
      nombreLots: insertProperty.nombreLots ?? null,
      chargesAnnuelles: insertProperty.chargesAnnuelles ?? null,
      taxeFonciere: insertProperty.taxeFonciere ?? null,
      anneeConstruction: insertProperty.anneeConstruction ?? null,
      prixBasseSaison: insertProperty.prixBasseSaison ?? null,
      prixMoyenneSaison: insertProperty.prixMoyenneSaison ?? null,
      prixHauteSaison: insertProperty.prixHauteSaison ?? null,
      depotGarantie: insertProperty.depotGarantie ?? null,
      taxeSejour: insertProperty.taxeSejour ?? null,
      personnesMax: insertProperty.personnesMax ?? null,
      animauxAcceptes: insertProperty.animauxAcceptes ?? false,
      fumeurAccepte: insertProperty.fumeurAccepte ?? false,
      wifi: insertProperty.wifi ?? false,
      tv: insertProperty.tv ?? false,
      laveLinge: insertProperty.laveLinge ?? false,
      laveVaisselle: insertProperty.laveVaisselle ?? false,
      parking: insertProperty.parking ?? false,
      piscine: insertProperty.piscine ?? false,
      climatisation: insertProperty.climatisation ?? false,
      menageInclus: insertProperty.menageInclus ?? false,
      lingeInclus: insertProperty.lingeInclus ?? false,
      conciergerieIncluse: insertProperty.conciergerieIncluse ?? false,
      badge: insertProperty.badge ?? null,
      createdAt: new Date(),
    };
    this.properties.set(id, property);
    return property;
  }

  async updateProperty(
    id: string,
    updates: Partial<InsertProperty>
  ): Promise<Property | undefined> {
    const property = this.properties.get(id);
    if (!property) return undefined;

    const updated: Property = {
      ...property,
      ...updates,
    };
    this.properties.set(id, updated);
    return updated;
  }

  async deleteProperty(id: string): Promise<boolean> {
    return this.properties.delete(id);
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async getAllAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getAppointmentsByProperty(propertyId: string): Promise<Appointment[]> {
    return Array.from(this.appointments.values())
      .filter((apt) => apt.propertyId === propertyId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = randomUUID();
    const appointment: Appointment = {
      ...insertAppointment,
      id,
      motif: insertAppointment.motif ?? '',
      message: insertAppointment.message ?? null,
      delegueA: insertAppointment.delegueA ?? null,
      delegueEmail: insertAppointment.delegueEmail ?? null,
      statut: "en_attente",
      createdAt: new Date(),
    };
    this.appointments.set(id, appointment);
    return appointment;
  }

  async updateAppointment(
    id: string,
    updates: Partial<InsertAppointment>
  ): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;

    const updated: Appointment = {
      ...appointment,
      ...updates,
    };
    this.appointments.set(id, updated);
    return updated;
  }

  async deleteAppointment(id: string): Promise<boolean> {
    return this.appointments.delete(id);
  }

  async getContact(id: string): Promise<Contact | undefined> {
    return this.contacts.get(id);
  }

  async getAllContacts(): Promise<Contact[]> {
    return Array.from(this.contacts.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const id = randomUUID();
    const contact: Contact = {
      ...insertContact,
      id,
      propertyId: insertContact.propertyId ?? null,
      statut: "nouveau",
      createdAt: new Date(),
    };
    this.contacts.set(id, contact);
    return contact;
  }

  async updateContact(
    id: string,
    updates: Partial<InsertContact>
  ): Promise<Contact | undefined> {
    const contact = this.contacts.get(id);
    if (!contact) return undefined;

    const updated: Contact = {
      ...contact,
      ...updates,
    };
    this.contacts.set(id, updated);
    return updated;
  }

  async deleteContact(id: string): Promise<boolean> {
    return this.contacts.delete(id);
  }

  async getAllEstimations(): Promise<Estimation[]> {
    return Array.from(this.estimations.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async createEstimation(insertEstimation: InsertEstimation): Promise<Estimation> {
    const id = randomUUID();
    const estimation: Estimation = {
      ...insertEstimation,
      id,
      pieces: insertEstimation.pieces ?? null,
      chambres: insertEstimation.chambres ?? null,
      anneeConstruction: insertEstimation.anneeConstruction ?? null,
      etat: insertEstimation.etat ?? null,
      estimationAuto: insertEstimation.estimationAuto ?? null,
      statut: "en_attente",
      createdAt: new Date(),
    };
    this.estimations.set(id, estimation);
    return estimation;
  }

  async updateEstimation(
    id: string,
    updates: Partial<InsertEstimation>
  ): Promise<Estimation | undefined> {
    const estimation = this.estimations.get(id);
    if (!estimation) return undefined;

    const updated: Estimation = {
      ...estimation,
      ...updates,
    };
    this.estimations.set(id, updated);
    return updated;
  }

  async deleteEstimation(id: string): Promise<boolean> {
    return this.estimations.delete(id);
  }

  async getAllLoanSimulations(): Promise<LoanSimulation[]> {
    return Array.from(this.loanSimulations.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async createLoanSimulation(insertSimulation: InsertLoanSimulation): Promise<LoanSimulation> {
    const id = randomUUID();
    const simulation: LoanSimulation = {
      ...insertSimulation,
      id,
      apport: insertSimulation.apport ?? null,
      mensualite: insertSimulation.mensualite ?? null,
      coutTotal: insertSimulation.coutTotal ?? null,
      createdAt: new Date(),
    };
    this.loanSimulations.set(id, simulation);
    return simulation;
  }

  async deleteLoanSimulation(id: string): Promise<boolean> {
    return this.loanSimulations.delete(id);
  }

  async getVisitAvailability(id: string): Promise<VisitAvailability | undefined> {
    return this.visitAvailabilities.get(id);
  }

  async getAllVisitAvailabilities(): Promise<VisitAvailability[]> {
    return Array.from(this.visitAvailabilities.values()).sort(
      (a, b) => a.date.localeCompare(b.date) || a.heureDebut.localeCompare(b.heureDebut)
    );
  }

  async getVisitAvailabilitiesByDate(date: string): Promise<VisitAvailability[]> {
    return Array.from(this.visitAvailabilities.values())
      .filter(avail => avail.date === date && avail.actif)
      .sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));
  }

  async createVisitAvailability(insertAvailability: InsertVisitAvailability): Promise<VisitAvailability> {
    const id = randomUUID();
    const availability: VisitAvailability = {
      ...insertAvailability,
      id,
      dureeVisite: insertAvailability.dureeVisite ?? 45,
      margeSecurite: insertAvailability.margeSecurite ?? 15,
      intervalleCreneaux: insertAvailability.intervalleCreneaux ?? 30,
      actif: insertAvailability.actif ?? true,
      createdAt: new Date(),
    };
    this.visitAvailabilities.set(id, availability);
    return availability;
  }

  async updateVisitAvailability(
    id: string,
    updates: Partial<InsertVisitAvailability>
  ): Promise<VisitAvailability | undefined> {
    const availability = this.visitAvailabilities.get(id);
    if (!availability) return undefined;

    const updated: VisitAvailability = {
      ...availability,
      ...updates,
    };
    this.visitAvailabilities.set(id, updated);
    return updated;
  }

  async deleteVisitAvailability(id: string): Promise<boolean> {
    return this.visitAvailabilities.delete(id);
  }

  async getPropertyAlert(id: string): Promise<PropertyAlert | undefined> {
    return this.propertyAlerts.get(id);
  }

  async getAllPropertyAlerts(): Promise<PropertyAlert[]> {
    return Array.from(this.propertyAlerts.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getActivePropertyAlerts(): Promise<PropertyAlert[]> {
    return Array.from(this.propertyAlerts.values())
      .filter(alert => alert.active)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createPropertyAlert(insertAlert: InsertPropertyAlert): Promise<PropertyAlert> {
    const id = randomUUID();
    const alert: PropertyAlert = {
      ...insertAlert,
      id,
      transactionType: insertAlert.transactionType ?? null,
      type: insertAlert.type ?? null,
      ville: insertAlert.ville ?? null,
      prixMax: insertAlert.prixMax ?? null,
      surfaceMin: insertAlert.surfaceMin ?? null,
      chambresMin: insertAlert.chambresMin ?? null,
      active: insertAlert.active ?? true,
      createdAt: new Date(),
    };
    this.propertyAlerts.set(id, alert);
    return alert;
  }

  async updatePropertyAlert(
    id: string,
    updates: Partial<InsertPropertyAlert>
  ): Promise<PropertyAlert | undefined> {
    const alert = this.propertyAlerts.get(id);
    if (!alert) return undefined;

    const updated: PropertyAlert = {
      ...alert,
      ...updates,
    };
    this.propertyAlerts.set(id, updated);
    return updated;
  }

  async deletePropertyAlert(id: string): Promise<boolean> {
    return this.propertyAlerts.delete(id);
  }

  async getPricingScale(id: string): Promise<PricingScale | undefined> {
    return this.pricingScales.get(id);
  }

  async getAllPricingScales(): Promise<PricingScale[]> {
    return Array.from(this.pricingScales.values()).sort(
      (a, b) => a.ordre - b.ordre
    );
  }

  async getActivePricingScales(): Promise<PricingScale[]> {
    return Array.from(this.pricingScales.values())
      .filter(scale => scale.actif)
      .sort((a, b) => a.ordre - b.ordre);
  }

  async getPricingScalesByType(type: string): Promise<PricingScale[]> {
    return Array.from(this.pricingScales.values())
      .filter(scale => scale.type === type && scale.actif)
      .sort((a, b) => a.ordre - b.ordre);
  }

  async createPricingScale(insertScale: InsertPricingScale): Promise<PricingScale> {
    const id = randomUUID();
    const scale: PricingScale = {
      id,
      type: insertScale.type,
      categorie: insertScale.categorie ?? null,
      nom: insertScale.nom,
      description: insertScale.description ?? null,
      elementsDifferenciants: insertScale.elementsDifferenciants ?? null,
      avantagesExclusifs: insertScale.avantagesExclusifs ?? null,
      trancheMin: insertScale.trancheMin ?? null,
      trancheMax: insertScale.trancheMax ?? null,
      honoraires: insertScale.honoraires ?? null,
      tauxPourcentage: insertScale.tauxPourcentage ?? null,
      unite: insertScale.unite ?? null,
      minimum: insertScale.minimum ?? null,
      factureA: insertScale.factureA ?? null,
      annee: insertScale.annee,
      ordre: insertScale.ordre ?? 0,
      actif: insertScale.actif ?? true,
      createdAt: new Date(),
    };
    this.pricingScales.set(id, scale);
    return scale;
  }

  async updatePricingScale(
    id: string,
    updates: Partial<InsertPricingScale>
  ): Promise<PricingScale | undefined> {
    const scale = this.pricingScales.get(id);
    if (!scale) return undefined;

    const updated: PricingScale = {
      ...scale,
      ...updates,
    };
    this.pricingScales.set(id, updated);
    return updated;
  }

  async deletePricingScale(id: string): Promise<boolean> {
    return this.pricingScales.delete(id);
  }

  // Hero Images
  async getHeroImage(id: string): Promise<HeroImage | undefined> {
    return this.heroImages.get(id);
  }

  async getAllHeroImages(): Promise<HeroImage[]> {
    return Array.from(this.heroImages.values()).sort((a, b) => a.ordre - b.ordre);
  }

  async getActiveHeroImages(): Promise<HeroImage[]> {
    return Array.from(this.heroImages.values())
      .filter(img => img.actif)
      .sort((a, b) => a.ordre - b.ordre);
  }

  async createHeroImage(image: InsertHeroImage): Promise<HeroImage> {
    const id = randomUUID();
    const heroImage: HeroImage = {
      id,
      imageUrl: image.imageUrl,
      titre: image.titre ?? null,
      sousTitre: image.sousTitre ?? null,
      ordre: image.ordre ?? 0,
      actif: image.actif ?? true,
      createdAt: new Date(),
    };
    this.heroImages.set(id, heroImage);
    return heroImage;
  }

  async updateHeroImage(id: string, updates: Partial<InsertHeroImage>): Promise<HeroImage | undefined> {
    const image = this.heroImages.get(id);
    if (!image) return undefined;

    const updated: HeroImage = {
      ...image,
      ...updates,
      titre: updates.titre !== undefined ? updates.titre : image.titre,
      sousTitre: updates.sousTitre !== undefined ? updates.sousTitre : image.sousTitre,
    };
    this.heroImages.set(id, updated);
    return updated;
  }

  async deleteHeroImage(id: string): Promise<boolean> {
    return this.heroImages.delete(id);
  }

  // Contact Carousel Images
  async getContactCarouselImage(id: string): Promise<ContactCarouselImage | undefined> {
    return this.contactCarouselImages.get(id);
  }

  async getAllContactCarouselImages(): Promise<ContactCarouselImage[]> {
    return Array.from(this.contactCarouselImages.values()).sort((a, b) => a.ordre - b.ordre);
  }

  async getActiveContactCarouselImages(): Promise<ContactCarouselImage[]> {
    return Array.from(this.contactCarouselImages.values())
      .filter(img => img.actif)
      .sort((a, b) => a.ordre - b.ordre);
  }

  async createContactCarouselImage(image: InsertContactCarouselImage): Promise<ContactCarouselImage> {
    const id = randomUUID();
    const carouselImage: ContactCarouselImage = {
      id,
      imageUrl: image.imageUrl,
      titre: image.titre ?? null,
      sousTitre: image.sousTitre ?? null,
      ordre: image.ordre ?? 0,
      actif: image.actif ?? true,
      createdAt: new Date(),
    };
    this.contactCarouselImages.set(id, carouselImage);
    return carouselImage;
  }

  async updateContactCarouselImage(id: string, updates: Partial<InsertContactCarouselImage>): Promise<ContactCarouselImage | undefined> {
    const image = this.contactCarouselImages.get(id);
    if (!image) return undefined;

    const updated: ContactCarouselImage = {
      ...image,
      ...updates,
      titre: updates.titre !== undefined ? updates.titre : image.titre,
      sousTitre: updates.sousTitre !== undefined ? updates.sousTitre : image.sousTitre,
    };
    this.contactCarouselImages.set(id, updated);
    return updated;
  }

  async deleteContactCarouselImage(id: string): Promise<boolean> {
    return this.contactCarouselImages.delete(id);
  }

  // Social Media Links
  async getSocialMediaLink(id: string): Promise<SocialMediaLink | undefined> {
    return this.socialMediaLinksMap.get(id);
  }

  async getAllSocialMediaLinks(): Promise<SocialMediaLink[]> {
    return Array.from(this.socialMediaLinksMap.values()).sort((a, b) => a.ordre - b.ordre);
  }

  async getActiveSocialMediaLinks(): Promise<SocialMediaLink[]> {
    return Array.from(this.socialMediaLinksMap.values())
      .filter(link => link.actif)
      .sort((a, b) => a.ordre - b.ordre);
  }

  async createSocialMediaLink(link: InsertSocialMediaLink): Promise<SocialMediaLink> {
    const id = randomUUID();
    const socialLink: SocialMediaLink = {
      id,
      nom: link.nom,
      plateforme: link.plateforme,
      url: link.url,
      ordre: link.ordre ?? 0,
      actif: link.actif ?? true,
      createdAt: new Date(),
    };
    this.socialMediaLinksMap.set(id, socialLink);
    return socialLink;
  }

  async updateSocialMediaLink(id: string, updates: Partial<InsertSocialMediaLink>): Promise<SocialMediaLink | undefined> {
    const link = this.socialMediaLinksMap.get(id);
    if (!link) return undefined;

    const updated: SocialMediaLink = {
      ...link,
      ...updates,
    };
    this.socialMediaLinksMap.set(id, updated);
    return updated;
  }

  async deleteSocialMediaLink(id: string): Promise<boolean> {
    return this.socialMediaLinksMap.delete(id);
  }

  // Client Reviews
  async getClientReview(id: string): Promise<ClientReview | undefined> {
    return this.clientReviewsMap.get(id);
  }

  async getAllClientReviews(): Promise<ClientReview[]> {
    return Array.from(this.clientReviewsMap.values()).sort((a, b) => a.ordre - b.ordre);
  }

  async getActiveClientReviews(): Promise<ClientReview[]> {
    return Array.from(this.clientReviewsMap.values())
      .filter(review => review.actif)
      .sort((a, b) => a.ordre - b.ordre);
  }

  async createClientReview(review: InsertClientReview): Promise<ClientReview> {
    const id = randomUUID();
    const clientReview: ClientReview = {
      id,
      nomComplet: review.nomComplet,
      photoUrl: review.photoUrl ?? null,
      ville: review.ville ?? null,
      note: review.note,
      commentaire: review.commentaire,
      typeService: review.typeService ?? null,
      ordre: review.ordre ?? 0,
      actif: review.actif ?? true,
      createdAt: new Date(),
    };
    this.clientReviewsMap.set(id, clientReview);
    return clientReview;
  }

  async updateClientReview(id: string, updates: Partial<InsertClientReview>): Promise<ClientReview | undefined> {
    const review = this.clientReviewsMap.get(id);
    if (!review) return undefined;

    const updated: ClientReview = {
      ...review,
      ...updates,
      photoUrl: updates.photoUrl !== undefined ? updates.photoUrl : review.photoUrl,
      ville: updates.ville !== undefined ? updates.ville : review.ville,
      typeService: updates.typeService !== undefined ? updates.typeService : review.typeService,
    };
    this.clientReviewsMap.set(id, updated);
    return updated;
  }

  async deleteClientReview(id: string): Promise<boolean> {
    return this.clientReviewsMap.delete(id);
  }

  // Seasonal Booking Requests
  private generateConfirmationCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async getSeasonalBookingRequest(id: string): Promise<SeasonalBookingRequest | undefined> {
    return this.seasonalBookingRequestsMap.get(id);
  }

  async getSeasonalBookingRequestByCode(confirmationCode: string): Promise<SeasonalBookingRequest | undefined> {
    return Array.from(this.seasonalBookingRequestsMap.values())
      .find((request) => request.confirmationCode === confirmationCode);
  }

  async getAllSeasonalBookingRequests(): Promise<SeasonalBookingRequest[]> {
    return Array.from(this.seasonalBookingRequestsMap.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getSeasonalBookingRequestsByProperty(propertyId: string): Promise<SeasonalBookingRequest[]> {
    return Array.from(this.seasonalBookingRequestsMap.values())
      .filter((request) => request.propertyId === propertyId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createSeasonalBookingRequest(request: InsertSeasonalBookingRequest): Promise<SeasonalBookingRequest> {
    const id = randomUUID();
    let confirmationCode = this.generateConfirmationCode();
    
    while (await this.getSeasonalBookingRequestByCode(confirmationCode)) {
      confirmationCode = this.generateConfirmationCode();
    }
    
    const seasonalBookingRequest: SeasonalBookingRequest = {
      id,
      confirmationCode,
      ...request,
      message: request.message ?? null,
      numChildren: request.numChildren ?? 0,
      totalPrice: request.totalPrice ?? null,
      status: 'en_attente',
      createdAt: new Date(),
    };
    this.seasonalBookingRequestsMap.set(id, seasonalBookingRequest);
    return seasonalBookingRequest;
  }

  async updateSeasonalBookingRequest(id: string, updates: Partial<InsertSeasonalBookingRequest>): Promise<SeasonalBookingRequest | undefined> {
    const request = this.seasonalBookingRequestsMap.get(id);
    if (!request) return undefined;

    const updated: SeasonalBookingRequest = {
      ...request,
      ...updates,
    };
    this.seasonalBookingRequestsMap.set(id, updated);
    return updated;
  }

  async confirmSeasonalBookingRequest(id: string): Promise<SeasonalBookingRequest | undefined> {
    const request = this.seasonalBookingRequestsMap.get(id);
    if (!request) return undefined;

    const updated: SeasonalBookingRequest = {
      ...request,
      status: 'confirmee',
    };
    this.seasonalBookingRequestsMap.set(id, updated);
    return updated;
  }

  async refuseSeasonalBookingRequest(id: string): Promise<SeasonalBookingRequest | undefined> {
    const request = this.seasonalBookingRequestsMap.get(id);
    if (!request) return undefined;

    const updated: SeasonalBookingRequest = {
      ...request,
      status: 'refusee',
    };
    this.seasonalBookingRequestsMap.set(id, updated);
    return updated;
  }

  async cancelSeasonalBookingRequest(id: string): Promise<SeasonalBookingRequest | undefined> {
    const request = this.seasonalBookingRequestsMap.get(id);
    if (!request) return undefined;

    const updated: SeasonalBookingRequest = {
      ...request,
      status: 'annulee',
    };
    this.seasonalBookingRequestsMap.set(id, updated);
    return updated;
  }

  async deleteSeasonalBookingRequest(id: string): Promise<boolean> {
    return this.seasonalBookingRequestsMap.delete(id);
  }

  // Seasonal Availability
  async getSeasonalAvailability(id: string): Promise<SeasonalAvailability | undefined> {
    return this.seasonalAvailabilitiesMap.get(id);
  }

  async getAllSeasonalAvailabilities(): Promise<SeasonalAvailability[]> {
    return Array.from(this.seasonalAvailabilitiesMap.values())
      .sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime());
  }

  async getSeasonalAvailabilitiesByProperty(propertyId: string): Promise<SeasonalAvailability[]> {
    return Array.from(this.seasonalAvailabilitiesMap.values())
      .filter((availability) => availability.propertyId === propertyId)
      .sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime());
  }

  async createSeasonalAvailability(availability: InsertSeasonalAvailability): Promise<SeasonalAvailability> {
    const id = randomUUID();
    const seasonalAvailability: SeasonalAvailability = {
      id,
      ...availability,
      motif: availability.motif ?? '',
      bloque: availability.bloque ?? false,
      notes: availability.notes ?? null,
      createdAt: new Date(),
    };
    this.seasonalAvailabilitiesMap.set(id, seasonalAvailability);
    return seasonalAvailability;
  }

  async updateSeasonalAvailability(id: string, updates: Partial<InsertSeasonalAvailability>): Promise<SeasonalAvailability | undefined> {
    const availability = this.seasonalAvailabilitiesMap.get(id);
    if (!availability) return undefined;

    const updated: SeasonalAvailability = {
      ...availability,
      ...updates,
    };
    this.seasonalAvailabilitiesMap.set(id, updated);
    return updated;
  }

  async deleteSeasonalAvailability(id: string): Promise<boolean> {
    return this.seasonalAvailabilitiesMap.delete(id);
  }
}

// Classe DBStorage utilisant PostgreSQL avec Drizzle ORM
export class DBStorage implements IStorage {
  public sessionStore: session.Store;
  private db: ReturnType<typeof drizzle>;

  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    this.db = drizzle(pool);
    
    const PgSession = connectPgSimple(session);
    this.sessionStore = new PgSession({
      pool: pool,
      tableName: 'session',
      createTableIfMissing: true,
    });
    
    // NOTE: La vitrine NE SEED PAS de données
    // Elle lit uniquement les données créées par l'intranet
    // Cela garantit une synchronisation automatique: vitrine + intranet = même base de données
  }

  private async seedIfEmpty() {
    try {
      const existingProps = await this.db.select().from(properties);
      if (existingProps.length > 0) return; // Database already has data

      const currentYear = new Date().getFullYear();

      // Seed properties
      const sampleProperties: InsertProperty[] = [
        {
          titre: "Appartement avec vue panoramique",
          description: "Appartement de 180m² situé au dernier étage d'un immeuble haussmannien. Vue dégagée sur les monuments parisiens. Parquet massif, moulures d'époque, cheminées en marbre. Cuisine équipée, salles de bains en marbre.",
          type: "appartement",
          prix: "2850000",
          surface: 180,
          pieces: 5,
          chambres: 3,
          localisation: "Avenue Montaigne, 75008 Paris",
          ville: "Paris",
          codePostal: "75008",
          photos: [
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200",
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200",
            "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200",
          ],
          featured: true,
          statut: "disponible",
        },
        {
          titre: "Villa contemporaine avec piscine",
          description: "Villa d'architecte de 350m² sur un terrain de 2000m². Design contemporain avec de grandes baies vitrées offrant une luminosité optimale. Piscine à débordement chauffée, pool house, garage pour 3 véhicules. Domotique complète.",
          type: "maison",
          prix: "4500000",
          surface: 350,
          pieces: 8,
          chambres: 5,
          localisation: "Chemin des Collines, 06400 Cannes",
          ville: "Cannes",
          codePostal: "06400",
          photos: [
            "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200",
            "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=1200",
          ],
          featured: true,
          statut: "disponible",
        },
        {
          titre: "Appartement T3 moderne en location",
          description: "Bel appartement de 65m² rénové récemment. Cuisine équipée, salle de bain moderne, balcon, parking. Proche commerces et transports.",
          type: "appartement",
          transactionType: "location",
          prix: "1500",
          surface: 65,
          pieces: 3,
          chambres: 2,
          localisation: "Rue de la Paix, 75002 Paris",
          ville: "Paris",
          codePostal: "75002",
          photos: [
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200",
          ],
          featured: false,
          statut: "disponible",
        },
      ];

      await this.db.insert(properties).values(sampleProperties);

      // Seed pricing scales
      const sampleScales = [
        // Barèmes vente
        { type: 'vente', nom: 'Moins de 100 000 €', trancheMin: null, trancheMax: '100000', tauxPourcentage: '6', annee: currentYear, ordre: 1, actif: true },
        { type: 'vente', nom: 'De 100 000 à 200 000 €', trancheMin: '100000', trancheMax: '200000', tauxPourcentage: '5', annee: currentYear, ordre: 2, actif: true },
        { type: 'vente', nom: 'Plus de 500 000 €', trancheMin: '500000', trancheMax: null, tauxPourcentage: '3', annee: currentYear, ordre: 3, actif: true },
        
        // Barèmes location - Mandats
        { type: 'location', categorie: 'mandat', nom: 'Gestion Premium', description: 'Service complet avec garantie loyers impayés', tauxPourcentage: '10', annee: currentYear, ordre: 1, actif: true, elementsDifferenciants: ['CRG mensuel détaillé', 'GLI+PNO', 'ADRF mensuelle', 'Reporting mensuel détaillé'] },
        { type: 'location', categorie: 'mandat', nom: 'Gestion sur mesure', description: 'Formule personnalisée selon vos besoins', tauxPourcentage: '8', annee: currentYear, ordre: 2, actif: true },
        { type: 'location', categorie: 'mandat', nom: 'Gestion Standard', description: 'Gestion complète de votre bien locatif', tauxPourcentage: '7', annee: currentYear, ordre: 3, actif: true },
        { type: 'location', categorie: 'mandat', nom: 'Gestion Basique', description: 'Gestion essentielle et économique', tauxPourcentage: '5', annee: currentYear, ordre: 4, actif: true },
        
        // Services location (ALUR)
        { type: 'location_services', categorie: 'zone_alur', nom: 'Zone très tendue', honoraires: '12', unite: '€/m²', factureA: 'locataire', annee: currentYear, ordre: 1, actif: true },
        { type: 'location_services', categorie: 'zone_alur', nom: 'Zone tendue', honoraires: '10', unite: '€/m²', factureA: 'locataire', annee: currentYear, ordre: 2, actif: true },
        { type: 'location_services', categorie: 'zone_alur', nom: 'État des lieux d\'entrée', honoraires: '3', unite: '€/m²', factureA: 'locataire', annee: currentYear, ordre: 4, actif: true },
      ];

      await this.db.insert(pricingScales).values(sampleScales as any);

      // Seed hero images
      const sampleHeroImages: InsertHeroImage[] = [
        {
          imageUrl: "/assets/stock_images/modern_luxury_house__28e541f9.jpg",
          titre: "Bienvenue chez KEYLOR",
          sousTitre: "Votre partenaire immobilier de confiance en Drôme, Ardèche et toute la France",
          ordre: 1,
          actif: true,
        },
        {
          imageUrl: "/assets/stock_images/modern_luxury_house__a62d2804.jpg",
          titre: "Des propriétés d'exception",
          sousTitre: "Découvrez notre sélection de biens immobiliers",
          ordre: 2,
          actif: true,
        },
        {
          imageUrl: "/assets/stock_images/modern_luxury_house__7da36a17.jpg",
          titre: "Un accompagnement sur mesure",
          sousTitre: "Vendre, louer, acheter ou faire gérer avec sérénité",
          ordre: 3,
          actif: true,
        },
      ];

      await this.db.insert(heroImages).values(sampleHeroImages);

      console.log('✅ Base de données initialisée avec les données de démonstration');
    } catch (error) {
      console.error('Erreur lors du seed de la base de données:', error);
    }
  }

  // Properties
  async getProperty(id: string): Promise<Property | undefined> {
    const result = await this.db.select().from(properties).where(eq(properties.id, id));
    return result[0];
  }

  async getAllProperties(): Promise<Property[]> {
    return await this.db.select().from(properties);
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const result = await this.db.insert(properties).values(property).returning();
    return result[0];
  }

  async updateProperty(id: string, property: Partial<InsertProperty>): Promise<Property | undefined> {
    const result = await this.db.update(properties).set(property).where(eq(properties.id, id)).returning();
    return result[0];
  }

  async deleteProperty(id: string): Promise<boolean> {
    const result = await this.db.delete(properties).where(eq(properties.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Appointments
  async getAppointment(id: string): Promise<Appointment | undefined> {
    const result = await this.db.select().from(appointments).where(eq(appointments.id, id));
    return result[0];
  }

  async getAllAppointments(): Promise<Appointment[]> {
    return await this.db.select().from(appointments);
  }

  async getAppointmentsByProperty(propertyId: string): Promise<Appointment[]> {
    return await this.db.select().from(appointments).where(eq(appointments.propertyId, propertyId));
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const result = await this.db.insert(appointments).values(appointment).returning();
    return result[0];
  }

  async updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const result = await this.db.update(appointments).set(appointment).where(eq(appointments.id, id)).returning();
    return result[0];
  }

  async deleteAppointment(id: string): Promise<boolean> {
    const result = await this.db.delete(appointments).where(eq(appointments.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Contacts
  async getContact(id: string): Promise<Contact | undefined> {
    const result = await this.db.select().from(contacts).where(eq(contacts.id, id));
    return result[0];
  }

  async getAllContacts(): Promise<Contact[]> {
    return await this.db.select().from(contacts);
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const result = await this.db.insert(contacts).values(contact).returning();
    return result[0];
  }

  async updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact | undefined> {
    const result = await this.db.update(contacts).set(contact).where(eq(contacts.id, id)).returning();
    return result[0];
  }

  async deleteContact(id: string): Promise<boolean> {
    const result = await this.db.delete(contacts).where(eq(contacts.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Estimations
  async getAllEstimations(): Promise<Estimation[]> {
    return await this.db.select().from(estimations);
  }

  async createEstimation(estimation: InsertEstimation): Promise<Estimation> {
    const result = await this.db.insert(estimations).values(estimation).returning();
    return result[0];
  }

  async updateEstimation(id: string, estimation: Partial<InsertEstimation>): Promise<Estimation | undefined> {
    const result = await this.db.update(estimations).set(estimation).where(eq(estimations.id, id)).returning();
    return result[0];
  }

  async deleteEstimation(id: string): Promise<boolean> {
    const result = await this.db.delete(estimations).where(eq(estimations.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Loan Simulations
  async getAllLoanSimulations(): Promise<LoanSimulation[]> {
    return await this.db.select().from(loanSimulations);
  }

  async createLoanSimulation(simulation: InsertLoanSimulation): Promise<LoanSimulation> {
    const result = await this.db.insert(loanSimulations).values(simulation).returning();
    return result[0];
  }

  async deleteLoanSimulation(id: string): Promise<boolean> {
    const result = await this.db.delete(loanSimulations).where(eq(loanSimulations.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Visit Availabilities
  async getVisitAvailability(id: string): Promise<VisitAvailability | undefined> {
    const result = await this.db.select().from(visitAvailability).where(eq(visitAvailability.id, id));
    return result[0];
  }

  async getAllVisitAvailabilities(): Promise<VisitAvailability[]> {
    return await this.db.select().from(visitAvailability);
  }

  async getVisitAvailabilitiesByDate(date: string): Promise<VisitAvailability[]> {
    return await this.db.select().from(visitAvailability).where(
      and(eq(visitAvailability.date, date), eq(visitAvailability.actif, true))
    );
  }

  async createVisitAvailability(availability: InsertVisitAvailability): Promise<VisitAvailability> {
    const result = await this.db.insert(visitAvailability).values(availability).returning();
    return result[0];
  }

  async updateVisitAvailability(id: string, availability: Partial<InsertVisitAvailability>): Promise<VisitAvailability | undefined> {
    const result = await this.db.update(visitAvailability).set(availability).where(eq(visitAvailability.id, id)).returning();
    return result[0];
  }

  async deleteVisitAvailability(id: string): Promise<boolean> {
    const result = await this.db.delete(visitAvailability).where(eq(visitAvailability.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Property Alerts
  async getPropertyAlert(id: string): Promise<PropertyAlert | undefined> {
    const result = await this.db.select().from(propertyAlerts).where(eq(propertyAlerts.id, id));
    return result[0];
  }

  async getAllPropertyAlerts(): Promise<PropertyAlert[]> {
    return await this.db.select().from(propertyAlerts);
  }

  async getActivePropertyAlerts(): Promise<PropertyAlert[]> {
    return await this.db.select().from(propertyAlerts).where(eq(propertyAlerts.active, true));
  }

  async createPropertyAlert(alert: InsertPropertyAlert): Promise<PropertyAlert> {
    const result = await this.db.insert(propertyAlerts).values(alert).returning();
    return result[0];
  }

  async updatePropertyAlert(id: string, alert: Partial<InsertPropertyAlert>): Promise<PropertyAlert | undefined> {
    const result = await this.db.update(propertyAlerts).set(alert).where(eq(propertyAlerts.id, id)).returning();
    return result[0];
  }

  async deletePropertyAlert(id: string): Promise<boolean> {
    const result = await this.db.delete(propertyAlerts).where(eq(propertyAlerts.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Pricing Scales
  async getPricingScale(id: string): Promise<PricingScale | undefined> {
    const result = await this.db.select().from(pricingScales).where(eq(pricingScales.id, id));
    return result[0];
  }

  async getAllPricingScales(): Promise<PricingScale[]> {
    return await this.db.select().from(pricingScales);
  }

  async getActivePricingScales(): Promise<PricingScale[]> {
    return await this.db.select().from(pricingScales).where(eq(pricingScales.actif, true));
  }

  async getPricingScalesByType(type: string): Promise<PricingScale[]> {
    return await this.db.select().from(pricingScales).where(eq(pricingScales.type, type));
  }

  async createPricingScale(scale: InsertPricingScale): Promise<PricingScale> {
    const result = await this.db.insert(pricingScales).values(scale).returning();
    return result[0];
  }

  async updatePricingScale(id: string, scale: Partial<InsertPricingScale>): Promise<PricingScale | undefined> {
    const result = await this.db.update(pricingScales).set(scale).where(eq(pricingScales.id, id)).returning();
    return result[0];
  }

  async deletePricingScale(id: string): Promise<boolean> {
    const result = await this.db.delete(pricingScales).where(eq(pricingScales.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Hero Images
  async getHeroImage(id: string): Promise<HeroImage | undefined> {
    const result = await this.db.select().from(heroImages).where(eq(heroImages.id, id));
    return result[0];
  }

  async getAllHeroImages(): Promise<HeroImage[]> {
    return await this.db.select().from(heroImages).orderBy(heroImages.ordre);
  }

  async getActiveHeroImages(): Promise<HeroImage[]> {
    return await this.db.select().from(heroImages).where(eq(heroImages.actif, true)).orderBy(heroImages.ordre);
  }

  async createHeroImage(image: InsertHeroImage): Promise<HeroImage> {
    const result = await this.db.insert(heroImages).values(image).returning();
    return result[0];
  }

  async updateHeroImage(id: string, image: Partial<InsertHeroImage>): Promise<HeroImage | undefined> {
    const result = await this.db.update(heroImages).set(image).where(eq(heroImages.id, id)).returning();
    return result[0];
  }

  async deleteHeroImage(id: string): Promise<boolean> {
    const result = await this.db.delete(heroImages).where(eq(heroImages.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Contact Carousel Images
  async getContactCarouselImage(id: string): Promise<ContactCarouselImage | undefined> {
    const result = await this.db.select().from(contactCarouselImages).where(eq(contactCarouselImages.id, id));
    return result[0];
  }

  async getAllContactCarouselImages(): Promise<ContactCarouselImage[]> {
    return await this.db.select().from(contactCarouselImages).orderBy(contactCarouselImages.ordre);
  }

  async getActiveContactCarouselImages(): Promise<ContactCarouselImage[]> {
    return await this.db.select().from(contactCarouselImages).where(eq(contactCarouselImages.actif, true)).orderBy(contactCarouselImages.ordre);
  }

  async createContactCarouselImage(image: InsertContactCarouselImage): Promise<ContactCarouselImage> {
    const result = await this.db.insert(contactCarouselImages).values(image).returning();
    return result[0];
  }

  async updateContactCarouselImage(id: string, image: Partial<InsertContactCarouselImage>): Promise<ContactCarouselImage | undefined> {
    const result = await this.db.update(contactCarouselImages).set(image).where(eq(contactCarouselImages.id, id)).returning();
    return result[0];
  }

  async deleteContactCarouselImage(id: string): Promise<boolean> {
    const result = await this.db.delete(contactCarouselImages).where(eq(contactCarouselImages.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Social Media Links
  async getSocialMediaLink(id: string): Promise<SocialMediaLink | undefined> {
    const result = await this.db.select().from(socialMediaLinks).where(eq(socialMediaLinks.id, id));
    return result[0];
  }

  async getAllSocialMediaLinks(): Promise<SocialMediaLink[]> {
    return await this.db.select().from(socialMediaLinks).orderBy(socialMediaLinks.ordre);
  }

  async getActiveSocialMediaLinks(): Promise<SocialMediaLink[]> {
    return await this.db.select().from(socialMediaLinks).where(eq(socialMediaLinks.actif, true)).orderBy(socialMediaLinks.ordre);
  }

  async createSocialMediaLink(link: InsertSocialMediaLink): Promise<SocialMediaLink> {
    const result = await this.db.insert(socialMediaLinks).values(link).returning();
    return result[0];
  }

  async updateSocialMediaLink(id: string, link: Partial<InsertSocialMediaLink>): Promise<SocialMediaLink | undefined> {
    const result = await this.db.update(socialMediaLinks).set(link).where(eq(socialMediaLinks.id, id)).returning();
    return result[0];
  }

  async deleteSocialMediaLink(id: string): Promise<boolean> {
    const result = await this.db.delete(socialMediaLinks).where(eq(socialMediaLinks.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Client Reviews
  async getClientReview(id: string): Promise<ClientReview | undefined> {
    const result = await this.db.select().from(clientReviews).where(eq(clientReviews.id, id));
    return result[0];
  }

  async getAllClientReviews(): Promise<ClientReview[]> {
    return await this.db.select().from(clientReviews).orderBy(clientReviews.ordre);
  }

  async getActiveClientReviews(): Promise<ClientReview[]> {
    return await this.db.select().from(clientReviews).where(eq(clientReviews.actif, true)).orderBy(clientReviews.ordre);
  }

  async createClientReview(review: InsertClientReview): Promise<ClientReview> {
    const result = await this.db.insert(clientReviews).values(review).returning();
    return result[0];
  }

  async updateClientReview(id: string, review: Partial<InsertClientReview>): Promise<ClientReview | undefined> {
    const result = await this.db.update(clientReviews).set(review).where(eq(clientReviews.id, id)).returning();
    return result[0];
  }

  async deleteClientReview(id: string): Promise<boolean> {
    const result = await this.db.delete(clientReviews).where(eq(clientReviews.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Seasonal Booking Requests
  private generateConfirmationCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async getSeasonalBookingRequest(id: string): Promise<SeasonalBookingRequest | undefined> {
    const result = await this.db.select().from(seasonalBookingRequests).where(eq(seasonalBookingRequests.id, id));
    return result[0];
  }

  async getSeasonalBookingRequestByCode(confirmationCode: string): Promise<SeasonalBookingRequest | undefined> {
    const result = await this.db.select().from(seasonalBookingRequests).where(eq(seasonalBookingRequests.confirmationCode, confirmationCode));
    return result[0];
  }

  async getAllSeasonalBookingRequests(): Promise<SeasonalBookingRequest[]> {
    return await this.db.select().from(seasonalBookingRequests).orderBy(seasonalBookingRequests.createdAt);
  }

  async getSeasonalBookingRequestsByProperty(propertyId: string): Promise<SeasonalBookingRequest[]> {
    return await this.db.select().from(seasonalBookingRequests).where(eq(seasonalBookingRequests.propertyId, propertyId)).orderBy(seasonalBookingRequests.createdAt);
  }

  async createSeasonalBookingRequest(request: InsertSeasonalBookingRequest): Promise<SeasonalBookingRequest> {
    let confirmationCode = this.generateConfirmationCode();
    
    while (await this.getSeasonalBookingRequestByCode(confirmationCode)) {
      confirmationCode = this.generateConfirmationCode();
    }
    
    const result = await this.db.insert(seasonalBookingRequests).values({
      ...request,
      confirmationCode,
    }).returning();
    return result[0];
  }

  async updateSeasonalBookingRequest(id: string, request: Partial<InsertSeasonalBookingRequest>): Promise<SeasonalBookingRequest | undefined> {
    const result = await this.db.update(seasonalBookingRequests).set(request).where(eq(seasonalBookingRequests.id, id)).returning();
    return result[0];
  }

  async confirmSeasonalBookingRequest(id: string): Promise<SeasonalBookingRequest | undefined> {
    const result = await this.db.update(seasonalBookingRequests)
      .set({ status: 'confirmee' })
      .where(eq(seasonalBookingRequests.id, id))
      .returning();
    return result[0];
  }

  async refuseSeasonalBookingRequest(id: string): Promise<SeasonalBookingRequest | undefined> {
    const result = await this.db.update(seasonalBookingRequests)
      .set({ status: 'refusee' })
      .where(eq(seasonalBookingRequests.id, id))
      .returning();
    return result[0];
  }

  async cancelSeasonalBookingRequest(id: string): Promise<SeasonalBookingRequest | undefined> {
    const result = await this.db.update(seasonalBookingRequests)
      .set({ status: 'annulee' })
      .where(eq(seasonalBookingRequests.id, id))
      .returning();
    return result[0];
  }

  async deleteSeasonalBookingRequest(id: string): Promise<boolean> {
    const result = await this.db.delete(seasonalBookingRequests).where(eq(seasonalBookingRequests.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Seasonal Availability
  async getSeasonalAvailability(id: string): Promise<SeasonalAvailability | undefined> {
    const result = await this.db.select().from(seasonalAvailability).where(eq(seasonalAvailability.id, id));
    return result[0];
  }

  async getAllSeasonalAvailabilities(): Promise<SeasonalAvailability[]> {
    return await this.db.select().from(seasonalAvailability).orderBy(seasonalAvailability.dateDebut);
  }

  async getSeasonalAvailabilitiesByProperty(propertyId: string): Promise<SeasonalAvailability[]> {
    return await this.db.select().from(seasonalAvailability).where(eq(seasonalAvailability.propertyId, propertyId)).orderBy(seasonalAvailability.dateDebut);
  }

  async createSeasonalAvailability(availability: InsertSeasonalAvailability): Promise<SeasonalAvailability> {
    const result = await this.db.insert(seasonalAvailability).values(availability).returning();
    return result[0];
  }

  async updateSeasonalAvailability(id: string, updates: Partial<InsertSeasonalAvailability>): Promise<SeasonalAvailability | undefined> {
    const result = await this.db.update(seasonalAvailability).set(updates).where(eq(seasonalAvailability.id, id)).returning();
    return result[0];
  }

  async deleteSeasonalAvailability(id: string): Promise<boolean> {
    const result = await this.db.delete(seasonalAvailability).where(eq(seasonalAvailability.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Rental Applications
  async getRentalApplication(id: string): Promise<RentalApplication | undefined> {
    const result = await this.db.select().from(rentalApplications).where(eq(rentalApplications.id, id));
    return result[0];
  }

  async getAllRentalApplications(): Promise<RentalApplication[]> {
    return await this.db.select().from(rentalApplications).orderBy(rentalApplications.createdAt);
  }

  async getRentalApplicationsByProperty(propertyId: string): Promise<RentalApplication[]> {
    return await this.db.select().from(rentalApplications).where(eq(rentalApplications.propertyId, propertyId)).orderBy(rentalApplications.createdAt);
  }

  async getRentalApplicationsByStatus(status: string): Promise<RentalApplication[]> {
    return await this.db.select().from(rentalApplications).where(eq(rentalApplications.statut, status)).orderBy(rentalApplications.createdAt);
  }

  async createRentalApplication(app: InsertRentalApplication): Promise<RentalApplication> {
    const result = await this.db.insert(rentalApplications).values(app).returning();
    return result[0];
  }

  async updateRentalApplication(id: string, updates: Partial<InsertRentalApplication & { score?: number; scoreDetail?: string; tauxEffort?: number; statutSolvabilite?: string }>): Promise<RentalApplication | undefined> {
    const result = await this.db.update(rentalApplications).set(updates).where(eq(rentalApplications.id, id)).returning();
    return result[0];
  }

  async deleteRentalApplication(id: string): Promise<boolean> {
    const result = await this.db.delete(rentalApplications).where(eq(rentalApplications.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

export const storage = new DBStorage();
