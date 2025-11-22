import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download, Mail, FileText } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface Appointment {
  id: string;
  date: string;
  heure: string;
  nom: string;
  motif: string;
  statut?: string;
  email?: string;
}

interface SeasonalBooking {
  id: string;
  dateDebut: string;
  dateFin: string;
  nom: string;
  statut: string;
  email?: string;
  telephone?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "confirmé":
    case "confirmed":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "en_attente":
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "refusé":
    case "refused":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
};

export function PlanningAdmin() {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [emailRecipient, setEmailRecipient] = useState("");
  const [isSending, setIsSending] = useState(false);

  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: bookings = [] } = useQuery<SeasonalBooking[]>({
    queryKey: ["/api/seasonal-booking-requests"],
  });

  // Combiner et filtrer les événements du mois courant
  const monthEvents = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    const appointmentsByDate: Record<string, Appointment[]> = {};
    const bookingsByDate: Record<string, SeasonalBooking[]> = {};

    appointments.forEach(apt => {
      const aptDate = new Date(apt.date);
      if (aptDate >= monthStart && aptDate <= monthEnd) {
        const dateKey = format(aptDate, "yyyy-MM-dd");
        if (!appointmentsByDate[dateKey]) appointmentsByDate[dateKey] = [];
        appointmentsByDate[dateKey].push(apt);
      }
    });

    bookings.forEach(booking => {
      const startDate = new Date(booking.dateDebut);
      const endDate = new Date(booking.dateFin);
      if (startDate <= monthEnd && endDate >= monthStart) {
        const dateKey = format(startDate, "yyyy-MM-dd");
        if (!bookingsByDate[dateKey]) bookingsByDate[dateKey] = [];
        bookingsByDate[dateKey].push(booking);
      }
    });

    return { appointmentsByDate, bookingsByDate };
  }, [currentDate, appointments, bookings]);

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  // Générer HTML pour l'email
  const generateEmailHTML = () => {
    const rows: string[] = [];
    
    appointments.forEach(apt => {
      rows.push(`
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 8px; color: ${apt.statut === 'confirmé' ? '#22c55e' : apt.statut === 'en_attente' ? '#eab308' : '#ef4444'};">Visite</td>
          <td style="padding: 8px;">${apt.date} ${apt.heure}</td>
          <td style="padding: 8px;">${apt.nom}</td>
          <td style="padding: 8px;">${apt.email || '-'}</td>
          <td style="padding: 8px;">${apt.motif}</td>
          <td style="padding: 8px; font-weight: bold; color: ${apt.statut === 'confirmé' ? '#22c55e' : apt.statut === 'en_attente' ? '#eab308' : '#ef4444'};">${apt.statut || 'nouveau'}</td>
        </tr>
      `);
    });

    bookings.forEach(booking => {
      rows.push(`
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 8px; color: ${booking.statut === 'confirmé' ? '#22c55e' : booking.statut === 'en_attente' ? '#eab308' : '#ef4444'};">Réservation</td>
          <td style="padding: 8px;">${booking.dateDebut} à ${booking.dateFin}</td>
          <td style="padding: 8px;">${booking.nom}</td>
          <td style="padding: 8px;">${booking.email || '-'}</td>
          <td style="padding: 8px;">Location saisonnière</td>
          <td style="padding: 8px; font-weight: bold; color: ${booking.statut === 'confirmé' ? '#22c55e' : booking.statut === 'en_attente' ? '#eab308' : '#ef4444'};">${booking.statut}</td>
        </tr>
      `);
    });

    return `
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            h1 { color: #1a1a1a; border-bottom: 3px solid #c4a674; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f0f0f0; padding: 10px; text-align: left; font-weight: bold; }
            td { padding: 8px; }
          </style>
        </head>
        <body>
          <h1>Planning - ${format(currentDate, "MMMM yyyy", { locale: fr })}</h1>
          <p>Calendrier des rendez-vous programmés</p>
          
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Date/Heure</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Motif</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              ${rows.join('\n')}
            </tbody>
          </table>

          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            Légende: <span style="color: #22c55e;">■</span> Confirmé | 
            <span style="color: #eab308;">■</span> En attente | 
            <span style="color: #ef4444;">■</span> Refusé
          </p>
        </body>
      </html>
    `;
  };

  // Exporter en Excel
  const handleExportExcel = () => {
    const data: any[] = [];

    appointments.forEach(apt => {
      data.push({
        Type: "Visite",
        Date: apt.date,
        Heure: apt.heure,
        Contact: apt.nom,
        Email: apt.email || "",
        Motif: apt.motif,
        Statut: apt.statut || "nouveau",
      });
    });

    bookings.forEach(booking => {
      data.push({
        Type: "Réservation",
        Date: `${booking.dateDebut}`,
        Heure: `à ${booking.dateFin}`,
        Contact: booking.nom,
        Email: booking.email || "",
        Motif: "Location saisonnière",
        Statut: booking.statut,
      });
    });

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 12 }];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Planning");
    XLSX.writeFile(wb, `planning_${format(currentDate, "yyyy-MM")}.xlsx`);
    toast({ title: "✅ Planning exporté en Excel" });
  };

  // Exporter en PDF
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margins = 10;

      // Titre
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text(`Planning - ${format(currentDate, "MMMM yyyy", { locale: fr })}`, pageWidth / 2, margins + 10, { align: "center" });

      // Sous-titre
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Calendrier des rendez-vous programmés", pageWidth / 2, margins + 18, { align: "center" });

      // Préparation des données
      const tableData: any[] = [
        ["Type", "Date/Heure", "Contact", "Email", "Motif", "Statut"],
      ];

      appointments.forEach(apt => {
        tableData.push([
          "Visite",
          `${apt.date} ${apt.heure}`,
          apt.nom,
          apt.email || "",
          apt.motif,
          apt.statut || "nouveau",
        ]);
      });

      bookings.forEach(booking => {
        tableData.push([
          "Réservation",
          `${booking.dateDebut}\nà ${booking.dateFin}`,
          booking.nom,
          booking.email || "",
          "Location saisonnière",
          booking.statut,
        ]);
      });

      // Table
      (doc as any).autoTable({
        head: [tableData[0]],
        body: tableData.slice(1),
        startY: margins + 25,
        margin: margins,
        styles: {
          fontSize: 9,
          cellPadding: 3,
          overflow: "linebreak",
          halign: "left",
          valign: "middle",
        },
        headStyles: {
          fillColor: [196, 166, 116],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        didDrawPage: () => {
          // Footer
          const pageCount = (doc as any).internal.pages.length - 1;
          for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(
              `Page ${i} / ${pageCount}`,
              pageWidth / 2,
              pageHeight - 5,
              { align: "center" }
            );
          }
        },
      });

      doc.save(`planning_${format(currentDate, "yyyy-MM")}.pdf`);
      toast({ title: "✅ Planning exporté en PDF" });
    } catch (error) {
      console.error("Erreur PDF:", error);
      toast({ title: "❌ Erreur lors de l'export PDF", variant: "destructive" });
    }
  };

  // Envoyer par email
  const handleSendEmail = async () => {
    if (!emailRecipient) {
      toast({ title: "Entrez une adresse email", variant: "destructive" });
      return;
    }

    setIsSending(true);
    try {
      const htmlContent = generateEmailHTML();
      const response = await fetch("/api/send-planning-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          recipientEmail: emailRecipient,
          planningType: "visites_reservations",
          monthYear: format(currentDate, "yyyy-MM"),
          htmlContent: htmlContent,
          subject: `Planning - ${format(currentDate, "MMMM yyyy", { locale: fr })}`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'envoi");
      }
      
      toast({ title: "✅ Planning envoyé par email" });
      setEmailRecipient("");
    } catch (error) {
      console.error("Erreur email:", error);
      toast({ title: `❌ ${error instanceof Error ? error.message : 'Erreur lors de l\'envoi'}`, variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {/* Sélecteur de mois */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Planning du mois</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                data-testid="button-prev-month"
              >
                ← Mois précédent
              </Button>
              <h3 className="font-semibold text-lg">
                {format(currentDate, "MMMM yyyy", { locale: fr })}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                data-testid="button-next-month"
              >
                Mois suivant →
              </Button>
            </div>

            {/* Calendrier */}
            <div className="bg-muted rounded-lg p-3">
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold mb-2">
                {["L", "M", "M", "J", "V", "S", "D"].map(day => (
                  <div key={day} className="py-1">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {monthDays.map(day => {
                  const dateKey = format(day, "yyyy-MM-dd");
                  const dayAppointments = monthEvents.appointmentsByDate[dateKey] || [];
                  const dayBookings = monthEvents.bookingsByDate[dateKey] || [];
                  const totalEvents = dayAppointments.length + dayBookings.length;
                  const hasConfirmed = dayAppointments.some(a => a.statut === 'confirmé') || dayBookings.some(b => b.statut === 'confirmé');
                  const hasPending = dayAppointments.some(a => a.statut === 'en_attente') || dayBookings.some(b => b.statut === 'en_attente');

                  return (
                    <div
                      key={dateKey}
                      className={`aspect-square p-1 rounded border text-xs ${
                        isSameMonth(day, currentDate)
                          ? hasConfirmed ? "bg-green-50 border-green-200" : hasPending ? "bg-yellow-50 border-yellow-200" : "bg-background border-border"
                          : "bg-muted border-transparent"
                      }`}
                    >
                      <div className="font-semibold">{format(day, "d")}</div>
                      {totalEvents > 0 && (
                        <div className="text-[10px] font-bold text-accent">{totalEvents} evt</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exports et actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportExcel}
                data-testid="button-export-excel"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Export Excel
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportPDF}
                data-testid="button-export-pdf"
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                Export PDF
              </Button>
            </div>

            <div className="border-t pt-3">
              <label className="block text-sm font-medium mb-2">Envoyer par email</label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  data-testid="input-email-recipient"
                />
                <Button
                  size="sm"
                  onClick={handleSendEmail}
                  disabled={isSending || !emailRecipient}
                  data-testid="button-send-email"
                  className="gap-2"
                >
                  <Mail className="w-4 h-4" />
                  {isSending ? "Envoi..." : "Envoyer"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Légende */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Légende</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500"></div>
                <span>Confirmé</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500"></div>
                <span>En attente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500"></div>
                <span>Refusé</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-400"></div>
                <span>Autre</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste détaillée */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Événements du mois</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {appointments.length === 0 && bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun événement ce mois-ci</p>
            ) : (
              <>
                {appointments.map(apt => (
                  <div key={apt.id} className="border rounded p-2 text-sm bg-card">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <strong>{apt.nom}</strong>
                        <p className="text-xs text-muted-foreground">{apt.date} à {apt.heure}</p>
                      </div>
                      <Badge className={getStatusColor(apt.statut || "nouveau")}>
                        {apt.statut || "nouveau"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Motif: {apt.motif}</p>
                    {apt.email && <p className="text-xs text-muted-foreground">Email: {apt.email}</p>}
                  </div>
                ))}

                {bookings.map(booking => (
                  <div key={booking.id} className="border rounded p-2 text-sm bg-card">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <strong>{booking.nom}</strong>
                        <p className="text-xs text-muted-foreground">
                          {booking.dateDebut} à {booking.dateFin}
                        </p>
                      </div>
                      <Badge className={getStatusColor(booking.statut)}>
                        {booking.statut}
                      </Badge>
                    </div>
                    {booking.email && <p className="text-xs text-muted-foreground">Email: {booking.email}</p>}
                    {booking.telephone && <p className="text-xs text-muted-foreground">Tél: {booking.telephone}</p>}
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
