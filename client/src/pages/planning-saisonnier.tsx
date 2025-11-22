import { useQuery } from "@tanstack/react-query";
import { Property } from "@shared/schema";
import { SeasonalAvailabilityManager } from "@/components/SeasonalAvailabilityManager";
import SeasonalBookingsManager from "@/components/SeasonalBookingsManager";
import { SeasonalBookingsCalendar } from "@/components/SeasonalBookingsCalendar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PlanningSaisonnierPage() {
  const { data: properties } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const seasonalProperties = properties?.filter(p => p.transactionType === "location_saisonniere");

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-light mb-2">Planning Saisonnier</h1>
          <p className="text-muted-foreground">Gestion complète des locations saisonnières</p>
        </div>

        <Tabs defaultValue="calendrier" className="w-full">
          <TabsList>
            <TabsTrigger value="calendrier">Calendrier des réservations</TabsTrigger>
            <TabsTrigger value="reservations">Gestion des réservations</TabsTrigger>
            <TabsTrigger value="disponibilites">Disponibilités</TabsTrigger>
          </TabsList>

          <TabsContent value="calendrier" className="mt-6">
            <SeasonalBookingsCalendar />
          </TabsContent>

          <TabsContent value="reservations" className="mt-6">
            <SeasonalBookingsManager />
          </TabsContent>

          <TabsContent value="disponibilites" className="mt-6">
            <Card className="p-6">
              <h3 className="text-xl font-serif mb-4">Disponibilités locations saisonnières</h3>
              <p className="text-muted-foreground mb-6">
                Gérez les périodes bloquées ou disponibles pour vos locations saisonnières. Les périodes bloquées ne seront pas réservables par les clients.
              </p>

              <div className="space-y-6">
                {seasonalProperties?.map(property => (
                  <SeasonalAvailabilityManager 
                    key={property.id} 
                    propertyId={property.id} 
                    propertyTitle={property.titre}
                  />
                ))}

                {(!seasonalProperties || seasonalProperties.length === 0) && (
                  <p className="text-muted-foreground text-center py-8">
                    Aucune propriété en location saisonnière. Créez une propriété avec le type "Location saisonnière" pour gérer ses disponibilités.
                  </p>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
