import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, FileText, Mail } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { RentalApplication } from "@shared/schema";

export function RentalApplicationsAdmin() {
  const [selectedApp, setSelectedApp] = useState<RentalApplication | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: applications = [], isLoading } = useQuery<RentalApplication[]>({
    queryKey: ["/api/rental-applications"],
    queryFn: async () => {
      const res = await fetch("/api/rental-applications");
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
  });

  const handleViewDetails = (app: RentalApplication) => {
    setSelectedApp(app);
    setDetailsOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Chargement des dossiers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Dossiers de candidature location</h2>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {applications.length} dossier{applications.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Aucun dossier de candidature pour le moment.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <Card key={app.id} className="hover-elevate">
              <CardContent className="pt-6">
                <div className="grid grid-cols-6 gap-4 items-center">
                  {/* Identité */}
                  <div>
                    <p className="text-sm font-semibold">{app.prenom} {app.nom}</p>
                    <p className="text-xs text-muted-foreground">{app.email}</p>
                  </div>

                  {/* Propriété */}
                  <div>
                    <p className="text-sm font-medium text-foreground">{app.propertyTitle?.slice(0, 25)}</p>
                    <p className="text-xs text-muted-foreground">Loyer: {parseFloat(app.monthlyRent?.toString() || "0").toLocaleString("fr-FR")}€</p>
                  </div>

                  {/* Situation */}
                  <div>
                    <p className="text-sm text-foreground">{app.typeContrat || "Non renseigné"}</p>
                    <p className="text-xs text-muted-foreground">{app.entreprise || "-"}</p>
                  </div>

                  {/* Revenus */}
                  <div>
                    <p className="text-sm font-semibold text-accent">
                      {(parseFloat(app.salaireMensuel?.toString() || "0") + 
                        parseFloat(app.allocations?.toString() || "0") + 
                        parseFloat(app.autresRevenus?.toString() || "0")).toLocaleString("fr-FR")}€
                    </p>
                    <p className="text-xs text-muted-foreground">revenus totaux</p>
                  </div>

                  {/* Composition */}
                  <div>
                    <Badge variant="secondary" className="text-xs">
                      {app.compositionMenage === "1_locataire" ? "1 locataire" : 
                       app.compositionMenage === "2_locataires" ? "2 locataires" : 
                       "Famille"}
                    </Badge>
                    {app.garants && app.garants.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {app.garants.length} garant{app.garants.length > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(app)}
                      className="gap-1"
                      data-testid={`button-view-application-${app.id}`}
                    >
                      <Eye className="w-3 h-3" />
                      Détails
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      data-testid={`button-email-application-${app.id}`}
                    >
                      <a href={`mailto:${app.email}`} className="gap-1 flex">
                        <Mail className="w-3 h-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du dossier</DialogTitle>
            <DialogDescription>
              {selectedApp?.prenom} {selectedApp?.nom} - {selectedApp?.email}
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-6">
              {/* Identité */}
              <div>
                <h3 className="font-semibold mb-3">Identité</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Civilité</p>
                    <p className="font-medium">{selectedApp.civilite}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Nom & Prénom</p>
                    <p className="font-medium">{selectedApp.prenom} {selectedApp.nom}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Téléphone</p>
                    <p className="font-medium">{selectedApp.telephone}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedApp.email}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Adresse actuelle</p>
                    <p className="font-medium">{selectedApp.adresseActuelle}</p>
                  </div>
                </div>
              </div>

              {/* Propriété */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Propriété</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Bien</p>
                    <p className="font-medium">{selectedApp.propertyTitle}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Loyer mensuel</p>
                    <p className="font-semibold text-accent">
                      {parseFloat(selectedApp.monthlyRent?.toString() || "0").toLocaleString("fr-FR")}€
                    </p>
                  </div>
                </div>
              </div>

              {/* Situation professionnelle */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Situation professionnelle</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Type de contrat</p>
                    <p className="font-medium">{selectedApp.typeContrat || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Entreprise</p>
                    <p className="font-medium">{selectedApp.entreprise || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Salaire mensuel</p>
                    <p className="font-medium">
                      {parseFloat(selectedApp.salaireMensuel?.toString() || "0").toLocaleString("fr-FR")}€
                    </p>
                  </div>
                </div>
              </div>

              {/* Revenus */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Revenus totaux</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Allocations</p>
                    <p className="font-medium">
                      {parseFloat(selectedApp.allocations?.toString() || "0").toLocaleString("fr-FR")}€
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Autres revenus</p>
                    <p className="font-medium">
                      {parseFloat(selectedApp.autresRevenus?.toString() || "0").toLocaleString("fr-FR")}€
                    </p>
                  </div>
                  <div className="bg-muted p-2 rounded">
                    <p className="text-muted-foreground text-xs">Total</p>
                    <p className="font-semibold text-accent text-lg">
                      {(parseFloat(selectedApp.salaireMensuel?.toString() || "0") + 
                        parseFloat(selectedApp.allocations?.toString() || "0") + 
                        parseFloat(selectedApp.autresRevenus?.toString() || "0")).toLocaleString("fr-FR")}€
                    </p>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded text-sm">
                  <p className="text-muted-foreground">Taux d'effort</p>
                  <p className="font-bold text-lg">
                    {((parseFloat(selectedApp.salaireMensuel?.toString() || "0") + 
                      parseFloat(selectedApp.allocations?.toString() || "0") + 
                      parseFloat(selectedApp.autresRevenus?.toString() || "0")) / parseFloat(selectedApp.monthlyRent?.toString() || "1")).toFixed(2)}x le loyer
                  </p>
                </div>
              </div>

              {/* Ménage et garanties */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Composition du ménage & Garanties</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Composition</p>
                    <Badge className="mt-1">
                      {selectedApp.compositionMenage === "1_locataire" ? "1 locataire" : 
                       selectedApp.compositionMenage === "2_locataires" ? "2 locataires" : 
                       "Famille"}
                    </Badge>
                  </div>

                  {selectedApp.garants && selectedApp.garants.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Garants</p>
                      <div className="space-y-1">
                        {selectedApp.garants.map((garant, idx) => (
                          <p key={idx} className="text-sm bg-muted p-2 rounded">
                            • {garant}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedApp.numeroVisale && (
                    <div>
                      <p className="text-sm text-muted-foreground">Numéro Visale</p>
                      <p className="font-medium">{selectedApp.numeroVisale}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
