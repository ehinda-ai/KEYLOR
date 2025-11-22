import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRentalApplicationSchema, type InsertRentalApplication, type Property } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [step, setStep] = useState(1);

  if (!property) return null;

  const monthlyRent = parseFloat(property.prix.toString());

  const form = useForm<any>({
    resolver: zodResolver(insertRentalApplicationSchema),
    defaultValues: {
      propertyId: property.id,
      propertyTitle: property.titre,
      monthlyRent: monthlyRent,
      civilite: "M",
      nom: "",
      prenom: "",
      telephone: "",
      email: "",
      adresseActuelle: "",
      situationFamiliale: "Célibataire",
      profession: "",
      typeContrat: "CDI",
      entreprise: "",
      salaireMensuel: 0,
      allocations: 0,
      autresRevenus: 0,
      totalRevenusMenuels: 0,
      typeGarantie: "caution_solidaire",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: InsertRentalApplication) =>
      apiRequest("POST", "/api/rental-applications", data),
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Votre dossier a été reçu. Nous vous contacterons bientôt.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rental-applications"] });
      form.reset();
      onOpenChange(false);
      setStep(1);
    },
    onError: (error) => {
      console.error("Error submitting application:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: any) => {
    const salary = parseFloat(data.salaireMensuel?.toString() || "0");
    const alloc = parseFloat(data.allocations?.toString() || "0");
    const other = parseFloat(data.autresRevenus?.toString() || "0");
    const total = salary + alloc + other;

    const finalData = {
      propertyId: data.propertyId,
      propertyTitle: data.propertyTitle,
      monthlyRent: (parseFloat(data.monthlyRent?.toString() || "0")).toString(),
      civilite: data.civilite,
      nom: data.nom,
      prenom: data.prenom,
      telephone: data.telephone,
      email: data.email,
      adresseActuelle: data.adresseActuelle,
      situationFamiliale: data.situationFamiliale,
      profession: data.profession || "",
      typeContrat: data.typeContrat,
      entreprise: data.entreprise || "",
      salaireMensuel: salary.toString(),
      allocations: alloc.toString(),
      autresRevenus: other.toString(),
      totalRevenusMenuels: total,
      typeGarantie: data.typeGarantie,
    };
    
    console.log("Submitting rental application:", finalData);
    mutation.mutate(finalData as any);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Déposer votre dossier de candidature</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Étape 1: Identité */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Votre identité</h3>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="civilite"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Civilité</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-civilite">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="M">M.</SelectItem>
                            <SelectItem value="Mme">Mme</SelectItem>
                            <SelectItem value="Mlle">Mlle</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="prenom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prénom</FormLabel>
                        <FormControl>
                          <Input placeholder="Jean" {...field} data-testid="input-prenom" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom</FormLabel>
                        <FormControl>
                          <Input placeholder="Dupont" {...field} data-testid="input-nom" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                  name="adresseActuelle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse actuelle</FormLabel>
                      <FormControl>
                        <Input placeholder="123 rue de la Paix" {...field} data-testid="input-adresse" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Étape 2: Situation professionnelle */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Situation professionnelle</h3>

                <FormField
                  control={form.control}
                  name="typeContrat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de contrat</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-contrat">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CDI">CDI</SelectItem>
                          <SelectItem value="CDD">CDD</SelectItem>
                          <SelectItem value="Stage">Stage</SelectItem>
                          <SelectItem value="Autre">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="entreprise"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entreprise</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom entreprise" {...field} data-testid="input-entreprise" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="salaireMensuel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salaire mensuel (€)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} data-testid="input-salaire" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Étape 3: Revenus */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Revenus totaux</h3>

                <FormField
                  control={form.control}
                  name="allocations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allocations (€)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} data-testid="input-allocations" />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">Laisser à 0 si aucune allocation</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="autresRevenus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Autres revenus (€)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} data-testid="input-autres" />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">Laisser à 0 si aucun revenu supplémentaire</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="p-4 bg-muted rounded">
                  <p className="text-sm">
                    <strong>Loyer mensuel:</strong> {monthlyRent.toLocaleString("fr-FR")}€
                  </p>
                  <p className="text-sm">
                    <strong>Revenus totaux:</strong> {(form.watch("salaireMensuel") + form.watch("allocations") + form.watch("autresRevenus")).toLocaleString("fr-FR")}€
                  </p>
                  <p className="text-sm">
                    <strong>Taux d'effort:</strong> {((form.watch("salaireMensuel") + form.watch("allocations") + form.watch("autresRevenus")) / monthlyRent).toFixed(2)}x le loyer
                  </p>
                </div>
              </div>
            )}

            {/* Buttons */}
            <DialogFooter className="flex justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                data-testid="button-previous"
              >
                Précédent
              </Button>
              <div className="flex gap-2">
                {step < 3 && (
                  <Button
                    type="button"
                    onClick={() => setStep(step + 1)}
                    data-testid="button-next"
                  >
                    Suivant
                  </Button>
                )}
                {step === 3 && (
                  <Button
                    type="submit"
                    disabled={mutation.isPending}
                    data-testid="button-submit"
                  >
                    {mutation.isPending ? "Envoi..." : "Envoyer dossier"}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
