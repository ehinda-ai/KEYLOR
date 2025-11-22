import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { VisitAvailability, InsertVisitAvailability, insertVisitAvailabilitySchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Edit } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const JOURS_SEMAINE = [
  { value: "lundi", label: "Lundi" },
  { value: "mardi", label: "Mardi" },
  { value: "mercredi", label: "Mercredi" },
  { value: "jeudi", label: "Jeudi" },
  { value: "vendredi", label: "Vendredi" },
  { value: "samedi", label: "Samedi" },
  { value: "dimanche", label: "Dimanche" },
];

export function VisitAvailabilityAdmin() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState<VisitAvailability | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const { data: availabilities = [] } = useQuery<VisitAvailability[]>({
    queryKey: ["/api/visit-availabilities"],
  });

  const form = useForm<InsertVisitAvailability>({
    resolver: zodResolver(insertVisitAvailabilitySchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      jourSemaine: "lundi",
      heureDebut: "09:00",
      heureFin: "18:00",
      dureeVisite: 45,
      margeSecurite: 15,
      actif: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertVisitAvailability) => apiRequest("POST", "/api/visit-availabilities", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visit-availabilities"] });
      toast({ title: "Configuration créée" });
      setDialogOpen(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertVisitAvailability> }) =>
      apiRequest("PATCH", `/api/visit-availabilities/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visit-availabilities"] });
      toast({ title: "Configuration mise à jour" });
      setEditingAvailability(null);
      setDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/visit-availabilities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visit-availabilities"] });
      toast({ title: "Configuration supprimée" });
    },
  });

  const handleEdit = (availability: VisitAvailability) => {
    setEditingAvailability(availability);
    form.reset(availability);
    setDialogOpen(true);
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const onSubmit = async (data: Omit<InsertVisitAvailability, 'jourSemaine'>) => {
    if (editingAvailability) {
      await updateMutation.mutateAsync({ id: editingAvailability.id, data: { ...data, jourSemaine: editingAvailability.jourSemaine } });
    } else {
      if (selectedDays.length === 0) {
        toast({
          title: "Sélection requise",
          description: "Veuillez cocher au moins un jour",
          variant: "destructive",
        });
        return;
      }
      
      // Créer une disponibilité pour chaque jour sélectionné
      try {
        for (const day of selectedDays) {
          await createMutation.mutateAsync({
            ...data,
            jourSemaine: day,
          });
        }
        setSelectedDays([]);
        form.reset();
        setDialogOpen(false);
      } catch (error) {
        // Error already handled
      }
    }
  };

  const activeAvailability = availabilities.find(a => a.actif);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Disponibilités de visite</h3>
          {activeAvailability && (
            <p className="text-sm text-muted-foreground">
              Configuration active : {activeAvailability.heureDebut} - {activeAvailability.heureFin}
            </p>
          )}
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingAvailability(null);
              form.reset();
            }} data-testid="button-add-availability">
              <Plus className="w-4 h-4 mr-2" />
              Configuration
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAvailability ? "Modifier" : "Créer"} configuration</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <FormLabel className="text-base font-medium mb-3 block">Jours disponibles</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {JOURS_SEMAINE.map((jour) => (
                      <button
                        key={jour.value}
                        type="button"
                        onClick={() => toggleDay(jour.value)}
                        className={`px-4 py-2 rounded-md border text-sm font-medium transition ${
                          selectedDays.includes(jour.value)
                            ? "bg-accent text-accent-foreground border-accent"
                            : "border-input bg-background hover:bg-accent/50"
                        }`}
                        data-testid={`button-day-${jour.value}`}
                      >
                        {jour.label}
                      </button>
                    ))}
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-availability-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="heureDebut"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Heure début</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} data-testid="input-availability-start" />
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
                        <FormLabel>Heure fin</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} data-testid="input-availability-end" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dureeVisite"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Durée visite (min)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} data-testid="input-visit-duration" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="margeSecurite"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marge sécurité (min)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} data-testid="input-security-margin" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="actif"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Actif</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-availability-active" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" data-testid="button-submit-availability">
                  {editingAvailability ? "Mettre à jour" : "Créer"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {availabilities.map((availability) => (
          <Card key={availability.id} className={availability.actif ? "border-green-500" : ""}>
            <CardContent className="flex justify-between items-center pt-6">
              <div>
                <p className="font-semibold">{availability.jourSemaine.charAt(0).toUpperCase() + availability.jourSemaine.slice(1)} - {availability.heureDebut} - {availability.heureFin}</p>
                <p className="text-sm text-muted-foreground">
                  {availability.date} | Visite : {availability.dureeVisite}min | Marge : {availability.margeSecurite}min
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(availability)}
                  data-testid={`button-edit-availability-${availability.id}`}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteMutation.mutate(availability.id)}
                  data-testid={`button-delete-availability-${availability.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
