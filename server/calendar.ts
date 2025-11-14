/**
 * Génération de fichiers iCalendar (.ics) pour les rendez-vous
 */

import { Appointment } from "@shared/schema";
import { Property } from "@shared/schema";

interface CalendarEvent {
  summary: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  organizer: {
    name: string;
    email: string;
  };
  attendee: {
    name: string;
    email: string;
  };
}

/**
 * Formate une date au format iCalendar avec fuseau horaire local (YYYYMMDDTHHMMSS)
 * Note: On utilise le format sans Z (pas UTC) car c'est un événement local
 */
function formatICalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Génère un fichier iCalendar (.ics) pour un événement
 */
export function generateICalendarFile(event: CalendarEvent): string {
  const now = new Date();
  const dtstamp = formatICalDate(now);
  const dtstart = formatICalDate(event.startDate);
  const dtend = formatICalDate(event.endDate);
  const uid = `${Date.now()}@keylor.fr`;

  // Format iCalendar (RFC 5545) compatible avec tous les clients de calendrier
  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//KEYLOR//Gestion Immobiliere//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatICalDate(now)}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${event.summary}`,
    `DESCRIPTION:${event.description.replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')}`,
    `LOCATION:${event.location.replace(/,/g, '\\,').replace(/;/g, '\\;')}`,
    `ORGANIZER;CN="${event.organizer.name}":mailto:${event.organizer.email}`,
    `ATTENDEE;CN="${event.attendee.name}";ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${event.attendee.email}`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return icalContent;
}

/**
 * Génère un fichier iCalendar pour un rendez-vous de visite
 */
export function generateAppointmentICalendar(
  appointment: Appointment,
  property: Property,
  delegatedTo?: { name: string; email: string }
): string {
  // Combiner la date et l'heure pour créer les objets Date
  const [hours, minutes] = appointment.heure.split(':');
  
  // Créer la date en utilisant le format ISO pour éviter les problèmes de fuseau
  const dateParts = appointment.date.split('-');
  const startDate = new Date(
    parseInt(dateParts[0]), 
    parseInt(dateParts[1]) - 1, 
    parseInt(dateParts[2]),
    parseInt(hours),
    parseInt(minutes),
    0
  );
  
  // Fin de rendez-vous (1 heure par défaut)
  const endDate = new Date(startDate);
  endDate.setHours(startDate.getHours() + 1);

  const event: CalendarEvent = {
    summary: `Visite - ${property.titre}`,
    description: [
      `Visite de propriété`,
      ``,
      `Propriété : ${property.titre}`,
      `Adresse : ${property.localisation}, ${property.codePostal} ${property.ville}`,
      ``,
      `Client : ${appointment.nom}`,
      `Email : ${appointment.email}`,
      `Téléphone : ${appointment.telephone}`,
      appointment.message ? `\nMessage : ${appointment.message}` : '',
      delegatedTo ? `\nVisite déléguée à : ${delegatedTo.name}` : ''
    ].filter(Boolean).join('\n'),
    location: `${property.localisation}, ${property.codePostal} ${property.ville}`,
    startDate,
    endDate,
    organizer: {
      name: 'KEYLOR Immobilier',
      email: 'contact@keylor.fr'
    },
    attendee: {
      name: delegatedTo?.name || 'Agent KEYLOR',
      email: delegatedTo?.email || 'contact@keylor.fr'
    }
  };

  return generateICalendarFile(event);
}
