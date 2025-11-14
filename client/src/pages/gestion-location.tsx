import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  FileCheck,
  Users,
  Shield,
  Calculator,
  Home,
  TrendingUp,
  Clock,
  Award,
  CheckCircle2,
  Phone,
  Star,
} from "lucide-react";
import { EstimatorForm } from "@/components/estimator-form";
import { useQuery } from "@tanstack/react-query";
import type { PricingScale } from "@shared/schema";

export default function GestionLocationPage() {
  const { data: scales } = useQuery<PricingScale[]>({
    queryKey: ['/api/pricing-scales'],
    queryFn: async () => {
      const res = await fetch('/api/pricing-scales?active=true');
      if (!res.ok) throw new Error('Erreur');
      return res.json();
    }
  });

  // Filtrer uniquement les 4 mandats de gestion locative (type='location' ET categorie='mandat')
  const gestionScales = scales?.filter(s => 
    s.type === 'location' && 
    s.categorie === 'mandat'
  ).sort((a, b) => parseFloat(b.tauxPourcentage || '0') - parseFloat(a.tauxPourcentage || '0')) || [];

  // Filtrer les barèmes ALUR (type='location_services' ET categorie='zone_alur')
  const alurScales = scales?.filter(s => 
    s.type === 'location_services' && 
    s.categorie === 'zone_alur'
  ).sort((a, b) => (a.ordre || 0) - (b.ordre || 0)) || [];

  // Filtrer les baux code civil
  const bauxCivil = scales?.filter(s => 
    s.type === 'location_services' && 
    s.categorie === 'baux_civil'
  ).sort((a, b) => (a.ordre || 0) - (b.ordre || 0)) || [];

  // Filtrer les commerces
  const commercial = scales?.filter(s => 
    s.type === 'location_services' && 
    s.categorie === 'commercial'
  ).sort((a, b) => (a.ordre || 0) - (b.ordre || 0)) || [];

  // Filtrer le stationnement
  const stationnement = scales?.filter(s => 
    s.type === 'location_services' && 
    s.categorie === 'stationnement'
  ).sort((a, b) => (a.ordre || 0) - (b.ordre || 0)) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-12 px-4 bg-gradient-to-br from-accent/10 to-background">
        <div className="container mx-auto text-center">
          <h1 className="font-serif text-3xl md:text-4xl font-normal mb-4">
            Gestion locative professionnelle
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Suivi complet et fiable pour sécuriser et valoriser votre investissement locatif.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" onClick={() => {
              const el = document.getElementById('pricing');
              if (el) {
                const y = el.getBoundingClientRect().top + window.pageYOffset - 100;
                window.scrollTo({ top: y, behavior: 'smooth' });
              }
            }} data-testid="button-pricing-cta">
              Voir nos solutions de gestion
            </Button>
            <Link href="/rendez-vous?origine=gerer">
              <Button variant="outline" data-testid="button-take-appointment">
                <Phone className="mr-2 h-5 w-5" />
                Prendre rendez-vous
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pourquoi choisir KEYLOR */}
      <section className="container mx-auto py-10 px-4">
        <h2 className="font-serif text-3xl md:text-4xl text-center mb-4">
          Pourquoi choisir KEYLOR pour la gestion locative ?
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
          Gestion complète de votre bien : suivi administratif et technique, accompagnement fiable et efficace pour sécuriser votre investissement locatif.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="text-center hover-elevate flex flex-col border-2 border-accent/40">
            <CardHeader className="pb-4">
              <Star className="h-10 w-10 text-accent mx-auto mb-3" />
              <CardTitle className="text-lg font-serif font-normal leading-tight min-h-[3.5rem] flex items-center justify-center">
                Taux d'occupation<br/>optimisé
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <CardDescription className="text-sm flex-1 text-center">Recherche active de locataires qualifiés pour votre bien.</CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover-elevate flex flex-col border-2 border-accent/40">
            <CardHeader className="pb-4">
              <Shield className="h-10 w-10 text-accent mx-auto mb-3" />
              <CardTitle className="text-lg font-serif font-normal leading-tight min-h-[3.5rem] flex items-center justify-center">
                Garantie loyers<br/>impayés
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <CardDescription className="text-sm flex-1 text-center">Couverture et suivi en cas de loyers impayés ou dégradations.</CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover-elevate flex flex-col border-2 border-accent/40">
            <CardHeader className="pb-4">
              <Clock className="h-10 w-10 text-accent mx-auto mb-3" />
              <CardTitle className="text-lg font-serif font-normal leading-tight min-h-[3.5rem] flex items-center justify-center">
                Disponibilité<br/>7j/7
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <CardDescription className="text-sm flex-1 text-center">Service client réactif pour vous et vos locataires.</CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover-elevate flex flex-col border-2 border-accent/40">
            <CardHeader className="pb-4">
              <Award className="h-10 w-10 text-accent mx-auto mb-3" />
              <CardTitle className="text-lg font-serif font-normal leading-tight min-h-[3.5rem] flex items-center justify-center">
                Service<br/>professionnel
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <CardDescription className="text-sm flex-1 text-center">Suivi administratif et technique personnalisé pour chaque bien.</CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" onClick={() => {
              const el = document.getElementById('estimation-form');
              if (el) {
                const y = el.getBoundingClientRect().top + window.pageYOffset - 100;
                window.scrollTo({ top: y, behavior: 'smooth' });
              }
            }} data-testid="button-contact-audit">
              Obtenir mon audit gratuit
            </Button>
          </div>
        </div>
      </section>

      {/* Services complets */}
      <section className="bg-muted py-10 px-4">
        <div className="container mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl text-center mb-4">
            Services complets de gestion locative
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            Gestion locative complète : de la recherche de locataires à la gestion quotidienne, toutes les étapes sont prises en charge pour sécuriser et valoriser votre investissement.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover-elevate flex flex-col border-2 border-accent/40">
              <CardHeader className="text-center pb-4">
                <Users className="h-10 w-10 text-accent mx-auto mb-3" />
                <CardTitle className="text-lg font-serif font-normal leading-tight min-h-[3.5rem] flex items-center justify-center">
                  Recherche et sélection<br/>de locataires
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <CardDescription className="text-sm text-center flex-1">
                  Diffusion sur les meilleurs portails<br/>
                  Organisation et accompagnement des visites<br/>
                  Vérification approfondie des dossiers<br/>
                  Sélection des profils les plus solvables
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover-elevate flex flex-col border-2 border-accent/40">
              <CardHeader className="text-center pb-4">
                <FileCheck className="h-10 w-10 text-accent mx-auto mb-3" />
                <CardTitle className="text-lg font-serif font-normal leading-tight min-h-[3.5rem] flex items-center justify-center">
                  Gestion administrative<br/>complète
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <CardDescription className="text-sm text-center flex-1">
                  Rédaction des baux et annexes légales<br/>
                  États des lieux entrée/sortie<br/>
                  Gestion des quittances et charges<br/>
                  Révision annuelle des loyers
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover-elevate flex flex-col border-2 border-accent/40">
              <CardHeader className="text-center pb-4">
                <Shield className="h-10 w-10 text-accent mx-auto mb-3" />
                <CardTitle className="text-lg font-serif font-normal leading-tight min-h-[3.5rem] flex items-center justify-center">
                  Protection<br/>financière
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <CardDescription className="text-sm text-center flex-1">
                  Garantie loyers impayés<br/>
                  Recouvrement des impayés<br/>
                  Protection juridique locative<br/>
                  Assurance propriétaire non-occupant
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover-elevate flex flex-col border-2 border-accent/40">
              <CardHeader className="text-center pb-4">
                <Calculator className="h-10 w-10 text-accent mx-auto mb-3" />
                <CardTitle className="text-lg font-serif font-normal leading-tight min-h-[3.5rem] flex items-center justify-center">
                  Optimisation fiscale<br/>et comptable
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <CardDescription className="text-sm text-center flex-1">
                  Conseil en optimisation fiscale<br/>
                  Déclaration des revenus locatifs<br/>
                  Comptabilité détaillée<br/>
                  Reporting mensuel
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover-elevate flex flex-col border-2 border-accent/40">
              <CardHeader className="text-center pb-4">
                <Home className="h-10 w-10 text-accent mx-auto mb-3" />
                <CardTitle className="text-lg font-serif font-normal leading-tight min-h-[3.5rem] flex items-center justify-center">
                  Gestion technique<br/>du bien
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <CardDescription className="text-sm text-center flex-1">
                  Coordination des réparations<br/>
                  Réseau d'artisans qualifiés<br/>
                  Devis et suivi des travaux<br/>
                  Entretien préventif du logement
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover-elevate flex flex-col border-2 border-accent/40">
              <CardHeader className="text-center pb-4">
                <TrendingUp className="h-10 w-10 text-accent mx-auto mb-3" />
                <CardTitle className="text-lg font-serif font-normal leading-tight min-h-[3.5rem] flex items-center justify-center">
                  Maximisation de<br/>la rentabilité
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <CardDescription className="text-sm text-center flex-1">
                  Fixation du loyer optimal<br/>
                  Réduction de la vacance locative<br/>
                  Renégociation des charges<br/>
                  Conseils en valorisation du bien
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto py-16 px-4">
        <h2 className="font-serif text-3xl md:text-4xl text-center mb-4">
          Nos gammes de mandat
        </h2>
        <p className="text-center text-muted-foreground mb-8 max-w-3xl mx-auto">
          Choisissez la formule qui correspond le mieux à votre bien et à vos besoins.
        </p>
        <p className="text-center text-sm text-muted-foreground mb-12 italic">
          * La recherche de locataires et la rédaction de bail font l'objet d'un mandat de location distinct (facturation ALUR)
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {gestionScales.map((scale, idx) => (
            <Card key={scale.id} className={idx === 0 ? "hover-elevate border-accent border-2 flex flex-col h-full" : "hover-elevate border-accent/40 border-2 flex flex-col h-full"}>
              <CardHeader className="text-center border-b pb-4">
                <Badge className={idx === 0 ? "mx-auto mb-3 bg-accent text-white" : "mx-auto mb-3 bg-accent/20 text-accent"}>
                  {scale.nom}
                </Badge>
                <div className="text-4xl font-serif font-light mb-2">{scale.tauxPourcentage}%</div>
                <CardDescription className="text-sm">des loyers perçus</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 flex-1">
                {scale.description && (
                  <p className="text-xs text-center text-muted-foreground mb-3">{scale.description}</p>
                )}
                {scale.elementsDifferenciants && scale.elementsDifferenciants.length > 0 ? (
                  <ul className="space-y-2">
                    {scale.elementsDifferenciants.map((element, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{element}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-sm">CRG mensuel détaillé</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Garantie loyers impayés (GLI) + PNO incluse</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-sm">ADRF incluse (déclaration revenus fonciers)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Reporting complet + assistance en cas d'impayés</span>
                    </li>
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Barèmes ALUR - Honoraires de location */}
      <section className="container mx-auto py-16 px-4 bg-muted/30">
        <h2 className="font-serif text-3xl text-center mb-4">Honoraires de mise en location TTC</h2>
        <p className="text-center text-sm text-muted-foreground mb-8">TVA au taux en vigueur (20%)</p>
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Carte 1: Locaux d'habitation ALUR */}
            <Card className="border-accent/40 border-2">
              <CardHeader className="text-center bg-accent/5 border-b pb-4">
                <CardTitle className="text-lg font-serif font-normal">
                  Locaux d'habitation (Loi ALUR)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* À la charge du propriétaire */}
                  {alurScales.some(s => s.factureA === 'proprietaire') && (
                    <div>
                      <div className="text-xs font-semibold mb-2 text-primary">À la charge du propriétaire</div>
                      <div className="space-y-2">
                        {alurScales.filter(s => s.factureA === 'proprietaire').map((scale) => (
                          <div key={scale.id} className="flex items-center justify-between text-sm border-l-2 border-primary/30 pl-2 py-1">
                            <span className="font-medium">{scale.nom}</span>
                            <span className="font-semibold text-accent">
                              {scale.tauxPourcentage 
                                ? `${scale.tauxPourcentage}%` 
                                : scale.honoraires 
                                  ? `${scale.honoraires} ${scale.unite === 'mois_loyer' ? 'mois' : scale.unite}` 
                                  : 'N/A'
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* À la charge du locataire */}
                  {alurScales.some(s => s.factureA === 'locataire') && (
                    <div>
                      <div className="text-xs font-semibold mb-2 text-blue-600 dark:text-blue-400">À la charge du locataire</div>
                      <div className="space-y-2">
                        {alurScales.filter(s => s.factureA === 'locataire').map((scale) => (
                          <div key={scale.id} className="flex items-center justify-between text-sm border-l-2 border-blue-600/30 pl-2 py-1">
                            <span className="font-medium">{scale.nom}</span>
                            <span className="font-semibold text-accent">
                              {scale.tauxPourcentage 
                                ? `${scale.tauxPourcentage}%` 
                                : scale.honoraires 
                                  ? `${scale.honoraires} ${scale.unite === 'mois_loyer' ? 'mois' : scale.unite}` 
                                  : 'N/A'
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* À la charge des deux */}
                  {alurScales.some(s => s.factureA === 'les_deux') && (
                    <div>
                      <div className="text-xs font-semibold mb-2 text-purple-600 dark:text-purple-400">À la charge des deux parties</div>
                      <div className="space-y-2">
                        {alurScales.filter(s => s.factureA === 'les_deux').map((scale) => (
                          <div key={scale.id} className="flex items-center justify-between text-sm border-l-2 border-purple-600/30 pl-2 py-1">
                            <span className="font-medium">{scale.nom}</span>
                            <span className="font-semibold text-accent">
                              {scale.tauxPourcentage 
                                ? `${scale.tauxPourcentage}%` 
                                : scale.honoraires 
                                  ? `${scale.honoraires} ${scale.unite === 'mois_loyer' ? 'mois' : scale.unite}` 
                                  : 'N/A'
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Carte 2: Locaux hors ALUR (baux civil + stationnement) */}
            <Card className="border-accent/40 border-2">
              <CardHeader className="text-center bg-accent/5 border-b pb-4">
                <CardTitle className="text-lg font-serif font-normal">
                  Locaux hors ALUR
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Grouper tous les services (baux civil + stationnement) par factureA */}
                  {[...bauxCivil, ...stationnement].some(s => s.factureA === 'proprietaire') && (
                    <div>
                      <div className="text-xs font-semibold mb-2 text-primary">À la charge du propriétaire</div>
                      <div className="space-y-2">
                        {[...bauxCivil, ...stationnement].filter(s => s.factureA === 'proprietaire').map((scale) => (
                          <div key={scale.id} className="flex items-center justify-between text-sm border-l-2 border-primary/30 pl-2 py-1">
                            <span className="font-medium">{scale.nom}</span>
                            <span className="font-semibold text-accent">
                              {scale.honoraires 
                                ? `${scale.honoraires} ${scale.unite === 'mois_loyer' ? 'mois' : scale.unite}` 
                                : 'N/A'
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {[...bauxCivil, ...stationnement].some(s => s.factureA === 'locataire') && (
                    <div>
                      <div className="text-xs font-semibold mb-2 text-blue-600 dark:text-blue-400">À la charge du locataire</div>
                      <div className="space-y-2">
                        {[...bauxCivil, ...stationnement].filter(s => s.factureA === 'locataire').map((scale) => (
                          <div key={scale.id} className="flex items-center justify-between text-sm border-l-2 border-blue-600/30 pl-2 py-1">
                            <span className="font-medium">{scale.nom}</span>
                            <span className="font-semibold text-accent">
                              {scale.honoraires 
                                ? `${scale.honoraires} ${scale.unite === 'mois_loyer' ? 'mois' : scale.unite}` 
                                : 'N/A'
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {[...bauxCivil, ...stationnement].some(s => s.factureA === 'les_deux') && (
                    <div>
                      <div className="text-xs font-semibold mb-2 text-purple-600 dark:text-purple-400">À la charge des deux parties</div>
                      <div className="space-y-2">
                        {[...bauxCivil, ...stationnement].filter(s => s.factureA === 'les_deux').map((scale) => (
                          <div key={scale.id} className="flex items-center justify-between text-sm border-l-2 border-purple-600/30 pl-2 py-1">
                            <span className="font-medium">{scale.nom}</span>
                            <span className="font-semibold text-accent">
                              {scale.honoraires 
                                ? `${scale.honoraires} ${scale.unite === 'mois_loyer' ? 'mois' : scale.unite}` 
                                : 'N/A'
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Carte 3: Locaux commerciaux */}
            <Card className="border-accent/40 border-2">
              <CardHeader className="text-center bg-accent/5 border-b pb-4">
                <CardTitle className="text-lg font-serif font-normal">
                  Locaux commerciaux
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* À la charge du propriétaire */}
                  {commercial.some(s => s.factureA === 'proprietaire') && (
                    <div>
                      <div className="text-xs font-semibold mb-2 text-primary">À la charge du propriétaire</div>
                      <div className="space-y-2">
                        {commercial.filter(s => s.factureA === 'proprietaire').map((scale) => (
                          <div key={scale.id} className="border-l-2 border-primary/30 pl-2 py-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{scale.nom}</span>
                              <span className="font-semibold text-accent">
                                {scale.tauxPourcentage 
                                  ? `${scale.tauxPourcentage}%` 
                                  : scale.honoraires 
                                    ? `${scale.honoraires} ${scale.unite}` 
                                    : 'N/A'
                                }
                              </span>
                            </div>
                            {scale.minimum && (
                              <p className="text-xs text-muted-foreground mt-0.5">Min : {scale.minimum} €</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* À la charge du locataire */}
                  {commercial.some(s => s.factureA === 'locataire') && (
                    <div>
                      <div className="text-xs font-semibold mb-2 text-blue-600 dark:text-blue-400">À la charge du locataire</div>
                      <div className="space-y-2">
                        {commercial.filter(s => s.factureA === 'locataire').map((scale) => (
                          <div key={scale.id} className="border-l-2 border-blue-600/30 pl-2 py-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{scale.nom}</span>
                              <span className="font-semibold text-accent">
                                {scale.tauxPourcentage 
                                  ? `${scale.tauxPourcentage}%` 
                                  : scale.honoraires 
                                    ? `${scale.honoraires} ${scale.unite}` 
                                    : 'N/A'
                                }
                              </span>
                            </div>
                            {scale.minimum && (
                              <p className="text-xs text-muted-foreground mt-0.5">Min : {scale.minimum} €</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* À la charge des deux */}
                  {commercial.some(s => s.factureA === 'les_deux') && (
                    <div>
                      <div className="text-xs font-semibold mb-2 text-purple-600 dark:text-purple-400">À la charge des deux parties</div>
                      <div className="space-y-2">
                        {commercial.filter(s => s.factureA === 'les_deux').map((scale) => (
                          <div key={scale.id} className="border-l-2 border-purple-600/30 pl-2 py-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{scale.nom}</span>
                              <span className="font-semibold text-accent">
                                {scale.tauxPourcentage 
                                  ? `${scale.tauxPourcentage}%` 
                                  : scale.honoraires 
                                    ? `${scale.honoraires} ${scale.unite}` 
                                    : 'N/A'
                                }
                              </span>
                            </div>
                            {scale.minimum && (
                              <p className="text-xs text-muted-foreground mt-0.5">Min : {scale.minimum} €</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Formulaire d'estimation de loyer */}
      <section id="estimation-form" className="container mx-auto py-16 px-4">
        <h2 className="font-serif text-3xl md:text-4xl text-center mb-4">
          Estimez le loyer de votre bien gratuitement
        </h2>
        <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
          Obtenez une estimation précise du loyer optimal par nos experts en moins de 24h
        </p>
        <Card className="p-8 max-w-3xl mx-auto">
          <EstimatorForm />
        </Card>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto py-16 px-4 text-center">
        <h2 className="font-serif text-3xl md:text-4xl mb-6">
          Prêt à confier la gestion locative de votre investissement ?
        </h2>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/rendez-vous?origine=gerer">
            <Button data-testid="button-take-appointment-footer">
              <Phone className="mr-2 h-5 w-5" />
              Prendre rendez-vous
            </Button>
          </Link>
          <Button size="lg" variant="outline" onClick={() => document.getElementById('estimation-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} data-testid="button-estimate-rental">
            <Calculator className="mr-2 h-5 w-5" />
            Faire estimer un loyer
          </Button>
        </div>
      </section>
    </div>
  );
}
