import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Award, Euro, Clock, Shield, Camera, TrendingUp, Users, FileText, Home, Calculator, CheckCircle2 } from "lucide-react";
import { EstimatorForm } from "@/components/estimator-form";
import { useQuery } from "@tanstack/react-query";
import type { PricingScale } from "@shared/schema";

export default function VendrePage() {
  const { data: scales } = useQuery<PricingScale[]>({
    queryKey: ['/api/pricing-scales'],
    queryFn: async () => {
      const res = await fetch('/api/pricing-scales?type=vente&active=true');
      if (!res.ok) throw new Error('Erreur');
      return res.json();
    }
  });

  const mandatSimple = scales?.filter(s => s.nom === 'Mandat Simple').sort((a, b) => a.ordre - b.ordre) || [];
  const mandatExclusif = scales?.filter(s => s.nom === 'Mandat Exclusif').sort((a, b) => a.ordre - b.ordre) || [];

  const formatPrice = (price: string | null) => {
    if (!price) return null;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(parseFloat(price));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-12 px-4 bg-gradient-to-br from-accent/10 to-background">
        <div className="container mx-auto text-center">
          <h1 className="font-serif text-3xl md:text-4xl font-normal mb-4">
            Vendez votre bien en toute confiance avec KEYLOR
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Un accompagnement personnalisé à chaque étape, avec un suivi clair et des conseils adaptés. L’objectif : maximiser la valeur de votre bien, en toute sérénité.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" onClick={() => {
              const el = document.getElementById('pricing');
              if (el) {
                const y = el.getBoundingClientRect().top + window.pageYOffset - 100;
                window.scrollTo({ top: y, behavior: 'smooth' });
              }
            }} data-testid="button-pricing-cta">
              Voir nos solutions
            </Button>
            <Button size="lg" variant="outline" onClick={() => {
              const el = document.getElementById('estimation-form');
              if (el) {
                const y = el.getBoundingClientRect().top + window.pageYOffset - 100;
                window.scrollTo({ top: y, behavior: 'smooth' });
              }
            }} data-testid="button-estimate-sale">
              <Calculator className="mr-2 h-5 w-5" />
              Estimer mon bien maintenant
            </Button>
          </div>
        </div>
      </section>

      {/* Pourquoi vendre */}
      <section className="container mx-auto py-10 px-4">
        <h2 className="font-serif text-3xl md:text-4xl text-center mb-4">
          Pourquoi vendre avec KEYLOR ?
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
          Une agence immobilière nationale offrant un accompagnement professionnel pour valoriser votre bien de manière optimale.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="text-center hover-elevate flex flex-col border-2 border-accent/40">
            <CardHeader className="pb-4">
              <Award className="h-10 w-10 text-accent mx-auto mb-3" />
              <CardTitle className="text-lg font-serif font-normal leading-tight min-h-[3.5rem] flex items-center justify-center">
                Service<br/>professionnel
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <CardDescription className="text-sm flex-1 text-center">Photos de qualité, annonces ciblées et stratégie adaptée : tout est mis en œuvre pour donner à votre bien la meilleure visibilité.</CardDescription>
            </CardContent>
          </Card>
          <Card className="text-center hover-elevate flex flex-col border-2 border-accent/40">
            <CardHeader className="pb-4">
              <Euro className="h-10 w-10 text-accent mx-auto mb-3" />
              <CardTitle className="text-lg font-serif font-normal leading-tight min-h-[3.5rem] flex items-center justify-center">
                Prix<br/>optimisé
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <CardDescription className="text-sm flex-1 text-center">Estimation précise basée sur le marché et les caractéristiques de votre bien, pour vendre au bon prix et dans les meilleures conditions.</CardDescription>
            </CardContent>
          </Card>
          <Card className="text-center hover-elevate flex flex-col border-2 border-accent/40">
            <CardHeader className="pb-4">
              <Clock className="h-10 w-10 text-accent mx-auto mb-3" />
              <CardTitle className="text-lg font-serif font-normal leading-tight min-h-[3.5rem] flex items-center justify-center">
                Vente<br/>maîtrisée
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <CardDescription className="text-sm flex-1 text-center">Mise en vente structurée avec valorisation du bien, ciblage des acheteurs et suivi attentif des visites, jusqu’à la signature.</CardDescription>
            </CardContent>
          </Card>
          <Card className="text-center hover-elevate flex flex-col border-2 border-accent/40">
            <CardHeader className="pb-4">
              <Shield className="h-10 w-10 text-accent mx-auto mb-3" />
              <CardTitle className="text-lg font-serif font-normal leading-tight min-h-[3.5rem] flex items-center justify-center">
                Accompagnement<br/>complet
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <CardDescription className="text-sm flex-1 text-center">De l’estimation à la signature, un interlocuteur unique assure un suivi régulier, des conseils clairs et une assistance à chaque étape.</CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Processus de vente - 6 étapes */}
      <section className="bg-muted py-10 px-4">
        <div className="container mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl text-center mb-4">
            Notre processus de vente en 6 étapes
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            Un accompagnement clair et sécurisé, de l’estimation à la signature.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card className="text-center hover-elevate flex flex-col border-2 border-accent/40">
              <CardHeader className="pb-4">
                <Clock className="h-10 w-10 text-accent mx-auto mb-3" />
                <CardTitle className="text-lg font-serif font-normal leading-tight min-h-[3.5rem] flex items-center justify-center">
                  Évaluation<br/>gratuite
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <CardDescription className="text-sm flex-1 text-center">Analyse du marché et estimation précise pour définir un prix juste et adapté à votre bien.</CardDescription>
              </CardContent>
            </Card>
            <Card className="text-center hover-elevate flex flex-col border-2 border-accent/40">
              <CardHeader className="pb-4">
                <Home className="h-10 w-10 text-accent mx-auto mb-3" />
                <CardTitle className="text-lg font-serif font-normal leading-tight min-h-[3.5rem] flex items-center justify-center">
                  Visite et<br/>diagnostic
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <CardDescription className="text-sm flex-1 text-center">Valorisation des points forts du bien et préparation aux obligations légales (diagnostics, conformité…).</CardDescription>
              </CardContent>
            </Card>
            <Card className="text-center hover-elevate flex flex-col border-2 border-accent/40">
              <CardHeader className="pb-4">
                <Camera className="h-10 w-10 text-accent mx-auto mb-3" />
                <CardTitle className="text-lg font-serif font-normal leading-tight min-h-[3.5rem] flex items-center justify-center">
                  Reportage<br/>photo
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <CardDescription className="text-sm flex-1 text-center">Photos HD, visite virtuelle et drone pour présenter le bien sous son meilleur jour.</CardDescription>
              </CardContent>
            </Card>
            <Card className="text-center hover-elevate flex flex-col border-2 border-accent/40">
              <CardHeader className="pb-4">
                <TrendingUp className="h-10 w-10 text-accent mx-auto mb-3" />
                <CardTitle className="text-lg font-serif font-normal leading-tight min-h-[3.5rem] flex items-center justify-center">
                  Marketing &<br/>diffusion
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <CardDescription className="text-sm flex-1 text-center">Rédaction et diffusion de l’annonce sur les principaux portails et réseaux sociaux pour toucher le plus d’acheteurs potentiels.</CardDescription>
              </CardContent>
            </Card>
            <Card className="text-center hover-elevate flex flex-col border-2 border-accent/40">
              <CardHeader className="pb-4">
                <Users className="h-10 w-10 text-accent mx-auto mb-3" />
                <CardTitle className="text-lg font-serif font-normal leading-tight min-h-[3.5rem] flex items-center justify-center">
                  Organisation<br/>des visites
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <CardDescription className="text-sm flex-1 text-center">Sélection des acheteurs sérieux, planification des visites et compte-rendu détaillé à chaque étape.</CardDescription>
              </CardContent>
            </Card>
            <Card className="text-center hover-elevate flex flex-col border-2 border-accent/40">
              <CardHeader className="pb-4">
                <FileText className="h-10 w-10 text-accent mx-auto mb-3" />
                <CardTitle className="text-lg font-serif font-normal leading-tight min-h-[3.5rem] flex items-center justify-center">
                  Signature<br/>finale
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <CardDescription className="text-sm flex-1 text-center">Accompagnement lors de la négociation, suivi notarial et sécurisation complète de la transaction jusqu’à l’acte.</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tarifs mandats de vente */}
      <section id="pricing" className="container mx-auto py-16 px-4">
        <h2 className="font-serif text-3xl md:text-4xl text-center mb-4">
          Nos tarifs de mandat de vente
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
          Choisissez le type de mandat adapté à vos besoins
        </p>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
          {/* Mandat Simple */}
          <Card className="hover-elevate flex flex-col">
            <CardHeader className="text-center border-b pb-4">
              <Badge className="mx-auto mb-3 bg-accent/20 text-accent">Mandat Simple</Badge>
              <CardTitle className="text-xl mb-2">Keylor One</CardTitle>
              <CardDescription className="text-sm">Contrôle total de votre bien. Accompagnement fiable.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex-1">
              <div className="space-y-3">
                <h4 className="font-medium text-center mb-3 text-sm">Barème d'honoraires</h4>
                <div className="space-y-2 text-sm">
                  {mandatSimple.map((scale, idx) => (
                    <div key={scale.id} className={`flex justify-between p-2 ${idx % 2 === 0 ? 'bg-muted/50 rounded' : ''}`}>
                      <span className="text-xs">
                        {scale.trancheMin && scale.trancheMax ? (
                          <>{formatPrice(scale.trancheMin)} - {formatPrice(scale.trancheMax)}</>
                        ) : scale.trancheMax ? (
                          <>&lt; {formatPrice(scale.trancheMax)}</>
                        ) : scale.trancheMin ? (
                          <>&gt; {formatPrice(scale.trancheMin)}</>
                        ) : 'Tous montants'}
                      </span>
                      <span className="font-medium text-xs">
                        {scale.honoraires ? formatPrice(scale.honoraires) : `${scale.tauxPourcentage}%`}
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Ligne séparatrice invisible pour aligner avec Keylor Prisme */}
                <div className="border-t pt-3 mt-3 opacity-0 pointer-events-none">
                  <div className="h-[1px]"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mandat Exclusif */}
          <Card className="hover-elevate border-accent border-2 flex flex-col">
            <CardHeader className="text-center border-b pb-4">
              <Badge className="mx-auto mb-3 bg-accent text-white">Mandat Exclusif</Badge>
              <CardTitle className="text-xl mb-2">Keylor Prisme</CardTitle>
              <CardDescription className="text-sm">Visibilité maximale. Suivi prioritaire. Vente optimisée.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex-1">
              <div className="space-y-3">
                <h4 className="font-medium text-center mb-3 text-sm">Barème d'honoraires</h4>
                <div className="space-y-2 text-sm">
                  {mandatExclusif.map((scale, idx) => (
                    <div key={scale.id} className={`flex justify-between p-2 ${idx % 2 === 0 ? 'bg-muted/50 rounded' : ''}`}>
                      <span className="text-xs">
                        {scale.trancheMin && scale.trancheMax ? (
                          <>{formatPrice(scale.trancheMin)} - {formatPrice(scale.trancheMax)}</>
                        ) : scale.trancheMax ? (
                          <>&lt; {formatPrice(scale.trancheMax)}</>
                        ) : scale.trancheMin ? (
                          <>&gt; {formatPrice(scale.trancheMin)}</>
                        ) : 'Tous montants'}
                      </span>
                      <span className="font-medium text-xs">
                        {scale.honoraires ? formatPrice(scale.honoraires) : `${scale.tauxPourcentage}%`}
                      </span>
                    </div>
                  ))}
                </div>
                
                {mandatExclusif.length > 0 && mandatExclusif[0].avantagesExclusifs && mandatExclusif[0].avantagesExclusifs.length > 0 && (
                  <div className="border-t pt-3 mt-3">
                    <h5 className="font-medium text-sm mb-2">Avantages exclusifs :</h5>
                    <ul className="space-y-1.5 text-xs">
                      {mandatExclusif[0].avantagesExclusifs.map((avantage, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-accent flex-shrink-0 mt-0.5" />
                          <span>{avantage}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Formulaire d'estimation */}
      <section id="estimation-form" className="container mx-auto py-16 px-4">
        <h2 className="font-serif text-3xl md:text-4xl text-center mb-4">
          Estimez votre bien gratuitement
        </h2>
        <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
          Obtenez une estimation précise de votre bien par nos experts en moins de 24h
        </p>
        <Card className="p-8 max-w-3xl mx-auto">
          <EstimatorForm />
        </Card>
      </section>
    </div>
  );
}
