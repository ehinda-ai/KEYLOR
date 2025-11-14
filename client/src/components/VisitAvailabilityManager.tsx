import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { VisitAvailability, InsertVisitAvailability, insertVisitAvailabilitySchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";

const JOURS_SEMAINE = [
  { value: "lundi", label: "Lundi" },
  { value: "mardi", label: "Mardi" },
  { value: "mercredi", label: "Mercredi" },
  { value: "jeudi", label: "Jeudi" },
  { value: "vendredi", label: "Vendredi" },
  { value: "samedi", label: "Samedi" },
  { value: "dimanche", label: "Dimanche" },
];

const INTERVALLES = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 heure" },
];

export function VisitAvailabilityManager() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const { data: availabilities = [], isLoading } = useQuery<VisitAvailability[]>({
    queryKey: ["/api/visit-availability"],
  });

  const form = useForm<InsertVisitAvailability>({
    resolver: zodResolver(insertVisitAvailabilitySchema),
    defaultValues: {
      date: "2024-01-01",
      jourSemaine: "lundi",
      heureDebut: "09:00",
      heureFin: "18:00",
      intervalleCreneaux: 30,
      dureeVisite: 45,
      margeSecurite: 15,
      actif: true,
    },
  });

  const createAvailability = useMutation({
    mutationFn: async (data: InsertVisitAvailability) =>
      apiRequest("POST", "/api/visit-availability", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visit-availability"] });
      toast({ title: "Disponibilités ajoutées" });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer les disponibilités",
        variant: "destructive",
      });
    },
  });

  const deleteAvailability = useMutation({
    mutationFn: async (id: string) =>
      apiRequest("DELETE", `/api/visit-availability/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visit-availability"] });
      toast({ title: "Disponibilité supprimée" });
    },
  });

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const onSubmit = async (data: Omit<InsertVisitAvailability, 'jourSemaine'>) => {
    if (selectedDays.length === 0) {
      toast({
        title: "Sélection requise",
        description: "Veuillez cocher au moins un jour",
        variant: "destructive",
      });
      return;
    }

    // Créer une disponibilité pour chaque jour sélectionné
    const dayMap: { [key: string]: string } = {
      lundi: "2024-01-01",
      mardi: "2024-01-02",
      mercredi: "2024-01-03",
      jeudi: "2024-01-04",
      vendredi: "2024-01-05",
      samedi: "2024-01-06",
      dimanche: "2024-01-07",
    };

    try {
      for (const day of selectedDays) {
        await createAvailability.mutateAsync({
          ...data,
          jourSemaine: day,
          date: dayMap[day] || "2024-01-01",
        });
      }

      form.reset();
      setSelectedDays([]);
      setDialogOpen(false);
    } catch (error) {
      // Error already handled by mutation
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-serif mb-2">Disponibilités de visite</h3>
          <p className="text-sm text-muted-foreground">
            Cochez les jours et définissez votre plage horaire. Les créneaux se calculent automatiquement.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-availability">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="text-2xl font-serif">Configurer les disponibilités</DialogTitle>
              <DialogDescription>
                Définissez vos jours et horaires de visite. Le système gérera automatiquement les créneaux.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                <div className="space-y-6 overflow-y-auto pr-2 flex-1">
                {/* Sélection des jours */}
                <div className="space-y-3">
                  <FormLabel className="text-base font-medium">Jours disponibles</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {JOURS_SEMAINE.map((jour) => (
                      <Button
                        key={jour.value}
                        type="button"
                        variant={selectedDays.includes(jour.value) ? "default" : "outline"}
                        onClick={() => toggleDay(jour.value)}
                        data-testid={`button-day-${jour.value}`}
                        className="justify-start h-11"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${selectedDays.includes(jour.value) ? 'bg-primary-foreground border-primary-foreground' : 'border-muted-foreground'}`}>
                            {selectedDays.includes(jour.value) && (
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            )}
                          </div>
                          <span>{jour.label}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Sélectionnez un ou plusieurs jours</p>
                </div>

                {/* Plage horaire */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="heureDebut"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Début</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} data-testid="input-heure-debut" className="h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="heureFin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fin</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} data-testid="input-heure-fin" className="h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Configuration des RV */}
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium text-sm">Configuration des rendez-vous</h4>
                  
                  {/* Durée de la visite */}
                  <FormField
                    control={form.control}
                    name="dureeVisite"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Durée d'une visite</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input 
                              type="number" 
                              min="15"
                              max="180"
                              step="15"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-duree-visite" 
                              className="h-11" 
                            />
                            <span className="text-sm text-muted-foreground whitespace-nowrap">minutes</span>
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs">
                          Temps réel de la visite avec le client
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Marge de sécurité */}
                  <FormField
                    control={form.control}
                    name="margeSecurite"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marge avant/après chaque RV</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input 
                              type="number" 
                              min="0"
                              max="60"
                              step="5"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-marge-securite" 
                              className="h-11" 
                            />
                            <span className="text-sm text-muted-foreground whitespace-nowrap">minutes</span>
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs">
                          Temps de pause (toilettes, déplacements, etc.)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Intervalle des créneaux */}
                  <FormField
                    control={form.control}
                    name="intervalleCreneaux"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Fréquence des créneaux proposés
                        </FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-4 gap-2">
                            {INTERVALLES.map((intervalle) => (
                              <Button
                                key={intervalle.value}
                                type="button"
                                variant={field.value === intervalle.value ? "default" : "outline"}
                                onClick={() => field.onChange(intervalle.value)}
                                data-testid={`button-interval-${intervalle.value}`}
                                className="h-11"
                              >
                                {intervalle.label}
                              </Button>
                            ))}
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs">
                          Un créneau proposé toutes les {field.value} minutes
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Info box avec exemple */}
                <div className="bg-accent/20 border border-accent/40 p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <span className="text-primary">ℹ️</span>
                    Exemple de calcul
                  </p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Si RV à <strong>10h00</strong> avec :</p>
                    <ul className="ml-4 list-disc space-y-0.5">
                      <li>Durée visite : {form.watch("dureeVisite") || 45} min</li>
                      <li>Marge sécurité : {form.watch("margeSecurite") || 15} min avant/après</li>
                      <li>Intervalle : {form.watch("intervalleCreneaux") || 30} min</li>
                    </ul>
                    <p className="pt-2">→ Prochain créneau disponible : <strong>10h{String(form.watch("intervalleCreneaux") || 30).padStart(2, "0")}</strong></p>
                    <p>→ Temps total bloqué : {(form.watch("dureeVisite") || 45) + ((form.watch("margeSecurite") || 15) * 2)} min (visite + marges)</p>
                  </div>
                </div>
                </div>

                {/* Bouton en bas fixe */}
                <div className="pt-4 border-t flex-shrink-0 mt-4">
                  <Button 
                    type="submit" 
                    className="w-full h-11"
                    size="lg"
                    disabled={createAvailability.isPending}
                    data-testid="button-submit-availability"
                  >
                    {createAvailability.isPending ? "Ajout en cours..." : "Confirmer et créer"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Chargement...</div>
      ) : availabilities.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground mb-2">Aucune disponibilité configurée</p>
          <p className="text-sm text-muted-foreground">
            Cliquez sur "Ajouter" pour définir vos jours et horaires
          </p>
        </div>
      ) : (
        <div className="grid gap-2">
          {JOURS_SEMAINE.map((jour) => {
            const dayAvails = availabilities.filter(av => av.jourSemaine === jour.value);
            return (
              <div
                key={jour.value}
                className={`p-4 rounded-lg border transition-all ${dayAvails.length > 0 ? 'bg-card hover-elevate' : 'bg-muted/20 border-dashed'}`}
                data-testid={`availability-${jour.value}`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-24 font-medium">{jour.label}</div>
                  {dayAvails.length === 0 ? (
                    <div className="text-sm text-muted-foreground italic">Non configuré</div>
                  ) : (
                    <div className="flex-1 flex flex-wrap gap-2">
                      {dayAvails.map((avail) => (
                        <div key={avail.id} className="flex items-center gap-2 bg-accent/20 px-3 py-1.5 rounded-lg text-sm group">
                          <span className="text-muted-foreground">{avail.heureDebut} - {avail.heureFin}</span>
                          <span className="text-xs px-1.5 py-0.5 bg-accent/30 rounded">
                            /{avail.intervalleCreneaux}min
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteAvailability.mutate(avail.id)}
                            data-testid={`button-delete-${jour.value}-${avail.id}`}
                            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
