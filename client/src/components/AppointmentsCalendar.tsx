import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, FileSpreadsheet, Mail, CheckCircle, XCircle, Clock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { Appointment, Property } from "@shared/schema";

// Fonction pour obtenir les couleurs selon le motif du RDV
const getMotifColors = (motif: string = "audit", statut: string) => {
  const isDark = document.documentElement.classList.contains('dark');
  
  const colors: Record<string, { light: string; dark: string; text: string }> = {
    vendre: { light: 'bg-amber-200', dark: 'bg-amber-900', text: 'Vendre' },
    gerer: { light: 'bg-emerald-200', dark: 'bg-emerald-900', text: 'Gérer' },
    audit: { light: 'bg-blue-200', dark: 'bg-blue-900', text: 'Audit/Consult' },
  };
  
  const motifColor = colors[motif] || colors.audit;
  
  // Si annulé, appliquer une opacité réduite
  if (statut === 'annulé') {
    return `${isDark ? motifColor.dark : motifColor.light} opacity-50`;
  }
  
  // Si en attente, légère variation
  if (statut === 'en_attente') {
    return `${isDark ? motifColor.dark : motifColor.light} opacity-75`;
  }
  
  // Si confirmé, couleur normale
  return isDark ? motifColor.dark : motifColor.light;
};

const getMotifLabel = (motif: string = "audit") => {
  const labels: Record<string, string> = {
    vendre: 'Vendre',
    gerer: 'Gérer',
    audit: 'Audit',
  };
  return labels[motif] || labels.audit;
};

export function AppointmentsCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");
  const [transactionFilter, setTransactionFilter] = useState<string>("all");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const filteredProperties = properties.filter(p => {
    if (transactionFilter === "all") return true;
    return p.transactionType === transactionFilter;
  });

  const filteredAppointments = appointments.filter(a => 
    selectedPropertyId === "all" || a.propertyId === selectedPropertyId
  );

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getAppointmentsForDay = (date: Date) => {
    return filteredAppointments.filter(appt => {
      try {
        const apptDate = parseISO(appt.date);
        return isSameDay(date, apptDate);
      } catch {
        return false;
      }
    });
  };

  const generatePlanningHTML = () => {
    const selectedProperty = selectedPropertyId === "all" 
      ? "Tous les biens" 
      : properties.find(p => p.id === selectedPropertyId)?.titre || "";

    let tableRows = '';
    filteredAppointments.forEach(appt => {
      const property = properties.find(p => p.id === appt.propertyId);
      if (property) {
        const statusText = appt.statut === "en_attente" ? "En attente" :
                          appt.statut === "confirmé" ? "Confirmé" : "Annulé";
        const statusColor = appt.statut === "confirmé" ? "#10b981" :
                           appt.statut === "en_attente" ? "#f59e0b" : "#ef4444";
        const motifText = getMotifLabel(appt.motif);
        
        tableRows += `
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">${property.titre}</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">${property.ville}</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">${motifText}</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">${appt.nom}</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">${format(parseISO(appt.date), "dd/MM/yyyy", { locale: fr })}</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">${appt.heure}</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb; color: ${statusColor}; font-weight: 600;">${statusText}</td>
          </tr>
        `;
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
            <h2 style="color: #202c45;">Planning des Visites et Rendez-vous</h2>
            <p><strong>Mois :</strong> ${format(currentMonth, "MMMM yyyy", { locale: fr })}</p>
            <p><strong>Bien :</strong> ${selectedProperty}</p>
            
            <table>
              <thead>
                <tr>
                  <th>Bien</th>
                  <th>Ville</th>
                  <th>Type</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Heure</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows || '<tr><td colspan="7" style="padding: 20px; text-align: center; color: #9ca3af;">Aucun rendez-vous pour cette période</td></tr>'}
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

  const updateStatusMutation = useMutation({
    mutationFn: async ({ appointmentId, newStatus }: { appointmentId: string; newStatus: string }) => {
      return await apiRequest('PATCH', `/api/appointments/${appointmentId}`, {
        statut: newStatus
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Statut modifié",
        description: "Le statut du rendez-vous a été mis à jour",
      });
      setAppointmentDialogOpen(false);
      setSelectedAppointment(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut du rendez-vous",
        variant: "destructive",
      });
    }
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      const htmlContent = generatePlanningHTML();
      const subject = `Planning visites - ${format(currentMonth, "MMMM yyyy", { locale: fr })}`;
      
      return await apiRequest('POST', '/api/send-planning-email', {
        recipientEmail: email,
        planningType: 'appointments',
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
    doc.setTextColor(32, 44, 69);
    doc.text('KEYLOR', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Planning des Visites et Rendez-vous', 14, 27);
    doc.text(`Mois : ${format(currentMonth, "MMMM yyyy", { locale: fr })}`, 14, 32);
    
    const selectedProperty = selectedPropertyId === "all" 
      ? "Tous les biens" 
      : properties.find(p => p.id === selectedPropertyId)?.titre || "";
    doc.text(`Bien : ${selectedProperty}`, 14, 37);

    doc.setDrawColor(170, 138, 83);
    doc.setLineWidth(0.5);
    doc.line(14, 40, 283, 40);

    const tableData: any[] = [];
    
    const propertiesToShow = selectedPropertyId === "all" 
      ? filteredProperties 
      : filteredProperties.filter(p => p.id === selectedPropertyId);

    filteredAppointments.forEach(appt => {
      const property = properties.find(p => p.id === appt.propertyId);
      if (property) {
        tableData.push([
          property.titre,
          property.ville,
          getMotifLabel(appt.motif),
          appt.nom,
          format(parseISO(appt.date), "dd/MM/yyyy", { locale: fr }),
          appt.heure,
          appt.statut === "en_attente" ? "En attente" :
          appt.statut === "confirmé" ? "Confirmé" : "Annulé"
        ]);
      }
    });

    autoTable(doc, {
      startY: 45,
      head: [['Bien', 'Ville', 'Type', 'Client', 'Date', 'Heure', 'Statut']],
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
        0: { cellWidth: 55 },
        1: { cellWidth: 35 },
        2: { cellWidth: 30 },
        3: { cellWidth: 45 },
        4: { cellWidth: 28 },
        5: { cellWidth: 22 },
        6: { cellWidth: 28 }
      }
    });

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

    doc.save(`planning-visites-${format(currentMonth, "yyyy-MM", { locale: fr })}.pdf`);
  };

  const exportToExcel = () => {
    const excelData: any[] = [];
    
    filteredAppointments.forEach(appt => {
      const property = properties.find(p => p.id === appt.propertyId);
      if (property) {
        excelData.push({
          'Bien': property.titre,
          'Ville': property.ville,
          'Type RDV': getMotifLabel(appt.motif),
          'Type transaction': property.transactionType === "vente" ? "Vente" : 
                             property.transactionType === "location" ? "Location" : "Location saisonnière",
          'Client': appt.nom,
          'Email': appt.email,
          'Téléphone': appt.telephone,
          'Date': format(parseISO(appt.date), "dd/MM/yyyy", { locale: fr }),
          'Heure': appt.heure,
          'Statut': appt.statut === "en_attente" ? "En attente" :
                   appt.statut === "confirmé" ? "Confirmé" : "Annulé",
          'Message': appt.message || ''
        });
      }
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Visites");
    
    XLSX.writeFile(wb, `planning-visites-${format(currentMonth, "yyyy-MM", { locale: fr })}.xlsx`);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Planning des Visites</CardTitle>
            <CardDescription>
              Vue calendrier des rendez-vous programmés
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
          <Select value={transactionFilter} onValueChange={setTransactionFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous types</SelectItem>
              <SelectItem value="vente">Vente</SelectItem>
              <SelectItem value="location">Location</SelectItem>
              <SelectItem value="location_saisonniere">Location saisonnière</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
            <SelectTrigger className="w-full sm:w-[300px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les biens</SelectItem>
              {filteredProperties.map(property => (
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
          <div className="grid grid-cols-7 gap-2 min-w-[700px]">
            {/* En-tête des jours */}
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
              <div key={day} className="font-medium text-sm text-center p-2 bg-muted rounded">
                {day}
              </div>
            ))}

            {/* Jours du calendrier */}
            {calendarDays.map(day => {
              const dayAppointments = getAppointmentsForDay(day);
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              
              return (
                <div
                  key={day.toString()}
                  className={`min-h-[100px] border rounded p-2 ${
                    isToday ? 'border-primary border-2' : ''
                  } ${
                    !isCurrentMonth ? 'bg-muted/30 text-muted-foreground' : 'bg-background'
                  }`}
                >
                  <div className="text-xs font-medium mb-1">
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayAppointments.map((appt, idx) => {
                      const property = properties.find(p => p.id === appt.propertyId);
                      const motifLabel = getMotifLabel(appt.motif);
                      return (
                        <div
                          key={idx}
                          className={`text-[10px] p-1 rounded truncate cursor-pointer hover-elevate ${getMotifColors(appt.motif, appt.statut)}`}
                          title={`${appt.heure} - ${appt.nom} - ${motifLabel} - ${property?.titre} (cliquer pour gérer)`}
                          onClick={() => {
                            setSelectedAppointment(appt);
                            setAppointmentDialogOpen(true);
                          }}
                        >
                          <div className="font-medium flex items-center gap-1">
                            <span>{appt.heure}</span>
                            <span className="text-[8px] opacity-60">• {motifLabel}</span>
                          </div>
                          <div className="truncate">{appt.nom}</div>
                          <div className="truncate text-[9px] opacity-75">{property?.ville}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Légende */}
        <div className="mt-4 p-4 bg-muted/30 rounded-lg border">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Code couleur des rendez-vous
          </h4>
          
          {/* Légende des types de RDV */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs mb-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-200 dark:bg-amber-900 rounded flex-shrink-0"></div>
              <span>Vendre mon bien</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-emerald-200 dark:bg-emerald-900 rounded flex-shrink-0"></div>
              <span>Faire gérer mon bien</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-200 dark:bg-blue-900 rounded flex-shrink-0"></div>
              <span>Audit / Consultation</span>
            </div>
          </div>

          {/* Légende des statuts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-3 border-t">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 bg-blue-200 dark:bg-blue-900 rounded flex-shrink-0 mt-0.5"></div>
              <div>
                <div className="font-medium">Confirmé</div>
                <div className="text-muted-foreground">Couleur pleine</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 bg-blue-200 dark:bg-blue-900 opacity-75 rounded flex-shrink-0 mt-0.5"></div>
              <div>
                <div className="font-medium">En attente</div>
                <div className="text-muted-foreground">Couleur légèrement atténuée</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 bg-blue-200 dark:bg-blue-900 opacity-50 rounded flex-shrink-0 mt-0.5"></div>
              <div>
                <div className="font-medium">Annulé</div>
                <div className="text-muted-foreground">Couleur très atténuée</div>
              </div>
            </div>
          </div>
        </div>

        {filteredAppointments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Aucun rendez-vous programmé pour cette période
          </div>
        )}

        {/* Dialog pour gérer le statut du rendez-vous */}
        <Dialog open={appointmentDialogOpen} onOpenChange={setAppointmentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gérer le rendez-vous</DialogTitle>
              <DialogDescription>
                Modifier le statut ou consulter les détails du rendez-vous
              </DialogDescription>
            </DialogHeader>
            
            {selectedAppointment && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Informations du rendez-vous</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Client:</span>
                      <span className="font-medium">{selectedAppointment.nom}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span>{selectedAppointment.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Téléphone:</span>
                      <span>{selectedAppointment.telephone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span>{format(parseISO(selectedAppointment.date), "dd/MM/yyyy", { locale: fr })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Heure:</span>
                      <span>{selectedAppointment.heure}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span>{getMotifLabel(selectedAppointment.motif)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bien:</span>
                      <span>{properties.find(p => p.id === selectedAppointment.propertyId)?.titre || "Consultation générale"}</span>
                    </div>
                    {selectedAppointment.message && (
                      <div className="pt-2 border-t">
                        <span className="text-muted-foreground">Message:</span>
                        <p className="mt-1">{selectedAppointment.message}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <h4 className="font-medium text-sm">Modifier le statut</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={selectedAppointment.statut === 'en_attente' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateStatusMutation.mutate({ 
                        appointmentId: selectedAppointment.id, 
                        newStatus: 'en_attente' 
                      })}
                      disabled={updateStatusMutation.isPending}
                      className="flex flex-col gap-1 h-auto py-3"
                    >
                      <Clock className="h-4 w-4" />
                      <span className="text-xs">En attente</span>
                    </Button>
                    <Button
                      variant={selectedAppointment.statut === 'confirmé' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateStatusMutation.mutate({ 
                        appointmentId: selectedAppointment.id, 
                        newStatus: 'confirmé' 
                      })}
                      disabled={updateStatusMutation.isPending}
                      className="flex flex-col gap-1 h-auto py-3"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-xs">Confirmé</span>
                    </Button>
                    <Button
                      variant={selectedAppointment.statut === 'annulé' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateStatusMutation.mutate({ 
                        appointmentId: selectedAppointment.id, 
                        newStatus: 'annulé' 
                      })}
                      disabled={updateStatusMutation.isPending}
                      className="flex flex-col gap-1 h-auto py-3"
                    >
                      <XCircle className="h-4 w-4" />
                      <span className="text-xs">Annulé</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => {
                  setAppointmentDialogOpen(false);
                  setSelectedAppointment(null);
                }}
              >
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
