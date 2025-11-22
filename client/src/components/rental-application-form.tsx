import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRentalApplicationSchema, type InsertRentalApplication, type Property } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface RentalApplicationFormProps {
  property: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RentalApplicationForm({ property, open, onOpenChange }: RentalApplicationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);

  const monthlyRent = parseFloat(property.prix.toString());

  const form = useForm<InsertRentalApplication>({
    resolver: zodResolver(insertRentalApplicationSchema),
    defaultValues: {
      propertyId: property.id,
      propertyTitle: property.titre,
      monthlyRent: monthlyRent.toString(),
      civilite: "M",
      situationFamiliale: "Célibataire",
      typeContrat: "CDI",
      typeGarantie: "caution_solidaire",
      salaireMensuel: "0",
      allocations: "0",
      aidesLogement: "0",
      autresRevenus: "0",
      totalRevenusMenuels: "0",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: InsertRentalApplication) =>
      apiRequest("POST", "/api/rental-applications", data),
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Votre dossier de candidature a été reçu. Nous vous contacterons sous peu.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rental-applications"] });
      form.reset();
      onOpenChange(false);
      setStep(1);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: InsertRentalApplication) => {
    // Calculer le total des revenus
    const total =
      (parseFloat(data.salaireMensuel?.toString() || "0")) +
      (parseFloat(data.allocations?.toString() || "0")) +
      (parseFloat(data.aidesLogement?.toString() || "0")) +
      (parseFloat(data.autresRevenus?.toString() || "0"));

    mutation.mutate({ ...data, totalRevenusMenuels: total.toString() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Déposer votre dossier de candidature</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Étape 1: Identité & Contact */}
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
                            <SelectTrigger>
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
                  name="dateNaissance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de naissance</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-date-naissance" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lieuNaissance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lieu de naissance</FormLabel>
                      <FormControl>
                        <Input placeholder="Lyon" {...field} data-testid="input-lieu-naissance" />
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
                        <Textarea placeholder="123 rue de la Paix, 75000 Paris" {...field} data-testid="textarea-adresse" />
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
              </div>
            )}

            {/* Étape 2: Situation familiale & professionnelle */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Situation familiale</h3>

                <FormField
                  control={form.control}
                  name="situationFamiliale"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Situation</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Célibataire">Célibataire</SelectItem>
                          <SelectItem value="Marié">Marié(e)</SelectItem>
                          <SelectItem value="Concubin">Concubin(e)</SelectItem>
                          <SelectItem value="PACS">PACS</SelectItem>
                          <SelectItem value="Séparé">Séparé(e)</SelectItem>
                          <SelectItem value="Divorcé">Divorcé(e)</SelectItem>
                          <SelectItem value="Veuf">Veuf(ve)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nombrePersonnesCharge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de personnes à charge</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          value={field.value || 0}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-personnes-charge"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <h3 className="font-semibold text-lg mt-6">Situation professionnelle</h3>

                <FormField
                  control={form.control}
                  name="profession"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profession</FormLabel>
                      <FormControl>
                        <Input placeholder="Ingénieur" {...field} data-testid="input-profession" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="typeContrat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de contrat</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CDI">CDI</SelectItem>
                          <SelectItem value="CDD">CDD</SelectItem>
                          <SelectItem value="Stage">Stage</SelectItem>
                          <SelectItem value="Freelance">Freelance</SelectItem>
                          <SelectItem value="Entrepreneur">Entrepreneur</SelectItem>
                          <SelectItem value="Retraité">Retraité</SelectItem>
                          <SelectItem value="Autre">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateEmbauche"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date d'embauche</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-date-embauche" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="entreprise"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Raison sociale (entreprise)</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Corp" {...field} data-testid="input-entreprise" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="adresseEntreprise"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse de l'employeur</FormLabel>
                      <FormControl>
                        <Input placeholder="456 avenue des Champs" {...field} data-testid="input-adresse-entreprise" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Étape 3: Revenus & Garanties */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Ressources mensuelles</h3>
                <p className="text-sm text-muted-foreground">Loyer de l'annonce: <span className="font-semibold">{monthlyRent.toFixed(2)}€</span></p>

                <FormField
                  control={form.control}
                  name="salaireMensuel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salaire mensuel net</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} data-testid="input-salaire" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allocations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allocations familiales</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} data-testid="input-allocations" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="aidesLogement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aides au logement (APL, ALF, ALS)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} data-testid="input-aides" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="autresRevenus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Autres revenus</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} data-testid="input-autres-revenus" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <h3 className="font-semibold text-lg mt-6">Garanties</h3>

                <FormField
                  control={form.control}
                  name="typeGarantie"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de garantie</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="caution_solidaire">Caution solidaire</SelectItem>
                          <SelectItem value="visale">Visale</SelectItem>
                          <SelectItem value="autre">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="garantieDetail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Détails de la garantie (optionnel)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Nom et lien avec le candidat..." {...field} data-testid="textarea-garantie" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                data-testid="button-previous"
              >
                Précédent
              </Button>

              {step < 3 ? (
                <Button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  data-testid="button-next"
                >
                  Suivant
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  data-testid="button-submit"
                >
                  {mutation.isPending ? "Envoi en cours..." : "Envoyer mon dossier"}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
