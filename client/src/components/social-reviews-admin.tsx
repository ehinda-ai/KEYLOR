import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { SocialMediaLink, ClientReview, InsertSocialMediaLink, InsertClientReview } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, Facebook, Instagram, Linkedin, Twitter, Youtube } from "lucide-react";
import { SiTiktok } from "react-icons/si";

export function SocialReviewsAdmin() {
  return (
    <div className="space-y-8">
      <SocialMediaLinksAdmin />
    </div>
  );
}

// Social Media Links Admin Component
function SocialMediaLinksAdmin() {
  const { toast } = useToast();
  const [editingLink, setEditingLink] = useState<SocialMediaLink | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedPlateforme, setSelectedPlateforme] = useState<string>("facebook");

  const { data: links = [] } = useQuery<SocialMediaLink[]>({
    queryKey: ["/api/social-links"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertSocialMediaLink) =>
      apiRequest("POST", "/api/social-links", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-links"] });
      toast({ title: "Lien créé avec succès" });
      setShowForm(false);
    },
    onError: () => {
      toast({ title: "Erreur lors de la création", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertSocialMediaLink> }) =>
      apiRequest("PATCH", `/api/social-links/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-links"] });
      toast({ title: "Lien mis à jour avec succès" });
      setEditingLink(null);
    },
    onError: () => {
      toast({ title: "Erreur lors de la mise à jour", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/social-links/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-links"] });
      toast({ title: "Lien supprimé avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      nom: formData.get("nom") as string,
      plateforme: selectedPlateforme,
      url: formData.get("url") as string,
      ordre: parseInt(formData.get("ordre") as string) || 0,
      actif: formData.get("actif") === "on",
    };

    if (editingLink) {
      updateMutation.mutate({ id: editingLink.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getPlatformIcon = (plateforme: string) => {
    switch (plateforme) {
      case "facebook": return <Facebook className="h-5 w-5" />;
      case "instagram": return <Instagram className="h-5 w-5" />;
      case "linkedin": return <Linkedin className="h-5 w-5" />;
      case "twitter": return <Twitter className="h-5 w-5" />;
      case "youtube": return <Youtube className="h-5 w-5" />;
      case "tiktok": return <SiTiktok className="h-5 w-5" />;
      default: return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Réseaux sociaux</CardTitle>
            <CardDescription>Gérez les liens vers vos réseaux sociaux</CardDescription>
          </div>
          <Button onClick={() => { setShowForm(!showForm); setEditingLink(null); setSelectedPlateforme("facebook"); }} data-testid="button-add-social">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {(showForm || editingLink) && (
          <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-md">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nom">Nom</Label>
                <Input id="nom" name="nom" defaultValue={editingLink?.nom} required data-testid="input-social-nom" />
              </div>
              <div>
                <Label htmlFor="plateforme">Plateforme</Label>
                <Select value={selectedPlateforme} onValueChange={setSelectedPlateforme} required>
                  <SelectTrigger data-testid="select-social-plateforme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="url">URL</Label>
              <Input id="url" name="url" type="url" defaultValue={editingLink?.url} required data-testid="input-social-url" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ordre">Ordre d'affichage</Label>
                <Input id="ordre" name="ordre" type="number" defaultValue={editingLink?.ordre || 0} data-testid="input-social-ordre" />
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Switch id="actif" name="actif" defaultChecked={editingLink?.actif !== false} data-testid="switch-social-actif" />
                <Label htmlFor="actif">Actif</Label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-social">
                {editingLink ? "Mettre à jour" : "Créer"}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingLink(null); }} data-testid="button-cancel-social">
                Annuler
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {links.map((link) => (
            <div key={link.id} className="flex items-center justify-between p-3 border rounded-md hover-elevate" data-testid={`social-link-${link.id}`}>
              <div className="flex items-center gap-3">
                {getPlatformIcon(link.plateforme)}
                <div>
                  <p className="font-medium">{link.nom}</p>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:underline">
                    {link.url}
                  </a>
                </div>
                {!link.actif && <span className="text-xs bg-muted px-2 py-1 rounded">Inactif</span>}
              </div>
              <div className="flex gap-2">
                <Button size="icon" variant="ghost" onClick={() => { setEditingLink(link); setSelectedPlateforme(link.plateforme); }} data-testid={`button-edit-social-${link.id}`}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(link.id)} data-testid={`button-delete-social-${link.id}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Client Reviews Admin Component
function ClientReviewsAdmin() {
  const { toast } = useToast();
  const [editingReview, setEditingReview] = useState<ClientReview | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: reviews = [] } = useQuery<ClientReview[]>({
    queryKey: ["/api/reviews"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertClientReview) =>
      apiRequest("POST", "/api/reviews", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      toast({ title: "Avis créé avec succès" });
      setShowForm(false);
    },
    onError: () => {
      toast({ title: "Erreur lors de la création", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertClientReview> }) =>
      apiRequest("PATCH", `/api/reviews/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      toast({ title: "Avis mis à jour avec succès" });
      setEditingReview(null);
    },
    onError: () => {
      toast({ title: "Erreur lors de la mise à jour", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/reviews/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      toast({ title: "Avis supprimé avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      nomComplet: formData.get("nomComplet") as string,
      photoUrl: formData.get("photoUrl") as string || null,
      ville: formData.get("ville") as string || null,
      note: parseInt(formData.get("note") as string),
      commentaire: formData.get("commentaire") as string,
      typeService: formData.get("typeService") as string || null,
      ordre: parseInt(formData.get("ordre") as string) || 0,
      actif: formData.get("actif") === "on",
    };

    if (editingReview) {
      updateMutation.mutate({ id: editingReview.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const renderStars = (note: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} className={i < note ? "text-accent" : "text-muted-foreground"}>★</span>
    ));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Avis clients</CardTitle>
            <CardDescription>Gérez les témoignages de vos clients</CardDescription>
          </div>
          <Button onClick={() => { setShowForm(!showForm); setEditingReview(null); }} data-testid="button-add-review">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {(showForm || editingReview) && (
          <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-md">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nomComplet">Nom complet *</Label>
                <Input id="nomComplet" name="nomComplet" defaultValue={editingReview?.nomComplet} required data-testid="input-review-nom" />
              </div>
              <div>
                <Label htmlFor="ville">Ville</Label>
                <Input id="ville" name="ville" defaultValue={editingReview?.ville || ""} data-testid="input-review-ville" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="note">Note (1-5) *</Label>
                <Input id="note" name="note" type="number" min="1" max="5" defaultValue={editingReview?.note || 5} required data-testid="input-review-note" />
              </div>
              <div>
                <Label htmlFor="typeService">Type de service</Label>
                <Select name="typeService" defaultValue={editingReview?.typeService || ""}>
                  <SelectTrigger data-testid="select-review-type">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucun</SelectItem>
                    <SelectItem value="vente">Vente</SelectItem>
                    <SelectItem value="achat">Achat</SelectItem>
                    <SelectItem value="location">Location</SelectItem>
                    <SelectItem value="gestion_locative">Gestion locative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="commentaire">Commentaire *</Label>
              <Textarea id="commentaire" name="commentaire" rows={4} defaultValue={editingReview?.commentaire} required data-testid="textarea-review-comment" />
            </div>
            <div>
              <Label htmlFor="photoUrl">URL Photo (optionnel)</Label>
              <Input id="photoUrl" name="photoUrl" type="url" defaultValue={editingReview?.photoUrl || ""} data-testid="input-review-photo" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ordre">Ordre d'affichage</Label>
                <Input id="ordre" name="ordre" type="number" defaultValue={editingReview?.ordre || 0} data-testid="input-review-ordre" />
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Switch id="actif" name="actif" defaultChecked={editingReview?.actif !== false} data-testid="switch-review-actif" />
                <Label htmlFor="actif">Actif</Label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-review">
                {editingReview ? "Mettre à jour" : "Créer"}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingReview(null); }} data-testid="button-cancel-review">
                Annuler
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {reviews.map((review) => (
            <div key={review.id} className="p-4 border rounded-md hover-elevate" data-testid={`review-${review.id}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{review.nomComplet}</p>
                    {review.ville && <span className="text-sm text-muted-foreground">• {review.ville}</span>}
                    {!review.actif && <span className="text-xs bg-muted px-2 py-1 rounded">Inactif</span>}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">{renderStars(review.note)}</div>
                    {review.typeService && (
                      <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded">{review.typeService}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{review.commentaire}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button size="icon" variant="ghost" onClick={() => setEditingReview(review)} data-testid={`button-edit-review-${review.id}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(review.id)} data-testid={`button-delete-review-${review.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
