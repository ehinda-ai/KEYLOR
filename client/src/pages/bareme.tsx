import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { PricingScale } from "@shared/schema";
import { Euro, Building2, Home, Key } from "lucide-react";

function Bareme() {
  const { data: scales, isLoading } = useQuery<PricingScale[]>({
    queryKey: ['/api/pricing-scales'],
    queryFn: async () => {
      const res = await fetch('/api/pricing-scales?active=true');
      if (!res.ok) throw new Error('Erreur');
      return res.json();
    }
  });

  const { data: configData } = useQuery<{ minimum: number }>({
    queryKey: ['/api/config/minimum-sale-fee'],
    queryFn: async () => {
      const res = await fetch('/api/config/minimum-sale-fee');
      if (!res.ok) throw new Error('Erreur');
      return res.json();
    }
  });

  const minimumSaleFee = configData?.minimum || 4500;

  // Filtre les tarifs correctement par type
  const venteScales = scales?.filter(s => s.type === 'vente' && s.categorie === 'mandat' && s.nom === 'Mandat Simple') || [];
  const avisValeurScales = scales?.filter(s => s.type === 'vente' && s.categorie === 'avis_valeur').sort((a, b) => (a.ordre || 0) - (b.ordre || 0)) || [];
  const vacationScales = scales?.filter(s => s.type === 'vente' && s.categorie === 'vacation').sort((a, b) => (a.ordre || 0) - (b.ordre || 0)) || [];
  
  // Filtrer uniquement les 4 mandats de gestion locative (type='location' ET categorie='mandat')
  const locationScales = scales?.filter(s => 
    s.type === 'location' && 
    s.categorie === 'mandat'
  ).sort((a, b) => parseFloat(b.tauxPourcentage || '0') - parseFloat(a.tauxPourcentage || '0')) || [];
  
  // Récupérer les barèmes ALUR depuis l'admin
  const alurScales = scales?.filter(s => 
    s.type === 'location_services' && 
    s.categorie === 'zone_alur'
  ).sort((a, b) => (a.ordre || 0) - (b.ordre || 0)) || [];
  
  // Récupérer les baux code civil
  const bauxCivil = scales?.filter(s => 
    s.type === 'location_services' && 
    s.categorie === 'baux_civil'
  ).sort((a, b) => (a.ordre || 0) - (b.ordre || 0)) || [];

  // Récupérer les tarifs commerciaux
  const commercial = scales?.filter(s => 
    s.type === 'location_services' && 
    s.categorie === 'commercial'
  ).sort((a, b) => (a.ordre || 0) - (b.ordre || 0)) || [];

  // Récupérer les tarifs stationnement
  const stationnement = scales?.filter(s => 
    s.type === 'location_services' && 
    s.categorie === 'stationnement'
  ).sort((a, b) => (a.ordre || 0) - (b.ordre || 0)) || [];

  const formatPrice = (price: string | null) => {
    if (!price) return null;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(parseFloat(price));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background">
      {/* En-tête avec logo - visible à l'écran et à l'impression */}
      <section className="relative py-8 px-4 bg-gradient-to-br from-primary/5 to-background border-b">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-center gap-8 mb-6">
            <div className="flex-1 text-center">
              <div className="font-serif text-3xl md:text-5xl font-bold mb-4 text-accent" data-testid="text-logo">
                KEYLOR
              </div>
              <h1 className="font-serif text-2xl md:text-4xl font-normal mb-2 text-primary">
                Barème d'honoraires {currentYear}
              </h1>
              <p className="text-foreground mb-1 hidden md:block">
                Transparence totale sur nos honoraires d'agence
              </p>
              <p className="text-sm text-muted-foreground font-medium">
                Tarifs TTC - TVA au taux en vigueur (20%)
              </p>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @media print {
          .print-header {
            display: block !important;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>

      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* TRANSACTION */}
          <Card className="border-primary/30 border hover-elevate">
            <CardHeader className="text-center bg-primary/5 border-b border-primary/20 pb-4">
              <Building2 className="h-10 w-10 text-accent mx-auto mb-3" />
              <CardTitle className="text-lg font-serif text-primary">TRANSACTION</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3 mb-6">
                <h3 className="font-semibold text-center mb-4 text-foreground">Honoraires de vente</h3>
                {venteScales.map((scale) => (
                  <div key={scale.id} className="text-xs py-2 border-b border-border last:border-0">
                    <div className="flex justify-between items-start gap-2">
                      <span className="flex-1 font-medium text-foreground">
                        {scale.trancheMax && !scale.trancheMin ? (
                          <>Jusqu'à {formatPrice(scale.trancheMax)}</>
                        ) : scale.trancheMin && !scale.trancheMax ? (
                          <>Plus de {formatPrice(scale.trancheMin)}</>
                        ) : scale.trancheMin && scale.trancheMax ? (
                          <>{formatPrice(scale.trancheMin)} - {formatPrice(scale.trancheMax)}</>
                        ) : 'Tous montants'}
                      </span>
                      <span className="font-semibold text-accent text-right shrink-0 leading-tight">
                        {scale.honoraires ? (
                          <div className="flex flex-col items-end leading-[1.2]">
                            <span className="font-bold text-sm">{formatPrice(scale.honoraires)}</span>
                            <span className="text-xs text-muted-foreground">HT</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end leading-[1.2]">
                            <span className="font-bold text-sm">{scale.tauxPourcentage}%</span>
                            <span className="text-xs text-muted-foreground">HT</span>
                          </div>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-accent/10 p-3 rounded text-center mb-6">
                <p className="text-sm font-medium text-foreground">Minimum : {formatPrice(minimumSaleFee.toString())} TTC</p>
              </div>

              {avisValeurScales.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm mb-3 text-foreground">Avis de valeur (hors mandat)</h4>
                  <div className="space-y-1 text-sm">
                    {avisValeurScales.map((scale) => (
                      <div key={scale.id} className="flex justify-between text-foreground">
                        <span>{scale.nom}</span>
                        <span className="font-medium text-accent">{formatPrice(scale.honoraires)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {vacationScales.length > 0 && (
                <div className="space-y-2 mt-4">
                  <h4 className="font-semibold text-sm mb-3 text-foreground">Vacation / Conseil</h4>
                  <div className="space-y-1 text-sm">
                    {vacationScales.map((scale) => (
                      <div key={scale.id} className="flex justify-between text-foreground">
                        <span>{scale.nom}</span>
                        <span className="font-medium text-accent">
                          {scale.honoraires ? formatPrice(scale.honoraires) : `${scale.tauxPourcentage}%`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* GESTION LOCATIVE */}
          <Card className="border-primary/30 border hover-elevate">
            <CardHeader className="text-center bg-primary/5 border-b border-primary/20 pb-4">
              <Home className="h-10 w-10 text-accent mx-auto mb-3" />
              <CardTitle className="text-lg font-serif text-primary">GESTION LOCATIVE</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3 mb-6">
                <h3 className="font-semibold text-center mb-4 text-foreground">Honoraires de gestion</h3>
                {locationScales.map((scale) => (
                  <div key={scale.id} className="text-center p-3 rounded-lg bg-accent/10 border border-accent/30">
                    <div className="text-lg font-bold text-accent mb-1">
                      {scale.tauxPourcentage}%
                    </div>
                    <div className="text-xs font-medium text-foreground">{scale.nom}</div>
                    {scale.description && (
                      <div className="text-xs text-muted-foreground mt-1">{scale.description}</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-accent/10 p-3 rounded text-xs text-muted-foreground">
                <p className="text-center">* Pourcentage des loyers perçus</p>
              </div>
            </CardContent>
          </Card>

          {/* LOCATION HABITATION (ALUR + BAUX CIVIL) */}
          <Card className="border-primary/30 border hover-elevate">
            <CardHeader className="text-center bg-primary/5 border-b border-primary/20 pb-4">
              <Key className="h-10 w-10 text-accent mx-auto mb-3" />
              <CardTitle className="text-lg font-serif text-primary">LOCATION</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Locaux habitation ALUR */}
                {alurScales.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-3">Loi ALUR</h4>
                    
                    {/* À la charge du propriétaire */}
                    {alurScales.some(s => s.factureA === 'proprietaire') && (
                      <div className="mb-4">
                        <div className="text-xs font-semibold mb-2 italic text-primary">À la charge du propriétaire</div>
                        <div className="space-y-2">
                          {alurScales.filter(s => s.factureA === 'proprietaire').map((scale) => (
                            <div key={scale.id} className="flex justify-between items-start gap-4 text-xs py-1">
                              <span className="flex-1 font-medium text-foreground">{scale.nom}</span>
                              <span className="font-semibold text-accent text-right whitespace-nowrap">
                                {scale.tauxPourcentage 
                                  ? `${scale.tauxPourcentage}% du loyer annuel HC` 
                                  : scale.honoraires 
                                    ? `${scale.honoraires} ${scale.unite === 'mois_loyer' ? 'mois de loyer' : scale.unite}` 
                                    : 'À définir'
                                }
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* À la charge du locataire */}
                    {alurScales.some(s => s.factureA === 'locataire') && (
                      <div className="mb-4">
                        <div className="text-xs font-semibold mb-2 italic text-accent">À la charge du locataire</div>
                        <div className="space-y-2">
                          {alurScales.filter(s => s.factureA === 'locataire').map((scale) => (
                            <div key={scale.id} className="flex justify-between items-start gap-4 text-xs py-1">
                              <span className="flex-1 font-medium text-foreground">{scale.nom}</span>
                              <span className="font-semibold text-accent text-right whitespace-nowrap">
                                {scale.tauxPourcentage 
                                  ? `${scale.tauxPourcentage}% du loyer annuel HC` 
                                  : scale.honoraires 
                                    ? `${scale.honoraires} ${scale.unite === 'mois_loyer' ? 'mois de loyer' : scale.unite}` 
                                    : 'À définir'
                                }
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* À la charge des deux */}
                    {alurScales.some(s => s.factureA === 'les_deux') && (
                      <div className="mb-4">
                        <div className="text-xs font-semibold mb-2 italic text-muted-foreground">À la charge du propriétaire et du locataire</div>
                        <div className="space-y-2">
                          {alurScales.filter(s => s.factureA === 'les_deux').map((scale) => (
                            <div key={scale.id} className="flex justify-between items-start gap-4 text-xs py-1">
                              <span className="flex-1 font-medium text-foreground">{scale.nom}</span>
                              <span className="font-semibold text-accent text-right whitespace-nowrap">
                                {scale.tauxPourcentage 
                                  ? `${scale.tauxPourcentage}% du loyer annuel HC` 
                                  : scale.honoraires 
                                    ? `${scale.honoraires} ${scale.unite === 'mois_loyer' ? 'mois de loyer' : scale.unite}` 
                                    : 'À définir'
                                }
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Baux code civil */}
                {bauxCivil.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-semibold text-sm mb-3">Baux code civil (hors loi 1989)</h4>
                    
                    {/* À la charge du propriétaire */}
                    {bauxCivil.some(s => s.factureA === 'proprietaire') && (
                      <div className="mb-4">
                        <div className="text-xs font-semibold mb-2 italic text-primary">À la charge du propriétaire</div>
                        <div className="space-y-2">
                          {bauxCivil.filter(s => s.factureA === 'proprietaire').map((scale) => (
                            <div key={scale.id} className="flex justify-between items-start gap-4 text-xs py-1">
                              <span className="flex-1 font-medium text-foreground">{scale.nom}</span>
                              <span className="font-semibold text-accent text-right whitespace-nowrap">
                                {scale.honoraires 
                                  ? `${scale.honoraires} ${scale.unite === 'mois_loyer' ? 'mois de loyer' : scale.unite}` 
                                  : 'À définir'
                                }
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* À la charge du locataire */}
                    {bauxCivil.some(s => s.factureA === 'locataire') && (
                      <div className="mb-4">
                        <div className="text-xs font-semibold mb-2 italic text-accent">À la charge du locataire</div>
                        <div className="space-y-2">
                          {bauxCivil.filter(s => s.factureA === 'locataire').map((scale) => (
                            <div key={scale.id} className="flex justify-between items-start gap-4 text-xs py-1">
                              <span className="flex-1 font-medium text-foreground">{scale.nom}</span>
                              <span className="font-semibold text-accent text-right whitespace-nowrap">
                                {scale.honoraires 
                                  ? `${scale.honoraires} ${scale.unite === 'mois_loyer' ? 'mois de loyer' : scale.unite}` 
                                  : 'À définir'
                                }
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* À la charge des deux */}
                    {bauxCivil.some(s => s.factureA === 'les_deux') && (
                      <div className="mb-4">
                        <div className="text-xs font-semibold mb-2 italic text-muted-foreground">À la charge du propriétaire et du locataire</div>
                        <div className="space-y-2">
                          {bauxCivil.filter(s => s.factureA === 'les_deux').map((scale) => (
                            <div key={scale.id} className="flex justify-between items-start gap-4 text-xs py-1">
                              <span className="flex-1 font-medium text-foreground">{scale.nom}</span>
                              <span className="font-semibold text-accent text-right whitespace-nowrap">
                                {scale.honoraires 
                                  ? `${scale.honoraires} ${scale.unite === 'mois_loyer' ? 'mois de loyer' : scale.unite}` 
                                  : 'À définir'
                                }
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* COMMERCES ET ANNEXES */}
          <Card className="border-primary/30 border hover-elevate">
            <CardHeader className="text-center bg-primary/5 border-b border-primary/20 pb-4">
              <Building2 className="h-10 w-10 text-accent mx-auto mb-3" />
              <CardTitle className="text-lg font-serif text-primary whitespace-nowrap">COMMERCES & ANNEXES</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Locaux professionnels et commerciaux */}
                {commercial.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-3 text-foreground">Locaux commerciaux</h4>
                    
                    {/* À la charge du propriétaire */}
                    {commercial.some(s => s.factureA === 'proprietaire') && (
                      <div className="mb-4">
                        <div className="text-xs font-semibold mb-2 italic text-primary">À la charge du propriétaire</div>
                        <div className="space-y-2">
                          {commercial.filter(s => s.factureA === 'proprietaire').map((scale) => (
                            <div key={scale.id} className="text-xs py-1">
                              <div className="flex justify-between items-start gap-2">
                                <span className="flex-1 font-medium break-words text-xs">{scale.nom}</span>
                                <span className="font-semibold text-accent text-right text-xs shrink-0 leading-tight">
                                  {scale.tauxPourcentage 
                                    ? (
                                      <div className="flex flex-col items-end leading-[1.2]">
                                        <span className="font-bold text-sm">{scale.tauxPourcentage}%</span>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">loyer annuel</span>
                                        <span className="text-xs text-muted-foreground">HC</span>
                                      </div>
                                    )
                                    : scale.honoraires 
                                      ? `${scale.honoraires} ${scale.unite}` 
                                      : 'À définir'
                                  }
                                </span>
                              </div>
                              {scale.minimum && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Minimum : {scale.minimum} €
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* À la charge du locataire */}
                    {commercial.some(s => s.factureA === 'locataire') && (
                      <div className="mb-4">
                        <div className="text-xs font-semibold mb-2 italic" style={{ color: '#D8BFA9' }}>À la charge du locataire</div>
                        <div className="space-y-2">
                          {commercial.filter(s => s.factureA === 'locataire').map((scale) => (
                            <div key={scale.id} className="text-xs py-1">
                              <div className="flex justify-between items-start gap-2">
                                <span className="flex-1 font-medium break-words text-xs">{scale.nom}</span>
                                <span className="font-semibold text-accent text-right text-xs shrink-0 leading-tight">
                                  {scale.tauxPourcentage 
                                    ? (
                                      <div className="flex flex-col items-end leading-[1.2]">
                                        <span className="font-bold text-sm">{scale.tauxPourcentage}%</span>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">loyer annuel</span>
                                        <span className="text-xs text-muted-foreground">HC</span>
                                      </div>
                                    )
                                    : scale.honoraires 
                                      ? `${scale.honoraires} ${scale.unite}` 
                                      : 'À définir'
                                  }
                                </span>
                              </div>
                              {scale.minimum && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Minimum : {scale.minimum} €
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* À la charge des deux */}
                    {commercial.some(s => s.factureA === 'les_deux') && (
                      <div className="mb-4">
                        <div className="text-xs font-semibold mb-2 italic text-muted-foreground">À la charge des deux parties</div>
                        <div className="space-y-2">
                          {commercial.filter(s => s.factureA === 'les_deux').map((scale) => (
                            <div key={scale.id} className="text-xs py-1">
                              <div className="flex justify-between items-start gap-2">
                                <span className="flex-1 font-medium break-words text-xs">{scale.nom}</span>
                                <span className="font-semibold text-accent text-right text-xs shrink-0 leading-tight">
                                  {scale.tauxPourcentage 
                                    ? (
                                      <div className="flex flex-col items-end leading-[1.2]">
                                        <span className="font-bold text-sm">{scale.tauxPourcentage}%</span>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">loyer annuel</span>
                                        <span className="text-xs text-muted-foreground">HC</span>
                                      </div>
                                    )
                                    : scale.honoraires 
                                      ? `${scale.honoraires} ${scale.unite}` 
                                      : 'À définir'
                                  }
                                </span>
                              </div>
                              {scale.minimum && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Minimum : {scale.minimum} €
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Stationnement */}
                {stationnement.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-semibold text-sm mb-3">Stationnement</h4>
                    
                    {/* À la charge du propriétaire */}
                    {stationnement.some(s => s.factureA === 'proprietaire') && (
                      <div className="mb-4">
                        <div className="text-xs font-semibold mb-2 italic text-primary">À la charge du propriétaire</div>
                        <div className="space-y-2">
                          {stationnement.filter(s => s.factureA === 'proprietaire').map((scale) => (
                            <div key={scale.id} className="text-xs py-1">
                              <div className="flex justify-between items-start gap-2">
                                <span className="flex-1 font-medium text-foreground break-words">{scale.nom}</span>
                                <span className="font-semibold text-accent text-right text-[10px] shrink-0 whitespace-nowrap">
                                  {scale.honoraires 
                                    ? `${scale.honoraires} ${scale.unite === 'mois_loyer' ? 'mois de loyer' : scale.unite}` 
                                    : 'À définir'
                                  }
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* À la charge du locataire */}
                    {stationnement.some(s => s.factureA === 'locataire') && (
                      <div className="mb-4">
                        <div className="text-xs font-semibold mb-2 italic text-accent">À la charge du locataire</div>
                        <div className="space-y-2">
                          {stationnement.filter(s => s.factureA === 'locataire').map((scale) => (
                            <div key={scale.id} className="text-xs py-1">
                              <div className="flex justify-between items-start gap-2">
                                <span className="flex-1 font-medium text-foreground break-words">{scale.nom}</span>
                                <span className="font-semibold text-accent text-right text-[10px] shrink-0 whitespace-nowrap">
                                  {scale.honoraires 
                                    ? `${scale.honoraires} ${scale.unite === 'mois_loyer' ? 'mois de loyer' : scale.unite}` 
                                    : 'À définir'
                                  }
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* À la charge des deux */}
                    {stationnement.some(s => s.factureA === 'les_deux') && (
                      <div className="mb-4">
                        <div className="text-xs font-semibold mb-2 italic text-muted-foreground">À la charge du propriétaire et du locataire</div>
                        <div className="space-y-2">
                          {stationnement.filter(s => s.factureA === 'les_deux').map((scale) => (
                            <div key={scale.id} className="text-xs py-1">
                              <div className="flex justify-between items-start gap-2">
                                <span className="flex-1 font-medium text-foreground break-words">{scale.nom}</span>
                                <span className="font-semibold text-accent text-right text-[10px] shrink-0 whitespace-nowrap">
                                  {scale.honoraires 
                                    ? `${scale.honoraires} ${scale.unite === 'mois_loyer' ? 'mois de loyer' : scale.unite}` 
                                    : 'À définir'
                                  }
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact */}
        <section className="text-center mt-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <Euro className="h-12 w-12 text-accent mx-auto mb-4" />
              <CardTitle className="text-2xl">Des questions sur nos tarifs ?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Notre équipe est à votre disposition pour vous accompagner dans votre projet immobilier.
              </p>
            </CardContent>
          </Card>
        </section>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>Tarifs TTC conformes à la loi ALUR - Décret n° 2014-890 du 1er Août 2014</p>
        </div>
      </div>
    </div>
  );
}

export default function BaremePage() {
  return <Bareme />;
}
