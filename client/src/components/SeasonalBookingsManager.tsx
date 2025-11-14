import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Ban, Calendar, User, Mail, Phone, MapPin, Euro, Trash2 } from "lucide-react";
import { useState } from "react";
import type { SeasonalBookingRequest, Property } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending':
    case 'en_attente':
      return <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800">En attente</Badge>;
    case 'confirmed':
    case 'confirmee':
      return <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">Confirmée</Badge>;
    case 'refused':
    case 'refusee':
      return <Badge variant="outline" className="bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800">Refusée</Badge>;
    case 'cancelled':
    case 'annulee':
      return <Badge variant="outline" className="bg-gray-50 dark:bg-gray-950 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800">Annulée</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function SeasonalBookingsManager() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("tous");
  const [selectedBooking, setSelectedBooking] = useState<SeasonalBookingRequest | null>(null);
  const [refusalReason, setRefusalReason] = useState("");
  const [showRefusalDialog, setShowRefusalDialog] = useState(false);

  const { data: bookings = [], isLoading } = useQuery<SeasonalBookingRequest[]>({
    queryKey: ["/api/seasonal-booking-requests"],
  });

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const confirmMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("PUT", `/api/seasonal-booking-requests/${id}/confirm`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasonal-booking-requests"] });
      toast({
        title: "Réservation confirmée",
        description: "Un email de confirmation a été envoyé au client.",
      });
      setSelectedBooking(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de confirmer la réservation.",
        variant: "destructive",
      });
    },
  });

  const refuseMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      return await apiRequest("PUT", `/api/seasonal-booking-requests/${id}/refuse`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasonal-booking-requests"] });
      toast({
        title: "Réservation refusée",
        description: "Un email a été envoyé au client.",
      });
      setSelectedBooking(null);
      setShowRefusalDialog(false);
      setRefusalReason("");
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de refuser la réservation.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/seasonal-booking-requests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasonal-booking-requests"] });
      toast({
        title: "Réservation supprimée",
        description: "La réservation a été supprimée avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la réservation.",
        variant: "destructive",
      });
    },
  });

  const filteredBookings = bookings.filter((booking) => {
    if (statusFilter === "tous") return true;
    if (statusFilter === "en_attente") return booking.status === "pending" || booking.status === "en_attente";
    if (statusFilter === "confirmee") return booking.status === "confirmed" || booking.status === "confirmee";
    if (statusFilter === "refusee") return booking.status === "refused" || booking.status === "refusee";
    if (statusFilter === "annulee") return booking.status === "cancelled" || booking.status === "annulee";
    return booking.status === statusFilter;
  });

  const getPropertyById = (id: string) => {
    return properties.find((p) => p.id === id);
  };

  const handleConfirm = (booking: SeasonalBookingRequest) => {
    if (window.confirm(`Confirmer la réservation de ${booking.guestName} ?`)) {
      confirmMutation.mutate(booking.id);
    }
  };

  const handleRefuse = (booking: SeasonalBookingRequest) => {
    setSelectedBooking(booking);
    setShowRefusalDialog(true);
  };

  const submitRefusal = () => {
    if (selectedBooking) {
      refuseMutation.mutate({ id: selectedBooking.id, reason: refusalReason });
    }
  };

  const handleDelete = (booking: SeasonalBookingRequest) => {
    if (window.confirm(`Supprimer définitivement la réservation de ${booking.guestName} (${booking.confirmationCode}) ?`)) {
      deleteMutation.mutate(booking.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Gestion des réservations saisonnières</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center mb-6">
            <Label>Filtrer par statut :</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]" data-testid="select-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Toutes</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="confirmee">Confirmées</SelectItem>
                <SelectItem value="refusee">Refusées</SelectItem>
                <SelectItem value="annulee">Annulées</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="ml-auto">
              {filteredBookings.length} réservation{filteredBookings.length > 1 ? "s" : ""}
            </Badge>
          </div>

          <div className="space-y-4">
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Aucune réservation à afficher
              </div>
            ) : (
              filteredBookings.map((booking) => {
                const property = getPropertyById(booking.propertyId);
                const nights = calculateNights(booking.checkIn, booking.checkOut);

                return (
                  <Card key={booking.id} className="hover-elevate">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-lg mb-1" data-testid={`booking-property-${booking.id}`}>
                                {property?.titre || "Propriété non trouvée"}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4" />
                                <span>{property?.ville}</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 items-end">
                              <div className="flex items-center gap-2">
                                {getStatusBadge(booking.status)}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleDelete(booking)}
                                  disabled={deleteMutation.isPending}
                                  data-testid={`button-delete-${booking.id}`}
                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                Code: <span className="font-mono font-semibold">{booking.confirmationCode}</span>
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">{booking.guestName}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <a href={`mailto:${booking.guestEmail}`} className="text-primary hover:underline">
                                  {booking.guestEmail}
                                </a>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                <a href={`tel:${booking.guestPhone}`} className="text-primary hover:underline">
                                  {booking.guestPhone}
                                </a>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span>
                                  <strong>Arrivée:</strong> {formatDate(booking.checkIn)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span>
                                  <strong>Départ:</strong> {formatDate(booking.checkOut)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">{nights} nuit{nights > 1 ? "s" : ""}</span>
                                <span className="text-muted-foreground">•</span>
                                <span>
                                  {booking.numAdults} adulte{booking.numAdults > 1 ? "s" : ""}
                                  {booking.numChildren > 0 && ` + ${booking.numChildren} enfant${booking.numChildren > 1 ? "s" : ""}`}
                                </span>
                              </div>
                              {booking.totalPrice && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Euro className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-semibold text-lg text-primary">{Math.round(parseFloat(booking.totalPrice)).toLocaleString('fr-FR')} €</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {booking.message && (
                            <div className="mt-4 p-3 bg-muted rounded-md">
                              <p className="text-sm font-medium mb-1">Message du client :</p>
                              <p className="text-sm text-muted-foreground italic">{booking.message}</p>
                            </div>
                          )}
                        </div>

                        {(booking.status === "en_attente" || booking.status === "pending") && (
                          <div className="flex flex-col gap-2 lg:w-48">
                            <Button
                              size="sm"
                              onClick={() => handleConfirm(booking)}
                              disabled={confirmMutation.isPending}
                              data-testid={`button-confirm-${booking.id}`}
                              className="w-full"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Confirmer
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRefuse(booking)}
                              disabled={refuseMutation.isPending}
                              data-testid={`button-refuse-${booking.id}`}
                              className="w-full"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Refuser
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showRefusalDialog} onOpenChange={setShowRefusalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser la réservation</DialogTitle>
            <DialogDescription>
              Indiquez le motif du refus (optionnel). Un email sera envoyé au client.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="refusal-reason">Motif du refus (optionnel)</Label>
              <Textarea
                id="refusal-reason"
                placeholder="Ex: Dates déjà réservées, propriété en maintenance, etc."
                value={refusalReason}
                onChange={(e) => setRefusalReason(e.target.value)}
                rows={4}
                data-testid="input-refusal-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRefusalDialog(false);
                setRefusalReason("");
                setSelectedBooking(null);
              }}
              data-testid="button-cancel-refusal"
            >
              Annuler
            </Button>
            <Button
              onClick={submitRefusal}
              disabled={refuseMutation.isPending}
              data-testid="button-submit-refusal"
            >
              <Ban className="w-4 h-4 mr-2" />
              Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
