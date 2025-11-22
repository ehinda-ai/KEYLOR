import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SeasonalAvailability, InsertSeasonalAvailability, insertSeasonalAvailabilitySchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export function SeasonalAvailabilityAdmin() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState<SeasonalAvailability | null>(null);

  const { data: availabilities = [] } = useQuery<SeasonalAvailability[]>({
    queryKey: ["/api/seasonal-availabilities"],
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["/api/properties"],
  }) as any;

  const form = useForm<InsertSeasonalAvailability>({
    resolver: zodResolver(insertSeasonalAvailabilitySchema),
    defaultValues: {
      propertyId: "",
      dateDebut: "",
      dateFin: "",
      bloque: false,
      motif: "",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertSeasonalAvailability) => apiRequest("POST", "/api/seasonal-availabilities", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasonal-availabilities"] });
      toast({ title: "Disponibilité créée" });
      setDialogOpen(false);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/seasonal-availabilities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasonal-availabilities"] });
      toast({ title: "Disponibilité supprimée" });
    },
  });

  const onSubmit = async (data: InsertSeasonalAvailability) => {
    await createMutation.mutateAsync(data);
  };

  const blockedCount = availabilities.filter(a => a.bloque).length;
  const availableCount = availabilities.filter(a => !a.bloque).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availabilities.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Bloquées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blockedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Disponibilités saisonnières</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingAvailability(null);
              form.reset();
            }} data-testid="button-add-seasonal">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle période
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une période de disponibilité</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="propertyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Propriété</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-seasonal-property">
                            <SelectValue placeholder="Sélectionner une propriété" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(properties as any[])?.map((prop: any) => (
                            <SelectItem key={prop.id} value={prop.id}>
                              {prop.titre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dateDebut"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date début</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-seasonal-start" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dateFin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date fin</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-seasonal-end" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="bloque"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-seasonal-blocked" />
                      </FormControl>
                      <FormLabel>Bloquer cette période</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="motif"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motif</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Maintenance" {...field} data-testid="input-seasonal-reason" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Notes supplémentaires" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value)} data-testid="input-seasonal-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" data-testid="button-submit-seasonal">
                  Créer
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {availabilities.map((availability) => (
          <Card key={availability.id} className={availability.bloque ? "border-red-500 bg-red-50 dark:bg-red-950" : "border-green-500 bg-green-50 dark:bg-green-950"}>
            <CardContent className="flex justify-between items-center pt-6">
              <div>
                <p className="font-semibold">{availability.dateDebut} → {availability.dateFin}</p>
                <p className="text-sm text-muted-foreground">{availability.motif || "—"}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteMutation.mutate(availability.id)}
                  data-testid={`button-delete-seasonal-${availability.id}`}
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
