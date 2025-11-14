import { Property } from "@shared/schema";

interface AvailabilityPeriod {
  startDate: string;
  endDate: string;
}

export function isPropertyAvailable(
  property: Property,
  checkIn: Date | null,
  checkOut: Date | null
): boolean {
  // Si pas de dates sélectionnées, on affiche tout
  if (!checkIn || !checkOut) {
    return true;
  }

  // Seulement pour location saisonnière
  if (property.transactionType !== "location_saisonniere") {
    return true;
  }

  // Vérifier que les dates sont valides
  if (checkOut <= checkIn) {
    return false;
  }

  // 1. Vérifier que les dates tombent dans une période de disponibilité
  const availabilityPeriods = (property as any).availabilityPeriods as AvailabilityPeriod[] | undefined;
  if (availabilityPeriods && availabilityPeriods.length > 0) {
    const isInAvailabilityPeriod = availabilityPeriods.some((period: AvailabilityPeriod) => {
      const startDate = new Date(period.startDate);
      const endDate = new Date(period.endDate);
      
      // Les dates demandées doivent être complètement dans la période
      return checkIn >= startDate && checkOut <= endDate;
    });

    if (!isInAvailabilityPeriod) {
      return false;
    }
  }

  // 2. Vérifier qu'il n'y a pas de réservation confirmée qui chevauche
  // Note: Dans le contexte frontend, on n'a pas accès aux bookings des autres clients
  // Cette vérification devrait idéalement être faite côté backend
  // Pour l'instant on considère que si c'est dans availabilityPeriods, c'est dispo

  // 3. Vérifier les contraintes de jour d'arrivée/départ (si définies)
  const allowedArrivalDays = (property as any).allowedArrivalDays as string[] | undefined;
  if (allowedArrivalDays && allowedArrivalDays.length > 0) {
    const arrivalDay = checkIn.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
    const dayNames = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
    const arrivalDayName = dayNames[arrivalDay];
    
    if (!allowedArrivalDays.includes(arrivalDayName)) {
      return false;
    }
  }

  const allowedDepartureDays = (property as any).allowedDepartureDays as string[] | undefined;
  if (allowedDepartureDays && allowedDepartureDays.length > 0) {
    const departureDay = checkOut.getDay();
    const dayNames = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
    const departureDayName = dayNames[departureDay];
    
    if (!allowedDepartureDays.includes(departureDayName)) {
      return false;
    }
  }

  // 4. Vérifier la durée minimale de séjour
  const minStayDays = (property as any).minStayDays as number | undefined;
  if (minStayDays) {
    const stayDuration = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    if (stayDuration < minStayDays) {
      return false;
    }
  }

  return true;
}
