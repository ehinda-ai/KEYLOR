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
      civilite: "M",
      nom: "",
      prenom: "",
      telephone: "",
      email: "",
      salaireMensuel: 0,
      allocations: 0,
      autresRevenus: 0,
      totalRevenusMenuels: 0,
      adresseActuelle: "",
      dateNaissance: "",
      lieuNaissance: "",
      situationFamiliale: "",
      nombrePersonnesCharge: 0,
      profession: "",
      typeContrat: "",
      dateEmbauche: "",
      entreprise: "",
      adresseEntreprise: "",
      compositionMenage: "1_locataire",
      typeGarantie: "caution_solidaire",
      garantieDetail: "",
      garants: [],
      numeroVisale: "",
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
        description: error?.message || "Impossible d'envoyer le dossier.",
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
      dateNaissance: formData.dateNaissance || null,
      lieuNaissance: formData.lieuNaissance || null,
      situationFamiliale: formData.situationFamiliale || null,
      nombrePersonnesCharge: formData.nombrePersonnesCharge || 0,
      profession: formData.profession || null,
      typeContrat: formData.typeContrat || null,
      dateEmbauche: formData.dateEmbauche || null,
      entreprise: formData.entreprise || null,
      adresseEntreprise: formData.adresseEntreprise || null,
      compositionMenage: formData.compositionMenage || "1_locataire",
      typeGarantie: formData.typeGarantie || "caution_solidaire",
      garantieDetail: formData.garantieDetail || null,
      garants: (formData.garants || []).filter((g: string) => g && g.trim()),
      numeroVisale: formData.numeroVisale || null,
    };

    mutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Candidature location</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Champs obligatoires */}
            <div className="space-y-3 bg-blue-50 dark:bg-blue-950 p-3 rounded border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-medium text-blue-900 dark:text-blue-100">Champs obligatoires *</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Civilité */}
              <FormField
                control={form.control}
                name="civilite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Civilité</FormLabel>
                    <FormControl>
                      <select {...field} className="w-full px-3 py-2 border rounded-md">
                        <option value="M">M.</option>
                        <option value="Mme">Mme</option>
                        <option value="Mlle">Mlle</option>
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />

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
                  <FormItem className="col-span-2">
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
                  <FormItem className="col-span-2">
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
            </div>

            {/* Champs optionnels */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800 mt-6">
              <p className="text-xs font-medium text-slate-900 dark:text-slate-100">Informations complémentaires (optionnelles)</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Date de naissance */}
              <FormField
                control={form.control}
                name="dateNaissance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de naissance</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Lieu de naissance */}
              <FormField
                control={form.control}
                name="lieuNaissance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lieu de naissance</FormLabel>
                    <FormControl>
                      <Input placeholder="Paris" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Adresse actuelle */}
              <FormField
                control={form.control}
                name="adresseActuelle"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Adresse actuelle</FormLabel>
                    <FormControl>
                      <Input placeholder="123 rue de la Paix, 75000 Paris" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Situation familiale */}
              <FormField
                control={form.control}
                name="situationFamiliale"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Situation familiale</FormLabel>
                    <FormControl>
                      <select {...field} className="w-full px-3 py-2 border rounded-md">
                        <option value="">-- Sélectionner --</option>
                        <option value="celibataire">Célibataire</option>
                        <option value="marie">Marié</option>
                        <option value="concubin">Concubin</option>
                        <option value="pacs">PACS</option>
                        <option value="separe">Séparé</option>
                        <option value="divorce">Divorcé</option>
                        <option value="veuf">Veuf</option>
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Nombre de personnes à charge */}
              <FormField
                control={form.control}
                name="nombrePersonnesCharge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Personnes à charge</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Profession */}
              <FormField
                control={form.control}
                name="profession"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Profession</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingénieur" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Type de contrat */}
              <FormField
                control={form.control}
                name="typeContrat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de contrat</FormLabel>
                    <FormControl>
                      <select {...field} className="w-full px-3 py-2 border rounded-md">
                        <option value="">-- Sélectionner --</option>
                        <option value="CDI">CDI</option>
                        <option value="CDD">CDD</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Date d'embauche */}
              <FormField
                control={form.control}
                name="dateEmbauche"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date d'embauche</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Entreprise */}
              <FormField
                control={form.control}
                name="entreprise"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Entreprise</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Corp" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Adresse entreprise */}
              <FormField
                control={form.control}
                name="adresseEntreprise"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Adresse entreprise</FormLabel>
                    <FormControl>
                      <Input placeholder="456 avenue de l'Entreprise" {...field} />
                    </FormControl>
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
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Autres revenus */}
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
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Composition du ménage */}
              <FormField
                control={form.control}
                name="compositionMenage"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Composition du ménage</FormLabel>
                    <FormControl>
                      <select {...field} className="w-full px-3 py-2 border rounded-md">
                        <option value="1_locataire">1 locataire</option>
                        <option value="2_locataires">2 locataires</option>
                        <option value="famille">Famille</option>
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Type de garantie */}
              <FormField
                control={form.control}
                name="typeGarantie"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Type de garantie</FormLabel>
                    <FormControl>
                      <select {...field} className="w-full px-3 py-2 border rounded-md">
                        <option value="caution_solidaire">Caution solidaire</option>
                        <option value="visale">Visale</option>
                        <option value="autre">Autre</option>
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Détail garantie */}
              <FormField
                control={form.control}
                name="garantieDetail"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Détail de la garantie</FormLabel>
                    <FormControl>
                      <Input placeholder="Détails..." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Numéro Visale */}
              <FormField
                control={form.control}
                name="numeroVisale"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Numéro Visale</FormLabel>
                    <FormControl>
                      <Input placeholder="Numéro du dossier Visale" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Résumé */}
            <div className="p-3 bg-muted rounded text-sm space-y-1">
              <p><strong>Loyer:</strong> {monthlyRent.toLocaleString("fr-FR")}€/mois</p>
              <p><strong>Revenus estimés:</strong> {(Number(form.watch("salaireMensuel")) + Number(form.watch("allocations")) + Number(form.watch("autresRevenus"))).toLocaleString("fr-FR")}€</p>
              <p><strong>Taux d'effort:</strong> {(Number(form.watch("salaireMensuel")) / monthlyRent).toFixed(2)}x</p>
            </div>

            {/* Buttons */}
            <DialogFooter className="flex gap-2 pt-4">
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
                {mutation.isPending ? "Envoi..." : "Envoyer le dossier"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
