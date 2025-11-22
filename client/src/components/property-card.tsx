import { Link } from "wouter";
import { MapPin, Maximize, Bed, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Property } from "@shared/schema";
import { AmenitiesIcons, CapacityInfo } from "./AmenitiesIcons";
import { ShareButton } from "./share-button";
import { resolveImageUrl, getDefaultPropertyImage } from "@/lib/imageUrl";

interface PropertyCardProps {
  property: Property;
  searchDates?: {
    checkIn: Date | null;
    checkOut: Date | null;
  };
}

export function PropertyCard({ property, searchDates }: PropertyCardProps) {
  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(parseFloat(price));
  };

  const mainPhoto = resolveImageUrl(property.photos[0]) || getDefaultPropertyImage(property.transactionType);

  const buildPropertyUrl = () => {
    let url = `/proprietes/${property.id}`;
    const params = new URLSearchParams();
    
    if (searchDates?.checkIn && searchDates.checkIn instanceof Date) {
      params.append('checkIn', searchDates.checkIn.toISOString());
    }
    if (searchDates?.checkOut && searchDates.checkOut instanceof Date) {
      params.append('checkOut', searchDates.checkOut.toISOString());
    }
    
    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
  };

  return (
    <Link href={buildPropertyUrl()}>
      <Card className="overflow-hidden hover-elevate transition-all duration-300 cursor-pointer group" data-testid={`card-property-${property.id}`}>
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={mainPhoto}
            alt={property.titre}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.src = getDefaultPropertyImage(property.transactionType);
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          <div className="absolute top-4 left-4 flex gap-2 flex-wrap max-w-[60%]">
            <Badge className="bg-background/90 text-foreground border-0 backdrop-blur-sm">
              {property.type.charAt(0).toUpperCase() + property.type.slice(1)}
            </Badge>
            {property.featured && (
              <Badge className="bg-accent/90 text-accent-foreground border-0 backdrop-blur-sm">
                En vedette
              </Badge>
            )}
            {property.badge === "exclusivite" && (
              <Badge className="bg-accent text-white border-0 backdrop-blur-sm">
                Exclusivité
              </Badge>
            )}
            {property.badge === "nouveaute" && (
              <Badge className="bg-primary text-white border-0 backdrop-blur-sm">
                Nouveauté
              </Badge>
            )}
            {property.badge === "coup_de_coeur" && (
              <Badge className="bg-rose-500 text-white border-0 backdrop-blur-sm">
                Coup de cœur
              </Badge>
            )}
          </div>

          <div className="absolute top-4 right-4 flex gap-2">
            <ShareButton
              propertyId={property.id}
              propertyTitle={property.titre}
              variant="ghost"
              size="icon"
            />
            <Button
              variant="ghost"
              size="icon"
              className="bg-background/90 backdrop-blur-sm hover:bg-background"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              data-testid={`button-favorite-${property.id}`}
            >
              <Heart className="h-4 w-4" />
            </Button>
          </div>

          <div className="absolute bottom-4 left-4 right-4">
            {property.transactionType === "location_saisonniere" && property.prixBasseSaison ? (
              <div className="text-white mb-1">
                <p className="text-2xl font-serif font-light">
                  {formatPrice(property.prixBasseSaison)} - {formatPrice(property.prixHauteSaison || property.prix)}
                </p>
                <p className="text-sm text-white/80">par semaine selon saison</p>
              </div>
            ) : (
              <p className="text-3xl font-serif font-light text-white mb-1">
                {formatPrice(property.prix)}
                {property.transactionType === "location" && <span className="text-lg">/mois</span>}
              </p>
            )}
            <div className="flex items-center gap-1 text-white/90 text-sm">
              <MapPin className="h-4 w-4" />
              <span>{property.localisation}</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-xl font-serif font-normal mb-3 line-clamp-1">
            {property.titre}
          </h3>
          
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {property.description}
          </p>

          {property.transactionType === "location_saisonniere" ? (
            <div className="space-y-3">
              <CapacityInfo property={property} />
              <AmenitiesIcons property={property} variant="compact" maxDisplay={6} />
            </div>
          ) : (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Maximize className="h-4 w-4" />
                <span>{property.surface} m²</span>
              </div>
              {property.chambres && (
                <div className="flex items-center gap-1">
                  <Bed className="h-4 w-4" />
                  <span>{property.chambres} ch.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
