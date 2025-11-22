import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Property, InsertProperty, insertPropertySchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Edit, MapPin, Euro, Copy, Upload } from "lucide-react";
import { useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export function PropertiesAdmin() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  const { data: properties = [], isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const form = useForm<Partial<InsertProperty>>({
    resolver: zodResolver(insertPropertySchema.partial()),
    defaultValues: {
      titre: "",
      description: "",
      type: "appartement",
      transactionType: "vente",
      prix: "0",
      surface: 0,
      ville: "",
      codePostal: "",
      localisation: "",
      photos: [],
      featured: false,
      statut: "disponible",
      dpe: "",
      ges: "",
      copropriete: false,
      wifi: false,
      tv: false,
      parking: false,
      piscine: false,
      chauffage: false,
      climatisation: false,
      animauxAcceptes: false,
      dureeMinimaleNuits: 1,
      heureArriveeDebut: "14:00",
      heureArriveeFin: "20:00",
    },
  });

  // Reset form quando dialog fecha
  useEffect(() => {
    if (!dialogOpen) {
      setEditingProperty(null);
      form.reset();
    }
  }, [dialogOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const createMutation = useMutation({
    mutationFn: async (data: Partial<InsertProperty>) => {
      const response = await apiRequest("POST", "/api/properties", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({ title: "Propriété créée avec succès" });
      setDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la création",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertProperty> }) => {
      const response = await apiRequest("PATCH", `/api/properties/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({ title: "Propriété mise à jour" });
      setEditingProperty(null);
      setDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la mise à jour",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/properties/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({ title: "Propriété supprimée" });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (property: Property) => {
      const { id, createdAt, ...rest } = property;
      const newProperty = {
        ...rest,
        titre: `${rest.titre} (copie)`,
      };
      const response = await apiRequest("POST", "/api/properties", newProperty);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({ title: "Propriété dupliquée avec succès" });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la duplication",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    form.reset({
      ...property,
      prix: String(property.prix),
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: Partial<InsertProperty>) => {
    if (editingProperty) {
      await updateMutation.mutateAsync({
        id: editingProperty.id,
        data,
      });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos = form.getValues("photos") || [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        newPhotos.push(dataUrl);
        form.setValue("photos", newPhotos);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Annonces ({properties.length})</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogOpen(true)} data-testid="button-add-property">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle annonce
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{editingProperty ? "Modifier" : "Créer"} une annonce</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[calc(90vh-120px)] pr-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <Tabs defaultValue="base" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="base">Infos</TabsTrigger>
                      <TabsTrigger value="localisation">Localisation</TabsTrigger>
                      <TabsTrigger value="legales">Légales</TabsTrigger>
                      <TabsTrigger value="equipements">Équipements</TabsTrigger>
                      <TabsTrigger value="saisonniere">Saisonnière</TabsTrigger>
                    </TabsList>

                    {/* INFOS GÉNÉRALES */}
                    <TabsContent value="base" className="space-y-4">
                      <FormField
                        control={form.control}
                        name="titre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Titre *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Bel appartement 2 pièces" {...field} data-testid="input-title" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description *</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Description détaillée..." rows={4} {...field} data-testid="input-description" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-type">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="appartement">Appartement</SelectItem>
                                  <SelectItem value="maison">Maison</SelectItem>
                                  <SelectItem value="terrain">Terrain</SelectItem>
                                  <SelectItem value="commercial">Commercial</SelectItem>
                                  <SelectItem value="mobilhome">Mobilhome</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="transactionType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type transaction *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-transaction">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="vente">Vente</SelectItem>
                                  <SelectItem value="location">Location</SelectItem>
                                  <SelectItem value="location_saisonniere">Saisonnière</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="prix"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Prix *</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} data-testid="input-price" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="surface"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Surface m² *</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} data-testid="input-surface" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="statut"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Statut</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="disponible">Disponible</SelectItem>
                                  <SelectItem value="vendu">Vendu</SelectItem>
                                  <SelectItem value="loue">Loué</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="featured"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-3 space-y-0">
                            <FormControl>
                              <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel>Mettre en avant</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="photos"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Photos</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                <Input
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  onChange={handlePhotoUpload}
                                  data-testid="input-photos"
                                />
                                {field.value && field.value.length > 0 && (
                                  <div className="grid grid-cols-3 gap-2">
                                    {field.value.map((photo, idx) => (
                                      <div key={idx} className="relative group">
                                        <img src={photo.startsWith('data:') ? photo : photo} alt={`Photo ${idx}`} className="w-full h-24 object-cover rounded border" />
                                        <Button
                                          type="button"
                                          variant="destructive"
                                          size="sm"
                                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100"
                                          onClick={() => {
                                            const newPhotos = (field.value || []).filter((_, i) => i !== idx);
                                            field.onChange(newPhotos);
                                          }}
                                        >
                                          X
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    {/* LOCALISATION */}
                    <TabsContent value="localisation" className="space-y-4">
                      <FormField
                        control={form.control}
                        name="localisation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Adresse *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: 123 Rue de la Paix" {...field} data-testid="input-address" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="ville"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ville *</FormLabel>
                              <FormControl>
                                <Input placeholder="Lyon" {...field} data-testid="input-city" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="codePostal"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Code postal *</FormLabel>
                              <FormControl>
                                <Input placeholder="75001" {...field} data-testid="input-zipcode" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold">Géolocalisation (pour la carte et trajets)</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="latitude"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Latitude</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="Ex: 45.7640" step="0.0001" {...field} value={field.value?.toString() ?? ""} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} data-testid="input-latitude" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="longitude"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Longitude</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="Ex: 4.8357" step="0.0001" {...field} value={field.value?.toString() ?? ""} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} data-testid="input-longitude" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Format décimal: 45.7640 (latitude), 4.8357 (longitude). Utilisé pour situer le bien sur la carte et calculer les trajets de visite.</p>
                      </div>

                    </TabsContent>

                    {/* MENTIONS LÉGALES */}
                    <TabsContent value="legales" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="dpe"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>DPE</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="non-renseigne">Non renseigné</SelectItem>
                                  <SelectItem value="A">A</SelectItem>
                                  <SelectItem value="B">B</SelectItem>
                                  <SelectItem value="C">C</SelectItem>
                                  <SelectItem value="D">D</SelectItem>
                                  <SelectItem value="E">E</SelectItem>
                                  <SelectItem value="F">F</SelectItem>
                                  <SelectItem value="G">G</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="ges"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>GES</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value || "non-renseigne"}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="non-renseigne">Non renseigné</SelectItem>
                                  <SelectItem value="A">A</SelectItem>
                                  <SelectItem value="B">B</SelectItem>
                                  <SelectItem value="C">C</SelectItem>
                                  <SelectItem value="D">D</SelectItem>
                                  <SelectItem value="E">E</SelectItem>
                                  <SelectItem value="F">F</SelectItem>
                                  <SelectItem value="G">G</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="copropriete"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-3 space-y-0">
                            <FormControl>
                              <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel>Copropriété</FormLabel>
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    {/* ÉQUIPEMENTS */}
                    <TabsContent value="equipements" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="wifi" render={({ field }) => (
                          <FormItem className="flex items-center gap-3 space-y-0">
                            <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                            <FormLabel className="cursor-pointer">WiFi</FormLabel>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="tv" render={({ field }) => (
                          <FormItem className="flex items-center gap-3 space-y-0">
                            <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                            <FormLabel className="cursor-pointer">TV</FormLabel>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="parking" render={({ field }) => (
                          <FormItem className="flex items-center gap-3 space-y-0">
                            <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                            <FormLabel className="cursor-pointer">Parking</FormLabel>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="piscine" render={({ field }) => (
                          <FormItem className="flex items-center gap-3 space-y-0">
                            <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                            <FormLabel className="cursor-pointer">Piscine</FormLabel>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="chauffage" render={({ field }) => (
                          <FormItem className="flex items-center gap-3 space-y-0">
                            <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                            <FormLabel className="cursor-pointer">Chauffage</FormLabel>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="climatisation" render={({ field }) => (
                          <FormItem className="flex items-center gap-3 space-y-0">
                            <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                            <FormLabel className="cursor-pointer">Climatisation</FormLabel>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="animauxAcceptes" render={({ field }) => (
                          <FormItem className="flex items-center gap-3 space-y-0">
                            <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                            <FormLabel className="cursor-pointer">Animaux acceptés</FormLabel>
                          </FormItem>
                        )} />
                      </div>

                    </TabsContent>

                    {/* LOCATION SAISONNIÈRE */}
                    <TabsContent value="saisonniere" className="space-y-4">
                      <p className="text-sm text-muted-foreground mb-4">Paramètres spécifiques aux locations saisonnières</p>
                      
                      <div className="space-y-4">
                        <h4 className="font-semibold">Tarifs par saison</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="prixBasseSaison"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Prix Basse Saison (€/nuit)</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="Ex: 60" {...field} value={field.value?.toString() ?? ""} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} data-testid="input-low-season-price" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="prixMoyenneSaison"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Prix Moyenne Saison (€/nuit)</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="Ex: 85" {...field} value={field.value?.toString() ?? ""} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} data-testid="input-mid-season-price" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="prixHauteSaison"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Prix Haute Saison (€/nuit)</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="Ex: 120" {...field} value={field.value?.toString() ?? ""} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} data-testid="input-high-season-price" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold">Frais et dépôt</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="depotGarantie"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Dépôt de garantie (€)</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="Ex: 200" {...field} value={field.value?.toString() ?? ""} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} data-testid="input-security-deposit" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="taxeSejour"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Taxe de séjour (€/nuit)</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="Ex: 5" {...field} value={field.value?.toString() ?? ""} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} data-testid="input-tourist-tax" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold">Capacité et règles</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="personnesMax"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nombre maximum de personnes</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="Ex: 4" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} data-testid="input-max-persons" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="dureeMinimaleNuits"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Durée minimale (nuits)</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="Ex: 3" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} data-testid="input-min-nights" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold">Horaires d'accueil</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="heureArriveeDebut"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Arrivée à partir de</FormLabel>
                                <FormControl>
                                  <Input type="time" {...field} value={field.value ?? ""} data-testid="input-check-in-start" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="heureArriveeFin"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Arrivée jusqu'à</FormLabel>
                                <FormControl>
                                  <Input type="time" {...field} value={field.value ?? ""} data-testid="input-check-in-end" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="heureDepartDebut"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Départ à partir de</FormLabel>
                                <FormControl>
                                  <Input type="time" {...field} value={field.value ?? ""} data-testid="input-check-out-start" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="heureDepartFin"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Départ jusqu'à</FormLabel>
                                <FormControl>
                                  <Input type="time" {...field} value={field.value ?? ""} data-testid="input-check-out-end" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold">Services inclus</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField control={form.control} name="menageInclus" render={({ field }) => (
                            <FormItem className="flex items-center gap-3 space-y-0">
                              <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                              <FormLabel className="cursor-pointer">Ménage inclus</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="lingeInclus" render={({ field }) => (
                            <FormItem className="flex items-center gap-3 space-y-0">
                              <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                              <FormLabel className="cursor-pointer">Linge de lit inclus</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="conciergerieIncluse" render={({ field }) => (
                            <FormItem className="flex items-center gap-3 space-y-0">
                              <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                              <FormLabel className="cursor-pointer">Conciergerie incluse</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="fumeurAccepte" render={({ field }) => (
                            <FormItem className="flex items-center gap-3 space-y-0">
                              <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                              <FormLabel className="cursor-pointer">Fumeur accepté</FormLabel>
                            </FormItem>
                          )} />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold">Équipements</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField control={form.control} name="wifi" render={({ field }) => (
                            <FormItem className="flex items-center gap-3 space-y-0">
                              <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                              <FormLabel className="cursor-pointer">WiFi</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="tv" render={({ field }) => (
                            <FormItem className="flex items-center gap-3 space-y-0">
                              <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                              <FormLabel className="cursor-pointer">TV</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="laveLinge" render={({ field }) => (
                            <FormItem className="flex items-center gap-3 space-y-0">
                              <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                              <FormLabel className="cursor-pointer">Lave-linge</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="laveVaisselle" render={({ field }) => (
                            <FormItem className="flex items-center gap-3 space-y-0">
                              <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                              <FormLabel className="cursor-pointer">Lave-vaisselle</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="secheLinge" render={({ field }) => (
                            <FormItem className="flex items-center gap-3 space-y-0">
                              <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                              <FormLabel className="cursor-pointer">Sèche-linge</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="parking" render={({ field }) => (
                            <FormItem className="flex items-center gap-3 space-y-0">
                              <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                              <FormLabel className="cursor-pointer">Parking</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="piscine" render={({ field }) => (
                            <FormItem className="flex items-center gap-3 space-y-0">
                              <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                              <FormLabel className="cursor-pointer">Piscine</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="jardin" render={({ field }) => (
                            <FormItem className="flex items-center gap-3 space-y-0">
                              <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                              <FormLabel className="cursor-pointer">Jardin</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="chauffage" render={({ field }) => (
                            <FormItem className="flex items-center gap-3 space-y-0">
                              <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                              <FormLabel className="cursor-pointer">Chauffage</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="climatisation" render={({ field }) => (
                            <FormItem className="flex items-center gap-3 space-y-0">
                              <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                              <FormLabel className="cursor-pointer">Climatisation</FormLabel>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="animauxAcceptes" render={({ field }) => (
                            <FormItem className="flex items-center gap-3 space-y-0">
                              <FormControl><Checkbox checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                              <FormLabel className="cursor-pointer">Animaux acceptés</FormLabel>
                            </FormItem>
                          )} />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <Button type="submit" className="w-full" data-testid="button-submit">
                    {editingProperty ? "Mettre à jour" : "Créer"}
                  </Button>
                </form>
              </Form>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div>Chargement...</div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((property) => (
                <TableRow key={property.id} data-testid={`row-${property.id}`}>
                  <TableCell className="font-medium">{property.titre}</TableCell>
                  <TableCell>{property.type}</TableCell>
                  <TableCell className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {property.ville}
                  </TableCell>
                  <TableCell className="flex items-center gap-1">
                    <Euro className="w-4 h-4" />
                    {Number(property.prix).toLocaleString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      property.statut === 'disponible' ? 'bg-green-100 text-green-800' :
                      property.statut === 'vendu' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {property.statut}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(property)}
                        data-testid={`btn-edit-${property.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => duplicateMutation.mutate(property)}
                        data-testid={`btn-duplicate-${property.id}`}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm("Êtes-vous sûr ?")) {
                            deleteMutation.mutate(property.id);
                          }
                        }}
                        data-testid={`btn-delete-${property.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
