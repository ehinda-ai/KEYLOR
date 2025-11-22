import { useQuery, useMutation } from "@tanstack/react-query";
import { SeasonalBookingRequest, Property } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Eye, Copy, MapPin, Users, DollarSign, MessageSquare } from "lucide-react";
import { useState, useMemo } from "react";
import { format, parseISO, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";

export function BookingsAdmin() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"calendar" | "management">("calendar");
  const [selectedBooking, setSelectedBooking] = useState<SeasonalBookingRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("toutes");
  const [filterProperty, setFilterProperty] = useState("tous");
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: bookings = [] } = useQuery<SeasonalBookingRequest[]>({
    queryKey: ["/api/seasonal-booking-requests"],
  });

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PUT", `/api/seasonal-booking-requests/${id}/confirm`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasonal-booking-requests"] });
      toast({ title: "✅ Réservation confirmée" });
      setDetailsOpen(false);
    },
  });

  const refuseMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PUT", `/api/seasonal-booking-requests/${id}/refuse`, { reason: "Refusée" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasonal-booking-requests"] });
      toast({ title: "✅ Réservation refusée" });
      setDetailsOpen(false);
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Code copié" });
  };

  const handleViewDetails = (booking: SeasonalBookingRequest) => {
    setSelectedBooking(booking);
    setDetailsOpen(true);
  };

  // Filtrer les réservations
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      const statusMatch = filterStatus === "toutes" || booking.status === filterStatus;
      const propertyMatch = filterProperty === "tous" || booking.propertyId === filterProperty;
      return statusMatch && propertyMatch;
    });
  }, [bookings, filterStatus, filterProperty]);

  // Calendrier par bien
  const bookingsByProperty = useMemo(() => {
    const grouped: Record<string, SeasonalBookingRequest[]> = {};
    bookings.forEach(booking => {
      if (!grouped[booking.propertyId]) {
        grouped[booking.propertyId] = [];
      }
      grouped[booking.propertyId].push(booking);
    });
    return grouped;
  }, [bookings]);

  const getPropertyName = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    return property?.titre || propertyId;
  };

  const confirmedCount = bookings.filter(b => b.status === "confirmee").length;
  const pendingCount = bookings.filter(b => b.status === "en_attente").length;
  const refusedCount = bookings.filter(b => b.status === "refusee").length;

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Confirmées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{confirmedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Refusées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{refusedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("calendar")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === "calendar"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          data-testid="tab-calendar-reservations"
        >
          Calendrier des réservations
        </button>
        <button
          onClick={() => setActiveTab("management")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === "management"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          data-testid="tab-management-reservations"
        >
          Gestion des réservations
        </button>
      </div>

      {/* Calendar Tab */}
      {activeTab === "calendar" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Planning des Réservations</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              >
                ← Mois précédent
              </Button>
              <span className="px-4 py-2 font-semibold">
                {format(currentDate, "MMMM yyyy", { locale: fr })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              >
                Mois suivant →
              </Button>
            </div>
          </div>

          {Object.entries(bookingsByProperty).map(([propertyId, propertyBookings]) => (
            <Card key={propertyId}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {getPropertyName(propertyId)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold mb-2">
                  {["L", "M", "M", "J", "V", "S", "D"].map(day => (
                    <div key={day} className="py-2">{day}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {eachDayOfInterval({
                    start: startOfMonth(currentDate),
                    end: endOfMonth(currentDate),
                  }).map(day => {
                    const dayBookings = propertyBookings.filter(b => {
                      const start = parseISO(b.checkIn);
                      const end = parseISO(b.checkOut);
                      return day >= start && day <= end;
                    });

                    const hasConfirmed = dayBookings.some(b => b.status === "confirmee");
                    const hasPending = dayBookings.some(b => b.status === "en_attente");

                    return (
                      <div
                        key={day.toISOString()}
                        className={`aspect-square p-1 rounded border text-xs flex flex-col items-center justify-center ${
                          dayBookings.length > 0
                            ? hasConfirmed
                              ? "bg-green-50 border-green-300"
                              : hasPending
                              ? "bg-yellow-50 border-yellow-300"
                              : "bg-red-50 border-red-300"
                            : "bg-background border-border"
                        }`}
                      >
                        <div className="font-semibold">{format(day, "d")}</div>
                        {dayBookings.length > 0 && (
                          <div className="text-[10px] font-bold">{dayBookings.length}</div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Réservations détail */}
                {propertyBookings.length > 0 && (
                  <div className="mt-4 space-y-2 border-t pt-4">
                    {propertyBookings.map(booking => (
                      <div
                        key={booking.id}
                        className={`p-2 rounded text-sm cursor-pointer border-l-4 ${
                          booking.status === "confirmee"
                            ? "bg-green-50 border-l-green-500"
                            : booking.status === "en_attente"
                            ? "bg-yellow-50 border-l-yellow-500"
                            : "bg-red-50 border-l-red-500"
                        }`}
                        onClick={() => handleViewDetails(booking)}
                      >
                        <div className="font-semibold flex justify-between items-center">
                          <span>{booking.guestName}</span>
                          <Badge
                            className={
                              booking.status === "confirmee"
                                ? "bg-green-600"
                                : booking.status === "en_attente"
                                ? "bg-yellow-600"
                                : "bg-red-600"
                            }
                          >
                            {booking.status === "confirmee"
                              ? "Confirmée"
                              : booking.status === "en_attente"
                              ? "En attente"
                              : "Refusée"}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(parseISO(booking.checkIn), "d MMM", { locale: fr })} →{" "}
                          {format(parseISO(booking.checkOut), "d MMM", { locale: fr })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Management Tab */}
      {activeTab === "management" && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Toutes les statuts</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="confirmee">Confirmées</SelectItem>
                <SelectItem value="refusee">Refusées</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterProperty} onValueChange={setFilterProperty}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les biens</SelectItem>
                {properties.map(property => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.titre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="ml-auto text-sm text-muted-foreground">
              {filteredBookings.length} réservation{filteredBookings.length !== 1 ? "s" : ""}
            </div>
          </div>

          <div className="space-y-3">
            {filteredBookings.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Aucune réservation trouvée</p>
            ) : (
              filteredBookings.map(booking => (
                <Card key={booking.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-base flex items-center gap-2">
                            {getPropertyName(booking.propertyId)}
                            <Badge
                              className={
                                booking.status === "confirmee"
                                  ? "bg-green-600"
                                  : booking.status === "en_attente"
                                  ? "bg-yellow-600"
                                  : "bg-red-600"
                              }
                            >
                              {booking.status === "confirmee"
                                ? "Confirmée"
                                : booking.status === "en_attente"
                                ? "En attente"
                                : "Refusée"}
                            </Badge>
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Code: <span className="font-mono font-semibold">{booking.confirmationCode}</span>
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(booking)}
                          data-testid={`button-view-booking-${booking.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Client</p>
                          <p className="font-semibold">{booking.guestName}</p>
                          <p className="text-xs">{booking.guestEmail}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Dates</p>
                          <p className="font-semibold">
                            {format(parseISO(booking.checkIn), "d MMM", { locale: fr })} →{" "}
                            {format(parseISO(booking.checkOut), "d MMM", { locale: fr })}
                          </p>
                          <p className="text-xs">
                            {booking.numAdults} adulte{booking.numAdults > 1 ? "s" : ""} · {booking.numChildren || 0} enfant
                            {booking.numChildren !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Prix</p>
                          <p className="font-semibold text-lg">
                            {booking.totalPrice || booking.numAdults * 100}€
                          </p>
                        </div>
                      </div>

                      {/* Message */}
                      {booking.message && (
                        <div className="bg-muted p-3 rounded text-sm border-l-2 border-amber-500">
                          <p className="text-xs text-muted-foreground flex items-center gap-2 mb-1">
                            <MessageSquare className="w-3 h-3" />
                            Message du client
                          </p>
                          <p className="text-sm italic">{booking.message}</p>
                        </div>
                      )}

                      {/* Actions */}
                      {booking.status === "en_attente" && (
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            className="flex-1"
                            size="sm"
                            onClick={() => confirmMutation.mutate(booking.id)}
                            data-testid={`button-confirm-booking-${booking.id}`}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Accepter
                          </Button>
                          <Button
                            variant="destructive"
                            className="flex-1"
                            size="sm"
                            onClick={() => refuseMutation.mutate(booking.id)}
                            data-testid={`button-refuse-booking-${booking.id}`}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Refuser
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Récapitulatif de réservation</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              {/* Bien */}
              <div className="bg-muted p-4 rounded-lg border">
                <p className="font-semibold text-base flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {getPropertyName(selectedBooking.propertyId)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Sans jours conditionnés
                </p>
              </div>

              {/* Code & Status */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Code de confirmation</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-bold text-lg">{selectedBooking.confirmationCode}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(selectedBooking.confirmationCode)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Badge
                  className={`text-lg px-4 py-2 ${
                    selectedBooking.status === "confirmee"
                      ? "bg-green-600"
                      : selectedBooking.status === "en_attente"
                      ? "bg-yellow-600"
                      : "bg-red-600"
                  }`}
                >
                  {selectedBooking.status === "confirmee"
                    ? "Confirmée"
                    : selectedBooking.status === "en_attente"
                    ? "En attente"
                    : "Refusée"}
                </Badge>
              </div>

              {/* Client Info */}
              <div className="border-t pt-4">
                <p className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Informations client
                </p>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Nom:</span>{" "}
                    <span className="font-semibold">{selectedBooking.guestName}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Email:</span>{" "}
                    <span className="font-semibold">{selectedBooking.guestEmail}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Téléphone:</span>{" "}
                    <span className="font-semibold">{selectedBooking.guestPhone || "-"}</span>
                  </p>
                </div>
              </div>

              {/* Dates & Guests */}
              <div className="border-t pt-4 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Arrivée</p>
                  <p className="font-semibold">
                    {format(parseISO(selectedBooking.checkIn), "d MMM yyyy", {
                      locale: fr,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Départ</p>
                  <p className="font-semibold">
                    {format(parseISO(selectedBooking.checkOut), "d MMM yyyy", {
                      locale: fr,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Occupants</p>
                  <p className="font-semibold">
                    {selectedBooking.numAdults} adulte{selectedBooking.numAdults > 1 ? "s" : ""} ·{" "}
                    {selectedBooking.numChildren || 0} enfant
                    {selectedBooking.numChildren !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Price */}
              <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-700">
                <div className="flex justify-between items-center">
                  <p className="font-semibold flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Montant total
                  </p>
                  <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                    {selectedBooking.totalPrice || selectedBooking.numAdults * 100}€
                  </p>
                </div>
              </div>

              {/* Message */}
              {selectedBooking.message && (
                <div className="bg-muted p-3 rounded text-sm border">
                  <p className="font-semibold mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Message du client
                  </p>
                  <p className="whitespace-pre-wrap italic">{selectedBooking.message}</p>
                </div>
              )}

              {/* Actions */}
              {selectedBooking.status === "en_attente" && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={() => confirmMutation.mutate(selectedBooking.id)}
                    data-testid={`button-confirm-booking-${selectedBooking.id}`}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Confirmer la réservation
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => refuseMutation.mutate(selectedBooking.id)}
                    data-testid={`button-refuse-booking-${selectedBooking.id}`}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Refuser
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
