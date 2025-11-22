import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download, Mail, FileText } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from "date-fns";
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
        Date: `${booking.dateDebut} à ${booking.dateFin}`,
        Heure: "",
        Contact: booking.nom,
        Email: booking.email || "",
        Motif: "Location saisonnière",
        Statut: booking.statut,
      });
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Planning");
    XLSX.writeFile(wb, `planning_${format(currentDate, "yyyy-MM")}.xlsx`);
    toast({ title: "Planning exporté en Excel" });
  };

  // Exporter en PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.text(`Planning - ${format(currentDate, "MMMM yyyy", { locale: fr })}`, pageWidth / 2, 15, { align: "center" });

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
        `${booking.dateDebut} - ${booking.dateFin}`,
        booking.nom,
        booking.email || "",
        "Location saisonnière",
        booking.statut,
      ]);
    });

    (doc as any).autoTable({
      head: [tableData[0]],
      body: tableData.slice(1),
      startY: 25,
      margin: 10,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [200, 140, 70], textColor: 255 },
    });

    doc.save(`planning_${format(currentDate, "yyyy-MM")}.pdf`);
    toast({ title: "Planning exporté en PDF" });
  };

  // Envoyer par email
  const handleSendEmail = async () => {
    if (!emailRecipient) {
      toast({ title: "Entrez une adresse email", variant: "destructive" });
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/send-planning-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: emailRecipient,
          month: format(currentDate, "yyyy-MM"),
          appointments,
          bookings,
        }),
      });

      if (!response.ok) throw new Error("Erreur");
      toast({ title: "Planning envoyé par email" });
      setEmailRecipient("");
    } catch {
      toast({ title: "Erreur lors de l'envoi", variant: "destructive" });
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
                ←
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
                →
              </Button>
            </div>

            {/* Calendrier */}
            <div className="bg-muted rounded-lg p-3">
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold mb-2">
                {["L", "M", "M", "J", "V", "S", "D"].map(day => (
                  <div key={day}>{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {monthDays.map(day => {
                  const dateKey = format(day, "yyyy-MM-dd");
                  const dayAppointments = monthEvents.appointmentsByDate[dateKey] || [];
                  const dayBookings = monthEvents.bookingsByDate[dateKey] || [];
                  const totalEvents = dayAppointments.length + dayBookings.length;

                  return (
                    <div
                      key={dateKey}
                      className={`aspect-square p-1 rounded text-xs border ${
                        isSameMonth(day, currentDate)
                          ? "bg-background border-border"
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

        {/* Légende et actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Légende</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500"></div>
                <span>Confirmé</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-yellow-500"></div>
                <span>En attente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500"></div>
                <span>Refusé</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gray-400"></div>
                <span>Autre</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exports */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Exports et partage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportExcel}
                data-testid="button-export-excel"
              >
                <Download className="w-4 h-4 mr-2" />
                Excel
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportPDF}
                data-testid="button-export-pdf"
              >
                <FileText className="w-4 h-4 mr-2" />
                PDF
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
                  disabled={isSending}
                  data-testid="button-send-email"
                >
                  <Mail className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste détaillée des événements */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Événements du mois</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {appointments.length === 0 && bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun événement ce mois-ci</p>
            ) : (
              <>
                {appointments.map(apt => (
                  <div key={apt.id} className="border rounded p-2 text-sm">
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
                  <div key={booking.id} className="border rounded p-2 text-sm">
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
