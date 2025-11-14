import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { HeroImage, InsertHeroImage, insertHeroImageSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Image as ImageIcon, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUploader } from "@/components/ImageUploader";

export function HeroImagesAdmin() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<HeroImage | null>(null);

  const { data: images, isLoading } = useQuery<HeroImage[]>({
    queryKey: ["/api/hero-images"],
  });

  const form = useForm<InsertHeroImage>({
    resolver: zodResolver(insertHeroImageSchema),
    defaultValues: {
      imageUrl: "",
      titre: "",
      sousTitre: "",
      ordre: 0,
      actif: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertHeroImage) => {
      const response = await apiRequest("POST", "/api/hero-images", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hero-images"] });
      toast({
        title: "Succès",
        description: "Image créée avec succès",
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la création de l'image",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertHeroImage> }) => {
      const response = await apiRequest("PATCH", `/api/hero-images/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hero-images"] });
      toast({
        title: "Succès",
        description: "Image mise à jour avec succès",
      });
      setDialogOpen(false);
      setEditingImage(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour de l'image",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/hero-images/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hero-images"] });
      toast({
        title: "Succès",
        description: "Image supprimée avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression de l'image",
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, actif }: { id: string; actif: boolean }) => {
      const response = await apiRequest("PATCH", `/api/hero-images/${id}`, { actif });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hero-images"] });
      toast({
        title: "Succès",
        description: "Statut mis à jour",
      });
    },
  });

  const onSubmit = (data: InsertHeroImage) => {
    if (editingImage) {
      updateMutation.mutate({ id: editingImage.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (image: HeroImage) => {
    setEditingImage(image);
    form.reset({
      imageUrl: image.imageUrl,
      titre: image.titre ?? "",
      sousTitre: image.sousTitre ?? "",
      ordre: image.ordre,
      actif: image.actif,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette image ?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingImage(null);
      form.reset({
        imageUrl: "",
        titre: "",
        sousTitre: "",
        ordre: 0,
        actif: true,
      });
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
  }

  const sortedImages = images?.sort((a, b) => a.ordre - b.ordre) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif text-foreground">Images du Carrousel</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez les images affichées sur la page d'accueil
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-hero-image">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une image
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingImage ? "Modifier l'image" : "Nouvelle image"}
              </DialogTitle>
              <DialogDescription>
                {editingImage 
                  ? "Modifiez les informations de l'image du carrousel"
                  : "Ajoutez une nouvelle image au carrousel de la page d'accueil"
                }
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-4">
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image du carrousel *</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <ImageUploader
                            onUploadComplete={(imagePath) => {
                              field.onChange(imagePath);
                            }}
                            currentImage={field.value}
                            maxFileSizeMB={10}
                          />
                          <Input
                            placeholder="Ou entrez une URL directement"
                            data-testid="input-image-url"
                            {...field}
                            className="mt-2"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="titre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titre</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Titre affiché sur l'image"
                          data-testid="input-image-titre"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sousTitre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sous-titre</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Sous-titre ou description"
                          data-testid="input-image-sous-titre"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ordre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordre d'affichage *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          data-testid="input-image-ordre"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Les images sont affichées du plus petit au plus grand ordre
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="actif"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-image-actif"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Image active</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Seules les images actives sont affichées sur le site
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDialogClose(false)}
                    data-testid="button-cancel"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-hero-image"
                  >
                    {editingImage ? "Mettre à jour" : "Créer"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {sortedImages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Aucune image dans le carrousel. Ajoutez-en une pour commencer.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedImages.map((image) => (
            <Card key={image.id} className="overflow-hidden">
              <div className="aspect-video relative bg-muted">
                {image.imageUrl ? (
                  <img
                    src={image.imageUrl}
                    alt={image.titre || "Hero image"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={() => toggleActiveMutation.mutate({ 
                      id: image.id, 
                      actif: !image.actif 
                    })}
                    data-testid={`button-toggle-active-${image.id}`}
                  >
                    {image.actif ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">
                      {image.titre || "Sans titre"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Ordre: {image.ordre}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(image)}
                      data-testid={`button-edit-${image.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(image.id)}
                      data-testid={`button-delete-${image.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {image.sousTitre && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {image.sousTitre}
                  </p>
                )}
                {!image.actif && (
                  <div className="text-xs text-muted-foreground">
                    <EyeOff className="w-3 h-3 inline mr-1" />
                    Non visible sur le site
                  </div>
                )}
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
