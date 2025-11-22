import { VisitAvailabilityManager } from "@/components/VisitAvailabilityManager";

export default function PlanningVisitesPage() {
  return (
    <div className="min-h-screen py-8 px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-light mb-2">Planning des Visites</h1>
          <p className="text-muted-foreground">Gérez les créneaux de visite disponibles pour vos propriétés</p>
        </div>

        <div className="space-y-6">
          <VisitAvailabilityManager />
        </div>
      </div>
    </div>
  );
}
