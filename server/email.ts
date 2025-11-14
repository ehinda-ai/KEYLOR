import Mailjet from 'node-mailjet';
import type { SeasonalBookingRequest, Property, Appointment } from '@shared/schema';

// Configuration Mailjet
const MAILJET_API_KEY = process.env.MAILJET_API_KEY;
const MAILJET_SECRET_KEY = process.env.MAILJET_SECRET_KEY;

if (!MAILJET_API_KEY || !MAILJET_SECRET_KEY) {
  console.error('⚠️ MAILJET_API_KEY ou MAILJET_SECRET_KEY manquant dans les variables d\'environnement');
}

const mailjet = Mailjet.apiConnect(
  MAILJET_API_KEY || '',
  MAILJET_SECRET_KEY || ''
);

// Email d'envoi (doit être vérifié sur Mailjet)
const FROM_EMAIL = 'contact@keylor.fr';
const FROM_NAME = 'KEYLOR - Gestion Immobilière';

/**
 * Fonction helper pour envoyer un email via Mailjet
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  attachments?: Array<{ filename: string; content: string }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const message: any = {
      From: {
        Email: FROM_EMAIL,
        Name: FROM_NAME
      },
      To: [
        {
          Email: to
        }
      ],
      Subject: subject,
      HTMLPart: html
    };

    // Ajouter les pièces jointes si présentes
    if (attachments && attachments.length > 0) {
      message.Attachments = attachments.map(att => ({
        ContentType: att.filename.endsWith('.ics') ? 'text/calendar; charset=utf-8; method=REQUEST' : 'application/octet-stream',
        Filename: att.filename,
        Base64Content: att.content
      }));
    }

    // Vérifier que les clés API sont configurées
    if (!MAILJET_API_KEY || !MAILJET_SECRET_KEY) {
      console.error('❌ Impossible d\'envoyer l\'email : clés Mailjet non configurées');
      return { 
        success: false, 
        error: 'Clés Mailjet non configurées' 
      };
    }

    const result = await mailjet
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [message]
      });

    // Logger la réponse complète de Mailjet
    console.log('✅ Réponse Mailjet:', JSON.stringify(result.body, null, 2));
    console.log('Email sent successfully via Mailjet:', { to, subject });
    return { success: true };
  } catch (error) {
    console.error('Error sending email via Mailjet:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

function formatPrice(price: string | number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return `${Math.round(numPrice).toLocaleString('fr-FR')} €`;
}

function calculateTVA(totalTTC: string | number): { ht: number; tva: number; ttc: number } {
  const ttc = typeof totalTTC === 'string' ? parseFloat(totalTTC) : totalTTC;
  const ht = ttc / 1.20; // TVA à 20%
  const tva = ttc - ht;
  return {
    ht: Math.round(ht),
    tva: Math.round(tva),
    ttc: Math.round(ttc)
  };
}

function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export async function sendBookingRequestEmail(
  booking: SeasonalBookingRequest,
  property: Property
): Promise<{ success: boolean; error?: string }> {
  try {
    const nights = calculateNights(booking.checkIn, booking.checkOut);
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #202c45; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #202c45; color: #e7e5e2; padding: 30px; text-align: center; }
            .header h1 { margin: 0; color: #aa8a53; font-family: 'Cormorant Garamond', serif; font-size: 32px; }
            .content { background: #ffffff; padding: 30px; }
            .info-box { background: #f8f7f5; border-left: 4px solid #aa8a53; padding: 15px; margin: 20px 0; }
            .info-row { display: flex; justify-content: space-between; margin: 10px 0; }
            .label { font-weight: 600; color: #202c45; }
            .value { color: #5a6c8a; }
            .code-box { background: #202c45; color: #aa8a53; padding: 20px; text-align: center; margin: 20px 0; border-radius: 4px; }
            .code { font-size: 24px; font-weight: bold; letter-spacing: 3px; }
            .footer { text-align: center; padding: 20px; color: #8a9ab0; font-size: 14px; }
            .button { background: #aa8a53; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>KEYLOR</h1>
              <p style="margin: 10px 0 0 0; color: #e7e5e2;">Gestion Immobilière Sur Mesure</p>
            </div>
            
            <div class="content">
              <h2 style="color: #202c45;">Demande de réservation reçue</h2>
              
              <p>Bonjour ${booking.guestName},</p>
              
              <p>Nous avons bien reçu votre demande de réservation pour <strong>${property.titre}</strong>.</p>
              
              <div class="info-box">
                <h3 style="margin-top: 0; color: #aa8a53;">Détails de votre séjour</h3>
                <div class="info-row">
                  <span class="label">Propriété :</span>
                  <span class="value">${property.titre}</span>
                </div>
                <div class="info-row">
                  <span class="label">Localisation :</span>
                  <span class="value">${property.ville}</span>
                </div>
                <div class="info-row">
                  <span class="label">Arrivée :</span>
                  <span class="value">${formatDate(booking.checkIn)}</span>
                </div>
                <div class="info-row">
                  <span class="label">Départ :</span>
                  <span class="value">${formatDate(booking.checkOut)}</span>
                </div>
                <div class="info-row">
                  <span class="label">Durée :</span>
                  <span class="value">${nights} nuit${nights > 1 ? 's' : ''}</span>
                </div>
                <div class="info-row">
                  <span class="label">Voyageurs :</span>
                  <span class="value">${booking.numAdults} adulte${booking.numAdults > 1 ? 's' : ''}${booking.numChildren > 0 ? ` + ${booking.numChildren} enfant${booking.numChildren > 1 ? 's' : ''}` : ''}</span>
                </div>
                ${booking.totalPrice ? (() => {
                  const pricing = calculateTVA(booking.totalPrice);
                  return `
                <div class="info-row">
                  <span class="label">Montant HT :</span>
                  <span class="value">${formatPrice(pricing.ht)}</span>
                </div>
                <div class="info-row">
                  <span class="label">TVA (20%) :</span>
                  <span class="value">${formatPrice(pricing.tva)}</span>
                </div>
                <div class="info-row" style="border-top: 2px solid #aa8a53; padding-top: 10px; margin-top: 10px;">
                  <span class="label" style="font-size: 18px;">Total TTC :</span>
                  <span class="value" style="font-size: 20px; font-weight: bold; color: #aa8a53;">${formatPrice(pricing.ttc)}</span>
                </div>
                `;
                })() : ''}
              </div>
              
              <div class="code-box">
                <p style="margin: 0 0 10px 0; color: #e7e5e2;">Votre code de suivi</p>
                <div class="code">${booking.confirmationCode}</div>
                <p style="margin: 10px 0 0 0; color: #e7e5e2; font-size: 12px;">Conservez ce code pour suivre votre réservation</p>
              </div>
              
              <p>Notre équipe va étudier votre demande et vous répondra dans les plus brefs délais.</p>
              
              ${booking.message ? `
              <div class="info-box">
                <h4 style="margin-top: 0; color: #aa8a53;">Votre message :</h4>
                <p style="margin: 0; font-style: italic;">${booking.message}</p>
              </div>
              ` : ''}
              
              <p>Vous pouvez suivre l'état de votre demande à tout moment en utilisant votre code de confirmation.</p>
              
              <p style="margin-top: 30px;">Cordialement,<br><strong>L'équipe KEYLOR</strong></p>
            </div>
            
            <div class="footer">
              <p>KEYLOR - Gestion Immobilière Sur Mesure</p>
              <p>Drôme, Ardèche et toute la France</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return await sendEmail(
      booking.guestEmail,
      `Demande de réservation reçue - ${property.titre}`,
      html
    );
  } catch (error) {
    console.error('Error sending booking request email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendBookingConfirmationEmail(
  booking: SeasonalBookingRequest,
  property: Property
): Promise<{ success: boolean; error?: string }> {
  try {
    const nights = calculateNights(booking.checkIn, booking.checkOut);
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #202c45; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #202c45; color: #e7e5e2; padding: 30px; text-align: center; }
            .header h1 { margin: 0; color: #aa8a53; font-family: 'Cormorant Garamond', serif; font-size: 32px; }
            .content { background: #ffffff; padding: 30px; }
            .success-badge { background: #10b981; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 20px 0; }
            .info-box { background: #f8f7f5; border-left: 4px solid #aa8a53; padding: 15px; margin: 20px 0; }
            .info-row { display: flex; justify-content: space-between; margin: 10px 0; }
            .label { font-weight: 600; color: #202c45; }
            .value { color: #5a6c8a; }
            .highlight-box { background: #202c45; color: #e7e5e2; padding: 20px; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #8a9ab0; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>KEYLOR</h1>
              <p style="margin: 10px 0 0 0; color: #e7e5e2;">Gestion Immobilière Sur Mesure</p>
            </div>
            
            <div class="content">
              <div style="text-align: center;">
                <span class="success-badge">✓ Réservation confirmée</span>
              </div>
              
              <h2 style="color: #202c45; text-align: center;">Votre séjour est confirmé !</h2>
              
              <p>Bonjour ${booking.guestName},</p>
              
              <p>Excellente nouvelle ! Votre réservation pour <strong>${property.titre}</strong> est confirmée.</p>
              
              <div class="info-box">
                <h3 style="margin-top: 0; color: #aa8a53;">Récapitulatif de votre séjour</h3>
                <div class="info-row">
                  <span class="label">Propriété :</span>
                  <span class="value">${property.titre}</span>
                </div>
                <div class="info-row">
                  <span class="label">Adresse :</span>
                  <span class="value">${property.localisation}, ${property.ville}</span>
                </div>
                <div class="info-row">
                  <span class="label">Arrivée :</span>
                  <span class="value">${formatDate(booking.checkIn)}${property.heureArriveeDebut ? ` entre ${property.heureArriveeDebut} et ${property.heureArriveeFin}` : ''}</span>
                </div>
                <div class="info-row">
                  <span class="label">Départ :</span>
                  <span class="value">${formatDate(booking.checkOut)}${property.heureDepartDebut ? ` entre ${property.heureDepartDebut} et ${property.heureDepartFin}` : ''}</span>
                </div>
                <div class="info-row">
                  <span class="label">Durée :</span>
                  <span class="value">${nights} nuit${nights > 1 ? 's' : ''}</span>
                </div>
                <div class="info-row">
                  <span class="label">Voyageurs :</span>
                  <span class="value">${booking.numAdults} adulte${booking.numAdults > 1 ? 's' : ''}${booking.numChildren > 0 ? ` + ${booking.numChildren} enfant${booking.numChildren > 1 ? 's' : ''}` : ''}</span>
                </div>
                ${booking.totalPrice ? (() => {
                  const pricing = calculateTVA(booking.totalPrice);
                  return `
                <div class="info-row">
                  <span class="label">Montant HT :</span>
                  <span class="value">${formatPrice(pricing.ht)}</span>
                </div>
                <div class="info-row">
                  <span class="label">TVA (20%) :</span>
                  <span class="value">${formatPrice(pricing.tva)}</span>
                </div>
                <div class="info-row" style="border-top: 2px solid #aa8a53; padding-top: 10px; margin-top: 10px;">
                  <span class="label" style="font-size: 18px;">Total TTC :</span>
                  <span class="value" style="font-size: 20px; font-weight: bold; color: #aa8a53;">${formatPrice(pricing.ttc)}</span>
                </div>
                `;
                })() : ''}
              </div>
              
              <div class="highlight-box">
                <h4 style="margin-top: 0; color: #aa8a53;">Code de réservation</h4>
                <p style="font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 10px 0; color: #aa8a53;">${booking.confirmationCode}</p>
                <p style="margin: 0; font-size: 14px;">Conservez ce code, il vous sera demandé lors de votre arrivée</p>
              </div>
              
              <h3 style="color: #202c45;">Prochaines étapes</h3>
              <ul style="color: #5a6c8a;">
                <li>Vous recevrez les instructions d'accès quelques jours avant votre arrivée</li>
                <li>N'hésitez pas à nous contacter pour toute question</li>
                <li>En cas d'annulation, utilisez votre code de réservation</li>
              </ul>
              
              <p style="margin-top: 30px;">Nous vous souhaitons un excellent séjour !</p>
              
              <p>Cordialement,<br><strong>L'équipe KEYLOR</strong></p>
            </div>
            
            <div class="footer">
              <p>KEYLOR - Gestion Immobilière Sur Mesure</p>
              <p>Drôme, Ardèche et toute la France</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return await sendEmail(
      booking.guestEmail,
      `✓ Réservation confirmée - ${property.titre}`,
      html
    );
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendBookingRefusalEmail(
  booking: SeasonalBookingRequest,
  property: Property,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #202c45; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #202c45; color: #e7e5e2; padding: 30px; text-align: center; }
            .header h1 { margin: 0; color: #aa8a53; font-family: 'Cormorant Garamond', serif; font-size: 32px; }
            .content { background: #ffffff; padding: 30px; }
            .info-box { background: #fef3cd; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #8a9ab0; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>KEYLOR</h1>
              <p style="margin: 10px 0 0 0; color: #e7e5e2;">Gestion Immobilière Sur Mesure</p>
            </div>
            
            <div class="content">
              <h2 style="color: #202c45;">Concernant votre demande de réservation</h2>
              
              <p>Bonjour ${booking.guestName},</p>
              
              <p>Nous sommes désolés de vous informer que nous ne pouvons pas donner suite à votre demande de réservation pour <strong>${property.titre}</strong>.</p>
              
              ${reason ? `
              <div class="info-box">
                <h4 style="margin-top: 0;">Motif :</h4>
                <p style="margin: 0;">${reason}</p>
              </div>
              ` : ''}
              
              <p>Nous vous invitons à consulter nos autres biens disponibles sur notre site. Notre équipe reste à votre disposition pour vous proposer des alternatives.</p>
              
              <p>N'hésitez pas à nous contacter si vous avez des questions.</p>
              
              <p style="margin-top: 30px;">Cordialement,<br><strong>L'équipe KEYLOR</strong></p>
            </div>
            
            <div class="footer">
              <p>KEYLOR - Gestion Immobilière Sur Mesure</p>
              <p>Drôme, Ardèche et toute la France</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return await sendEmail(
      booking.guestEmail,
      `Demande de réservation - ${property.titre}`,
      html
    );
  } catch (error) {
    console.error('Error sending booking refusal email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendBookingCancellationEmail(
  booking: SeasonalBookingRequest,
  property: Property
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #202c45; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #202c45; color: #e7e5e2; padding: 30px; text-align: center; }
            .header h1 { margin: 0; color: #aa8a53; font-family: 'Cormorant Garamond', serif; font-size: 32px; }
            .content { background: #ffffff; padding: 30px; }
            .info-box { background: #fee; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #8a9ab0; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>KEYLOR</h1>
              <p style="margin: 10px 0 0 0; color: #e7e5e2;">Gestion Immobilière Sur Mesure</p>
            </div>
            
            <div class="content">
              <h2 style="color: #202c45;">Annulation de réservation</h2>
              
              <p>Bonjour ${booking.guestName},</p>
              
              <p>Votre réservation pour <strong>${property.titre}</strong> a bien été annulée.</p>
              
              <div class="info-box">
                <h4 style="margin-top: 0;">Détails de la réservation annulée</h4>
                <p style="margin: 5px 0;"><strong>Code :</strong> ${booking.confirmationCode}</p>
                <p style="margin: 5px 0;"><strong>Dates :</strong> du ${formatDate(booking.checkIn)} au ${formatDate(booking.checkOut)}</p>
                <p style="margin: 5px 0;"><strong>Propriété :</strong> ${property.titre}</p>
              </div>
              
              <p>Nous espérons avoir l'occasion de vous accueillir prochainement. N'hésitez pas à nous contacter pour toute future réservation.</p>
              
              <p style="margin-top: 30px;">Cordialement,<br><strong>L'équipe KEYLOR</strong></p>
            </div>
            
            <div class="footer">
              <p>KEYLOR - Gestion Immobilière Sur Mesure</p>
              <p>Drôme, Ardèche et toute la France</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return await sendEmail(
      booking.guestEmail,
      `Annulation de réservation - ${property.titre}`,
      html
    );
  } catch (error) {
    console.error('Error sending booking cancellation email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
/**
 * Envoie un email de confirmation de rendez-vous de visite à l'admin et au visiteur
 * Inclut un fichier iCalendar (.ics) pour ajouter le RDV au calendrier
 */
export async function sendAppointmentConfirmationEmails(
  appointment: Appointment,
  property: Property,
  icsContent: string,
  delegatedTo?: { name: string; email: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const appointmentDate = formatDate(appointment.date);
    const visitAgent = delegatedTo ? delegatedTo.name : 'Un agent KEYLOR';
    
    // Email pour le visiteur
    const visitorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #202c45; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #202c45; color: #e7e5e2; padding: 30px; text-align: center; }
            .header h1 { margin: 0; color: #aa8a53; font-family: 'Cormorant Garamond', serif; font-size: 32px; }
            .content { background: #ffffff; padding: 30px; }
            .info-box { background: #f8f7f5; border-left: 4px solid #aa8a53; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #8a9ab0; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>KEYLOR</h1>
              <p style="margin: 10px 0 0 0; font-size: 14px;">Gestion Immobilière Sur Mesure</p>
            </div>
            
            <div class="content">
              <h2 style="color: #202c45;">Rendez-vous confirmé</h2>
              
              <p>Bonjour ${appointment.nom},</p>
              
              <p>Votre rendez-vous de visite est confirmé !</p>
              
              <div class="info-box">
                <h4 style="margin-top: 0;">Détails du rendez-vous</h4>
                <p style="margin: 5px 0;"><strong>Date :</strong> ${appointmentDate}</p>
                <p style="margin: 5px 0;"><strong>Heure :</strong> ${appointment.heure}</p>
                <p style="margin: 5px 0;"><strong>Propriété :</strong> ${property.titre}</p>
                <p style="margin: 5px 0;"><strong>Adresse :</strong> ${property.localisation}, ${property.codePostal} ${property.ville}</p>
                <p style="margin: 5px 0;"><strong>Accompagné par :</strong> ${visitAgent}</p>
              </div>
              
              <p><strong>📅 Fichier iCalendar joint</strong> : Ouvrez le fichier joint pour ajouter automatiquement ce rendez-vous à votre calendrier (Outlook, Google Calendar, Apple Calendar, etc.)</p>
              
              <p>Nous vous attendons avec plaisir. Si vous avez des questions ou besoin de modifier ce rendez-vous, n'hésitez pas à nous contacter.</p>
              
              <p style="margin-top: 30px;">Cordialement,<br><strong>L'équipe KEYLOR</strong></p>
            </div>
            
            <div class="footer">
              <p>KEYLOR - Gestion Immobilière Sur Mesure</p>
              <p>Drôme, Ardèche et toute la France</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Email pour l'admin/agent
    const adminHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #202c45; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #202c45; color: #e7e5e2; padding: 30px; text-align: center; }
            .header h1 { margin: 0; color: #aa8a53; font-family: 'Cormorant Garamond', serif; font-size: 32px; }
            .content { background: #ffffff; padding: 30px; }
            .info-box { background: #f8f7f5; border-left: 4px solid #aa8a53; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #8a9ab0; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>KEYLOR</h1>
              <p style="margin: 10px 0 0 0; font-size: 14px;">Nouveau rendez-vous de visite</p>
            </div>
            
            <div class="content">
              <h2 style="color: #202c45;">Rendez-vous confirmé</h2>
              
              ${delegatedTo ? `<p><strong>⚠️ Visite déléguée à ${delegatedTo.name}</strong></p>` : ''}
              
              <div class="info-box">
                <h4 style="margin-top: 0;">Détails du rendez-vous</h4>
                <p style="margin: 5px 0;"><strong>Date :</strong> ${appointmentDate}</p>
                <p style="margin: 5px 0;"><strong>Heure :</strong> ${appointment.heure}</p>
                <p style="margin: 5px 0;"><strong>Propriété :</strong> ${property.titre}</p>
                <p style="margin: 5px 0;"><strong>Adresse :</strong> ${property.localisation}, ${property.codePostal} ${property.ville}</p>
              </div>
              
              <div class="info-box">
                <h4 style="margin-top: 0;">Informations visiteur</h4>
                <p style="margin: 5px 0;"><strong>Nom :</strong> ${appointment.nom}</p>
                <p style="margin: 5px 0;"><strong>Email :</strong> ${appointment.email}</p>
                <p style="margin: 5px 0;"><strong>Téléphone :</strong> ${appointment.telephone}</p>
                ${appointment.message ? `<p style="margin: 5px 0;"><strong>Message :</strong> ${appointment.message}</p>` : ''}
              </div>
              
              <p><strong>📅 Fichier iCalendar joint</strong> : Ouvrez le fichier joint pour ajouter automatiquement ce rendez-vous à votre calendrier.</p>
            </div>
            
            <div class="footer">
              <p>KEYLOR - Administration</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Encoder le contenu ICS en base64 pour l'envoi par email
    const icsBase64 = Buffer.from(icsContent, 'utf-8').toString('base64');
    
    // Envoyer l'email au visiteur (avec son adresse réelle)
    const visitorResult = await sendEmail(
      appointment.email,
      `Rendez-vous confirmé - Visite ${property.titre}`,
      visitorHtml,
      [
        {
          filename: 'rendez-vous.ics',
          content: icsBase64,
        },
      ]
    );

    // Envoyer l'email à l'admin/agent
    const adminRecipient = delegatedTo?.email || 'contact@keylor.fr';
    const adminResult = await sendEmail(
      adminRecipient,
      `Nouveau RDV - ${property.titre} - ${appointment.nom}`,
      adminHtml,
      [
        {
          filename: 'rendez-vous.ics',
          content: icsBase64,
        },
      ]
    );

    return { 
      success: visitorResult.success && adminResult.success,
      error: visitorResult.error || adminResult.error
    };
  } catch (error) {
    console.error('Error sending appointment confirmation emails:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Envoie un email d'annulation au client lorsque l'admin annule le RDV
 */
export async function sendAppointmentCancellationEmail(
  appointment: Appointment,
  property: Property
): Promise<{ success: boolean; error?: string }> {
  try {
    const appointmentDate = formatDate(appointment.date);
    
    // Email pour le visiteur
    const visitorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #202c45; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #202c45; color: #e7e5e2; padding: 30px; text-align: center; }
            .header h1 { margin: 0; color: #aa8a53; font-family: 'Cormorant Garamond', serif; font-size: 32px; }
            .content { background: #ffffff; padding: 30px; }
            .info-box { background: #f8f7f5; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
            .badge { display: inline-block; background: #dc2626; color: white; padding: 8px 16px; border-radius: 4px; font-weight: bold; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; color: #8a9ab0; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>KEYLOR</h1>
              <p style="margin: 10px 0 0 0; font-size: 14px;">Gestion Immobilière Sur Mesure</p>
            </div>
            
            <div class="content">
              <h2 style="color: #202c45;">❌ Rendez-vous annulé</h2>
              
              <p>Bonjour ${appointment.nom},</p>
              
              <p>Nous vous informons que votre rendez-vous a été <strong>annulé</strong>.</p>
              
              <div class="badge">ANNULÉ</div>
              
              <div class="info-box">
                <h4 style="margin-top: 0;">Détails du rendez-vous annulé</h4>
                <p style="margin: 5px 0;"><strong>Date :</strong> ${appointmentDate}</p>
                <p style="margin: 5px 0;"><strong>Heure :</strong> ${appointment.heure}</p>
                <p style="margin: 5px 0;"><strong>Propriété :</strong> ${property.titre}</p>
                <p style="margin: 5px 0;"><strong>Adresse :</strong> ${property.localisation}, ${property.codePostal} ${property.ville}</p>
              </div>
              
              <p>Si vous souhaitez reprogrammer ce rendez-vous ou obtenir plus d'informations, n'hésitez pas à nous contacter.</p>
              
              <p style="margin-top: 30px;">Cordialement,<br><strong>L'équipe KEYLOR</strong></p>
            </div>
            
            <div class="footer">
              <p>KEYLOR - Gestion Immobilière Sur Mesure</p>
              <p>Drôme, Ardèche et toute la France</p>
              <p>Email : contact@keylor.fr</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    // Envoyer l'email au visiteur
    const result = await sendEmail(
      appointment.email,
      `❌ Rendez-vous annulé - ${property.titre}`,
      visitorHtml
    );

    return result;
  } catch (error) {
    console.error('Error sending appointment cancellation email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Envoie un email de confirmation au client lorsque l'admin valide le RDV
 */
export async function sendAppointmentAdminConfirmationEmail(
  appointment: Appointment,
  property: Property,
  icsContent: string,
  delegatedTo?: { name: string; email: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const appointmentDate = formatDate(appointment.date);
    const visitAgent = delegatedTo ? delegatedTo.name : 'Un agent KEYLOR';
    
    // Email pour le visiteur
    const visitorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #202c45; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #202c45; color: #e7e5e2; padding: 30px; text-align: center; }
            .header h1 { margin: 0; color: #aa8a53; font-family: 'Cormorant Garamond', serif; font-size: 32px; }
            .content { background: #ffffff; padding: 30px; }
            .info-box { background: #f8f7f5; border-left: 4px solid #aa8a53; padding: 15px; margin: 20px 0; }
            .badge { display: inline-block; background: #4caf50; color: white; padding: 8px 16px; border-radius: 4px; font-weight: bold; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; color: #8a9ab0; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>KEYLOR</h1>
              <p style="margin: 10px 0 0 0; font-size: 14px;">Gestion Immobilière Sur Mesure</p>
            </div>
            
            <div class="content">
              <h2 style="color: #202c45;">✅ Rendez-vous confirmé par notre équipe</h2>
              
              <p>Bonjour ${appointment.nom},</p>
              
              <p>Nous avons le plaisir de vous informer que votre rendez-vous a été <strong>confirmé par notre équipe</strong>.</p>
              
              <div class="badge">CONFIRMÉ</div>
              
              <div class="info-box">
                <h4 style="margin-top: 0;">Détails du rendez-vous</h4>
                <p style="margin: 5px 0;"><strong>Date :</strong> ${appointmentDate}</p>
                <p style="margin: 5px 0;"><strong>Heure :</strong> ${appointment.heure}</p>
                <p style="margin: 5px 0;"><strong>Propriété :</strong> ${property.titre}</p>
                <p style="margin: 5px 0;"><strong>Adresse :</strong> ${property.localisation}, ${property.codePostal} ${property.ville}</p>
                <p style="margin: 5px 0;"><strong>Accompagné par :</strong> ${visitAgent}</p>
              </div>
              
              <p><strong>📅 Fichier iCalendar joint</strong> : Ouvrez le fichier joint pour ajouter automatiquement ce rendez-vous à votre calendrier (Outlook, Google Calendar, Apple Calendar, etc.)</p>
              
              <p>Nous vous attendons avec plaisir. Si vous avez des questions ou besoin de modifier ce rendez-vous, n'hésitez pas à nous contacter.</p>
              
              <p style="margin-top: 30px;">Cordialement,<br><strong>L'équipe KEYLOR</strong></p>
            </div>
            
            <div class="footer">
              <p>KEYLOR - Gestion Immobilière Sur Mesure</p>
              <p>Drôme, Ardèche et toute la France</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Encoder le contenu ICS en base64 pour l'envoi par email
    const icsBase64 = Buffer.from(icsContent, 'utf-8').toString('base64');
    
    // Envoyer l'email au visiteur
    const result = await sendEmail(
      appointment.email,
      `✅ Rendez-vous confirmé - ${property.titre}`,
      visitorHtml,
      [
        {
          filename: 'rendez-vous.ics',
          content: icsBase64,
        },
      ]
    );

    return result;
  } catch (error) {
    console.error('Error sending appointment admin confirmation email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
