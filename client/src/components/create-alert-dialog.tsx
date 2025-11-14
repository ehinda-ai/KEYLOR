import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPropertyAlertSchema, type InsertPropertyAlert } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BellRing } from "lucide-react";

interface CreateAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: {
    transactionType?: string | null;
    type?: string | null;
    ville?: string | null;
    prixMax?: string | null;
    surfaceMin?: number | null;
    chambresMin?: number | null;
  };
}

export function CreateAlertDialog({
  open,
  onOpenChange,
  defaultValues,
}: CreateAlertDialogProps) {
  const { toast } = useToast();

  const form = useForm<InsertPropertyAlert>({
    resolver: zodResolver(insertPropertyAlertSchema),
    defaultValues: {
      nom: "",
      email: "",
      telephone: "",
      transactionType: defaultValues?.transactionType === "tous" ? null : defaultValues?.transactionType || null,
      type: defaultValues?.type === "tous" ? null : defaultValues?.type || null,
      ville: defaultValues?.ville || null,
      prixMax: defaultValues?.prixMax || null,
      surfaceMin: defaultValues?.surfaceMin || null,
      chambresMin: defaultValues?.chambresMin || null,
      active: true,
    },
  });

  const createAlertMutation = useMutation({
    mutationFn: async (data: InsertPropertyAlert) => {
      return await apiRequest("POST", "/api/property-alerts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/property-alerts"] });
      toast({
        title: "Alerte créée",
        description: "Vous serez notifié lorsqu'un bien correspondant à vos critères sera disponible.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de l'alerte.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertPropertyAlert) => {
    createAlertMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-create-alert">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-primary" />
            Créer une alerte
          </DialogTitle>
          <DialogDescription>
            Recevez une notification dès qu'un bien correspondant à vos critères est disponible.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Votre nom" 
                      {...field} 
                      data-testid="input-alert-nom"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="votre@email.com" 
                      {...field} 
                      data-testid="input-alert-email"
                    />
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
                  <FormLabel>Téléphone (optionnel)</FormLabel>
                  <FormControl>
                    <Input 
                      type="tel" 
                      placeholder="06 12 34 56 78" 
                      {...field} 
                      value={field.value || ""}
                      data-testid="input-alert-telephone"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-3">Critères de recherche</p>
              <div className="space-y-2 text-sm">
                {form.watch("transactionType") && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type de transaction :</span>
                    <span className="font-medium capitalize">{form.watch("transactionType")}</span>
                  </div>
                )}
                {form.watch("type") && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type de bien :</span>
                    <span className="font-medium capitalize">{form.watch("type")}</span>
                  </div>
                )}
                {form.watch("ville") && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ville :</span>
                    <span className="font-medium">{form.watch("ville")}</span>
                  </div>
                )}
                {form.watch("prixMax") && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prix maximum :</span>
                    <span className="font-medium">{parseFloat(form.watch("prixMax") || "0").toLocaleString("fr-FR")} €</span>
                  </div>
                )}
                {form.watch("surfaceMin") && form.watch("surfaceMin")! > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Surface minimum :</span>
                    <span className="font-medium">{form.watch("surfaceMin")} m²</span>
                  </div>
                )}
                {form.watch("chambresMin") && form.watch("chambresMin")! > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chambres minimum :</span>
                    <span className="font-medium">{form.watch("chambresMin")}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-alert"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createAlertMutation.isPending}
                data-testid="button-submit-alert"
              >
                {createAlertMutation.isPending ? "Création..." : "Créer l'alerte"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
