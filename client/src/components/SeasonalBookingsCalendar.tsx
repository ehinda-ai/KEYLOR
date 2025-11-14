import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, FileSpreadsheet, Mail } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { SeasonalBookingRequest, Property, SeasonalAvailability } from "@shared/schema";

interface SeasonalBookingsCalendarProps {
  propertyId?: string;
}

export function SeasonalBookingsCalendar({ propertyId }: SeasonalBookingsCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(propertyId || "all");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const { toast } = useToast();

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const { data: bookings = [] } = useQuery<SeasonalBookingRequest[]>({
    queryKey: ["/api/seasonal-booking-requests"],
  });

  const { data: allAvailabilities = [] } = useQuery<SeasonalAvailability[]>({
    queryKey: ["/api/seasonal-availability"],
  });

  const seasonalProperties = properties.filter(p => p.transactionType === "location_saisonniere");

  const filteredBookings = bookings.filter(b => 
    selectedPropertyId === "all" || b.propertyId === selectedPropertyId
  );

  const filteredAvailabilities = allAvailabilities.filter(a =>
    selectedPropertyId === "all" || a.propertyId === selectedPropertyId
  );

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getBookingsForDay = (date: Date, propId: string) => {
    return filteredBookings.filter(booking => {
      if (booking.propertyId !== propId) return false;
      const checkIn = parseISO(booking.checkIn);
      const checkOut = parseISO(booking.checkOut);
      return date >= checkIn && date < checkOut;
    });
  };

  const getAvailabilityForDay = (date: Date, propId: string) => {
    return filteredAvailabilities.find(avail => {
      if (avail.propertyId !== propId || !avail.bloque) return false;
      const start = parseISO(avail.dateDebut);
      const end = parseISO(avail.dateFin);
      return date >= start && date <= end;
    });
  };

  const generatePlanningHTML = () => {
    const selectedProperty = selectedPropertyId === "all" 
      ? "Tous les biens" 
      : properties.find(p => p.id === selectedPropertyId)?.titre || "";
    
    const propertiesToShow = selectedPropertyId === "all" 
      ? seasonalProperties 
      : seasonalProperties.filter(p => p.id === selectedPropertyId);

    let tableRows = '';
    propertiesToShow.forEach(property => {
      const propBookings = filteredBookings.filter(b => b.propertyId === property.id);
      
      if (propBookings.length > 0) {
        propBookings.forEach(booking => {
          const statusText = booking.status === "en_attente" || booking.status === "pending" ? "En attente" :
                            booking.status === "confirmee" || booking.status === "confirmed" ? "Confirmé" :
                            booking.status === "refusee" || booking.status === "refused" ? "Refusé" : "Annulé";
          const statusColor = booking.status === "confirmee" || booking.status === "confirmed" ? "#10b981" :
                             booking.status === "en_attente" || booking.status === "pending" ? "#f59e0b" : "#ef4444";
          
          tableRows += `
            <tr>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">${property.titre}</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">${booking.guestName}</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">${format(parseISO(booking.checkIn), "dd/MM/yyyy", { locale: fr })}</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">${format(parseISO(booking.checkOut), "dd/MM/yyyy", { locale: fr })}</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">${booking.numAdults}</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb; color: ${statusColor}; font-weight: 600;">${statusText}</td>
            </tr>
          `;
        });
      }
    });

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Inter', Arial, sans-serif; color: #202c45; margin: 0; padding: 20px; }
            .header { background: #202c45; color: #e7e5e2; padding: 30px; text-align: center; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #aa8a53; font-size: 32px; }
            .header p { margin: 10px 0 0 0; color: #e7e5e2; }
            .content { background: #ffffff; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #202c45; color: #ffffff; padding: 12px; text-align: left; border: 1px solid #202c45; }
            .footer { text-align: center; padding: 20px; color: #8a9ab0; font-size: 14px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>KEYLOR</h1>
            <p>Gestion Immobilière Sur Mesure</p>
          </div>
          
          <div class="content">
            <h2 style="color: #202c45;">Planning des Locations Saisonnières</h2>
            <p><strong>Mois :</strong> ${format(currentMonth, "MMMM yyyy", { locale: fr })}</p>
            <p><strong>Bien :</strong> ${selectedProperty}</p>
            
            <table>
              <thead>
                <tr>
                  <th>Bien</th>
                  <th>Client</th>
                  <th>Arrivée</th>
                  <th>Départ</th>
                  <th>Voyageurs</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows || '<tr><td colspan="6" style="padding: 20px; text-align: center; color: #9ca3af;">Aucune réservation pour cette période</td></tr>'}
              </tbody>
            </table>
          </div>
          
          <div class="footer">
            <p>KEYLOR - Gestion Immobilière</p>
            <p>Édité le ${format(new Date(), "dd/MM/yyyy à HH:mm", { locale: fr })}</p>
          </div>
        </body>
      </html>
    `;
  };

  const sendEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      const htmlContent = generatePlanningHTML();
      const subject = `Planning locations saisonnières - ${format(currentMonth, "MMMM yyyy", { locale: fr })}`;
      
      return await apiRequest('POST', '/api/send-planning-email', {
        recipientEmail: email,
        planningType: 'seasonal',
        monthYear: format(currentMonth, "yyyy-MM"),
        htmlContent,
        subject
      });
    },
    onSuccess: () => {
      toast({
        title: "Email envoyé",
        description: `Le planning a été envoyé à ${recipientEmail}`,
      });
      setEmailDialogOpen(false);
      setRecipientEmail("");
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi de l'email",
        variant: "destructive",
      });
    }
  });

  const exportToPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    
    // En-tête avec logo
    doc.setFontSize(20);
    doc.setTextColor(32, 44, 69); // Couleur marine
    doc.text('KEYLOR', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Planning des Locations Saisonnières', 14, 27);
    doc.text(`Mois : ${format(currentMonth, "MMMM yyyy", { locale: fr })}`, 14, 32);
    
    const selectedProperty = selectedPropertyId === "all" 
      ? "Tous les biens" 
      : properties.find(p => p.id === selectedPropertyId)?.titre || "";
    doc.text(`Bien : ${selectedProperty}`, 14, 37);

    // Ligne de séparation
    doc.setDrawColor(170, 138, 83); // Couleur dorée
    doc.setLineWidth(0.5);
    doc.line(14, 40, 283, 40);

    // Préparer les données pour le tableau
    const tableData: any[] = [];
    
    const propertiesToShow = selectedPropertyId === "all" 
      ? seasonalProperties 
      : seasonalProperties.filter(p => p.id === selectedPropertyId);

    propertiesToShow.forEach(property => {
      const propBookings = filteredBookings.filter(b => b.propertyId === property.id);
      
      if (propBookings.length > 0) {
        propBookings.forEach(booking => {
          tableData.push([
            property.titre,
            booking.guestName,
            format(parseISO(booking.checkIn), "dd/MM/yyyy", { locale: fr }),
            format(parseISO(booking.checkOut), "dd/MM/yyyy", { locale: fr }),
            `${booking.numAdults}`,
            booking.status === "en_attente" || booking.status === "pending" ? "En attente" :
            booking.status === "confirmee" || booking.status === "confirmed" ? "Confirmé" :
            booking.status === "refusee" || booking.status === "refused" ? "Refusé" : "Annulé"
          ]);
        });
      }
    });

    autoTable(doc, {
      startY: 45,
      head: [['Bien', 'Client', 'Arrivée', 'Départ', 'Voyageurs', 'Statut']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [32, 44, 69],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 50 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
        4: { cellWidth: 25 },
        5: { cellWidth: 30 }
      }
    });

    // Pied de page
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} sur ${pageCount} - Édité le ${format(new Date(), "dd/MM/yyyy à HH:mm", { locale: fr })}`,
        14,
        200
      );
      doc.text('KEYLOR - Gestion Immobilière', 250, 200);
    }

    doc.save(`planning-locations-${format(currentMonth, "yyyy-MM", { locale: fr })}.pdf`);
  };

  const exportToExcel = () => {
    const propertiesToShow = selectedPropertyId === "all" 
      ? seasonalProperties 
      : seasonalProperties.filter(p => p.id === selectedPropertyId);

    const excelData: any[] = [];
    
    propertiesToShow.forEach(property => {
      const propBookings = filteredBookings.filter(b => b.propertyId === property.id);
      
      propBookings.forEach(booking => {
        excelData.push({
          'Bien': property.titre,
          'Ville': property.ville,
          'Client': booking.guestName,
          'Email': booking.guestEmail,
          'Téléphone': booking.guestPhone,
          'Date arrivée': format(parseISO(booking.checkIn), "dd/MM/yyyy", { locale: fr }),
          'Date départ': format(parseISO(booking.checkOut), "dd/MM/yyyy", { locale: fr }),
          'Nb voyageurs': booking.numAdults,
          'Prix total': booking.totalPrice ? `${booking.totalPrice} €` : '',
          'Statut': booking.status === "en_attente" || booking.status === "pending" ? "En attente" :
                   booking.status === "confirmee" || booking.status === "confirmed" ? "Confirmé" :
                   booking.status === "refusee" || booking.status === "refused" ? "Refusé" : "Annulé",
          'Code confirmation': booking.confirmationCode || '',
          'Message': booking.message || ''
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Réservations");
    
    XLSX.writeFile(wb, `planning-locations-${format(currentMonth, "yyyy-MM", { locale: fr })}.xlsx`);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Planning des Réservations</CardTitle>
            <CardDescription>
              Vue calendrier des locations saisonnières
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={exportToPDF} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button onClick={exportToExcel} variant="outline" size="sm">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Mail className="w-4 h-4 mr-2" />
                  Envoyer par mail
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Envoyer le planning par email</DialogTitle>
                  <DialogDescription>
                    Saisissez l'adresse email du destinataire
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="exemple@keylor.fr"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => sendEmailMutation.mutate(recipientEmail)}
                    disabled={!recipientEmail || sendEmailMutation.isPending}
                  >
                    {sendEmailMutation.isPending ? "Envoi..." : "Envoyer"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
            <SelectTrigger className="w-full sm:w-[300px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les biens</SelectItem>
              {seasonalProperties.map(property => (
                <SelectItem key={property.id} value={property.id}>
                  {property.titre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              ← Mois précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
            >
              Aujourd'hui
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              Mois suivant →
            </Button>
          </div>
        </div>

        <div className="text-center font-serif text-2xl mb-4">
          {format(currentMonth, "MMMM yyyy", { locale: fr })}
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* En-tête du calendrier */}
            <div className="grid grid-cols-8 gap-1 mb-2">
              <div className="font-medium text-sm p-2">Bien</div>
              {daysInMonth.slice(0, 7).map(day => (
                <div key={day.toString()} className="font-medium text-xs text-center p-2">
                  {format(day, "EEE dd", { locale: fr })}
                </div>
              ))}
            </div>

            {/* Lignes par bien */}
            {(selectedPropertyId === "all" ? seasonalProperties : seasonalProperties.filter(p => p.id === selectedPropertyId))
              .map(property => (
                <div key={property.id} className="mb-4">
                  <div className="grid grid-cols-8 gap-1">
                    <div className="font-medium text-sm p-2 border rounded bg-muted truncate">
                      {property.titre}
                    </div>
                    {daysInMonth.slice(0, 7).map(day => {
                      const dayBookings = getBookingsForDay(day, property.id);
                      const blocked = getAvailabilityForDay(day, property.id);
                      const isToday = isSameDay(day, new Date());
                      
                      return (
                        <div
                          key={day.toString()}
                          className={`min-h-[60px] border rounded p-1 text-xs ${
                            isToday ? 'border-primary border-2' : ''
                          } ${
                            blocked ? 'bg-gray-300 dark:bg-gray-700' :
                            dayBookings.length > 0 ? 'bg-primary/20' : 'bg-background'
                          }`}
                        >
                          {dayBookings.map((booking, idx) => (
                            <div
                              key={idx}
                              className={`mb-1 p-1 rounded text-[10px] truncate ${
                                booking.status === "confirmee" || booking.status === "confirmed" ? 'bg-green-200 dark:bg-green-900' :
                                booking.status === "en_attente" || booking.status === "pending" ? 'bg-yellow-200 dark:bg-yellow-900' :
                                'bg-red-200 dark:bg-red-900'
                              }`}
                              title={`${booking.guestName} - ${booking.status}`}
                            >
                              {booking.guestName.split(' ')[0]}
                            </div>
                          ))}
                          {blocked && dayBookings.length === 0 && (
                            <div className="text-[10px] text-muted-foreground truncate" title={blocked.motif}>
                              Bloqué
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Reste des jours du mois */}
                  {daysInMonth.length > 7 && (
                    <div className="grid grid-cols-8 gap-1 mt-1">
                      <div></div>
                      {daysInMonth.slice(7).map(day => {
                        const dayBookings = getBookingsForDay(day, property.id);
                        const blocked = getAvailabilityForDay(day, property.id);
                        const isToday = isSameDay(day, new Date());
                        
                        return (
                          <div
                            key={day.toString()}
                            className={`min-h-[60px] border rounded p-1 text-xs ${
                              isToday ? 'border-primary border-2' : ''
                            } ${
                              blocked ? 'bg-gray-300 dark:bg-gray-700' :
                              dayBookings.length > 0 ? 'bg-primary/20' : 'bg-background'
                            }`}
                          >
                            {dayBookings.map((booking, idx) => (
                              <div
                                key={idx}
                                className={`mb-1 p-1 rounded text-[10px] truncate ${
                                  booking.status === "confirmee" || booking.status === "confirmed" ? 'bg-green-200 dark:bg-green-900' :
                                  booking.status === "en_attente" || booking.status === "pending" ? 'bg-yellow-200 dark:bg-yellow-900' :
                                  'bg-red-200 dark:bg-red-900'
                                }`}
                                title={`${booking.guestName} - ${booking.status}`}
                              >
                                {booking.guestName.split(' ')[0]}
                              </div>
                            ))}
                            {blocked && dayBookings.length === 0 && (
                              <div className="text-[10px] text-muted-foreground truncate" title={blocked.motif}>
                                Bloqué
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Légende */}
        <div className="mt-4 p-4 bg-muted/30 rounded-lg border">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Comment lire le planning
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 bg-green-200 dark:bg-green-900 rounded flex-shrink-0 mt-0.5"></div>
              <div>
                <div className="font-medium">Réservation confirmée</div>
                <div className="text-muted-foreground">Le client a reçu sa confirmation</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 bg-yellow-200 dark:bg-yellow-900 rounded flex-shrink-0 mt-0.5"></div>
              <div>
                <div className="font-medium">Demande en attente</div>
                <div className="text-muted-foreground">À traiter dans "Réservations"</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 bg-red-200 dark:bg-red-900 rounded flex-shrink-0 mt-0.5"></div>
              <div>
                <div className="font-medium">Refusée ou annulée</div>
                <div className="text-muted-foreground">Réservation non aboutie</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 bg-gray-300 dark:bg-gray-700 rounded flex-shrink-0 mt-0.5"></div>
              <div>
                <div className="font-medium">Période bloquée</div>
                <div className="text-muted-foreground">Indisponible (travaux, personnel...)</div>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
            💡 Astuce : Survolez une case pour voir le nom complet du client et le statut
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
