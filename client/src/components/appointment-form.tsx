import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAppointmentSchema, type InsertAppointment } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";

interface AppointmentFormProps {
  propertyId: string;
  origine?: string;
  onSuccess?: () => void;
}

interface TimeSlot {
  time: string;
  available: boolean;
  priority?: number;
}

export function AppointmentForm({ propertyId, origine, onSuccess }: AppointmentFormProps) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [weekOffset, setWeekOffset] = useState(0);

  // Déterminer le motif par défaut selon l'origine
  const getDefaultMotif = () => {
    if (origine === "gerer") return "gerer";
    if (origine === "vendre") return "vendre";
    return "visite";
  };

  const getMotifLabel = (motif: string) => {
    const labels: Record<string, string> = {
      vendre: "Vendre mon bien",
      gerer: "Faire gérer mon bien",
      visite: "Visite d'un bien",
      autre: "Autre",
      audit: "Audit / Consultation"
    };
    return labels[motif] || labels.audit;
  };

  const form = useForm<InsertAppointment>({
    resolver: zodResolver(insertAppointmentSchema),
    defaultValues: {
      propertyId,
      nom: "",
      email: "",
      telephone: "",
      date: "",
      heure: "",
      message: "",
      motif: getDefaultMotif(),
      consentRGPD: false,
    },
  });

  // Générer les 5 prochains jours à partir de l'offset
  const next5Days = Array.from({ length: 5 }, (_, i) => {
    const date = addDays(new Date(), i + 1 + (weekOffset * 5));
    return {
      date: format(date, "yyyy-MM-dd"),
      dayName: format(date, "EEEE", { locale: fr }),
      dayDate: format(date, "d MMM", { locale: fr }),
    };
  });

  // Récupérer les créneaux pour chaque jour
  const slotsQueries = next5Days.map(day => 
    useQuery<{ slots: TimeSlot[] }>({
      queryKey: ["/api/appointments/available-slots", propertyId, day.date],
    })
  );

  // Extraire tous les créneaux horaires uniques
  const allTimeSlots = new Set<string>();
  slotsQueries.forEach(query => {
    query.data?.slots.forEach(slot => allTimeSlots.add(slot.time));
  });
  const sortedTimeSlots = Array.from(allTimeSlots).sort();

  const handleSlotClick = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    form.setValue("date", date);
    form.setValue("heure", time);
  };

  const isSlotAvailable = (dayIndex: number, time: string) => {
    const query = slotsQueries[dayIndex];
    if (!query.data) return false;
    const slot = query.data.slots.find(s => s.time === time);
    return slot?.available ?? false;
  };

  const isSlotSelected = (date: string, time: string) => {
    return selectedDate === date && selectedTime === time;
  };

  const createAppointment = useMutation({
    mutationFn: async (data: InsertAppointment) =>
      apiRequest("POST", "/api/appointments", data),
    onSuccess: () => {
      // Invalider les RDV ET tous les créneaux disponibles pour cette propriété
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/available-slots", propertyId] });
      toast({
        title: "Rendez-vous demandé",
        description: "Nous vous contacterons rapidement pour confirmer votre visite.",
      });
      form.reset();
      setSelectedDate("");
      setSelectedTime("");
      onSuccess?.();
    },
    onError: (error: any) => {
      const errorMessage = error?.message || error?.error || "Une erreur est survenue. Veuillez réessayer.";
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => createAppointment.mutate(data))}
        className="space-y-6"
      >
        {/* Formulaire contact d'abord */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="nom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom complet</FormLabel>
                <FormControl>
                  <Input placeholder="Jean Dupont" {...field} data-testid="input-nom" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
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
              name="telephone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone</FormLabel>
                  <FormControl>
                    <Input placeholder="06 12 34 56 78" {...field} data-testid="input-telephone" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="motif"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Motif de la demande de rendez-vous</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-motif">
                      <SelectValue placeholder="Sélectionnez le motif" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="vendre">Vendre mon bien</SelectItem>
                    <SelectItem value="gerer">Faire gérer mon bien</SelectItem>
                    <SelectItem value="visite">Visite d'un bien</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                    <SelectItem value="audit">Audit / Consultation</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Calendrier avec créneaux (plus compact) */}
        <div className="border rounded-lg overflow-hidden bg-card">
          {/* Navigation */}
          <div className="bg-accent/5 px-3 py-2 flex items-center justify-between border-b">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
              disabled={weekOffset === 0}
              data-testid="button-prev-week"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-xs font-medium text-muted-foreground">Choisissez votre créneau</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setWeekOffset(weekOffset + 1)}
              data-testid="button-next-week"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Grille calendrier */}
          <div className="overflow-x-auto">
            <div className="min-w-[650px]">
              {/* En-têtes des jours */}
              <div className="grid grid-cols-5">
                {next5Days.map((day) => (
                  <div
                    key={day.date}
                    className="p-2 text-center border-r last:border-r-0 bg-muted/20"
                  >
                    <div className="font-medium text-xs capitalize text-foreground">{day.dayName}</div>
                    <div className="text-[10px] text-muted-foreground">{day.dayDate}</div>
                  </div>
                ))}
              </div>

              {/* Grille des créneaux */}
              <div className="bg-background">
                {sortedTimeSlots.length > 0 ? (
                  sortedTimeSlots.map((time) => (
                    <div key={time} className="grid grid-cols-5 border-t">
                      {next5Days.map((day, dayIndex) => {
                        const query = slotsQueries[dayIndex];
                        const slot = query.data?.slots.find(s => s.time === time);
                        const available = slot?.available ?? false;
                        const priority = slot?.priority ?? 0;
                        const isRecommended = priority > 0;
                        const selected = isSlotSelected(day.date, time);
                        
                        return (
                          <div
                            key={`${day.date}-${time}`}
                            className="p-1.5 border-r last:border-r-0 flex items-center justify-center"
                          >
                            {available ? (
                              <div className="w-full relative">
                                {isRecommended && !selected && (
                                  <div className="absolute -top-0.5 -right-0.5 z-10">
                                    <span className="text-[8px]">★</span>
                                  </div>
                                )}
                                <button
                                  type="button"
                                  className={`
                                    w-full py-1.5 px-2 rounded text-xs font-medium transition-all relative
                                    ${selected 
                                      ? 'bg-primary text-primary-foreground shadow-sm' 
                                      : isRecommended
                                        ? 'bg-accent/50 hover:bg-accent/70 text-foreground'
                                        : 'bg-accent/30 hover:bg-accent/50 text-foreground'
                                    }
                                  `}
                                  onClick={() => handleSlotClick(day.date, time)}
                                  data-testid={`button-slot-${day.date}-${time}`}
                                >
                                  {time}
                                </button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground/40 text-xs">—</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <p className="text-muted-foreground text-sm">
                      Aucun créneau disponible pour ces dates.
                    </p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Veuillez naviguer vers d'autres jours ou contacter l'agence.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Créneau sélectionné */}
          {selectedDate && selectedTime && (
            <div className="border-t bg-primary/10 px-3 py-2 text-xs text-center">
              <strong className="text-primary">✓</strong>{" "}
              <span className="capitalize">
                {format(new Date(selectedDate + 'T12:00:00'), "EEEE d MMMM", { locale: fr })}
              </span>{" "}
              à <strong>{selectedTime}</strong>
            </div>
          )}
        </div>

        {/* Message optionnel */}
        <div className="space-y-4">

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message (optionnel)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Questions ou précisions..."
                    className="resize-none"
                    rows={3}
                    {...field}
                    value={field.value || ""}
                    data-testid="textarea-message"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="consentRGPD"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    data-testid="checkbox-consent"
                    className="mt-1"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-normal">
                    J'accepte que mes données personnelles soient utilisées pour me contacter concernant ma demande de visite
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={createAppointment.isPending || !selectedDate || !selectedTime}
            data-testid="button-submit-appointment"
          >
            {createAppointment.isPending ? "Envoi en cours..." : "Confirmer ma demande de visite"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
