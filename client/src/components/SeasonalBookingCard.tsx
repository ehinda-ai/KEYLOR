import { useState } from "react";
import { Property, insertSeasonalBookingRequestSchema, InsertSeasonalBookingRequest, SeasonalAvailability } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format, differenceInDays, isWithinInterval, parseISO, getDay } from "date-fns";
import { fr } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SeasonalBookingCardProps {
  property: Property;
  dateArrivee?: Date;
  setDateArrivee: (date: Date | undefined) => void;
  dateDepart?: Date;
  setDateDepart: (date: Date | undefined) => void;
}

export function SeasonalBookingCard({ 
  property, 
  dateArrivee, 
  setDateArrivee, 
  dateDepart, 
  setDateDepart 
}: SeasonalBookingCardProps) {
  const { toast } = useToast();
  const [nombreVoyageurs, setNombreVoyageurs] = useState<number>(2);
  const [calendarOpen, setCalendarOpen] = useState<boolean>(false);

  const { data: availabilities = [] } = useQuery<SeasonalAvailability[]>({
    queryKey: ["/api/seasonal-availability", property.id],
    queryFn: async () => {
      const response = await fetch(`/api/seasonal-availability?propertyId=${property.id}`);
      if (!response.ok) throw new Error("Failed to fetch availabilities");
      return response.json();
    },
  });

  const isDateBlocked = (date: Date): boolean => {
    const blockedPeriods = availabilities.filter(a => a.bloque);
    
    return blockedPeriods.some(period => {
      try {
        const start = parseISO(period.dateDebut);
        const end = parseISO(period.dateFin);
        
        return isWithinInterval(date, { start, end });
      } catch (error) {
        return false;
      }
    });
  };

  const isArrivalDayAllowed = (date: Date): boolean => {
    if (!property.joursArriveeAutorises || property.joursArriveeAutorises.length === 0) {
      return true;
    }
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const dayName = dayNames[getDay(date)];
    return property.joursArriveeAutorises.some(allowed => 
      allowed.toLowerCase() === dayName.toLowerCase()
    );
  };

  const isDepartureDayAllowed = (date: Date): boolean => {
    if (!property.joursDepartAutorises || property.joursDepartAutorises.length === 0) {
      return true;
    }
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const dayName = dayNames[getDay(date)];
    return property.joursDepartAutorises.some(allowed => 
      allowed.toLowerCase() === dayName.toLowerCase()
    );
  };

  const meetsMinimumStay = (arrival: Date | undefined, departure: Date | undefined): boolean => {
    if (!arrival || !departure) return true;
    const nights = differenceInDays(departure, arrival);
    const minNights = property.dureeMinimaleNuits || 1;
    return nights >= minNights;
  };

  const form = useForm<InsertSeasonalBookingRequest>({
    resolver: zodResolver(insertSeasonalBookingRequestSchema),
    defaultValues: {
      propertyId: property.id,
      guestName: "",
      guestEmail: "",
      guestPhone: "",
      checkIn: format(new Date(), "yyyy-MM-dd"),
      checkOut: format(new Date(), "yyyy-MM-dd"),
      numAdults: 2,
      numChildren: 0,
      message: "",
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: InsertSeasonalBookingRequest) => {
      const response = await apiRequest("POST", "/api/seasonal-booking-requests", data);
      return response.json();
    },
    onSuccess: () => {
      // Rafraîchir les disponibilités pour que les dates réservées soient grisées
      queryClient.invalidateQueries({ queryKey: ["/api/seasonal-availability", property.id] });
      
      toast({
        title: "Demande envoyée !",
        description: "Nous vous recontacterons rapidement pour confirmer votre réservation.",
      });
      form.reset();
      setDateArrivee(undefined);
      setDateDepart(undefined);
    },
    onError: (error: any) => {
      // Extraire le message d'erreur du serveur
      let errorMessage = "Une erreur est survenue lors de l'envoi de votre demande.";
      
      try {
        // L'erreur de apiRequest a le format: "statusCode: {json}"
        const errorString = error?.message || String(error);
        
        // Essayer d'extraire le JSON après le code de statut
        const jsonMatch = errorString.match(/\d+:\s*(.+)/);
        if (jsonMatch && jsonMatch[1]) {
          const errorData = JSON.parse(jsonMatch[1]);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        }
      } catch (e) {
        // Si on ne peut pas parser, utiliser le message par défaut
        console.error('Error parsing error message:', e);
      }
      
      toast({
        title: "Impossible de réserver",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(parseFloat(price)));
  };

  const calculatePrice = () => {
    if (!dateArrivee || !dateDepart) return null;

    const nights = differenceInDays(dateDepart, dateArrivee);
    const weeks = nights / 7;
    
    // Utiliser la moyenne saison par défaut si disponible, sinon le prix standard
    const weeklyPrice = property.prixMoyenneSaison 
      ? parseFloat(property.prixMoyenneSaison) 
      : parseFloat(property.prix);
    
    return weeklyPrice * weeks;
  };

  const totalPrice = calculatePrice();
  const nights = dateArrivee && dateDepart ? differenceInDays(dateDepart, dateArrivee) : 0;

  const onSubmit = (data: InsertSeasonalBookingRequest) => {
    if (!dateArrivee || !dateDepart) {
      toast({
        title: "Dates manquantes",
        description: "Veuillez sélectionner vos dates d'arrivée et de départ.",
        variant: "destructive",
      });
      return;
    }

    // Vérifier la durée minimale de séjour
    if (property.dureeMinimaleNuits && nights < property.dureeMinimaleNuits) {
      toast({
        title: "Durée de séjour insuffisante",
        description: `La durée minimale de séjour est de ${property.dureeMinimaleNuits} nuit${property.dureeMinimaleNuits > 1 ? 's' : ''}.`,
        variant: "destructive",
      });
      return;
    }

    // Vérifier les jours d'arrivée autorisés
    if (property.joursArriveeAutorises && property.joursArriveeAutorises.length > 0) {
      const dayOfWeek = dateArrivee.getDay(); // 0 = dimanche, 1 = lundi, etc.
      const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
      const currentDayName = dayNames[dayOfWeek];
      
      if (!property.joursArriveeAutorises.includes(currentDayName)) {
        toast({
          title: "Jour d'arrivée non autorisé",
          description: `Les arrivées sont uniquement possibles : ${property.joursArriveeAutorises.join(', ')}.`,
          variant: "destructive",
        });
        return;
      }
    }

    // Vérifier les jours de départ autorisés
    if (property.joursDepartAutorises && property.joursDepartAutorises.length > 0) {
      const dayOfWeek = dateDepart.getDay();
      const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
      const currentDayName = dayNames[dayOfWeek];
      
      if (!property.joursDepartAutorises.includes(currentDayName)) {
        toast({
          title: "Jour de départ non autorisé",
          description: `Les départs sont uniquement possibles : ${property.joursDepartAutorises.join(', ')}.`,
          variant: "destructive",
        });
        return;
      }
    }

    createBookingMutation.mutate({
      ...data,
      checkIn: format(dateArrivee, "yyyy-MM-dd"),
      checkOut: format(dateDepart, "yyyy-MM-dd"),
      numAdults: nombreVoyageurs,
      numChildren: 0,
      totalPrice: totalPrice?.toString(),
    });
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        {property.prixBasseSaison && property.prixHauteSaison ? (
          <div>
            <p className="text-3xl font-serif font-light text-accent">
              {formatPrice(property.prixBasseSaison)} - {formatPrice(property.prixHauteSaison)}
            </p>
            <p className="text-sm text-muted-foreground">par semaine selon saison</p>
          </div>
        ) : (
          <div>
            <p className="text-3xl font-serif font-light text-accent">
              {formatPrice(property.prix)}
            </p>
            <p className="text-sm text-muted-foreground">par semaine</p>
          </div>
        )}
      </div>

      {(property.dureeMinimaleNuits || 
        (property.heureArriveeDebut && property.heureArriveeFin) || 
        (property.heureDepartDebut && property.heureDepartFin) ||
        (property.joursArriveeAutorises && property.joursArriveeAutorises.length > 0) ||
        (property.joursDepartAutorises && property.joursDepartAutorises.length > 0)) && (
        <div className="mb-4 p-3 bg-muted/50 rounded-md space-y-1 text-sm">
          <p className="font-medium mb-2">Modalités de réservation :</p>
          {property.dureeMinimaleNuits && property.dureeMinimaleNuits > 1 && (
            <p className="text-muted-foreground">
              • Séjour minimum : {property.dureeMinimaleNuits} nuit{property.dureeMinimaleNuits > 1 ? 's' : ''}
            </p>
          )}
          {property.heureArriveeDebut && property.heureArriveeFin && (
            <p className="text-muted-foreground">
              • Arrivée : entre {property.heureArriveeDebut} et {property.heureArriveeFin}
            </p>
          )}
          {property.heureDepartDebut && property.heureDepartFin && (
            <p className="text-muted-foreground">
              • Départ : entre {property.heureDepartDebut} et {property.heureDepartFin}
            </p>
          )}
          {property.joursArriveeAutorises && property.joursArriveeAutorises.length > 0 && (
            <p className="text-muted-foreground">
              • Arrivées autorisées : {property.joursArriveeAutorises.join(', ')}
            </p>
          )}
          {property.joursDepartAutorises && property.joursDepartAutorises.length > 0 && (
            <p className="text-muted-foreground">
              • Départs autorisés : {property.joursDepartAutorises.join(', ')}
            </p>
          )}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Dates de séjour</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  data-testid="button-dates"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateArrivee && dateDepart ? (
                    <span>
                      {format(dateArrivee, "dd MMM", { locale: fr })} - {format(dateDepart, "dd MMM", { locale: fr })}
                    </span>
                  ) : dateArrivee ? (
                    <span className="text-muted-foreground text-sm">
                      {format(dateArrivee, "dd MMM", { locale: fr })} - Sélectionnez le départ
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">Sélectionnez vos dates</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-50" align="center" side="bottom" sideOffset={4}>
                <div className="max-h-[400px] overflow-auto">
                  <Calendar
                    mode="range"
                    selected={{
                      from: dateArrivee,
                      to: dateDepart,
                    }}
                    onSelect={(range) => {
                      setDateArrivee(range?.from);
                      setDateDepart(range?.to);
                      // Fermer automatiquement le calendrier après la sélection de la date de fin
                      if (range?.to) {
                        setCalendarOpen(false);
                      }
                    }}
                    disabled={(date) => {
                      if (date < new Date()) return true;
                      if (isDateBlocked(date)) return true;
                      
                      if (!dateArrivee) {
                        return !isArrivalDayAllowed(date);
                      } else {
                        if (!isDepartureDayAllowed(date)) return true;
                        if (date <= dateArrivee) return true;
                        
                        const minNights = property.dureeMinimaleNuits || 1;
                        const nights = differenceInDays(date, dateArrivee);
                        if (nights < minNights) return true;
                        
                        return false;
                      }
                    }}
                    modifiers={{
                      available: (date) => {
                        if (date < new Date()) return false;
                        if (isDateBlocked(date)) return false;
                        
                        if (!dateArrivee) {
                          return isArrivalDayAllowed(date);
                        } else {
                          if (!isDepartureDayAllowed(date)) return false;
                          if (date <= dateArrivee) return false;
                          
                          const minNights = property.dureeMinimaleNuits || 1;
                          const nights = differenceInDays(date, dateArrivee);
                          return nights >= minNights;
                        }
                      },
                    }}
                    modifiersClassNames={{
                      available: "bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100 hover:bg-green-200 dark:hover:bg-green-900/50 font-medium",
                    }}
                    numberOfMonths={2}
                    initialFocus
                    locale={fr}
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Voyageurs</Label>
            <Select
              value={nombreVoyageurs.toString()}
              onValueChange={(value) => {
                setNombreVoyageurs(parseInt(value));
                form.setValue("numAdults", parseInt(value));
              }}
            >
              <SelectTrigger data-testid="select-guests">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: property.personnesMax || 10 }, (_, i) => i + 1).map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? "voyageur" : "voyageurs"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {dateArrivee && dateDepart && totalPrice && (
            <div className="p-5 bg-primary/5 border-2 border-primary/20 rounded-lg space-y-3">
              <div className="text-center pb-3 border-b border-primary/10">
                <p className="text-3xl font-serif font-light text-primary mb-1">
                  {formatPrice(totalPrice.toString())}
                </p>
                <p className="text-sm text-muted-foreground">
                  pour {nights} nuit{nights > 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Arrivée</p>
                  <p className="font-medium">{format(dateArrivee, "dd/MM/yyyy", { locale: fr })}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Départ</p>
                  <p className="font-medium">{format(dateDepart, "dd/MM/yyyy", { locale: fr })}</p>
                </div>
              </div>
              
              <div className="text-sm">
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Voyageurs</p>
                <p className="font-medium">{nombreVoyageurs} {nombreVoyageurs === 1 ? "voyageur" : "voyageurs"}</p>
              </div>

              {(property.taxeSejour || property.depotGarantie) && (
                <div className="pt-3 border-t border-primary/10 space-y-2">
                  {property.taxeSejour && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Taxe de séjour</span>
                      <span>~{formatPrice((parseFloat(property.taxeSejour) * nombreVoyageurs * nights).toString())}</span>
                    </div>
                  )}
                  {property.depotGarantie && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Caution (non encaissée)</span>
                      <span>{formatPrice(property.depotGarantie)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="border-t pt-4"></div>

          <FormField
            control={form.control}
            name="guestName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom complet</FormLabel>
                <FormControl>
                  <Input placeholder="Jean Dupont" {...field} data-testid="input-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="guestEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="jean@example.com" {...field} data-testid="input-email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="guestPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Téléphone</FormLabel>
                <FormControl>
                  <Input placeholder="06 12 34 56 78" {...field} data-testid="input-phone" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message (optionnel)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Indiquez vos demandes particulières..."
                    {...field}
                    value={field.value || ""}
                    data-testid="textarea-message"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={createBookingMutation.isPending || !dateArrivee || !dateDepart}
            data-testid="button-submit-booking"
          >
            {createBookingMutation.isPending ? "Envoi en cours..." : "Demander une réservation"}
          </Button>
        </form>
      </Form>

      <p className="text-xs text-muted-foreground text-center mt-4">
        Vous ne serez pas débité immédiatement
      </p>
    </Card>
  );
}
