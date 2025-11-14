import { 
  Wifi, 
  Tv, 
  Waves, 
  Car, 
  Snowflake, 
  Flame, 
  Trees, 
  Sun, 
  Home,
  ChefHat,
  Utensils,
  Bed,
  Users,
  PawPrint,
  Cigarette,
  ShieldCheck,
  Sparkles,
  Wind,
  Coffee,
  Armchair
} from "lucide-react";
import { Property } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

interface AmenitiesIconsProps {
  property: Property;
  variant?: "compact" | "detailed";
  maxDisplay?: number;
}

export function AmenitiesIcons({ property, variant = "compact", maxDisplay }: AmenitiesIconsProps) {
  const amenities = [
    { key: "wifi", icon: Wifi, label: "Wi-Fi" },
    { key: "tv", icon: Tv, label: "Télévision" },
    { key: "piscine", icon: Waves, label: "Piscine" },
    { key: "parking", icon: Car, label: "Parking" },
    { key: "climatisation", icon: Snowflake, label: "Climatisation" },
    { key: "chauffage", icon: Flame, label: "Chauffage" },
    { key: "jardin", icon: Trees, label: "Jardin" },
    { key: "terrasse", icon: Sun, label: "Terrasse" },
    { key: "balcon", icon: Home, label: "Balcon" },
    { key: "laveVaisselle", icon: Utensils, label: "Lave-vaisselle" },
    { key: "laveLinge", icon: Sparkles, label: "Lave-linge" },
    { key: "secheLinge", icon: Wind, label: "Sèche-linge" },
    { key: "cheminee", icon: Flame, label: "Cheminée" },
    { key: "barbecue", icon: ChefHat, label: "Barbecue" },
    { key: "jacuzzi", icon: Waves, label: "Jacuzzi" },
    { key: "fer", icon: Coffee, label: "Fer à repasser" },
    { key: "coffre", icon: ShieldCheck, label: "Coffre-fort" },
    { key: "alarme", icon: ShieldCheck, label: "Alarme" },
  ];

  const availableAmenities = amenities.filter(
    (amenity) => property[amenity.key as keyof Property] === true
  );

  const displayAmenities = maxDisplay 
    ? availableAmenities.slice(0, maxDisplay)
    : availableAmenities;

  const remaining = maxDisplay && availableAmenities.length > maxDisplay
    ? availableAmenities.length - maxDisplay
    : 0;

  if (variant === "compact") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {displayAmenities.map((amenity) => {
          const Icon = amenity.icon;
          return (
            <div 
              key={amenity.key} 
              className="flex items-center gap-1 text-muted-foreground"
              title={amenity.label}
              data-testid={`amenity-${amenity.key}`}
            >
              <Icon className="h-4 w-4" />
            </div>
          );
        })}
        {remaining > 0 && (
          <Badge variant="secondary" className="text-xs">
            +{remaining}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {availableAmenities.map((amenity) => {
        const Icon = amenity.icon;
        return (
          <div 
            key={amenity.key} 
            className="flex items-center gap-2 text-sm"
            data-testid={`amenity-${amenity.key}`}
          >
            <Icon className="h-5 w-5 text-accent" />
            <span>{amenity.label}</span>
          </div>
        );
      })}
    </div>
  );
}

interface CapacityInfoProps {
  property: Property;
}

export function CapacityInfo({ property }: CapacityInfoProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
      {property.personnesMax && (
        <div className="flex items-center gap-2" data-testid="capacity-guests">
          <Users className="h-5 w-5" />
          <span>{property.personnesMax} voyageurs</span>
        </div>
      )}
      {property.chambres !== null && property.chambres !== undefined && (
        <div className="flex items-center gap-2" data-testid="capacity-bedrooms">
          <Bed className="h-5 w-5" />
          <span>{property.chambres} {property.chambres > 1 ? "chambres" : "chambre"}</span>
        </div>
      )}
      {property.surface && (
        <div className="flex items-center gap-2" data-testid="capacity-surface">
          <Home className="h-5 w-5" />
          <span>{property.surface} m²</span>
        </div>
      )}
    </div>
  );
}

interface PolicyBadgesProps {
  property: Property;
}

export function PolicyBadges({ property }: PolicyBadgesProps) {
  const policies = [];

  if (property.animauxAcceptes) {
    policies.push({ icon: PawPrint, label: "Animaux acceptés", variant: "default" as const });
  }

  if (property.fumeurAccepte) {
    policies.push({ icon: Cigarette, label: "Fumeurs acceptés", variant: "secondary" as const });
  }

  if (policies.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {policies.map((policy, index) => {
        const Icon = policy.icon;
        return (
          <Badge key={index} variant={policy.variant} className="flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5" />
            <span>{policy.label}</span>
          </Badge>
        );
      })}
    </div>
  );
}

interface IncludedServicesProps {
  property: Property;
}

export function IncludedServices({ property }: IncludedServicesProps) {
  const services = [];

  if (property.menageInclus) {
    services.push({ icon: Sparkles, label: "Ménage inclus" });
  }

  if (property.lingeInclus) {
    services.push({ icon: Armchair, label: "Linge de maison inclus" });
  }

  if (property.conciergerieIncluse) {
    services.push({ icon: ShieldCheck, label: "Conciergerie incluse" });
  }

  if (services.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="font-medium text-sm">Services inclus</h3>
      <div className="flex flex-wrap gap-2">
        {services.map((service, index) => {
          const Icon = service.icon;
          return (
            <Badge key={index} variant="outline" className="flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5 text-accent" />
              <span>{service.label}</span>
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
