import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calculator, Sparkles, TrendingUp, MapPin, Home, Zap, Phone, ArrowRight, AlertCircle } from "lucide-react";
import { Link } from "wouter";

const estimationSchema = z.object({
  mode: z.enum(["vente", "location"]),
  typeLogement: z.string().min(1, "Type de logement requis"),
  surface: z.coerce.number().min(10, "Surface minimale : 10m²").max(1000, "Surface maximale : 1000m²"),
  ville: z.string().min(2, "Ville requise"),
  secteur: z.string().min(2, "Secteur requis"),
  dpe: z.string().optional(),
  qualite: z.string().min(1, "Qualité du bien requise"),
});

type EstimationInput = z.infer<typeof estimationSchema>;

interface EstimationResult {
  mode: string;
  fourchetteBasse: number;
  fourchetteHaute: number;
  explication: string;
  facteurs: string[];
  recommandation: string;
}

export default function EstimationIAPage() {
  const [result, setResult] = useState<EstimationResult | null>(null);

  const form = useForm<EstimationInput>({
    resolver: zodResolver(estimationSchema),
    defaultValues: {
      mode: "vente",
      typeLogement: "",
      surface: 0,
      ville: "",
      secteur: "",
      dpe: "",
      qualite: "",
    },
  });

  const estimateMutation = useMutation({
    mutationFn: async (data: EstimationInput) => {
      const response = await fetch("/api/estimate-ai", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      
      const jsonData = await response.json();
      
      if (!response.ok) {
        throw new Error(jsonData.error || "Erreur lors de l'estimation");
      }
      
      return jsonData as EstimationResult;
    },
    onSuccess: (data) => {
      setResult(data);
      // Scroll to results
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    },
  });

  const onSubmit = (data: EstimationInput) => {
    setResult(null);
    estimateMutation.mutate(data);
  };

  const mode = form.watch("mode");

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-12 px-4 bg-gradient-to-br from-accent/10 to-background">
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full mb-4">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Estimation par intelligence artificielle</span>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-normal mb-4">
            Estimez votre bien en quelques secondes
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Notre calculette intelligente analyse le marché en temps réel pour vous donner une première estimation instantanée.
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="container mx-auto py-12 px-4 max-w-4xl">
        <Card className="border-2 border-accent/40">
          <CardHeader className="text-center border-b pb-6">
            <div className="flex justify-center mb-4">
              <div className="bg-accent/10 p-4 rounded-full">
                <Calculator className="h-8 w-8 text-accent" />
              </div>
            </div>
            <CardTitle className="text-2xl font-serif font-normal">Calculette d'estimation IA</CardTitle>
            <CardDescription className="text-base">
              Remplissez les informations ci-dessous pour obtenir votre estimation gratuite
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Mode Selection */}
                <FormField
                  control={form.control}
                  name="mode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Type d'estimation</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="grid grid-cols-2 gap-4"
                        >
                          <div>
                            <RadioGroupItem value="vente" id="vente" className="peer sr-only" />
                            <Label
                              htmlFor="vente"
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover-elevate cursor-pointer peer-data-[state=checked]:border-accent peer-data-[state=checked]:bg-accent/5"
                              data-testid="radio-mode-vente"
                            >
                              <Home className="mb-3 h-6 w-6" />
                              <span className="font-medium">Vente</span>
                            </Label>
                          </div>
                          <div>
                            <RadioGroupItem value="location" id="location" className="peer sr-only" />
                            <Label
                              htmlFor="location"
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover-elevate cursor-pointer peer-data-[state=checked]:border-accent peer-data-[state=checked]:bg-accent/5"
                              data-testid="radio-mode-location"
                            >
                              <TrendingUp className="mb-3 h-6 w-6" />
                              <span className="font-medium">Location</span>
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Type de logement */}
                  <FormField
                    control={form.control}
                    name="typeLogement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de logement</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-type-logement">
                              <SelectValue placeholder="Sélectionnez" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="appartement">Appartement</SelectItem>
                            <SelectItem value="maison">Maison</SelectItem>
                            <SelectItem value="terrain">Terrain</SelectItem>
                            <SelectItem value="commercial">Local commercial</SelectItem>
                            <SelectItem value="mobilhome">Mobil-home</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Surface */}
                  <FormField
                    control={form.control}
                    name="surface"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Surface (m²)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Ex: 75"
                            {...field}
                            data-testid="input-surface"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Ville */}
                  <FormField
                    control={form.control}
                    name="ville"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ville</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Valence"
                            {...field}
                            data-testid="input-ville"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Secteur */}
                  <FormField
                    control={form.control}
                    name="secteur"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Secteur / Quartier</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Centre-ville"
                            {...field}
                            data-testid="input-secteur"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* DPE */}
                  <FormField
                    control={form.control}
                    name="dpe"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Classe énergétique (DPE)</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-dpe">
                              <SelectValue placeholder="Sélectionnez (optionnel)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="A">A - Excellent</SelectItem>
                            <SelectItem value="B">B - Très performant</SelectItem>
                            <SelectItem value="C">C - Performant</SelectItem>
                            <SelectItem value="D">D - Moyen</SelectItem>
                            <SelectItem value="E">E - Passable</SelectItem>
                            <SelectItem value="F">F - Faible</SelectItem>
                            <SelectItem value="G">G - Très faible</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Qualité */}
                  <FormField
                    control={form.control}
                    name="qualite"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>État du bien</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-qualite">
                              <SelectValue placeholder="Sélectionnez" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="neuf">Neuf / VEFA</SelectItem>
                            <SelectItem value="renove">Rénové récemment</SelectItem>
                            <SelectItem value="bon">Bon état</SelectItem>
                            <SelectItem value="ancien">Ancien (à rénover)</SelectItem>
                            <SelectItem value="travaux">Gros travaux nécessaires</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-4 space-y-4">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={estimateMutation.isPending}
                    data-testid="button-estimate"
                  >
                    {estimateMutation.isPending ? (
                      <>
                        <Zap className="mr-2 h-5 w-5 animate-pulse" />
                        Analyse en cours...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Obtenir mon estimation gratuite
                      </>
                    )}
                  </Button>

                  {/* Error Alert */}
                  {estimateMutation.isError && (
                    <Alert variant="destructive" data-testid="alert-error">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {estimateMutation.error?.message || "Une erreur est survenue lors de l'estimation"}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </section>

      {/* Results Section */}
      {result && (
        <section id="results" className="container mx-auto py-12 px-4 max-w-4xl">
          <Card className="border-2 border-accent">
            <CardHeader className="text-center border-b pb-6 bg-accent/5">
              <div className="flex justify-center mb-4">
                <div className="bg-accent text-white p-4 rounded-full">
                  <TrendingUp className="h-8 w-8" />
                </div>
              </div>
              <CardTitle className="text-2xl font-serif font-normal mb-2">
                Estimation de {result.mode === "vente" ? "prix de vente" : "loyer mensuel"}
              </CardTitle>
              <div className="text-4xl md:text-5xl font-serif font-light text-accent my-4">
                {result.fourchetteBasse.toLocaleString('fr-FR')} € - {result.fourchetteHaute.toLocaleString('fr-FR')} €
              </div>
              <CardDescription className="text-base">
                {result.mode === "vente" ? "Fourchette de prix estimée" : "Fourchette de loyer mensuel estimée"}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
              {/* Explication */}
              <div>
                <h3 className="font-medium text-lg mb-3 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-accent" />
                  Analyse du marché
                </h3>
                <p className="text-muted-foreground leading-relaxed">{result.explication}</p>
              </div>

              {/* Facteurs */}
              <div>
                <h3 className="font-medium text-lg mb-3 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-accent" />
                  Facteurs pris en compte
                </h3>
                <ul className="grid md:grid-cols-2 gap-3">
                  {result.facteurs.map((facteur, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                      <span className="text-muted-foreground">{facteur}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommandation */}
              <div className="bg-muted/50 rounded-lg p-6">
                <h3 className="font-medium text-lg mb-3">💡 Recommandation</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">{result.recommandation}</p>
              </div>

              {/* CTA Fort */}
              <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg p-8 text-center border-2 border-accent/30">
                <h3 className="font-serif text-2xl font-normal mb-3">
                  Obtenez une estimation précise avec nos experts
                </h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Cette fourchette est une première indication. Pour une estimation précise et personnalisée basée sur les caractéristiques exactes de votre bien et les transactions récentes de votre secteur, contactez nos experts immobiliers.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Link href="/rendez-vous">
                    <Button size="lg" data-testid="button-take-appointment">
                      <Phone className="mr-2 h-5 w-5" />
                      Prendre rendez-vous
                    </Button>
                  </Link>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => document.getElementById('estimation-form')?.scrollIntoView({ behavior: 'smooth' })}
                    data-testid="button-contact-expert"
                  >
                    Demander une estimation détaillée
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Info Section */}
      <section className="bg-muted/30 py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="font-serif text-3xl text-center mb-8">Comment fonctionne notre estimateur IA ?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="hover-elevate border-2 border-accent/40">
              <CardHeader className="text-center">
                <div className="bg-accent/10 p-3 rounded-full w-fit mx-auto mb-3">
                  <Calculator className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-lg font-serif font-normal">Analyse IA</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Notre intelligence artificielle analyse des milliers de données de marché en temps réel
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover-elevate border-2 border-accent/40">
              <CardHeader className="text-center">
                <div className="bg-accent/10 p-3 rounded-full w-fit mx-auto mb-3">
                  <MapPin className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-lg font-serif font-normal">Données locales</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Prise en compte des spécificités de votre secteur et des tendances du marché local
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover-elevate border-2 border-accent/40">
              <CardHeader className="text-center">
                <div className="bg-accent/10 p-3 rounded-full w-fit mx-auto mb-3">
                  <Sparkles className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-lg font-serif font-normal">Instantané</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Résultat immédiat pour vous donner une première indication de valeur
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground italic">
              ⚠️ Cette estimation est indicative et ne remplace pas une évaluation professionnelle détaillée
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
