import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Property, SeasonalAvailability } from "@shared/schema";

interface SeasonalAvailabilityManagerProps {
  propertyId: string;
  propertyTitle: string;
}

export function SeasonalAvailabilityManager({ propertyId, propertyTitle }: SeasonalAvailabilityManagerProps) {
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [motif, setMotif] = useState("");

  const { data: availabilities = [], isLoading } = useQuery<SeasonalAvailability[]>({
    queryKey: ["/api/seasonal-availability", propertyId],
    queryFn: async () => {
      const response = await fetch(`/api/seasonal-availability?propertyId=${propertyId}`);
      if (!response.ok) throw new Error("Failed to fetch availabilities");
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { propertyId: string; dateDebut: string; dateFin: string; motif: string; bloque: boolean }) => {
      return await apiRequest("POST", "/api/seasonal-availability", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasonal-availability", propertyId] });
      toast({
        title: "Période bloquée",
        description: "La période a été bloquée avec succès.",
      });
      setIsAdding(false);
      setDateDebut("");
      setDateFin("");
      setMotif("");
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout de la période.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/seasonal-availability/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasonal-availability", propertyId] });
      toast({
        title: "Période supprimée",
        description: "La période a été supprimée avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dateDebut || !dateFin) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une date de début et de fin.",
        variant: "destructive",
      });
      return;
    }

    if (new Date(dateDebut) > new Date(dateFin)) {
      toast({
        title: "Erreur",
        description: "La date de début doit être antérieure à la date de fin.",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      propertyId,
      dateDebut,
      dateFin,
      motif: motif || "Période bloquée",
      bloque: true,
    });
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Chargement des disponibilités...</div>;
  }

  return (
    <div className="space-y-4" data-testid="seasonal-availability-manager">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">{propertyTitle}</h3>
          <p className="text-sm text-muted-foreground">
            {availabilities.length} période{availabilities.length > 1 ? "s" : ""} configurée{availabilities.length > 1 ? "s" : ""}
          </p>
        </div>
        {!isAdding && (
          <Button
            onClick={() => setIsAdding(true)}
            size="sm"
            data-testid="button-add-availability"
          >
            <Plus className="w-4 h-4 mr-2" />
            Bloquer une période
          </Button>
        )}
      </div>

      {isAdding && (
        <Card data-testid="card-add-availability">
          <CardHeader>
            <CardTitle>Bloquer une période</CardTitle>
            <CardDescription>
              Par défaut, toutes les dates sont disponibles. Bloquez uniquement les périodes indisponibles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateDebut">Date de début</Label>
                  <Input
                    id="dateDebut"
                    type="date"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                    required
                    data-testid="input-date-debut"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFin">Date de fin</Label>
                  <Input
                    id="dateFin"
                    type="date"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                    required
                    data-testid="input-date-fin"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="motif">Motif (optionnel)</Label>
                <Input
                  id="motif"
                  type="text"
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  placeholder="Ex: Travaux, réservation externe, indisponibilité..."
                  data-testid="input-motif"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-availability">
                  {createMutation.isPending ? "Ajout..." : "Bloquer cette période"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false);
                    setDateDebut("");
                    setDateFin("");
                    setMotif("");
                  }}
                  data-testid="button-cancel-availability"
                >
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {availabilities.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            Aucune période configurée pour ce bien.
          </p>
        ) : (
          availabilities.map((availability) => (
            <Card key={availability.id} data-testid={`availability-card-${availability.id}`}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-start gap-3">
                  <Calendar className={`w-5 h-5 mt-0.5 ${availability.bloque ? "text-destructive" : "text-primary"}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {format(new Date(availability.dateDebut), "dd MMM yyyy", { locale: fr })}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium">
                        {format(new Date(availability.dateFin), "dd MMM yyyy", { locale: fr })}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${availability.bloque ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                        {availability.bloque ? "Bloquée" : "Disponible"}
                      </span>
                    </div>
                    {availability.motif && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {availability.motif}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(availability.id)}
                  disabled={deleteMutation.isPending}
                  data-testid={`button-delete-availability-${availability.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
