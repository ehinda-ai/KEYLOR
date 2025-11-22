import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { RentalApplication, Property } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Mail, CheckCircle, AlertCircle, Trash2 } from "lucide-react";

export function StudyApplications() {
  const { toast } = useToast();
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("tous");

  const { data: applications = [], isLoading } = useQuery<RentalApplication[]>({
    queryKey: ["/api/rental-applications"],
  });

  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const filteredApps = filterStatus === "tous" 
    ? applications 
    : applications.filter(app => app.statut === filterStatus);

  const selectedApp = applications.find(app => app.id === selectedAppId);

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/rental-applications/${selectedAppId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rental-applications"] });
      toast({ title: "Succès", description: "Candidature mise à jour" });
      setShowScoreDialog(false);
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const scoreMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/rental-applications/${selectedAppId}/score`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rental-applications"] });
      toast({ title: "Succès", description: "Score enregistré" });
      setShowScoreDialog(false);
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const emailMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/rental-applications/${selectedAppId}/email`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rental-applications"] });
      toast({ title: "Succès", description: "Email envoyé" });
      setShowEmailDialog(false);
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/rental-applications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rental-applications"] });
      toast({ title: "Succès", description: "Candidature supprimée" });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepte": return "bg-green-100 text-green-800";
      case "refuse": return "bg-red-100 text-red-800";
      case "en_etude": return "bg-blue-100 text-blue-800";
      case "demande_pieces": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getSolvencyColor = (taux: number | null | undefined) => {
    if (!taux) return "text-gray-500";
    if (taux < 1.5) return "text-green-600 font-bold";
    if (taux < 1.8) return "text-blue-600";
    if (taux < 2.0) return "text-orange-600";
    return "text-red-600 font-bold";
  };

  if (isLoading) return <div className="text-center py-8">Chargement...</div>;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="liste" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="liste">Candidatures ({filteredApps.length})</TabsTrigger>
          <TabsTrigger value="scoring">Scoring</TabsTrigger>
          <TabsTrigger value="solvabilite">Solvabilité</TabsTrigger>
          <TabsTrigger value="emails">Emails</TabsTrigger>
        </TabsList>

        {/* LISTE DES CANDIDATURES */}
        <TabsContent value="liste" className="space-y-4">
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous</SelectItem>
                <SelectItem value="nouveau">Nouveau</SelectItem>
                <SelectItem value="en_etude">En étude</SelectItem>
                <SelectItem value="demande_pieces">Pièces demandées</SelectItem>
                <SelectItem value="accepte">Accepté</SelectItem>
                <SelectItem value="refuse">Refusé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {filteredApps.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucune candidature</p>
            ) : (
              filteredApps.map((app) => (
                <Card key={app.id} className="p-4 hover-elevate cursor-pointer" onClick={() => setSelectedAppId(app.id)} data-testid={`card-application-${app.id}`}>
                  <div className="grid grid-cols-6 gap-4 items-center">
                    <div>
                      <p className="font-semibold">{app.prenom} {app.nom}</p>
                      <p className="text-sm text-muted-foreground">{app.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{app.propertyTitle}</p>
                      <p className="text-xs text-muted-foreground">Loyer: {app.monthlyRent}€</p>
                    </div>
                    <div>
                      <Badge className={getStatusColor(app.statut || "nouveau")} data-testid={`badge-status-${app.id}`}>
                        {app.statut === "nouveau" ? "Nouveau" : app.statut?.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="text-center">
                      <p className={`font-bold text-lg ${getSolvencyColor(app.tauxEffort ? parseFloat(app.tauxEffort.toString()) : null)}`} data-testid={`text-taux-${app.id}`}>
                        {app.tauxEffort ? `${parseFloat(app.tauxEffort.toString()).toFixed(2)}x` : "-"}
                      </p>
                      <p className="text-xs text-muted-foreground">Taux d'effort</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-lg" data-testid={`text-score-${app.id}`}>{app.score || "-"}/100</p>
                      <p className="text-xs text-muted-foreground">Score</p>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button size="icon" variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedAppId(app.id); setShowScoreDialog(true); }} data-testid={`button-score-${app.id}`}>
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedAppId(app.id); setShowEmailDialog(true); }} data-testid={`button-email-${app.id}`}>
                        <Mail className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="destructive" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(app.id); }} data-testid={`button-delete-${app.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* SCORING */}
        <TabsContent value="scoring" className="space-y-4">
          {selectedApp ? (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">{selectedApp.prenom} {selectedApp.nom}</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold">Score (0-100)</label>
                  <Input type="number" min="0" max="100" defaultValue={selectedApp.score || ""} id="score-input" placeholder="0" data-testid="input-score-value" />
                </div>
                <div>
                  <label className="text-sm font-semibold">Détails</label>
                  <Textarea defaultValue={selectedApp.scoreDetail || ""} id="score-detail" placeholder="Critères..." data-testid="textarea-score-detail" />
                </div>
                <Button onClick={() => scoreMutation.mutate({ score: (document.getElementById('score-input') as HTMLInputElement)?.value, scoreDetail: (document.getElementById('score-detail') as HTMLTextAreaElement)?.value })} disabled={scoreMutation.isPending} data-testid="button-save-score">
                  Enregistrer le score
                </Button>
              </div>
            </Card>
          ) : (
            <p className="text-center text-muted-foreground py-8">Sélectionnez une candidature</p>
          )}
        </TabsContent>

        {/* SOLVABILITÉ */}
        <TabsContent value="solvabilite" className="space-y-4">
          {selectedApp ? (
            <Card className="p-6">
              <h3 className="font-semibold mb-6">{selectedApp.prenom} {selectedApp.nom}</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Loyer mensuel</p>
                  <p className="text-2xl font-bold">{selectedApp.monthlyRent}€</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Revenu total mensuel</p>
                  <p className="text-2xl font-bold">{selectedApp.totalRevenusMenuels}€</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Taux d'effort</p>
                  <p className={`text-3xl font-bold ${getSolvencyColor(selectedApp.tauxEffort ? parseFloat(selectedApp.tauxEffort.toString()) : null)}`}>
                    {selectedApp.tauxEffort ? `${parseFloat(selectedApp.tauxEffort.toString()).toFixed(2)}x le loyer` : "N/A"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <Badge className={getStatusColor(selectedApp.statutSolvabilite || "")}>
                    {selectedApp.statutSolvabilite || "Non évalué"}
                  </Badge>
                </div>
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
                <p className="text-sm"><strong>Recommandation:</strong> Taux d'effort idéal &lt; 1.5x, acceptable &lt; 1.8x, moyen &lt; 2.0x, risque ≥ 2.0x</p>
              </div>
            </Card>
          ) : (
            <p className="text-center text-muted-foreground py-8">Sélectionnez une candidature</p>
          )}
        </TabsContent>

        {/* EMAILS */}
        <TabsContent value="emails" className="space-y-4">
          {selectedApp ? (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">{selectedApp.prenom} {selectedApp.nom}</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold">Objet</label>
                  <Input defaultValue={`Demande de pièces complémentaires - ${selectedApp.propertyTitle}`} id="email-subject" data-testid="input-email-subject" />
                </div>
                <div>
                  <label className="text-sm font-semibold">Message (HTML)</label>
                  <Textarea rows={6} defaultValue={`<p>Bonjour ${selectedApp.prenom},</p><p>Nous vous demandons de nous envoyer les pièces suivantes:</p><ul><li>Bulletin de salaire</li><li>Avis d'imposition</li></ul>`} id="email-content" data-testid="textarea-email-content" />
                </div>
                <Button onClick={() => emailMutation.mutate({ recipientEmail: selectedApp.email, subject: (document.getElementById('email-subject') as HTMLInputElement)?.value, htmlContent: (document.getElementById('email-content') as HTMLTextAreaElement)?.value })} disabled={emailMutation.isPending} data-testid="button-send-email">
                  <Mail className="w-4 h-4 mr-2" />
                  Envoyer
                </Button>
              </div>
            </Card>
          ) : (
            <p className="text-center text-muted-foreground py-8">Sélectionnez une candidature</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
