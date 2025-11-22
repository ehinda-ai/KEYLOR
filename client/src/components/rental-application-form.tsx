import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRentalApplicationSchema, type Property } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface RentalApplicationFormProps {
  property: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RentalApplicationForm({ property, open, onOpenChange }: RentalApplicationFormProps) {
  const { toast } = useToast();

  if (!property) return null;

  const monthlyRent = parseFloat(property.prix.toString());

  const form = useForm({
    resolver: zodResolver(insertRentalApplicationSchema),
    mode: "onBlur",
    defaultValues: {
      propertyId: property.id,
      propertyTitle: property.titre,
      monthlyRent: monthlyRent,
      nom: "",
      prenom: "",
      telephone: "",
      email: "",
      salaireMensuel: 0,
      allocations: 0,
      autresRevenus: 0,
      totalRevenusMenuels: 0,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/rental-applications", data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Votre dossier a été reçu. Nous vous contacterons bientôt.",
      });
      form.reset();
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["/api/rental-applications"] });
    },
    onError: (error: any) => {
      console.error("Submission error:", error);
      toast({
        title: "Erreur",
        description: error?.message || "Impossible d'envoyer le dossier. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (formData: any) => {
    try {
      const salary = Number(formData.salaireMensuel) || 0;
      const alloc = Number(formData.allocations) || 0;
      const other = Number(formData.autresRevenus) || 0;
      const total = salary + alloc + other;

      if (salary < 1) {
        toast({
          title: "Erreur",
          description: "Le salaire mensuel est obligatoire et doit être > 0",
          variant: "destructive",
        });
        return;
      }

      const payload = {
        propertyId: formData.propertyId,
        propertyTitle: formData.propertyTitle,
        monthlyRent: monthlyRent.toString(),
        civilite: "M",
        nom: formData.nom,
        prenom: formData.prenom,
        telephone: formData.telephone,
        email: formData.email,
        salaireMensuel: salary.toString(),
        allocations: alloc.toString(),
        autresRevenus: other.toString(),
        totalRevenusMenuels: total,
        adresseActuelle: null,
        situationFamiliale: null,
        nombrePersonnesCharge: 0,
        profession: null,
        typeContrat: null,
        entreprise: null,
        dateNaissance: null,
        lieuNaissance: null,
        dateEmbauche: null,
        adresseEntreprise: null,
        typeGarantie: "caution_solidaire",
        garantieDetail: null,
        compositionMenage: "1_locataire",
        garants: [],
        numeroVisale: null,
      };

      await mutation.mutateAsync(payload);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Candidature location</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Prénom */}
            <FormField
              control={form.control}
              name="prenom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom *</FormLabel>
                  <FormControl>
                    <Input placeholder="Jean" {...field} data-testid="input-prenom" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nom */}
            <FormField
              control={form.control}
              name="nom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom *</FormLabel>
                  <FormControl>
                    <Input placeholder="Dupont" {...field} data-testid="input-nom" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Téléphone */}
            <FormField
              control={form.control}
              name="telephone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone *</FormLabel>
                  <FormControl>
                    <Input placeholder="06 12 34 56 78" {...field} data-testid="input-telephone" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="jean@example.com" {...field} data-testid="input-email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Salaire Mensuel */}
            <FormField
              control={form.control}
              name="salaireMensuel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Salaire mensuel (€) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="2500"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      data-testid="input-salaire"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Résumé */}
            <div className="p-3 bg-muted rounded text-sm space-y-1">
              <p>
                <strong>Loyer:</strong> {monthlyRent.toLocaleString("fr-FR")}€/mois
              </p>
              <p>
                <strong>Taux d'effort:</strong>{" "}
                {(Number(form.watch("salaireMensuel")) / monthlyRent).toFixed(2)}x
              </p>
            </div>

            {/* Buttons */}
            <DialogFooter className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                data-testid="button-cancel"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="flex-1"
                data-testid="button-submit"
              >
                {mutation.isPending ? "Envoi..." : "Envoyer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
