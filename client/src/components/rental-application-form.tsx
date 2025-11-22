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
    mode: "onChange",
    defaultValues: {
      propertyId: property.id,
      propertyTitle: property.titre,
      monthlyRent: monthlyRent,
      civilite: "M",
      nom: "",
      prenom: "",
      telephone: "",
      email: "",
      salaireMensuel: 0,
      allocations: 0,
      autresRevenus: 0,
      totalRevenusMenuels: 0,
      compositionMenage: "1_locataire",
      garants: [],
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/rental-applications", data),
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
      toast({
        title: "Erreur",
        description: error?.message || "Une erreur s'est produite.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (formData: any) => {
    const salary = parseFloat(formData.salaireMensuel?.toString() || "0");
    const alloc = parseFloat(formData.allocations?.toString() || "0");
    const other = parseFloat(formData.autresRevenus?.toString() || "0");
    const total = salary + alloc + other;

    const payload = {
      propertyId: formData.propertyId,
      propertyTitle: formData.propertyTitle,
      monthlyRent: monthlyRent.toString(),
      civilite: formData.civilite || "M",
      nom: formData.nom,
      prenom: formData.prenom,
      telephone: formData.telephone,
      email: formData.email,
      salaireMensuel: salary.toString(),
      allocations: alloc.toString(),
      autresRevenus: other.toString(),
      totalRevenusMenuels: total,
      adresseActuelle: formData.adresseActuelle || null,
      situationFamiliale: formData.situationFamiliale || null,
      nombrePersonnesCharge: formData.nombrePersonnesCharge || 0,
      profession: formData.profession || null,
      typeContrat: formData.typeContrat || null,
      entreprise: formData.entreprise || null,
      dateNaissance: formData.dateNaissance || null,
      lieuNaissance: formData.lieuNaissance || null,
      dateEmbauche: formData.dateEmbauche || null,
      adresseEntreprise: formData.adresseEntreprise || null,
      typeGarantie: formData.typeGarantie || "caution_solidaire",
      garantieDetail: formData.garantieDetail || null,
      compositionMenage: formData.compositionMenage || "1_locataire",
      garants: (formData.garants || []).filter((g: string) => g && g.trim()),
      numeroVisale: formData.numeroVisale || null,
    };

    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Candidature location</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-3 bg-blue-50 dark:bg-blue-950 p-3 rounded border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-medium text-blue-900 dark:text-blue-100">Champs obligatoires *</p>
            </div>

            {/* Prénom */}
            <FormField
              control={form.control}
              name="prenom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom *</FormLabel>
                  <FormControl>
                    <Input placeholder="Jean" {...field} value={field.value || ""} data-testid="input-prenom" />
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
                    <Input placeholder="Dupont" {...field} value={field.value || ""} data-testid="input-nom" />
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
                    <Input placeholder="06 12 34 56 78" {...field} value={field.value || ""} data-testid="input-telephone" />
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
                    <Input type="email" placeholder="jean@example.com" {...field} value={field.value || ""} data-testid="input-email" />
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
                      value={field.value || 0}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      data-testid="input-salaire"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Optionnels (collapsibles) */}
            <details className="border rounded p-3 bg-muted/30">
              <summary className="cursor-pointer font-medium text-sm">Informations supplémentaires (optionnel)</summary>
              
              <div className="space-y-3 mt-4">
                {/* Adresse */}
                <FormField
                  control={form.control}
                  name="adresseActuelle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse actuelle</FormLabel>
                      <FormControl>
                        <Input placeholder="123 rue de la Paix" {...field} value={field.value || ""} data-testid="input-adresse" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Entreprise */}
                <FormField
                  control={form.control}
                  name="entreprise"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entreprise</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom entreprise" {...field} value={field.value || ""} data-testid="input-entreprise" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Type Contrat */}
                <FormField
                  control={form.control}
                  name="typeContrat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de contrat</FormLabel>
                      <FormControl>
                        <Input placeholder="CDI, CDD..." {...field} value={field.value || ""} data-testid="input-contrat" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Allocations */}
                <FormField
                  control={form.control}
                  name="allocations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allocations (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          value={field.value || 0}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-allocations"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Autres Revenus */}
                <FormField
                  control={form.control}
                  name="autresRevenus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Autres revenus (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          value={field.value || 0}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-autres"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Composition Ménage */}
                <FormField
                  control={form.control}
                  name="compositionMenage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Composition du ménage</FormLabel>
                      <FormControl>
                        <select {...field} value={field.value || ""} className="w-full px-3 py-2 border rounded-md" data-testid="select-composition">
                          <option value="1_locataire">1 locataire</option>
                          <option value="2_locataires">2 locataires</option>
                          <option value="famille">Famille</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Numéro Visale */}
                <FormField
                  control={form.control}
                  name="numeroVisale"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro dossier Visale</FormLabel>
                      <FormControl>
                        <Input placeholder="Laissez vide si pas de Visale" {...field} value={field.value || ""} data-testid="input-numero-visale" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </details>

            {/* Résumé */}
            <div className="p-3 bg-muted rounded text-sm space-y-1">
              <p>
                <strong>Loyer mensuel:</strong> {monthlyRent.toLocaleString("fr-FR")}€
              </p>
              <p>
                <strong>Vos revenus:</strong>{" "}
                {(
                  parseFloat(form.watch("salaireMensuel")?.toString() || "0") +
                  parseFloat(form.watch("allocations")?.toString() || "0") +
                  parseFloat(form.watch("autresRevenus")?.toString() || "0")
                ).toLocaleString("fr-FR")}
                €
              </p>
              <p>
                <strong>Taux d'effort:</strong>{" "}
                {(
                  (parseFloat(form.watch("salaireMensuel")?.toString() || "0") +
                    parseFloat(form.watch("allocations")?.toString() || "0") +
                    parseFloat(form.watch("autresRevenus")?.toString() || "0")) /
                  monthlyRent
                ).toFixed(2)}
                x le loyer
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
                {mutation.isPending ? "Envoi..." : "Envoyer dossier"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
