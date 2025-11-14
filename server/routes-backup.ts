import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth } from "./auth";
import { z } from "zod";
import {
  insertPropertySchema,
  insertAppointmentSchema,
  insertContactSchema,
  insertEstimationSchema,
  insertLoanSimulationSchema,
  insertVisitAvailabilitySchema,
  insertPropertyAlertSchema,
  insertPricingScaleSchema,
  insertHeroImageSchema,
  insertContactCarouselImageSchema,
  insertSocialMediaLinkSchema,
  insertClientReviewSchema,
  insertSeasonalBookingRequestSchema,
  insertSeasonalAvailabilitySchema,
} from "@shared/schema";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { sendBookingRequestEmail, sendBookingConfirmationEmail, sendBookingRefusalEmail, sendBookingCancellationEmail, sendAppointmentConfirmationEmails, sendAppointmentAdminConfirmationEmail, sendAppointmentCancellationEmail } from "./email";
import { calculateTravelTime, formatPropertyAddress } from "./routing";
import { generateAppointmentICalendar } from "./calendar";
import Mailjet from 'node-mailjet';

export async function registerRoutes(app: Express): Promise<Server> {
  // Configuration de l'authentification
  setupAuth(app);
  
  app.get("/api/properties", async (req, res) => {
    try {
      const properties = await storage.getAllProperties();
      res.json(properties);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération des propriétés" });
    }
  });

  app.get("/api/properties/:id", async (req, res) => {
    try {
      const property = await storage.getProperty(req.params.id);
      if (!property) {
        return res.status(404).json({ error: "Propriété non trouvée" });
      }
      res.json(property);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération de la propriété" });
    }
  });

  app.post("/api/properties", async (req, res) => {
    try {
      const validatedData = insertPropertySchema.parse(req.body);
      const property = await storage.createProperty(validatedData);
      res.status(201).json(property);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Données invalides", details: error });
      }
      res.status(500).json({ error: "Erreur lors de la création de la propriété" });
    }
  });

  app.patch("/api/properties/:id", async (req, res) => {
    try {
      const validatedData = insertPropertySchema.partial().parse(req.body);
      const property = await storage.updateProperty(req.params.id, validatedData);
      if (!property) {
        return res.status(404).json({ error: "Propriété non trouvée" });
      }
      res.json(property);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Données invalides", details: error });
      }
      res.status(500).json({ error: "Erreur lors de la mise à jour de la propriété" });
    }
  });

  app.delete("/api/properties/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProperty(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Propriété non trouvée" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la suppression de la propriété" });
    }
  });

  app.get("/api/appointments", async (req, res) => {
    try {
      const { propertyId } = req.query;
      if (propertyId && typeof propertyId === "string") {
        const appointments = await storage.getAppointmentsByProperty(propertyId);
        return res.json(appointments);
      }
      const appointments = await storage.getAllAppointments();
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération des rendez-vous" });
    }
  });

  app.get("/api/appointments/:id", async (req, res) => {
    try {
      const appointment = await storage.getAppointment(req.params.id);
      if (!appointment) {
        return res.status(404).json({ error: "Rendez-vous non trouvé" });
      }
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération du rendez-vous" });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      const validatedData = insertAppointmentSchema.parse(req.body);
      
      // VALIDATION : Vérifier que le créneau n'est pas déjà pris
      const allAppointments = await storage.getAllAppointments();
      const dateAppointments = allAppointments.filter(apt => apt.date === validatedData.date);
      
      // Récupérer les paramètres de disponibilité
      const allAvailabilities = await storage.getAllVisitAvailabilities();
      const activeAvailability = allAvailabilities.find(av => av.actif);
      
      if (activeAvailability) {
        const [newHour, newMin] = validatedData.heure.split(':').map(Number);
        const newTimeMinutes = newHour * 60 + newMin;
        const dureeVisite = activeAvailability.dureeVisite || 45;
        const margeSecurite = activeAvailability.margeSecurite || 15;
        
        // Calculer la période complète du nouveau RDV
        const nouveauRdvDebut = newTimeMinutes - margeSecurite;
        const nouveauRdvFin = newTimeMinutes + dureeVisite + margeSecurite;
        
        // Vérifier chaque RDV existant
        for (const existingApt of dateAppointments) {
          const [existingHour, existingMin] = existingApt.heure.split(':').map(Number);
          const existingTimeMinutes = existingHour * 60 + existingMin;
          
          // Calculer la période complète du RDV existant
          const existingBlocageDebut = existingTimeMinutes - margeSecurite;
          const existingBlocageFin = existingTimeMinutes + dureeVisite + margeSecurite;
          
          // Vérifier si les deux périodes se chevauchent
          if (nouveauRdvDebut < existingBlocageFin && nouveauRdvFin > existingBlocageDebut) {
            return res.status(409).json({ 
              error: "Ce créneau n'est plus disponible",
              message: `Un rendez-vous est déjà prévu à ${existingApt.heure}. Veuillez choisir un autre créneau.`
            });
          }
        }
      }
      
      const appointment = await storage.createAppointment(validatedData);
      
      // Récupérer la propriété pour les emails (sauf si RDV général)
      let property = null;
      if (validatedData.propertyId !== "general") {
        property = await storage.getProperty(validatedData.propertyId);
      }
      
      // Créer une pseudo-propriété pour les RDV généraux
      if (!property) {
        property = {
          id: "general",
          titre: "Consultation générale",
          ville: "À définir",
          localisation: "",
          codePostal: "",
          numeroRue: "",
        } as any;
      }
      
      // Générer le fichier iCalendar
      const delegatedTo = appointment.delegueEmail ? {
        name: appointment.delegueA || 'Agent KEYLOR',
        email: appointment.delegueEmail
      } : undefined;
      
      const icsContent = generateAppointmentICalendar(appointment, property, delegatedTo);
      console.log('[RDV] Fichier ICS généré:', icsContent.substring(0, 200) + '...');
      
      // Envoyer les emails de confirmation
      const emailResult = await sendAppointmentConfirmationEmails(appointment, property, icsContent, delegatedTo);
      console.log('[RDV] Email envoyé:', emailResult);
      
      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Données invalides", details: error });
      }
      res.status(500).json({ error: "Erreur lors de la création du rendez-vous" });
    }
  });

  app.patch("/api/appointments/:id", async (req, res) => {
    try {
      // Permettre la mise à jour du statut en plus des champs du insertAppointmentSchema
      const updateSchema = insertAppointmentSchema.partial().extend({
        statut: z.enum(['en_attente', 'confirmé', 'annulé']).optional()
      });
      const validatedData = updateSchema.parse(req.body);
      
      // Récupérer le RDV actuel pour comparer le statut
      const currentAppointment = await storage.getAppointment(req.params.id);
      if (!currentAppointment) {
        return res.status(404).json({ error: "Rendez-vous non trouvé" });
      }
      
      // Mettre à jour le RDV
      const appointment = await storage.updateAppointment(req.params.id, validatedData);
      if (!appointment) {
        return res.status(404).json({ error: "Rendez-vous non trouvé" });
      }
      
      // Si le statut passe à "confirmé", envoyer un email au client
      if (validatedData.statut === 'confirmé' && currentAppointment.statut !== 'confirmé') {
        console.log('[RDV] ✅ Changement de statut vers "confirmé" - Envoi email au client');
        
        // Récupérer la propriété pour l'email (sauf si RDV général)
        let property = null;
        if (appointment.propertyId !== "general") {
          property = await storage.getProperty(appointment.propertyId);
        }
        
        // Créer une pseudo-propriété pour les RDV généraux
        if (!property) {
          property = {
            id: "general",
            titre: "Consultation générale",
            ville: "À définir",
            localisation: "",
            codePostal: "",
            numeroRue: "",
          } as any;
        }
        
        // Générer le fichier iCalendar
        const delegatedTo = appointment.delegueEmail ? {
          name: appointment.delegueA || 'Agent KEYLOR',
          email: appointment.delegueEmail
        } : undefined;
        
        const icsContent = generateAppointmentICalendar(appointment, property, delegatedTo);
        
        // Envoyer l'email de confirmation
        const emailResult = await sendAppointmentAdminConfirmationEmail(appointment, property, icsContent, delegatedTo);
        console.log('[RDV] Email de confirmation admin envoyé:', emailResult);
      }
      
      // Si le statut passe à "annulé", envoyer un email au client
      if (validatedData.statut === 'annulé' && currentAppointment.statut !== 'annulé') {
        console.log('[RDV] ❌ Changement de statut vers "annulé" - Envoi email au client');
        
        // Récupérer la propriété pour l'email (sauf si RDV général)
        let property = null;
        if (appointment.propertyId !== "general") {
          property = await storage.getProperty(appointment.propertyId);
        }
        
        // Créer une pseudo-propriété pour les RDV généraux
        if (!property) {
          property = {
            id: "general",
            titre: "Consultation générale",
            ville: "À définir",
            localisation: "",
            codePostal: "",
            numeroRue: "",
          } as any;
        }
        
        // Envoyer l'email d'annulation
        const emailResult = await sendAppointmentCancellationEmail(appointment, property);
        console.log('[RDV] Email d\'annulation envoyé:', emailResult);
      }
      
      res.json(appointment);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Données invalides", details: error });
      }
      console.error('Error updating appointment:', error);
      res.status(500).json({ error: "Erreur lors de la mise à jour du rendez-vous" });
    }
  });

  app.delete("/api/appointments/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteAppointment(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Rendez-vous non trouvé" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la suppression du rendez-vous" });
    }
  });

  // Calculer les créneaux disponibles pour une propriété et une date
  app.get("/api/appointments/available-slots/:propertyId/:date", async (req, res) => {
    try {
      const { propertyId, date } = req.params;
      
      // Récupérer la propriété (sauf pour "general")
      let property = null;
      if (propertyId !== "general") {
        property = await storage.getProperty(propertyId);
        if (!property) {
          return res.status(404).json({ error: "Propriété non trouvée" });
        }
      }

      // Récupérer le jour de la semaine en français
      const targetDate = new Date(date + 'T12:00:00');
      const dayOfWeek = targetDate.getDay();
      const daysInFrench = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
      const dayName = daysInFrench[dayOfWeek];

      // Récupérer toutes les disponibilités pour ce jour
      const allAvailabilities = await storage.getAllVisitAvailabilities();
      const dayAvailabilities = allAvailabilities.filter(av => av.jourSemaine === dayName && av.actif);
      
      if (dayAvailabilities.length === 0) {
        return res.json({ slots: [] }); // Aucune disponibilité ce jour-là
      }

      // Récupérer tous les rendez-vous pour cette date
      const allAppointments = await storage.getAllAppointments();
      const dateAppointments = allAppointments.filter(apt => apt.date === date);

      // Trier les rendez-vous par heure
      dateAppointments.sort((a, b) => a.heure.localeCompare(b.heure));

      // Récupérer toutes les propriétés pour calculer les distances
      const allProperties = await storage.getAllProperties();
      
      // Utiliser les paramètres de la PREMIÈRE availability active (configuration globale)
      const globalConfig = dayAvailabilities[0];
      const dureeVisite = globalConfig.dureeVisite || 45;
      const margeSecurite = globalConfig.margeSecurite || 15;
      
      // Fonction async pour vérifier si un créneau est bloqué (temporellement OU géographiquement)
      const isTimeSlotBlocked = async (slotTimeMinutes: number, slotTimeStr: string): Promise<boolean> => {
        // Pour chaque RDV, vérifier chevauchement temporel ET faisabilité géographique
        for (const apt of dateAppointments) {
          const [aptHour, aptMin] = apt.heure.split(':').map(Number);
          const aptTimeMinutes = aptHour * 60 + aptMin;
          
          // Période bloquée du RDV existant
          const blocageDebut = aptTimeMinutes - margeSecurite;
          const blocageFin = aptTimeMinutes + dureeVisite + margeSecurite;
          
          // Période nécessaire pour le nouveau RDV
          const nouveauRdvDebut = slotTimeMinutes - margeSecurite;
          const nouveauRdvFin = slotTimeMinutes + dureeVisite + margeSecurite;
          
          // 1. Vérifier chevauchement temporel direct
          if (nouveauRdvDebut < blocageFin && nouveauRdvFin > blocageDebut) {
            return true; // Chevauchement temporel = bloqué
          }
          
          // 2. Vérifier faisabilité géographique pour RDV proches dans le temps
          // Ne pas vérifier la géographie pour les RDV "general"
          const timeDiff = Math.abs(slotTimeMinutes - aptTimeMinutes);
          
          // Si le RDV est dans les 3h avant/après, vérifier le temps de trajet
          if (timeDiff <= 180 && property) {
            const aptProperty = allProperties.find(p => p.id === apt.propertyId);
            
            if (aptProperty && property) {
              // Si ce ne sont pas les mêmes propriétés, calculer le trajet
              if (aptProperty.id !== property.id) {
                const fromAddress = formatPropertyAddress(
                  aptProperty.localisation,
                  aptProperty.codePostal,
                  aptProperty.ville,
                  aptProperty.numeroRue
                );
                const toAddress = formatPropertyAddress(
                  property.localisation,
                  property.codePostal,
                  property.ville,
                  property.numeroRue
                );
                
                const travelTime = await calculateTravelTime(fromAddress, toAddress);
                
                if (travelTime.success) {
                  // Temps de trajet en minutes
                  const tempsTrajet = travelTime.durationMinutes;
                  
                  // Déterminer l'ordre des RDV
                  if (slotTimeMinutes > aptTimeMinutes) {
                    // Nouveau RDV APRÈS le RDV existant
                    // Vérifier si on a le temps de finir le RDV précédent + trajet
                    const finRdvPrecedent = aptTimeMinutes + dureeVisite + margeSecurite;
                    const tempsNecessaire = finRdvPrecedent + tempsTrajet;
                    
                    if (slotTimeMinutes < tempsNecessaire) {
                      console.log(`[Trajet] Créneau ${slotTimeStr} bloqué: pas assez de temps après RDV ${apt.heure} (trajet: ${tempsTrajet} min)`);
                      return true; // Pas le temps de faire le trajet
                    }
                  } else {
                    // Nouveau RDV AVANT le RDV existant
                    // Vérifier si on a le temps de finir ce RDV + trajet avant le suivant
                    const finNouveauRdv = slotTimeMinutes + dureeVisite + margeSecurite;
                    const tempsNecessaire = finNouveauRdv + tempsTrajet;
                    
                    if (tempsNecessaire > aptTimeMinutes) {
                      console.log(`[Trajet] Créneau ${slotTimeStr} bloqué: pas assez de temps avant RDV ${apt.heure} (trajet: ${tempsTrajet} min)`);
                      return true; // Pas le temps de faire le trajet
                    }
                  }
                }
              }
            }
          }
        }
        return false; // Créneau libre
      };
      
      // Générer les créneaux horaires pour toutes les plages de disponibilité
      const slots: Array<{ time: string; available: boolean; priority: number }> = [];
      
      for (const dayAvailability of dayAvailabilities) {
        const [firstHour, firstMin] = dayAvailability.heureDebut.split(':').map(Number);
        const [lastHour, lastMin] = dayAvailability.heureFin.split(':').map(Number);
        const intervalMinutes = dayAvailability.intervalleCreneaux || 30;

        let currentHour = firstHour;
        let currentMin = firstMin;

        while (currentHour < lastHour || (currentHour === lastHour && currentMin <= lastMin)) {
          const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
          const timeInMinutes = currentHour * 60 + currentMin;
          
          // Vérifier si ce créneau est bloqué (temporellement OU géographiquement)
          const isBlocked = await isTimeSlotBlocked(timeInMinutes, timeStr);
          
          if (!isBlocked) {
            // Calculer le score de priorité pour ce créneau
            let priority = 0;
            
            // Trouver les RDV proches dans le temps (avant/après) - fenêtre de 90 min
            const nearbyAppointments = dateAppointments.filter(apt => {
              const [aptHour, aptMin] = apt.heure.split(':').map(Number);
              const aptTimeInMinutes = aptHour * 60 + aptMin;
              const timeDiff = Math.abs(timeInMinutes - aptTimeInMinutes);
              return timeDiff <= 90; // Dans les 90 minutes
            });
            
            // Pour chaque RDV proche, calculer la priorité basée sur la proximité géographique
            // Ne pas calculer la priorité géographique pour les RDV "general"
            if (property) {
              for (const nearbyApt of nearbyAppointments) {
                const nearbyProperty = allProperties.find(p => p.id === nearbyApt.propertyId);
                if (nearbyProperty && property) {
                  // Bonus important si même ville ET même code postal
                  if (nearbyProperty.ville === property.ville && nearbyProperty.codePostal === property.codePostal) {
                    priority += 15; // Très proche
                  } 
                  // Bonus moyen si même ville
                  else if (nearbyProperty.ville === property.ville) {
                    priority += 8; // Proche
                  }
                  // Bonus faible si même département (2 premiers chiffres du code postal)
                  else if (nearbyProperty.codePostal.substring(0, 2) === property.codePostal.substring(0, 2)) {
                    priority += 3; // Assez proche
                  }
                }
              }
            }
            
            slots.push({
              time: timeStr,
              available: true,
              priority
            });
          }

          // Incrémenter par l'intervalle configuré
          currentMin += intervalMinutes;
          if (currentMin >= 60) {
            currentMin = 0;
            currentHour += 1;
          }
        }
      }
      
      // Trier les créneaux par priorité (optimisation des trajets) puis par heure
      slots.sort((a, b) => {
        if (b.priority !== a.priority) {
          return b.priority - a.priority; // Priorité décroissante
        }
        return a.time.localeCompare(b.time); // Heure croissante
      });
      
      // Log pour debug
      if (slots.some(s => s.priority > 0) && property) {
        console.log(`[Optimisation] ${slots.filter(s => s.priority > 0).length} créneaux optimisés trouvés pour ${property.ville}`);
      }

      res.json({ slots });
    } catch (error) {
      console.error('Error calculating available slots:', error);
      res.status(500).json({ error: "Erreur lors du calcul des créneaux disponibles" });
    }
  });

  app.get("/api/contacts", async (req, res) => {
    try {
      const contacts = await storage.getAllContacts();
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération des contacts" });
    }
  });

  app.get("/api/contacts/:id", async (req, res) => {
    try {
      const contact = await storage.getContact(req.params.id);
      if (!contact) {
        return res.status(404).json({ error: "Contact non trouvé" });
      }
      res.json(contact);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération du contact" });
    }
  });

  app.post("/api/contacts", async (req, res) => {
    try {
      const validatedData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(validatedData);
      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Données invalides", details: error });
      }
      res.status(500).json({ error: "Erreur lors de la création du contact" });
    }
  });

  app.patch("/api/contacts/:id", async (req, res) => {
    try {
      const validatedData = insertContactSchema.partial().parse(req.body);
      const contact = await storage.updateContact(req.params.id, validatedData);
      if (!contact) {
        return res.status(404).json({ error: "Contact non trouvé" });
      }
      res.json(contact);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Données invalides", details: error });
      }
      res.status(500).json({ error: "Erreur lors de la mise à jour du contact" });
    }
  });

  app.delete("/api/contacts/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteContact(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Contact non trouvé" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la suppression du contact" });
    }
  });

  // Estimations routes
  app.get("/api/estimations", async (req, res) => {
    try {
      const estimations = await storage.getAllEstimations();
      res.json(estimations);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération des estimations" });
    }
  });

  app.post("/api/estimations", async (req, res) => {
    try {
      const validatedData = insertEstimationSchema.parse(req.body);
      const estimation = await storage.createEstimation(validatedData);
      res.status(201).json(estimation);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Données invalides", details: error });
      }
      res.status(500).json({ error: "Erreur lors de la création de l'estimation" });
    }
  });

  app.patch("/api/estimations/:id", async (req, res) => {
    try {
      const validatedData = insertEstimationSchema.partial().parse(req.body);
      const estimation = await storage.updateEstimation(req.params.id, validatedData);
      if (!estimation) {
        return res.status(404).json({ error: "Estimation non trouvée" });
      }
      res.json(estimation);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Données invalides", details: error });
      }
      res.status(500).json({ error: "Erreur lors de la mise à jour de l'estimation" });
    }
  });

  app.delete("/api/estimations/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteEstimation(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Estimation non trouvée" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la suppression de l'estimation" });
    }
  });

  // Loan simulations routes
  app.get("/api/loan-simulations", async (req, res) => {
    try {
      const simulations = await storage.getAllLoanSimulations();
      res.json(simulations);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération des simulations" });
    }
  });

  app.post("/api/loan-simulations", async (req, res) => {
    try {
      const validatedData = insertLoanSimulationSchema.parse(req.body);
      const simulation = await storage.createLoanSimulation(validatedData);
      res.status(201).json(simulation);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Données invalides", details: error });
      }
      res.status(500).json({ error: "Erreur lors de la création de la simulation" });
    }
  });

  app.delete("/api/loan-simulations/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteLoanSimulation(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Simulation non trouvée" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la suppression de la simulation" });
    }
  });

  // Visit availability routes
  app.get("/api/visit-availability", async (req, res) => {
    try {
      const { date } = req.query;
      if (date && typeof date === 'string') {
        const availabilities = await storage.getVisitAvailabilitiesByDate(date);
        return res.json(availabilities);
      }
      const availabilities = await storage.getAllVisitAvailabilities();
      res.json(availabilities);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération des disponibilités" });
    }
  });

  app.post("/api/visit-availability", requireAuth, async (req, res) => {
    try {
      const validatedData = insertVisitAvailabilitySchema.parse(req.body);
      const availability = await storage.createVisitAvailability(validatedData);
      res.status(201).json(availability);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Données invalides", details: error });
      }
      res.status(500).json({ error: "Erreur lors de la création de la disponibilité" });
    }
  });

  app.patch("/api/visit-availability/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = insertVisitAvailabilitySchema.partial().parse(req.body);
      const availability = await storage.updateVisitAvailability(req.params.id, validatedData);
      if (!availability) {
        return res.status(404).json({ error: "Disponibilité non trouvée" });
      }
      res.json(availability);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Données invalides", details: error });
      }
      res.status(500).json({ error: "Erreur lors de la mise à jour de la disponibilité" });
    }
  });

  app.delete("/api/visit-availability/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteVisitAvailability(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Disponibilité non trouvée" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la suppression de la disponibilité" });
    }
  });

  // Property alerts routes
  app.get("/api/property-alerts", async (req, res) => {
    try {
      const { active } = req.query;
      if (active === 'true') {
        const alerts = await storage.getActivePropertyAlerts();
        return res.json(alerts);
      }
      const alerts = await storage.getAllPropertyAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération des alertes" });
    }
  });

  app.get("/api/property-alerts/:id", async (req, res) => {
    try {
      const alert = await storage.getPropertyAlert(req.params.id);
      if (!alert) {
        return res.status(404).json({ error: "Alerte non trouvée" });
      }
      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération de l'alerte" });
    }
  });

  app.post("/api/property-alerts", async (req, res) => {
    try {
      const validatedData = insertPropertyAlertSchema.parse(req.body);
      const alert = await storage.createPropertyAlert(validatedData);
      res.status(201).json(alert);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Données invalides", details: error });
      }
      res.status(500).json({ error: "Erreur lors de la création de l'alerte" });
    }
  });

  app.patch("/api/property-alerts/:id", async (req, res) => {
    try {
      const validatedData = insertPropertyAlertSchema.partial().parse(req.body);
      const alert = await storage.updatePropertyAlert(req.params.id, validatedData);
      if (!alert) {
        return res.status(404).json({ error: "Alerte non trouvée" });
      }
      res.json(alert);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Données invalides", details: error });
      }
      res.status(500).json({ error: "Erreur lors de la mise à jour de l'alerte" });
    }
  });

  app.delete("/api/property-alerts/:id", async (req, res) => {
    try {
      const deleted = await storage.deletePropertyAlert(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Alerte non trouvée" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la suppression de l'alerte" });
    }
  });

  // Pricing scales routes
  app.get("/api/pricing-scales", async (req, res) => {
    try {
      const { type, active } = req.query;
      let scales;
      
      if (active === 'true') {
        scales = await storage.getActivePricingScales();
      } else if (type) {
        scales = await storage.getPricingScalesByType(type as string);
      } else {
        scales = await storage.getAllPricingScales();
      }
      
      res.json(scales);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération des barèmes" });
    }
  });

  app.get("/api/pricing-scales/:id", async (req, res) => {
    try {
      const scale = await storage.getPricingScale(req.params.id);
      if (!scale) {
        return res.status(404).json({ error: "Barème non trouvé" });
      }
      res.json(scale);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération du barème" });
    }
  });

  app.post("/api/pricing-scales", requireAuth, async (req, res) => {
    try {
      const validatedData = insertPricingScaleSchema.parse(req.body);
      const scale = await storage.createPricingScale(validatedData);
      res.status(201).json(scale);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Données invalides", details: error });
      }
      res.status(500).json({ error: "Erreur lors de la création du barème" });
    }
  });

  app.patch("/api/pricing-scales/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = insertPricingScaleSchema.partial().parse(req.body);
      const scale = await storage.updatePricingScale(req.params.id, validatedData);
      if (!scale) {
        return res.status(404).json({ error: "Barème non trouvé" });
      }
      res.json(scale);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Données invalides", details: error });
      }
      res.status(500).json({ error: "Erreur lors de la mise à jour du barème" });
    }
  });

  app.delete("/api/pricing-scales/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deletePricingScale(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Barème non trouvé" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la suppression du barème" });
    }
  });

  // Hero Images
  app.get("/api/hero-images", async (req, res) => {
    try {
      const activeOnly = req.query.active === "true";
      const images = activeOnly 
        ? await storage.getActiveHeroImages()
        : await storage.getAllHeroImages();
      res.json(images);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération des images" });
    }
  });

  app.get("/api/hero-images/:id", async (req, res) => {
    try {
      const image = await storage.getHeroImage(req.params.id);
      if (!image) {
        return res.status(404).json({ error: "Image non trouvée" });
      }
      res.json(image);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération de l'image" });
    }
  });

  app.post("/api/hero-images", requireAuth, async (req, res) => {
    try {
      const validatedData = insertHeroImageSchema.parse(req.body);
      const image = await storage.createHeroImage(validatedData);
      res.status(201).json(image);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Données invalides", details: error });
      }
      res.status(500).json({ error: "Erreur lors de la création de l'image" });
    }
  });

  app.patch("/api/hero-images/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = insertHeroImageSchema.partial().parse(req.body);
      const image = await storage.updateHeroImage(req.params.id, validatedData);
      if (!image) {
        return res.status(404).json({ error: "Image non trouvée" });
      }
      res.json(image);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Données invalides", details: error });
      }
      res.status(500).json({ error: "Erreur lors de la mise à jour de l'image" });
    }
  });

  app.delete("/api/hero-images/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteHeroImage(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Image non trouvée" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la suppression de l'image" });
    }
  });

  // Contact Carousel Images
  app.get("/api/contact-carousel-images", async (req, res) => {
    try {
      const activeOnly = req.query.active === "true";
      const images = activeOnly 
        ? await storage.getActiveContactCarouselImages()
        : await storage.getAllContactCarouselImages();
      res.json(images);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération des images" });
    }
  });

  app.get("/api/contact-carousel-images/:id", async (req, res) => {
    try {
      const image = await storage.getContactCarouselImage(req.params.id);
      if (!image) {
        return res.status(404).json({ error: "Image non trouvée" });
      }
      res.json(image);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération de l'image" });
    }
  });

  app.post("/api/contact-carousel-images", requireAuth, async (req, res) => {
    try {
      const validatedData = insertContactCarouselImageSchema.parse(req.body);
      const image = await storage.createContactCarouselImage(validatedData);
      res.status(201).json(image);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Données invalides", details: error });
      }
      res.status(500).json({ error: "Erreur lors de la création de l'image" });
    }
  });

  app.patch("/api/contact-carousel-images/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = insertContactCarouselImageSchema.partial().parse(req.body);
      const image = await storage.updateContactCarouselImage(req.params.id, validatedData);
      if (!image) {
        return res.status(404).json({ error: "Image non trouvée" });
      }
      res.json(image);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Données invalides", details: error });
      }
      res.status(500).json({ error: "Erreur lors de la mise à jour de l'image" });
    }
  });

  app.delete("/api/contact-carousel-images/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteContactCarouselImage(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Image non trouvée" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la suppression de l'image" });
    }
  });

  // AI Estimation endpoint
  app.post("/api/estimate-ai", async (req, res) => {
    try {
      const { mode, typeLogement, surface, ville, secteur, dpe, qualite } = req.body;

      // Import OpenAI dynamically
      const { default: OpenAI } = await import("openai");
      
      const openai = new OpenAI({
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      });

      // Construct optimized prompt for AI
      const prompt = `Tu es un expert en estimation immobilière en France. 

ÉTAPE 1 - VALIDATION CRITIQUE:
Vérifie d'abord si "${ville}" est une vraie ville française qui existe.
Si la ville n'existe PAS en France ou semble fictive/inventée, réponds UNIQUEMENT:
{
  "error": true,
  "message": "Ville non reconnue. Veuillez saisir une ville française valide."
}

ÉTAPE 2 - ESTIMATION (seulement si la ville existe):
Analyse les données suivantes et fournis UNE FOURCHETTE LARGE (jamais un prix précis) :

MODE: ${mode === "vente" ? "Prix de vente" : "Loyer mensuel"}
Type: ${typeLogement}
Surface: ${surface} m²
Localisation: ${ville}, secteur ${secteur}
DPE: ${dpe || "Non communiqué"}
État: ${qualite}

INSTRUCTIONS CRITIQUES:
1. Donne TOUJOURS une fourchette large (au moins 20-30% d'écart entre min et max)
2. JAMAIS de prix précis, toujours des fourchettes
3. Pour la vente: exprime en euros (ex: 180 000 € - 240 000 €)
4. Pour la location: exprime en loyer mensuel hors charges (ex: 650 € - 850 €)
5. Explique brièvement les facteurs de marché RÉELS de cette ville
6. Fournis 4-6 facteurs clés pris en compte
7. Recommande TOUJOURS de contacter un expert pour une estimation précise

Réponds au format JSON exact suivant:
{
  "mode": "${mode}",
  "fourchetteBasse": [nombre],
  "fourchetteHaute": [nombre],
  "explication": "Explication courte du marché local (2-3 phrases max)",
  "facteurs": ["facteur 1", "facteur 2", "facteur 3", "facteur 4"],
  "recommandation": "Recommandation pour affiner l'estimation (1-2 phrases)"
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Tu es un expert immobilier français. Tu fournis UNIQUEMENT des fourchettes larges, jamais de prix précis. Réponds uniquement en JSON valide."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800,
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error("Pas de réponse de l'IA");
      }

      // Parse JSON response
      const result = JSON.parse(responseText);

      // Check if AI detected invalid city
      if (result.error) {
        return res.status(400).json({ 
          error: result.message || "Ville non reconnue. Veuillez saisir une ville française valide."
        });
      }

      res.json(result);
    } catch (error) {
      console.error("Erreur estimation IA:", error);
      res.status(500).json({ error: "Erreur lors de l'estimation IA" });
    }
  });

  // Social Media Links Routes
  app.get("/api/social-links", async (req, res) => {
    try {
      const links = await storage.getAllSocialMediaLinks();
      res.json(links);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération des liens réseaux sociaux" });
    }
  });

  app.get("/api/social-links/active", async (req, res) => {
    try {
      const links = await storage.getActiveSocialMediaLinks();
      res.json(links);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération des liens actifs" });
    }
  });

  app.post("/api/social-links", requireAuth, async (req, res) => {
    try {
      const validatedData = insertSocialMediaLinkSchema.parse(req.body);
      const link = await storage.createSocialMediaLink(validatedData);
      res.status(201).json(link);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Données invalides", details: error });
      }
      res.status(500).json({ error: "Erreur lors de la création du lien" });
    }
  });

  app.patch("/api/social-links/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = insertSocialMediaLinkSchema.partial().parse(req.body);
      const link = await storage.updateSocialMediaLink(req.params.id, validatedData);
      if (!link) {
        return res.status(404).json({ error: "Lien non trouvé" });
      }
      res.json(link);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Données invalides", details: error });
      }
      res.status(500).json({ error: "Erreur lors de la mise à jour du lien" });
    }
  });

  app.delete("/api/social-links/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteSocialMediaLink(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Lien non trouvé" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la suppression du lien" });
    }
  });

  // Client Reviews Routes
  app.get("/api/reviews", async (req, res) => {
    try {
      const reviews = await storage.getAllClientReviews();
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération des avis" });
    }
  });

  app.get("/api/reviews/active", async (req, res) => {
    try {
      const reviews = await storage.getActiveClientReviews();
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération des avis actifs" });
    }
  });

  app.post("/api/reviews", requireAuth, async (req, res) => {
    try {
      const validatedData = insertClientReviewSchema.parse(req.body);
      const review = await storage.createClientReview(validatedData);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Données invalides", details: error });
      }
      res.status(500).json({ error: "Erreur lors de la création de l'avis" });
    }
  });

  app.patch("/api/reviews/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = insertClientReviewSchema.partial().parse(req.body);
      const review = await storage.updateClientReview(req.params.id, validatedData);
      if (!review) {
        return res.status(404).json({ error: "Avis non trouvé" });
      }
      res.json(review);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Données invalides", details: error });
      }
      res.status(500).json({ error: "Erreur lors de la mise à jour de l'avis" });
    }
  });

  app.delete("/api/reviews/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteClientReview(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Avis non trouvé" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la suppression de l'avis" });
    }
  });

  // Seasonal Booking Requests Routes
  app.get("/api/seasonal-booking-requests", requireAuth, async (req, res) => {
    try {
      const requests = await storage.getAllSeasonalBookingRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération des demandes de réservation" });
    }
  });

  app.get("/api/seasonal-booking-requests/:id", requireAuth, async (req, res) => {
    try {
      const request = await storage.getSeasonalBookingRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Demande non trouvée" });
      }
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération de la demande" });
    }
  });

  app.post("/api/seasonal-booking-requests", async (req, res) => {
    try {
      const validatedData = insertSeasonalBookingRequestSchema.parse(req.body);
      
      // Vérifier les conflits de dates avec d'autres réservations
      const existingBookings = await storage.getSeasonalBookingRequestsByProperty(validatedData.propertyId);
      const requestCheckIn = new Date(validatedData.checkIn);
      const requestCheckOut = new Date(validatedData.checkOut);
      
      const hasConflict = existingBookings.some(booking => {
        // Ne vérifier que les réservations en attente ou confirmées
        if (booking.status !== 'en_attente' && booking.status !== 'pending' && 
            booking.status !== 'confirmee' && booking.status !== 'confirmed') {
          return false;
        }
        
        const bookingCheckIn = new Date(booking.checkIn);
        const bookingCheckOut = new Date(booking.checkOut);
        
        // Vérifier si les dates se chevauchent
        return (requestCheckIn < bookingCheckOut && requestCheckOut > bookingCheckIn);
      });
      
      if (hasConflict) {
        return res.status(409).json({ 
          error: "Ces dates ne sont plus disponibles. Une autre réservation existe déjà pour cette période." 
        });
      }
      
      const request = await storage.createSeasonalBookingRequest(validatedData);
      
      // Créer automatiquement une période bloquée pour cette réservation
      await storage.createSeasonalAvailability({
        propertyId: request.propertyId,
        dateDebut: request.checkIn,
        dateFin: request.checkOut,
        bloque: true,
        motif: `Réservation ${request.confirmationCode}`,
        notes: `bookingId:${request.id}`, // Lier à la réservation dans notes
      });
      
      const property = await storage.getProperty(request.propertyId);
      if (property) {
        await sendBookingRequestEmail(request, property);
      }
      
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Données invalides", details: error });
      }
      res.status(500).json({ error: "Erreur lors de la création de la demande" });
    }
  });

  app.patch("/api/seasonal-booking-requests/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = insertSeasonalBookingRequestSchema.partial().parse(req.body);
      const request = await storage.updateSeasonalBookingRequest(req.params.id, validatedData);
      if (!request) {
        return res.status(404).json({ error: "Demande non trouvée" });
      }
      res.json(request);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Données invalides", details: error });
      }
      res.status(500).json({ error: "Erreur lors de la mise à jour de la demande" });
    }
  });

  app.delete("/api/seasonal-booking-requests/:id", requireAuth, async (req, res) => {
    try {
      // Récupérer la réservation avant de la supprimer pour libérer les dates
      const booking = await storage.getSeasonalBookingRequest(req.params.id);
      if (!booking) {
        return res.status(404).json({ error: "Demande non trouvée" });
      }
      
      const deleted = await storage.deleteSeasonalBookingRequest(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Demande non trouvée" });
      }
      
      // Libérer les dates en supprimant la période bloquée associée
      const availabilities = await storage.getSeasonalAvailabilitiesByProperty(booking.propertyId);
      const linkedAvailability = availabilities.find(a => a.notes?.includes(`bookingId:${booking.id}`));
      if (linkedAvailability) {
        await storage.deleteSeasonalAvailability(linkedAvailability.id);
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la suppression de la demande" });
    }
  });

  // Récupérer une réservation par code de confirmation (public pour client)
  app.get("/api/seasonal-booking-requests/code/:confirmationCode", async (req, res) => {
    try {
      const request = await storage.getSeasonalBookingRequestByCode(req.params.confirmationCode);
      if (!request) {
        return res.status(404).json({ error: "Réservation non trouvée" });
      }
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération de la réservation" });
    }
  });

  // Confirmer une réservation (admin uniquement)
  app.put("/api/seasonal-booking-requests/:id/confirm", requireAuth, async (req, res) => {
    try {
      console.log('=== CONFIRM ROUTE: Starting confirmation for booking:', req.params.id);
      const request = await storage.confirmSeasonalBookingRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Demande non trouvée" });
      }
      
      console.log('=== CONFIRM ROUTE: Booking confirmed, fetching property:', request.propertyId);
      const property = await storage.getProperty(request.propertyId);
      if (property) {
        console.log('=== CONFIRM ROUTE: Property found, sending confirmation email...');
        const result = await sendBookingConfirmationEmail(request, property);
        console.log('=== CONFIRM ROUTE: Email send result:', result);
      } else {
        console.log('=== CONFIRM ROUTE: Property NOT found!');
      }
      
      res.json(request);
    } catch (error) {
      console.error('=== CONFIRM ROUTE ERROR:', error);
      res.status(500).json({ error: "Erreur lors de la confirmation de la réservation" });
    }
  });

  // Refuser une réservation (admin uniquement)
  app.put("/api/seasonal-booking-requests/:id/refuse", requireAuth, async (req, res) => {
    try {
      console.log('=== REFUSE ROUTE: Starting refusal for booking:', req.params.id);
      const request = await storage.refuseSeasonalBookingRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Demande non trouvée" });
      }
      
      // Libérer les dates en supprimant la période bloquée associée
      const availabilities = await storage.getSeasonalAvailabilitiesByProperty(request.propertyId);
      const linkedAvailability = availabilities.find(a => a.notes?.includes(`bookingId:${request.id}`));
      if (linkedAvailability) {
        await storage.deleteSeasonalAvailability(linkedAvailability.id);
        console.log('=== REFUSE ROUTE: Released blocked dates for booking:', request.id);
      }
      
      console.log('=== REFUSE ROUTE: Booking refused, fetching property:', request.propertyId);
      const property = await storage.getProperty(request.propertyId);
      if (property) {
        console.log('=== REFUSE ROUTE: Property found, sending refusal email...');
        const reason = req.body.reason;
        const result = await sendBookingRefusalEmail(request, property, reason);
        console.log('=== REFUSE ROUTE: Email send result:', result);
      } else {
        console.log('=== REFUSE ROUTE: Property NOT found!');
      }
      
      res.json(request);
    } catch (error) {
      console.error('=== REFUSE ROUTE ERROR:', error);
      res.status(500).json({ error: "Erreur lors du refus de la réservation" });
    }
  });

  // Annuler une réservation (public pour client avec code, ou admin)
  app.put("/api/seasonal-booking-requests/:id/cancel", async (req, res) => {
    try {
      const request = await storage.cancelSeasonalBookingRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Demande non trouvée" });
      }
      
      // Libérer les dates en supprimant la période bloquée associée
      const availabilities = await storage.getSeasonalAvailabilitiesByProperty(request.propertyId);
      const linkedAvailability = availabilities.find(a => a.notes?.includes(`bookingId:${request.id}`));
      if (linkedAvailability) {
        await storage.deleteSeasonalAvailability(linkedAvailability.id);
      }
      
      const property = await storage.getProperty(request.propertyId);
      if (property) {
        await sendBookingCancellationEmail(request, property);
      }
      
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de l'annulation de la réservation" });
    }
  });

  // Seasonal Availability Routes
  app.get("/api/seasonal-availability", async (req, res) => {
    try {
      const { propertyId } = req.query;
      if (propertyId && typeof propertyId === 'string') {
        const availabilities = await storage.getSeasonalAvailabilitiesByProperty(propertyId);
        return res.json(availabilities);
      }
      const availabilities = await storage.getAllSeasonalAvailabilities();
      res.json(availabilities);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération des disponibilités" });
    }
  });

  app.post("/api/seasonal-availability", requireAuth, async (req, res) => {
    try {
      const validatedData = insertSeasonalAvailabilitySchema.parse(req.body);
      const availability = await storage.createSeasonalAvailability(validatedData);
      res.status(201).json(availability);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Données invalides", details: error });
      }
      res.status(500).json({ error: "Erreur lors de la création de la disponibilité" });
    }
  });

  app.patch("/api/seasonal-availability/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = insertSeasonalAvailabilitySchema.partial().parse(req.body);
      const availability = await storage.updateSeasonalAvailability(req.params.id, validatedData);
      if (!availability) {
        return res.status(404).json({ error: "Disponibilité non trouvée" });
      }
      res.json(availability);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ error: "Données invalides", details: error });
      }
      res.status(500).json({ error: "Erreur lors de la mise à jour de la disponibilité" });
    }
  });

  app.delete("/api/seasonal-availability/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteSeasonalAvailability(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Disponibilité non trouvée" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la suppression de la disponibilité" });
    }
  });

  // Send planning by email
  app.post("/api/send-planning-email", requireAuth, async (req, res) => {
    try {
      const { recipientEmail, planningType, monthYear, htmlContent, subject } = req.body;
      
      if (!recipientEmail || !planningType || !htmlContent || !subject) {
        return res.status(400).json({ error: "Données manquantes" });
      }

      const mailjet = Mailjet.apiConnect(
        process.env.MAILJET_API_KEY || '',
        process.env.MAILJET_SECRET_KEY || ''
      );

      await mailjet
        .post('send', { version: 'v3.1' })
        .request({
          Messages: [
            {
              From: {
                Email: 'contact@keylor.fr',
                Name: 'KEYLOR - Gestion Immobilière'
              },
              To: [
                {
                  Email: recipientEmail
                }
              ],
              Subject: subject,
              HTMLPart: htmlContent
            }
          ]
        });

      res.json({ success: true });
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email:", error);
      res.status(500).json({ error: "Erreur lors de l'envoi de l'email" });
    }
  });

  // Object Storage Routes - Image Upload
  // Get upload URL for image upload (protected - requires authentication)
  app.post("/api/upload/get-url", requireAuth, async (req, res) => {
    try {
      const { fileExtension } = req.body;
      const ext = fileExtension || "jpg";
      const objectStorageService = new ObjectStorageService();
      const { uploadURL, objectPath } = await objectStorageService.getObjectEntityUploadURL(ext);
      res.json({ uploadURL, objectPath });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Erreur lors de la génération de l'URL d'upload" });
    }
  });

  // Serve uploaded objects (images) - public access
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error retrieving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
