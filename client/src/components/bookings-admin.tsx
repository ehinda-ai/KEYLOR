import { useQuery, useMutation } from "@tanstack/react-query";
import { SeasonalBookingRequest } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Eye, Copy } from "lucide-react";
import { useState } from "react";

export function BookingsAdmin() {
  const { toast } = useToast();
  const [selectedBooking, setSelectedBooking] = useState<SeasonalBookingRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: bookings = [], isLoading } = useQuery<SeasonalBookingRequest[]>({
    queryKey: ["/api/seasonal-booking-requests"],
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PUT", `/api/seasonal-booking-requests/${id}/confirm`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasonal-booking-requests"] });
      toast({ title: "Réservation confirmée" });
      setDetailsOpen(false);
    },
  });

  const refuseMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PUT", `/api/seasonal-booking-requests/${id}/refuse`, { reason: "Refusée" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasonal-booking-requests"] });
      toast({ title: "Réservation refusée" });
      setDetailsOpen(false);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PUT", `/api/seasonal-booking-requests/${id}/cancel`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasonal-booking-requests"] });
      toast({ title: "Réservation annulée" });
      setDetailsOpen(false);
    },
  });

  const handleViewDetails = (booking: SeasonalBookingRequest) => {
    setSelectedBooking(booking);
    setDetailsOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Code copié" });
  };

  const confirmedCount = bookings.filter(b => b.status === "confirmee").length;
  const pendingCount = bookings.filter(b => b.status === "en_attente").length;
  const refusedCount = bookings.filter(b => b.status === "refusee").length;

  return (
    <div className="space-y-4">
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
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              <CheckCircle2 className="w-4 h-4 inline mr-1" />
              Confirmées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              <XCircle className="w-4 h-4 inline mr-1" />
              Refusées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{refusedCount}</div>
          </CardContent>
        </Card>
      </div>

      <h3 className="text-lg font-semibold">Réservations saisonnières</h3>

      {isLoading ? (
        <div>Chargement...</div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id} data-testid={`row-booking-${booking.id}`}>
                  <TableCell className="font-mono text-sm">{booking.confirmationCode}</TableCell>
                  <TableCell>{booking.guestName}</TableCell>
                  <TableCell>{booking.checkIn}</TableCell>
                  <TableCell>{booking.checkOut}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      booking.status === "confirmee" ? "bg-green-100 text-green-800" :
                      booking.status === "refusee" ? "bg-red-100 text-red-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>
                      {booking.status === "confirmee" ? "Confirmée" : 
                       booking.status === "refusee" ? "Refusée" : 
                       "En attente"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {booking.status === "en_attente" && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => confirmMutation.mutate(booking.id)}
                            data-testid={`button-confirm-booking-${booking.id}`}
                            disabled={confirmMutation.isPending}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => refuseMutation.mutate(booking.id)}
                            data-testid={`button-refuse-booking-${booking.id}`}
                            disabled={refuseMutation.isPending}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {booking.status === "confirmee" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelMutation.mutate(booking.id)}
                          data-testid={`button-cancel-booking-${booking.id}`}
                          disabled={cancelMutation.isPending}
                        >
                          Annuler
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(booking)}
                        data-testid={`button-view-booking-${booking.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails de la réservation</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Code de confirmation</label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-mono bg-gray-50 px-3 py-2 rounded flex-1">{selectedBooking.confirmationCode}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(selectedBooking.confirmationCode)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Client</label>
                  <p>{selectedBooking.guestName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p>{selectedBooking.guestEmail}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Check-in</label>
                  <p>{selectedBooking.checkIn}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Check-out</label>
                  <p>{selectedBooking.checkOut}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Adultes</label>
                  <p>{selectedBooking.numAdults}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Enfants</label>
                  <p>{selectedBooking.numChildren || 0}</p>
                </div>
              </div>
              {selectedBooking.message && (
                <div>
                  <label className="text-sm font-medium">Message</label>
                  <p className="whitespace-pre-wrap bg-gray-50 p-3 rounded mt-1">{selectedBooking.message}</p>
                </div>
              )}

              {selectedBooking.status === "en_attente" && (
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={() => confirmMutation.mutate(selectedBooking.id)}
                    data-testid={`button-confirm-booking-${selectedBooking.id}`}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Confirmer
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
