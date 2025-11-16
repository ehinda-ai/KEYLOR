import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import { Property } from "@shared/schema";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { resolveImageUrl } from "@/lib/imageUrl";
import "leaflet/dist/leaflet.css";

interface PropertyMapProps {
  properties: Property[];
}

export function PropertyMap({ properties }: PropertyMapProps) {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Créer un icône personnalisé avec le prix
  const createPriceIcon = (price: string) => {
    const formattedPrice = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(parseFloat(price)));

    return L.divIcon({
      className: "custom-price-marker",
      html: `
        <div style="
          background: white;
          color: #202c45;
          padding: 6px 12px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          border: 1px solid #e7e5e2;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s;
        "
        onmouseover="this.style.transform='scale(1.1)'; this.style.zIndex='1000';"
        onmouseout="this.style.transform='scale(1)'; this.style.zIndex='auto';"
        >
          ${formattedPrice}
        </div>
      `,
      iconSize: [60, 30],
      iconAnchor: [30, 15],
    });
  };

  // Calculer le centre et le zoom de la carte en fonction des propriétés
  const getMapBounds = (): { center: LatLngExpression; zoom: number } => {
    if (properties.length === 0) {
      // Centrer sur la France par défaut
      return { center: [46.603354, 1.888334], zoom: 6 };
    }

    const validProperties = properties.filter(p => p.latitude && p.longitude);
    
    if (validProperties.length === 0) {
      return { center: [46.603354, 1.888334], zoom: 6 };
    }

    if (validProperties.length === 1) {
      return {
        center: [parseFloat(validProperties[0].latitude!), parseFloat(validProperties[0].longitude!)],
        zoom: 13,
      };
    }

    // Calculer le centre moyen
    const avgLat = validProperties.reduce((sum, p) => sum + parseFloat(p.latitude!), 0) / validProperties.length;
    const avgLng = validProperties.reduce((sum, p) => sum + parseFloat(p.longitude!), 0) / validProperties.length;

    return { center: [avgLat, avgLng], zoom: 10 };
  };

  const { center, zoom } = getMapBounds();

  const formatPrice = (price: string, transactionType: string) => {
    const formattedPrice = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(parseFloat(price)));

    if (transactionType === "location_saisonniere") {
      return `${formattedPrice}/semaine`;
    }
    return formattedPrice;
  };

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-border relative z-0">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {properties
          .filter(property => property.latitude && property.longitude)
          .map((property) => (
            <Marker
              key={property.id}
              position={[parseFloat(property.latitude!), parseFloat(property.longitude!)]}
              icon={createPriceIcon(property.prix)}
              eventHandlers={{
                click: () => {
                  setSelectedProperty(property);
                },
              }}
            >
              <Popup>
                <Card className="border-0 shadow-none p-0 min-w-[250px]">
                  {property.photos && property.photos.length > 0 && (
                    <img
                      src={resolveImageUrl(property.photos[0]) || '/placeholder.jpg'}
                      alt={property.titre}
                      className="w-full h-32 object-cover rounded-t-md"
                    />
                  )}
                  <div className="p-3">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                      {property.titre}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      {property.ville}
                    </p>
                    <p className="text-base font-semibold text-accent mb-3">
                      {formatPrice(property.prix, property.transactionType)}
                    </p>
                    <Button 
                      size="sm" 
                      className="w-full" 
                      data-testid={`button-view-property-${property.id}`}
                      onClick={() => window.location.href = `/proprietes/${property.id}`}
                    >
                      Voir le bien
                    </Button>
                  </div>
                </Card>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
