import { AppointmentsCalendar } from "@/components/AppointmentsCalendar";

export default function PlanningGlobalPage() {
  return (
    <div className="min-h-screen py-8 px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-light mb-2">Planning Global</h1>
          <p className="text-muted-foreground">Vue calendrier de tous les rendez-vous</p>
        </div>

        <div className="space-y-6">
          <AppointmentsCalendar />
        </div>
      </div>
    </div>
  );
}
