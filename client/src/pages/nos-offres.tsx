import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Property } from "@shared/schema";
import { PropertyCard } from "@/components/property-card";
import { PropertyMap } from "@/components/PropertyMap";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal, Home, Map } from "lucide-react";
import { Link, useLocation } from "wouter";
import { SeasonalSearchBar } from "@/components/SeasonalSearchBar";
import { isPropertyAvailable } from "@/utils/availability";

const getDefaultFilters = (transactionType: "vente" | "location" | "location_saisonniere") => ({
  type: "tous",
  ville: "",
  prixMax: transactionType === "vente" ? 500000 : 1500 ,
  surfaceMin: 0,
  chambresMin: 0,
  checkIn: null as Date | null,
  checkOut: null as Date | null,
  numGuests: 2,
});

export default function NosOffresPage() {
  const [location, setLocation] = useLocation();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"carte" | "liste">("carte");
  
  const [transactionType, setTransactionType] = useState<"vente" | "location" | "location_saisonniere">(() => {
    const storedTransaction = localStorage.getItem('savedTransactionType');
    if (storedTransaction === "vente" || storedTransaction === "location" || storedTransaction === "location_saisonniere") {
      return storedTransaction;
    }
    
    const stored = sessionStorage.getItem('transactionType');
    sessionStorage.removeItem('transactionType');
    if (stored === "vente" || stored === "location" || stored === "location_saisonniere") {
      return stored;
    }
    if (location === "/acheter") return "vente";
    if (location === "/louer") return "location";
    return "vente";
  });
  
  const [filters, setFilters] = useState(() => {
    const savedFilters = localStorage.getItem('savedFilters');
    if (savedFilters) {
      try {
        return JSON.parse(savedFilters);
      } catch (e) {
        return getDefaultFilters(transactionType);
      }
    }
    return getDefaultFilters(transactionType);
  });

  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  useEffect(() => {
    if (location === "/acheter") {
      sessionStorage.setItem('transactionType', 'vente');
      setLocation("/nos-offres");
    }
    if (location === "/louer") {
      sessionStorage.setItem('transactionType', 'location');
      setLocation("/nos-offres");
    }
  }, [location, setLocation]);

  useEffect(() => {
    localStorage.setItem('savedTransactionType', transactionType);
  }, [transactionType]);

  useEffect(() => {
    localStorage.setItem('savedFilters', JSON.stringify(filters));
  }, [filters]);

  const handleTransactionTypeChange = (newType: "vente" | "location" | "location_saisonniere") => {
    setTransactionType(newType);
    setFilters(getDefaultFilters(newType));
  };

  const filteredProperties = useMemo(() => {
    if (!properties) return [];

    return properties.filter((property) => {
      if (property.statut !== "disponible") return false;
      if (property.transactionType !== transactionType) return false;
      if (filters.type !== "tous" && property.type !== filters.type) return false;
      if (filters.ville && !property.ville.toLowerCase().includes(filters.ville.toLowerCase())) return false;
      if (parseFloat(property.prix) > filters.prixMax) return false;
      if (property.surface < filters.surfaceMin) return false;
      if (property.chambres && property.chambres < filters.chambresMin) return false;
      
      if (transactionType === "location_saisonniere") {
        // Vérifier le nombre de voyageurs
        if (filters.numGuests && property.personnesMax && filters.numGuests > property.personnesMax) {
          return false;
        }
        
        // Vérifier la disponibilité selon les dates sélectionnées
        if (!isPropertyAvailable(property, filters.checkIn, filters.checkOut)) {
          return false;
        }
      }
      
      return true;
    });
  }, [properties, filters, transactionType]);

  const getPrixLabel = () => {
    if (transactionType === "vente") {
      return `Prix maximum: ${filters.prixMax.toLocaleString("fr-FR")} €`;
    }
    if (transactionType === "location_saisonniere") {
      return `Budget maximum: ${filters.prixMax.toLocaleString("fr-FR")} €/semaine`;
    }
    return `Loyer maximum: ${filters.prixMax.toLocaleString("fr-FR")} €/mois`;
  };

  const getPageTitle = () => {
    switch (transactionType) {
      case "vente":
        return "Acheter votre bien immobilier";
      case "location":
        return "Louer un bien immobilier";
      case "location_saisonniere":
        return "Location saisonnière";
      default:
        return "Nos offres";
    }
  };

  const getPageSubtitle = () => {
    switch (transactionType) {
      case "vente":
        return "Découvrez notre sélection de biens à la vente";
      case "location":
        return "Trouvez votre location idéale parmi notre sélection de biens";
      case "location_saisonniere":
        return "Séjours et vacances dans nos offres saisonnières";
      default:
        return "Découvrez toutes nos offres immobilières";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="relative py-12 px-4 bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto text-center">
          <h1 className="font-serif text-3xl md:text-4xl font-normal mb-4">
            {getPageTitle()}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            {getPageSubtitle()}
          </p>
          
          <div className="flex flex-wrap gap-3 justify-center items-center mb-6">
            <Button 
              variant={transactionType === "vente" ? "default" : "outline"}
              size="lg"
              onClick={() => handleTransactionTypeChange("vente")}
              data-testid="tab-vente"
            >
              Acheter
            </Button>
            <Button 
              variant={transactionType === "location" ? "default" : "outline"}
              size="lg"
              onClick={() => handleTransactionTypeChange("location")}
              data-testid="tab-location"
            >
              Louer
            </Button>
            <Button 
              variant={transactionType === "location_saisonniere" ? "default" : "outline"}
              size="lg"
              onClick={() => handleTransactionTypeChange("location_saisonniere")}
              data-testid="tab-saisonniere"
            >
              Séjourner
            </Button>
            <div className="w-px h-8 bg-border hidden md:block"></div>
            <Link href="/contact">
              <Button size="lg" variant="outline" data-testid="button-contact-advisor">
                Contacter un conseiller
              </Button>
            </Link>
            {transactionType === "vente" && (
              <Link href="/vendre">
                <Button size="lg" variant="outline" data-testid="button-sell-property">
                  Vendre mon bien
                </Button>
              </Link>
            )}
            {(transactionType === "location" || transactionType === "location_saisonniere") && (
              <Link href="/gestion-location">
                <Button size="lg" variant="outline" data-testid="button-property-management">
                  Gestion locative
                </Button>
              </Link>
            )}
          </div>

          {transactionType === "location_saisonniere" && (
            <div className="mt-8 max-w-4xl mx-auto">
              <SeasonalSearchBar
                onSearch={(searchParams) => {
                  setFilters({
                    ...filters,
                    checkIn: searchParams.dateArrivee || null,
                    checkOut: searchParams.dateDepart || null,
                    numGuests: searchParams.nombreVoyageurs,
                  });
                }}
              />
            </div>
          )}
        </div>
      </section>

      <section className="container mx-auto py-12 px-4">
        <div className="lg:hidden mb-6">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setFiltersOpen(!filtersOpen)}
            data-testid="button-toggle-filters"
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            {filtersOpen ? "Masquer les filtres" : "Afficher les filtres"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar avec filtres */}
          <aside className={`lg:block ${filtersOpen ? "block" : "hidden"}`}>
            <Card className="p-6 sticky top-24">
              <h3 className="font-serif text-xl mb-6">Filtres de recherche</h3>

              <div className="space-y-6">
                {/* Type de bien */}
                <div>
                  <Label className="mb-3 block">Type de bien</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={filters.type === "tous" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilters({ ...filters, type: "tous" })}
                      data-testid="button-type-tous"
                      className="flex-1 min-w-[calc(50%-0.25rem)]"
                    >
                      Tous
                    </Button>
                    <Button
                      variant={filters.type === "appartement" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilters({ ...filters, type: "appartement" })}
                      data-testid="button-type-appartement"
                      className="flex-1 min-w-[calc(50%-0.25rem)]"
                    >
                      Appartement
                    </Button>
                    <Button
                      variant={filters.type === "maison" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilters({ ...filters, type: "maison" })}
                      data-testid="button-type-maison"
                      className="flex-1 min-w-[calc(50%-0.25rem)]"
                    >
                      Maison
                    </Button>
                    <Button
                      variant={filters.type === "terrain" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilters({ ...filters, type: "terrain" })}
                      data-testid="button-type-terrain"
                      className="flex-1 min-w-[calc(50%-0.25rem)]"
                    >
                      Terrain
                    </Button>
                    <Button
                      variant={filters.type === "commercial" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilters({ ...filters, type: "commercial" })}
                      data-testid="button-type-commercial"
                      className="flex-1 min-w-[calc(50%-0.25rem)]"
                    >
                      Commercial
                    </Button>
                    {transactionType === "location_saisonniere" && (
                      <Button
                        variant={filters.type === "mobilhome" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilters({ ...filters, type: "mobilhome" })}
                        data-testid="button-type-mobilhome"
                        className="flex-1 min-w-[calc(50%-0.25rem)]"
                      >
                        Mobil-home
                      </Button>
                    )}
                  </div>
                </div>

                {/* Ville */}
                <div>
                  <Label htmlFor="ville">Ville</Label>
                  <Input
                    id="ville"
                    placeholder="Rechercher une ville..."
                    value={filters.ville}
                    onChange={(e) =>
                      setFilters({ ...filters, ville: e.target.value })
                    }
                    data-testid="input-ville"
                  />
                </div>

                {/* Chambres minimum */}
                <div>
                  <Label>
                    Chambres minimum: {filters.chambresMin}
                  </Label>
                  <Slider
                    value={[filters.chambresMin]}
                    onValueChange={(value) =>
                      setFilters({ ...filters, chambresMin: value[0] })
                    }
                    max={10}
                    step={1}
                    className="mt-2"
                    data-testid="slider-chambres"
                  />
                </div>

                {/* Nombre de voyageurs (location saisonnière) */}
                {transactionType === "location_saisonniere" && (
                  <div>
                    <Label>
                      Nombre de voyageurs: {filters.numGuests}
                    </Label>
                    <Slider
                      value={[filters.numGuests]}
                      onValueChange={(value) =>
                        setFilters({ ...filters, numGuests: value[0] })
                      }
                      min={1}
                      max={12}
                      step={1}
                      className="mt-2"
                      data-testid="slider-voyageurs"
                    />
                  </div>
                )}

                {/* Prix et surface (pas pour location saisonnière) */}
                {transactionType !== "location_saisonniere" && (
                  <>
                    <div>
                      <Label>
                        {getPrixLabel()}
                      </Label>
                      <Slider
                        value={[filters.prixMax]}
                        onValueChange={(value) =>
                          setFilters({ ...filters, prixMax: value[0] })
                        }
                        max={transactionType === "vente" ? 10000000 : 10000}
                        step={transactionType === "vente" ? 100000 : 100}
                        className="mt-2"
                        data-testid="slider-prix"
                      />
                    </div>

                    <div>
                      <Label>
                        Surface minimum: {filters.surfaceMin} m²
                      </Label>
                      <Slider
                        value={[filters.surfaceMin]}
                        onValueChange={(value) =>
                          setFilters({ ...filters, surfaceMin: value[0] })
                        }
                        max={500}
                        step={10}
                        className="mt-2"
                        data-testid="slider-surface"
                      />
                    </div>
                  </>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setFilters(getDefaultFilters(transactionType))}
                  data-testid="button-reset-filters"
                >
                  Réinitialiser les filtres
                </Button>
              </div>
            </Card>
          </aside>

          {/* Contenu principal */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <h2 className="font-serif text-2xl">
                {filteredProperties.length} bien{filteredProperties.length > 1 ? 's' : ''} disponible{filteredProperties.length > 1 ? 's' : ''}
              </h2>
              <Badge variant="secondary">
                {transactionType === "vente" ? "Vente" : transactionType === "location" ? "Location" : "Location saisonnière"}
              </Badge>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="h-[400px] animate-pulse bg-muted" />
                <div className="grid grid-cols-1 gap-6">
                  {[1, 2].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <div className="h-40 bg-muted" />
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ) : filteredProperties.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">
                  Aucune propriété ne correspond à vos critères de recherche.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setFilters(getDefaultFilters(transactionType))}
                  data-testid="button-reset-filters-empty"
                >
                  Réinitialiser les filtres
                </Button>
              </Card>
            ) : transactionType === "location_saisonniere" ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <div className="h-[400px] sticky top-24">
                    <PropertyMap properties={filteredProperties} />
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredProperties.map((property) => (
                      <div key={property.id}>
                        <PropertyCard 
                          property={property}
                          searchDates={{
                            checkIn: filters.checkIn,
                            checkOut: filters.checkOut
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProperties.map((property) => (
                  <div key={property.id}>
                    <PropertyCard 
                      property={property}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
