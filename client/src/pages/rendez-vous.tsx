import { useSearch } from "wouter";
import { Card } from "@/components/ui/card";
import { AppointmentForm } from "@/components/appointment-form";

export default function RendezVousPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const origine = params.get("origine") || "";

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-normal mb-4" data-testid="heading-appointment">
            Prendre rendez-vous
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discutons ensemble de votre projet immobilier lors d'un rendez-vous personnalisé
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Card className="p-6">
            <AppointmentForm 
              propertyId="general" 
              origine={origine}
            />
          </Card>
        </div>

        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Un problème avec le formulaire ? Contactez-nous directement par téléphone ou email.</p>
        </div>
      </div>
    </div>
  );
}
