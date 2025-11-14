import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PricingScale, InsertPricingScale, insertPricingScaleSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Edit, ArrowUp, ArrowDown, Building2, Home, Key, ExternalLink, X, Copy, FileCheck } from "lucide-react";
import { Link } from "wouter";
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

export function PricingScalesAdmin() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingScale, setEditingScale] = useState<PricingScale | null>(null);
  const [activeTab, setActiveTab] = useState("transaction");
  const [elementsDiff, setElementsDiff] = useState<string[]>([]);
  const [newElement, setNewElement] = useState("");
  const [avantagesExcl, setAvantagesExcl] = useState<string[]>([]);
  const [newAvantage, setNewAvantage] = useState("");
  
  // État pour les tarifs ALUR
  const [alurTarifs, setAlurTarifs] = useState({
    zoneTendue: "",
    zoneMediane: "",
    horsZones: "",
    etatLieux: "",
    fraisEntremise: "",
    bailleur: "",
    locataireLocation: "",
    locataireBail: ""
  });

  // État pour les tarifs commerciaux
  const [commercialTarifs, setCommercialTarifs] = useState({
    rechercheLocataire: "",
    redactionBail: "",
    minimumBail: "",
    etatLieux: "",
    minimumEtatLieux: ""
  });

  // État pour les tarifs stationnement
  const [stationnementTarifs, setStationnementTarifs] = useState({
    locataire: "",
    bailleur: ""
  });

  const { data: scales, isLoading } = useQuery<PricingScale[]>({
    queryKey: ["/api/pricing-scales"],
  });

  const form = useForm<InsertPricingScale>({
    resolver: zodResolver(insertPricingScaleSchema),
    defaultValues: {
      type: "vente",
      categorie: undefined,
      nom: "",
      description: undefined,
      trancheMin: undefined,
      trancheMax: undefined,
      honoraires: undefined,
      tauxPourcentage: undefined,
      unite: undefined,
      minimum: undefined,
      annee: new Date().getFullYear(),
      ordre: 0,
      actif: true,
    },
  });

  const createScale = useMutation({
    mutationFn: async (data: InsertPricingScale) => {
      const res = await fetch("/api/pricing-scales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create scale");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-scales"] });
      setDialogOpen(false);
      form.reset();
      toast({ title: "Barème créé avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la création du barème", variant: "destructive" });
    },
  });

  const updateScale = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertPricingScale> }) => {
      const res = await fetch(`/api/pricing-scales/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update scale");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-scales"] });
      setDialogOpen(false);
      setEditingScale(null);
      form.reset();
      toast({ title: "Barème mis à jour avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la mise à jour du barème", variant: "destructive" });
    },
  });

  const deleteScale = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/pricing-scales/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to delete scale");
      }
      return id;
    },
    onMutate: async (id: string) => {
      // Annuler les requêtes en cours
      await queryClient.cancelQueries({ queryKey: ["/api/pricing-scales"] });
      
      // Sauvegarder l'état précédent
      const previousScales = queryClient.getQueryData(["/api/pricing-scales"]);
      
      // Mettre à jour de manière optimiste
      queryClient.setQueryData(["/api/pricing-scales"], (old: any) => {
        if (!old) return old;
        return old.filter((scale: PricingScale) => scale.id !== id);
      });
      
      return { previousScales };
    },
    onError: (err, id, context) => {
      // Restaurer l'état précédent en cas d'erreur
      if (context?.previousScales) {
        queryClient.setQueryData(["/api/pricing-scales"], context.previousScales);
      }
      toast({ title: "Erreur lors de la suppression du barème", variant: "destructive" });
    },
    onSuccess: () => {
      toast({ title: "Barème supprimé avec succès" });
    },
    onSettled: () => {
      // Toujours invalider le cache à la fin
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-scales"] });
    },
  });

  const moveScale = async (id: string, direction: 'up' | 'down', filteredScales: PricingScale[]) => {
    const currentIndex = filteredScales.findIndex(s => s.id === id);
    if (currentIndex === -1) return;
    
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= filteredScales.length) return;

    const current = filteredScales[currentIndex];
    const target = filteredScales[targetIndex];

    await Promise.all([
      updateScale.mutateAsync({ id: current.id, data: { ordre: target.ordre } }),
      updateScale.mutateAsync({ id: target.id, data: { ordre: current.ordre } }),
    ]);
  };

  const onSubmit = (data: InsertPricingScale) => {
    const payload = {
      ...data,
      categorie: data.categorie || null,
      trancheMin: data.trancheMin || null,
      trancheMax: data.trancheMax || null,
      honoraires: data.honoraires || null,
      tauxPourcentage: data.tauxPourcentage || null,
      description: data.description || null,
      unite: data.unite || null,
      minimum: data.minimum || null,
      elementsDifferenciants: elementsDiff.length > 0 ? elementsDiff : null,
      avantagesExclusifs: avantagesExcl.length > 0 ? avantagesExcl : null,
    };

    if (editingScale) {
      updateScale.mutate({ id: editingScale.id, data: payload });
    } else {
      createScale.mutate(payload as InsertPricingScale);
    }
  };

  const handleEdit = (scale: PricingScale) => {
    setEditingScale(scale);
    setElementsDiff(scale.elementsDifferenciants || []);
    setAvantagesExcl(scale.avantagesExclusifs || []);
    form.reset({
      type: scale.type,
      categorie: scale.categorie || undefined,
      nom: scale.nom,
      description: scale.description || undefined,
      trancheMin: scale.trancheMin || undefined,
      trancheMax: scale.trancheMax || undefined,
      honoraires: scale.honoraires || undefined,
      tauxPourcentage: scale.tauxPourcentage || undefined,
      unite: scale.unite || undefined,
      minimum: scale.minimum || undefined,
      annee: scale.annee,
      ordre: scale.ordre,
      actif: scale.actif,
    });
    setDialogOpen(true);
  };

  const handleDuplicate = (scale: PricingScale) => {
    setEditingScale(null);
    setElementsDiff(scale.elementsDifferenciants || []);
    setAvantagesExcl(scale.avantagesExclusifs || []);
    form.reset({
      type: scale.type,
      categorie: scale.categorie || undefined,
      nom: `${scale.nom} (copie)`,
      description: scale.description || undefined,
      trancheMin: scale.trancheMin || undefined,
      trancheMax: scale.trancheMax || undefined,
      honoraires: scale.honoraires || undefined,
      tauxPourcentage: scale.tauxPourcentage || undefined,
      unite: scale.unite || undefined,
      minimum: scale.minimum || undefined,
      annee: new Date().getFullYear(),
      ordre: scale.ordre + 1,
      actif: true,
    });
    setDialogOpen(true);
    toast({ 
      title: "Barème dupliqué", 
      description: "Modifiez les informations si nécessaire puis créez le barème" 
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce barème ?")) {
      deleteScale.mutate(id);
    }
  };

  const deleteAllVenteScales = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer TOUS les barèmes de vente ?")) return;
    
    try {
      const venteToDelete = scales?.filter(s => s.type === 'vente') || [];
      for (const scale of venteToDelete) {
        await fetch(`/api/pricing-scales/${scale.id}`, {
          method: "DELETE",
          credentials: "include",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-scales"] });
      toast({ title: `${venteToDelete.length} barèmes de vente supprimés` });
    } catch (error) {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    }
  };

  const createMandatSimpleTemplate = async () => {
    const annee = new Date().getFullYear();
    const paliers = [
      { min: null, max: "50000", honoraires: "5000", ordre: 1, description: "Forfait" },
      { min: "50001", max: "100000", tauxPourcentage: "7.0", ordre: 2 },
      { min: "100001", max: "150000", tauxPourcentage: "5.0", ordre: 3 },
      { min: "150001", max: "200000", tauxPourcentage: "4.5", ordre: 4 },
      { min: "200001", max: "400000", tauxPourcentage: "4.0", ordre: 5 },
      { min: "400001", max: "800000", tauxPourcentage: "3.5", ordre: 6 }
    ];

    try {
      for (const palier of paliers) {
        await fetch("/api/pricing-scales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "vente",
            nom: "Mandat Simple",
            trancheMin: palier.min,
            trancheMax: palier.max,
            honoraires: palier.honoraires,
            tauxPourcentage: palier.tauxPourcentage,
            description: palier.description,
            annee: annee,
            ordre: palier.ordre,
            actif: true
          }),
          credentials: "include",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-scales"] });
      toast({ title: "Template Mandat Simple créé avec succès" });
    } catch (error) {
      toast({ title: "Erreur lors de la création", variant: "destructive" });
    }
  };

  const createMandatExclusifTemplate = async () => {
    const annee = new Date().getFullYear();
    const paliers = [
      { min: null, max: "50000", honoraires: "5000", ordre: 1, description: "Forfait" },
      { min: "50001", max: "100000", tauxPourcentage: "6.5", ordre: 2 },
      { min: "100001", max: "150000", tauxPourcentage: "4.5", ordre: 3 },
      { min: "150001", max: "200000", tauxPourcentage: "4.0", ordre: 4 },
      { min: "200001", max: "400000", tauxPourcentage: "3.5", ordre: 5 },
      { min: "400001", max: "800000", tauxPourcentage: "3.0", ordre: 6 }
    ];

    try {
      for (const palier of paliers) {
        await fetch("/api/pricing-scales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "vente",
            nom: "Mandat Exclusif",
            trancheMin: palier.min,
            trancheMax: palier.max,
            honoraires: palier.honoraires,
            tauxPourcentage: palier.tauxPourcentage,
            description: palier.description,
            annee: annee,
            ordre: palier.ordre,
            actif: true
          }),
          credentials: "include",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-scales"] });
      toast({ title: "Template Mandat Exclusif créé avec succès" });
    } catch (error) {
      toast({ title: "Erreur lors de la création", variant: "destructive" });
    }
  };

  const createAvisValeurTemplate = async () => {
    const annee = new Date().getFullYear();
    const tarifs = [
      { nom: "Studio, T1-T2", honoraires: "90", ordre: 1 },
      { nom: "T3", honoraires: "110", ordre: 2 },
      { nom: "T4", honoraires: "130", ordre: 3 },
      { nom: "T5+", honoraires: "140", ordre: 4 }
    ];

    try {
      for (const tarif of tarifs) {
        await fetch("/api/pricing-scales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "vente",
            categorie: "avis_valeur",
            nom: tarif.nom,
            honoraires: tarif.honoraires,
            annee: annee,
            ordre: tarif.ordre,
            actif: true
          }),
          credentials: "include",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-scales"] });
      toast({ title: "Avis de valeur créés avec succès" });
    } catch (error) {
      toast({ title: "Erreur lors de la création", variant: "destructive" });
    }
  };

  const migrateLocationServices = async () => {
    try {
      // Récupérer tous les services de location
      const servicesToMigrate = scales?.filter(s => s.type === 'location_services') || [];
      
      for (const service of servicesToMigrate) {
        // Déterminer factureA basé sur le nom ou description
        let factureA = service.factureA; // Garder si déjà défini
        
        if (!factureA) {
          const nom = service.nom?.toLowerCase() || '';
          const desc = service.description?.toLowerCase() || '';
          
          if (nom.includes('locataire') || desc.includes('locataire')) {
            factureA = 'locataire';
          } else if (nom.includes('propriétaire') || nom.includes('bailleur') || desc.includes('propriétaire')) {
            factureA = 'proprietaire';
          } else if (service.categorie === 'commercial' && service.nom?.includes('État des lieux')) {
            factureA = 'les_deux';
          } else {
            factureA = 'proprietaire'; // Par défaut
          }
        }
        
        // Mettre à jour
        await fetch(`/api/pricing-scales/${service.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ factureA }),
          credentials: "include",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-scales"] });
      toast({ title: `${servicesToMigrate.length} services migrés avec succès` });
    } catch (error) {
      toast({ title: "Erreur lors de la migration", variant: "destructive" });
    }
  };

  const createLocationTemplate = async () => {
    const annee = new Date().getFullYear();
    
    // 1. LOCAUX D'HABITATION - Zone ALUR
    const zoneAlur = [
      // À la charge du locataire
      { nom: "Hors zones tendues et très tendues", honoraires: "8.00", unite: "€/m²", ordre: 1, factureA: "locataire" },
      { nom: "Zones tendues", honoraires: "10.00", unite: "€/m²", ordre: 2, factureA: "locataire" },
      { nom: "Zones très tendues", honoraires: "12.00", unite: "€/m²", ordre: 3, factureA: "locataire" },
      { nom: "État des lieux d'entrée", honoraires: "3.00", unite: "€/m²", ordre: 4, factureA: "locataire" },
      
      // À la charge du propriétaire
      { nom: "Hors zones tendues et très tendues", honoraires: "8.00", unite: "€/m²", ordre: 5, factureA: "proprietaire" },
      { nom: "Zones tendues", honoraires: "10.00", unite: "€/m²", ordre: 6, factureA: "proprietaire" },
      { nom: "Zones très tendues", honoraires: "12.00", unite: "€/m²", ordre: 7, factureA: "proprietaire" },
      { nom: "État des lieux d'entrée", honoraires: "3.00", unite: "€/m²", ordre: 8, factureA: "proprietaire" },
      { nom: "Honoraires d'expertise et de négociation", honoraires: null, unite: "€", ordre: 9, factureA: "proprietaire" }
    ];

    // 2. BAUX CODE CIVIL (hors loi 89-462)
    const bauxCivil = [
      { nom: "Location, bail et état des lieux (Locataire)", honoraires: null, unite: "€", ordre: 1, factureA: "locataire" },
      { nom: "Location (Propriétaire)", honoraires: null, unite: "€", ordre: 2, factureA: "proprietaire" },
      { nom: "Rédaction du bail (Propriétaire)", honoraires: null, unite: "€", ordre: 3, factureA: "proprietaire" }
    ];

    // 3. STATIONNEMENT
    const stationnement = [
      { nom: "Location et bail (Locataire)", honoraires: null, unite: "€", ordre: 1, factureA: "locataire" },
      { nom: "Location et bail (Propriétaire)", honoraires: null, unite: "€", ordre: 2, factureA: "proprietaire" }
    ];

    // 4. COMMERCIAUX
    const commercial: Array<{nom: string; honoraires?: any; tauxPourcentage?: any; minimum?: any; unite?: string; ordre: number; factureA: string}> = [
      { nom: "Recherche locataire", tauxPourcentage: null, minimum: null, ordre: 1, unite: "%", factureA: "proprietaire" },
      { nom: "Rédaction bail", tauxPourcentage: null, minimum: null, ordre: 2, unite: "%", factureA: "proprietaire" },
      { nom: "État des lieux", honoraires: null, minimum: null, unite: "€/m²", ordre: 3, factureA: "les_deux" }
    ];

    try {
      // Créer Zone ALUR
      for (const item of zoneAlur) {
        const payload: any = {
          type: "location_services",
          categorie: "zone_alur",
          nom: item.nom,
          unite: item.unite,
          factureA: item.factureA,
          annee: annee,
          ordre: item.ordre,
          actif: true
        };
        if (item.honoraires) payload.honoraires = item.honoraires;
        
        await fetch("/api/pricing-scales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        });
      }

      // Créer Baux Civil
      for (const item of bauxCivil) {
        const payload: any = {
          type: "location_services",
          categorie: "baux_civil",
          nom: item.nom,
          unite: item.unite,
          factureA: item.factureA,
          annee: annee,
          ordre: item.ordre,
          actif: true
        };
        if (item.honoraires) payload.honoraires = item.honoraires;
        
        await fetch("/api/pricing-scales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        });
      }

      // Créer Stationnement
      for (const item of stationnement) {
        const payload: any = {
          type: "location_services",
          categorie: "stationnement",
          nom: item.nom,
          unite: item.unite,
          factureA: item.factureA,
          annee: annee,
          ordre: item.ordre,
          actif: true
        };
        if (item.honoraires) payload.honoraires = item.honoraires;
        
        await fetch("/api/pricing-scales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        });
      }

      // Créer Commercial
      for (const item of commercial) {
        const payload: any = {
          type: "location_services",
          categorie: "commercial",
          nom: item.nom,
          factureA: item.factureA,
          annee: annee,
          ordre: item.ordre,
          actif: true
        };
        if (item.honoraires) payload.honoraires = item.honoraires;
        if (item.tauxPourcentage) payload.tauxPourcentage = item.tauxPourcentage;
        if (item.minimum) payload.minimum = item.minimum;
        if (item.unite) payload.unite = item.unite;
        
        await fetch("/api/pricing-scales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/pricing-scales"] });
      toast({ title: "Template Location créé avec succès" });
    } catch (error) {
      toast({ title: "Erreur lors de la création", variant: "destructive" });
    }
  };

  const formatPrice = (price: string | null) => {
    if (!price) return "-";
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(parseFloat(price));
  };

  // Filtrer les barèmes par section
  const venteScales = scales?.filter(s => s.type === 'vente' && !s.categorie).sort((a, b) => a.ordre - b.ordre) || [];
  const avisValeurScales = scales?.filter(s => s.type === 'vente' && s.categorie === 'avis_valeur').sort((a, b) => a.ordre - b.ordre) || [];
  const vacationScales = scales?.filter(s => s.type === 'vente' && s.categorie === 'vacation').sort((a, b) => a.ordre - b.ordre) || [];
  const locationMandats = scales?.filter(s => s.type === 'location' && s.categorie === 'mandat').sort((a, b) => a.ordre - b.ordre) || [];
  const locationAlur = scales?.filter(s => s.type === 'location_services' && s.categorie === 'zone_alur').sort((a, b) => a.ordre - b.ordre) || [];
  const bauxCivil = scales?.filter(s => s.type === 'location_services' && s.categorie === 'baux_civil').sort((a, b) => a.ordre - b.ordre) || [];
  const commercial = scales?.filter(s => s.type === 'location_services' && s.categorie === 'commercial').sort((a, b) => a.ordre - b.ordre) || [];
  const stationnement = scales?.filter(s => s.type === 'location_services' && s.categorie === 'stationnement').sort((a, b) => a.ordre - b.ordre) || [];
  const servicesScales = scales?.filter(s => s.type === 'location_services').sort((a, b) => a.ordre - b.ordre) || [];
  
  // Charger les tarifs ALUR et baux civil existants
  useEffect(() => {
    if (locationAlur.length > 0 || bauxCivil.length > 0) {
      const zoneTendue = locationAlur.find(s => s.nom === 'Zone très tendue');
      const zoneMediane = locationAlur.find(s => s.nom === 'Zone médiane');
      const horsZones = locationAlur.find(s => s.nom === 'Hors zones');
      const etatLieux = locationAlur.find(s => s.nom === 'État des lieux');
      const fraisEntremise = locationAlur.find(s => s.nom === 'Frais d\'entremise');
      
      const bailleur = bauxCivil.find(s => s.nom === 'Bailleur');
      const locataireLocation = bauxCivil.find(s => s.nom === 'Locataire (location)');
      const locataireBail = bauxCivil.find(s => s.nom === 'Locataire (bail)');
      
      setAlurTarifs({
        zoneTendue: zoneTendue?.honoraires || "12",
        zoneMediane: zoneMediane?.honoraires || "10",
        horsZones: horsZones?.honoraires || "8",
        etatLieux: etatLieux?.honoraires || "3",
        fraisEntremise: fraisEntremise?.tauxPourcentage || "",
        bailleur: bailleur?.honoraires || "",
        locataireLocation: locataireLocation?.honoraires || "",
        locataireBail: locataireBail?.honoraires || ""
      });
    }

    // Charger les tarifs commerciaux
    if (commercial.length > 0) {
      const rechercheLocataire = commercial.find(s => s.nom === 'Recherche locataire');
      const redactionBail = commercial.find(s => s.nom === 'Rédaction bail');
      const etatLieuxCom = commercial.find(s => s.nom === 'État des lieux');
      
      setCommercialTarifs({
        rechercheLocataire: rechercheLocataire?.tauxPourcentage || "96.05",
        redactionBail: redactionBail?.tauxPourcentage || "24.05",
        minimumBail: redactionBail?.minimum || "1000",
        etatLieux: etatLieuxCom?.honoraires || "1.40",
        minimumEtatLieux: etatLieuxCom?.minimum || "195"
      });
    }

    // Charger les tarifs stationnement
    if (stationnement.length > 0) {
      const locataire = stationnement.find(s => s.nom === 'Locataire');
      const bailleurStat = stationnement.find(s => s.nom === 'Bailleur');
      
      setStationnementTarifs({
        locataire: locataire?.honoraires || "",
        bailleur: bailleurStat?.honoraires || "180"
      });
    }
  }, [scales]);
  
  const saveAlurTarifs = async () => {
    const annee = new Date().getFullYear();
    const tarifsAlur = [
      { nom: 'Zone très tendue', honoraires: alurTarifs.zoneTendue, ordre: 1, unite: "€/m²" },
      { nom: 'Zone médiane', honoraires: alurTarifs.zoneMediane, ordre: 2, unite: "€/m²" },
      { nom: 'Hors zones', honoraires: alurTarifs.horsZones, ordre: 3, unite: "€/m²" },
      { nom: 'État des lieux', honoraires: alurTarifs.etatLieux, ordre: 4, unite: "€/m²" }
    ];

    // Ajouter frais d'entremise si renseigné
    if (alurTarifs.fraisEntremise) {
      tarifsAlur.push({
        nom: 'Frais d\'entremise',
        honoraires: alurTarifs.fraisEntremise,
        ordre: 5,
        unite: "%"
      });
    }

    const tarifsBaux = [];
    if (alurTarifs.bailleur) {
      tarifsBaux.push({ nom: 'Bailleur', honoraires: alurTarifs.bailleur, ordre: 1, unite: "mois_loyer" });
    }
    if (alurTarifs.locataireLocation) {
      tarifsBaux.push({ nom: 'Locataire (location)', honoraires: alurTarifs.locataireLocation, ordre: 2, unite: "mois_loyer" });
    }
    if (alurTarifs.locataireBail) {
      tarifsBaux.push({ nom: 'Locataire (bail)', honoraires: alurTarifs.locataireBail, ordre: 3, unite: "€" });
    }

    try {
      // Supprimer les anciens tarifs ALUR et baux civil
      for (const scale of [...locationAlur, ...bauxCivil]) {
        await fetch(`/api/pricing-scales/${scale.id}`, {
          method: "DELETE",
          credentials: "include",
        });
      }

      // Créer les nouveaux tarifs ALUR
      for (const tarif of tarifsAlur) {
        await fetch("/api/pricing-scales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "location_services",
            categorie: "zone_alur",
            nom: tarif.nom,
            honoraires: tarif.unite === "%" ? undefined : tarif.honoraires,
            tauxPourcentage: tarif.unite === "%" ? tarif.honoraires : undefined,
            unite: tarif.unite,
            annee: annee,
            ordre: tarif.ordre,
            actif: true
          }),
          credentials: "include",
        });
      }

      // Créer les nouveaux tarifs baux civil
      for (const tarif of tarifsBaux) {
        await fetch("/api/pricing-scales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "location_services",
            categorie: "baux_civil",
            nom: tarif.nom,
            honoraires: tarif.honoraires,
            unite: tarif.unite,
            annee: annee,
            ordre: tarif.ordre,
            actif: true
          }),
          credentials: "include",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/pricing-scales"] });
      toast({ title: "Tarifs ALUR et baux civil mis à jour avec succès" });
    } catch (error) {
      toast({ title: "Erreur lors de la mise à jour", variant: "destructive" });
    }
  };

  const saveCommercialTarifs = async () => {
    const annee = new Date().getFullYear();
    const tarifsData = [
      { 
        nom: 'Recherche locataire', 
        tauxPourcentage: commercialTarifs.rechercheLocataire, 
        ordre: 1, 
        unite: "%"
      },
      { 
        nom: 'Rédaction bail', 
        tauxPourcentage: commercialTarifs.redactionBail, 
        minimum: commercialTarifs.minimumBail,
        ordre: 2, 
        unite: "%"
      },
      { 
        nom: 'État des lieux', 
        honoraires: commercialTarifs.etatLieux,
        minimum: commercialTarifs.minimumEtatLieux,
        ordre: 3, 
        unite: "€/m²"
      }
    ];

    try {
      // Supprimer les anciens tarifs commerciaux
      for (const scale of commercial) {
        await fetch(`/api/pricing-scales/${scale.id}`, {
          method: "DELETE",
          credentials: "include",
        });
      }

      // Créer les nouveaux tarifs
      for (const tarif of tarifsData) {
        await fetch("/api/pricing-scales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "location_services",
            categorie: "commercial",
            nom: tarif.nom,
            honoraires: tarif.honoraires,
            tauxPourcentage: tarif.tauxPourcentage,
            minimum: tarif.minimum,
            unite: tarif.unite,
            annee: annee,
            ordre: tarif.ordre,
            actif: true
          }),
          credentials: "include",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/pricing-scales"] });
      toast({ title: "Tarifs commerciaux mis à jour avec succès" });
    } catch (error) {
      toast({ title: "Erreur lors de la mise à jour", variant: "destructive" });
    }
  };

  const saveStationnementTarifs = async () => {
    const annee = new Date().getFullYear();
    const tarifsData = [
      { nom: 'Locataire', honoraires: stationnementTarifs.locataire, ordre: 1, unite: "mois_loyer" },
      { nom: 'Bailleur', honoraires: stationnementTarifs.bailleur, ordre: 2, unite: "€" }
    ];

    try {
      // Supprimer les anciens tarifs stationnement
      for (const scale of stationnement) {
        await fetch(`/api/pricing-scales/${scale.id}`, {
          method: "DELETE",
          credentials: "include",
        });
      }

      // Créer les nouveaux tarifs
      for (const tarif of tarifsData) {
        await fetch("/api/pricing-scales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "location_services",
            categorie: "stationnement",
            nom: tarif.nom,
            honoraires: tarif.honoraires,
            unite: tarif.unite,
            annee: annee,
            ordre: tarif.ordre,
            actif: true
          }),
          credentials: "include",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/pricing-scales"] });
      toast({ title: "Tarifs stationnement mis à jour avec succès" });
    } catch (error) {
      toast({ title: "Erreur lors de la mise à jour", variant: "destructive" });
    }
  };

  const renderScalesList = (filteredScales: PricingScale[]) => {
    if (filteredScales.length === 0) {
      return (
        <Card className="p-12 text-center text-muted-foreground">
          <p>Aucun barème dans cette section.</p>
          <p className="text-sm mt-2">Cliquez sur "Ajouter un barème" pour commencer.</p>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4">
        {filteredScales.map((scale, index) => (
          <Card key={scale.id} className="p-6" data-testid={`admin-scale-${scale.id}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-muted-foreground font-mono w-8">#{scale.ordre}</span>
                  <h3 className="text-xl font-serif">{scale.nom}</h3>
                  {scale.categorie && (
                    <span className="text-xs px-2 py-1 bg-accent/20 text-accent rounded">{scale.categorie}</span>
                  )}
                  {!scale.actif && (
                    <span className="text-xs px-2 py-1 bg-muted rounded">Inactif</span>
                  )}
                </div>
                {scale.description && (
                  <p className="text-muted-foreground mb-2 text-sm">{scale.description}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="text-muted-foreground">Type: <strong className="text-foreground">{scale.type}</strong></span>
                  <span className="text-muted-foreground">Année: <strong className="text-foreground">{scale.annee}</strong></span>
                  {scale.trancheMin && (
                    <span className="text-muted-foreground">Min: <strong className="text-foreground">{formatPrice(scale.trancheMin)}</strong></span>
                  )}
                  {scale.trancheMax && (
                    <span className="text-muted-foreground">Max: <strong className="text-foreground">{formatPrice(scale.trancheMax)}</strong></span>
                  )}
                  {scale.honoraires && (
                    <span className="text-muted-foreground">Honoraires: <strong className="text-accent">{formatPrice(scale.honoraires)}</strong></span>
                  )}
                  {scale.tauxPourcentage && (
                    <span className="text-muted-foreground">Taux: <strong className="text-accent">{scale.tauxPourcentage}%</strong></span>
                  )}
                  {scale.unite && (
                    <span className="text-muted-foreground">Unité: <strong className="text-foreground">{scale.unite}</strong></span>
                  )}
                  {scale.minimum && (
                    <span className="text-muted-foreground">Minimum: <strong className="text-foreground">{formatPrice(scale.minimum)}</strong></span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex flex-col gap-1">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => moveScale(scale.id, 'up', filteredScales)}
                    disabled={index === 0}
                    data-testid={`button-move-up-${scale.id}`}
                    className="h-8 w-8"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => moveScale(scale.id, 'down', filteredScales)}
                    disabled={index === filteredScales.length - 1}
                    data-testid={`button-move-down-${scale.id}`}
                    className="h-8 w-8"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => handleEdit(scale)} 
                  disabled={deleteScale.isPending}
                  data-testid={`button-edit-scale-${scale.id}`}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => handleDuplicate(scale)} 
                  disabled={deleteScale.isPending}
                  data-testid={`button-duplicate-scale-${scale.id}`}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button 
                  variant="destructive" 
                  size="icon" 
                  onClick={() => handleDelete(scale.id)} 
                  disabled={deleteScale.isPending}
                  data-testid={`button-delete-scale-${scale.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-serif">Gestion des barèmes tarifaires</h2>
        <div className="flex gap-2">
          <Link href="/bareme">
            <Button variant="outline" size="sm" data-testid="link-view-bareme">
              <ExternalLink className="mr-2 h-4 w-4" />
              Voir le barème public
            </Button>
          </Link>
          <Link href="/gestion-location">
            <Button variant="outline" size="sm" data-testid="link-gestion-location">
              <ExternalLink className="mr-2 h-4 w-4" />
              Faire gérer
            </Button>
          </Link>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingScale(null); setElementsDiff([]); setNewElement(""); form.reset(); }} data-testid="button-add-pricing-scale">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un barème
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingScale ? "Modifier le barème" : "Créer un barème"}</DialogTitle>
              <DialogDescription>
                {editingScale ? "Modifiez les informations du barème tarifaire." : "Ajoutez un nouveau barème tarifaire."}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-scale-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="vente">Vente</SelectItem>
                            <SelectItem value="location">Location (Mandats + ALUR)</SelectItem>
                            <SelectItem value="location_services">Services Location</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="categorie"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catégorie (optionnelle)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-scale-categorie">
                              <SelectValue placeholder="Aucune" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Aucune</SelectItem>
                            <SelectItem value="mandat">Mandat</SelectItem>
                            <SelectItem value="zone_alur">Zone ALUR</SelectItem>
                            <SelectItem value="baux_civil">Baux code civil</SelectItem>
                            <SelectItem value="stationnement">Stationnement</SelectItem>
                            <SelectItem value="commercial">Commercial</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="nom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Gestion Premium, Zone très tendue..." data-testid="input-scale-nom" />
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
                      <FormLabel>Description (optionnelle)</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ''} placeholder="Description du barème" data-testid="textarea-scale-description" rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="trancheMin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tranche min (€)</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} type="number" placeholder="0" data-testid="input-tranche-min" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="trancheMax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tranche max (€)</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} type="number" placeholder="Illimité" data-testid="input-tranche-max" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="honoraires"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Honoraires fixes (€)</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} type="number" step="0.01" placeholder="Ex: 5000" data-testid="input-honoraires" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tauxPourcentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taux (%)</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} type="number" step="0.01" placeholder="Ex: 8" data-testid="input-taux" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="unite"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unité (optionnelle)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-scale-unite">
                              <SelectValue placeholder="Aucune" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Aucune</SelectItem>
                            <SelectItem value="€">€</SelectItem>
                            <SelectItem value="€/m²">€/m²</SelectItem>
                            <SelectItem value="%">%</SelectItem>
                            <SelectItem value="mois_loyer">Mois de loyer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="minimum"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum de facturation (€)</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} type="number" step="0.01" placeholder="Ex: 1000" data-testid="input-minimum" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="annee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Année</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" onChange={e => field.onChange(parseInt(e.target.value))} data-testid="input-annee" />
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
                        <FormLabel>Ordre d'affichage</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" onChange={e => field.onChange(parseInt(e.target.value))} data-testid="input-ordre" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="actif"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-actif"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Barème actif</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Éléments différenciants (uniquement pour mandats de gestion) */}
                {form.watch('type') === 'location' && form.watch('categorie') === 'mandat' && (
                  <div className="space-y-3 rounded-md border p-4">
                    <Label>Éléments différenciants du mandat</Label>
                    <p className="text-xs text-muted-foreground">
                      Ces éléments seront affichés sur la page "Faire gérer" pour décrire ce mandat.
                    </p>
                    
                    {elementsDiff.length > 0 && (
                      <div className="space-y-2">
                        {elementsDiff.map((element, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded">
                            <span className="flex-1">{element}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setElementsDiff(elementsDiff.filter((_, i) => i !== index))}
                              data-testid={`button-remove-element-${index}`}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Input
                        placeholder="Ex: CRG mensuel détaillé"
                        value={newElement}
                        onChange={(e) => setNewElement(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newElement.trim()) {
                              setElementsDiff([...elementsDiff, newElement.trim()]);
                              setNewElement("");
                            }
                          }
                        }}
                        data-testid="input-new-element"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (newElement.trim()) {
                            setElementsDiff([...elementsDiff, newElement.trim()]);
                            setNewElement("");
                          }
                        }}
                        data-testid="button-add-element"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Avantages exclusifs (uniquement pour Mandat Exclusif de vente) */}
                {form.watch('type') === 'vente' && form.watch('nom') === 'Mandat Exclusif' && (
                  <div className="space-y-3 rounded-md border p-4 bg-accent/5">
                    <Label>Avantages exclusifs du Mandat Exclusif</Label>
                    <p className="text-xs text-muted-foreground">
                      Ces avantages seront affichés sur la page "Vendre" pour le Mandat Exclusif uniquement.
                    </p>
                    
                    {avantagesExcl.length > 0 && (
                      <div className="space-y-2">
                        {avantagesExcl.map((avantage, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded">
                            <span className="flex-1">{avantage}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setAvantagesExcl(avantagesExcl.filter((_, i) => i !== index))}
                              data-testid={`button-remove-avantage-${index}`}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Input
                        placeholder="Ex: Diffusion sur tous les portails et marketing renforcé"
                        value={newAvantage}
                        onChange={(e) => setNewAvantage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newAvantage.trim()) {
                              setAvantagesExcl([...avantagesExcl, newAvantage.trim()]);
                              setNewAvantage("");
                            }
                          }
                        }}
                        data-testid="input-new-avantage"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (newAvantage.trim()) {
                            setAvantagesExcl([...avantagesExcl, newAvantage.trim()]);
                            setNewAvantage("");
                          }
                        }}
                        data-testid="button-add-avantage"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={createScale.isPending || updateScale.isPending} data-testid="button-save-scale">
                  {createScale.isPending || updateScale.isPending
                    ? "Enregistrement..."
                    : editingScale
                    ? "Mettre à jour"
                    : "Créer le barème"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-32 animate-pulse bg-muted" />
          ))}
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="transaction" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Vente ({venteScales.length})
            </TabsTrigger>
            <TabsTrigger value="gestion" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Gestion ({locationMandats.length})
            </TabsTrigger>
            <TabsTrigger value="location" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Services ({locationAlur.length + bauxCivil.length + commercial.length + stationnement.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transaction" className="space-y-6">
            <Card className="p-4 bg-accent/5 border-accent/30">
              <div className="flex items-start gap-3">
                <ExternalLink className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium mb-1">Où sont affichés ces barèmes ?</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Page <strong>Vendre</strong> : Cartes "Keylor One" (Mandat Simple) et "Keylor Exclu" (Mandat Exclusif)</li>
                    <li>• Page <strong>Barème</strong> : Section "Transaction Immobilière"</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">💡 Utilisez les templates ci-dessous pour créer automatiquement les paliers de prix</p>
                </div>
              </div>
            </Card>

            {/* Bouton de suppression massive */}
            {venteScales.length > 0 && (
              <Card className="p-4 border-2 border-destructive/30 bg-destructive/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Supprimer tous les barèmes de vente</h3>
                    <p className="text-sm text-muted-foreground">{venteScales.length} barème(s) actuellement en base</p>
                  </div>
                  <Button 
                    onClick={deleteAllVenteScales}
                    variant="destructive"
                    data-testid="button-delete-all-vente-scales"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Tout supprimer
                  </Button>
                </div>
              </Card>
            )}

            {/* Boutons de création de templates */}
            <Card className="p-6 border-2 border-primary/30 bg-primary/5">
              <h3 className="text-lg font-medium mb-4">Créer un barème complet</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    <h4 className="font-medium">Mandat Simple</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 0-50k€ : Forfait 5000€</li>
                    <li>• 50-100k€ : 7.0%</li>
                    <li>• 100-150k€ : 5.0%</li>
                    <li>• 150-200k€ : 4.5%</li>
                    <li>• 200-400k€ : 4.0%</li>
                    <li>• 400-800k€ : 3.5%</li>
                  </ul>
                  <Button 
                    onClick={createMandatSimpleTemplate}
                    className="w-full"
                    data-testid="button-create-mandat-simple-template"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Créer Mandat Simple
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-accent"></div>
                    <h4 className="font-medium">Mandat Exclusif</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 0-50k€ : Forfait 5000€</li>
                    <li>• 50-100k€ : 6.5%</li>
                    <li>• 100-150k€ : 4.5%</li>
                    <li>• 150-200k€ : 4.0%</li>
                    <li>• 200-400k€ : 3.5%</li>
                    <li>• 400-800k€ : 3.0%</li>
                  </ul>
                  <Button 
                    onClick={createMandatExclusifTemplate}
                    variant="outline"
                    className="w-full"
                    data-testid="button-create-mandat-exclusif-template"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Créer Mandat Exclusif
                  </Button>
                </div>
              </div>
            </Card>

            {renderScalesList(venteScales)}

            {/* Section Avis de valeur */}
            <Card className="p-6 border-2 border-accent/40">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-serif">Avis de valeur</h3>
                  <p className="text-sm text-muted-foreground">Tarifs affichés sur la page "Barème" → Section Transaction</p>
                </div>
                {avisValeurScales.length === 0 && (
                  <Button 
                    onClick={createAvisValeurTemplate}
                    size="sm"
                    data-testid="button-create-avis-valeur-template"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Créer les tarifs
                  </Button>
                )}
              </div>
              
              {avisValeurScales.length > 0 ? (
                <div className="space-y-3">
                  {avisValeurScales.map((scale) => (
                    <Card key={scale.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{scale.nom}</h4>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-accent">{formatPrice(scale.honoraires)}</span>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => handleEdit(scale)} 
                              disabled={deleteScale.isPending}
                              data-testid={`button-edit-scale-${scale.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="icon" 
                              onClick={() => handleDelete(scale.id)} 
                              disabled={deleteScale.isPending}
                              data-testid={`button-delete-scale-${scale.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Aucun tarif d'avis de valeur configuré</p>
                  <p className="text-sm mt-2">Cliquez sur "Créer les tarifs" pour initialiser les 4 types de biens</p>
                </div>
              )}
            </Card>

            {/* Section Vacation/Conseil */}
            <Card className="p-6 border-2 border-accent/40">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-serif">Vacation / Conseil</h3>
                  <p className="text-sm text-muted-foreground">Autres prestations (optionnel)</p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setEditingScale(null);
                        form.reset({
                          type: "vente",
                          categorie: "vacation",
                          nom: "",
                          honoraires: undefined,
                          annee: new Date().getFullYear(),
                          ordre: vacationScales.length + 1,
                          actif: true
                        });
                      }}
                      data-testid="button-add-vacation"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
              
              {vacationScales.length > 0 ? (
                <div className="space-y-3">
                  {vacationScales.map((scale) => (
                    <Card key={scale.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{scale.nom}</h4>
                          {scale.description && <p className="text-sm text-muted-foreground">{scale.description}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-bold text-accent">
                            {scale.honoraires ? formatPrice(scale.honoraires) : `${scale.tauxPourcentage}%`}
                          </span>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => handleEdit(scale)} 
                              disabled={deleteScale.isPending}
                              data-testid={`button-edit-scale-${scale.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="icon" 
                              onClick={() => handleDelete(scale.id)} 
                              disabled={deleteScale.isPending}
                              data-testid={`button-delete-scale-${scale.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Aucune vacation ou conseil configurée</p>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="gestion" className="space-y-6">
            <Card className="p-4 bg-accent/5 border-accent/30">
              <div className="flex items-start gap-3">
                <ExternalLink className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium mb-1">Où sont affichés ces barèmes ?</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Page <strong>Faire gérer</strong> : Section "Nos formules de gestion locative"</li>
                    <li>• Page <strong>Barème</strong> : Section "Gestion Locative"</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">💡 Créez des formules avec des taux de gestion (en %) et listez leurs avantages</p>
                </div>
              </div>
            </Card>
            {renderScalesList(locationMandats)}
          </TabsContent>

          <TabsContent value="location" className="space-y-6">
            <Card className="p-4 bg-accent/5 border-accent/30">
              <div className="flex items-start gap-3">
                <ExternalLink className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium mb-1">Où sont affichés ces barèmes ?</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Page <strong>Faire gérer</strong> : Sections "Locaux d'habitation", "Baux code civil", "Commerces", "Stationnement"</li>
                    <li>• Page <strong>Barème</strong> : Section "Location" avec toutes les sous-sections</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">💡 Chaque section ci-dessous correspond à un tableau affiché sur les pages publiques</p>
                </div>
              </div>
            </Card>

            {/* Bouton migration si données existantes */}
            {servicesScales.length > 0 && servicesScales.some(s => !s.factureA) && (
              <Card className="p-6 border-2 border-destructive/30 bg-destructive/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium mb-2 text-destructive">⚠️ Migration requise</h3>
                    <p className="text-sm text-muted-foreground">
                      Vos données ne s'affichent pas sur les pages publiques car elles utilisent l'ancien format.
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Cliquez sur "Migrer" pour convertir automatiquement {servicesScales.filter(s => !s.factureA).length} ligne(s).
                    </p>
                  </div>
                  <Button 
                    onClick={migrateLocationServices}
                    size="lg"
                    variant="destructive"
                    data-testid="button-migrate-services"
                  >
                    <FileCheck className="mr-2 h-4 w-4" />
                    Migrer maintenant
                  </Button>
                </div>
              </Card>
            )}

            {/* Bouton création template complet */}
            {(locationAlur.length === 0 && bauxCivil.length === 0 && commercial.length === 0 && stationnement.length === 0) && (
              <Card className="p-6 border-2 border-primary/30 bg-primary/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Créer le template complet</h3>
                    <p className="text-sm text-muted-foreground">Génère automatiquement la structure pour :</p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>• Locaux d'habitation (Loi ALUR) - 9 lignes avec zones de tension</li>
                      <li>• Baux code civil (hors loi 89-462) - 3 lignes</li>
                      <li>• Stationnement - 2 lignes</li>
                      <li>• Locaux professionnels et commerciaux - 3 lignes</li>
                    </ul>
                    <p className="text-xs text-muted-foreground mt-2 italic">Total : 17 lignes pré-remplies avec les tarifs réglementaires</p>
                  </div>
                  <Button 
                    onClick={createLocationTemplate}
                    size="lg"
                    data-testid="button-create-location-template"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Créer le template
                  </Button>
                </div>
              </Card>
            )}

            {/* Section 1: Locaux d'habitation ALUR */}
            <Card className="p-6 mb-6 border-accent/40 border-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-serif">Locaux d'habitation (Loi ALUR)</h3>
                  <p className="text-sm text-muted-foreground">
                    Tarifs ALUR affichés sur "Faire gérer" et "Barème" → Section Location
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={() => {
                      setEditingScale(null);
                      form.reset({
                        type: "location_services",
                        categorie: "zone_alur",
                        nom: "",
                        honoraires: undefined,
                        tauxPourcentage: undefined,
                        unite: "€/m²",
                        annee: new Date().getFullYear(),
                        ordre: locationAlur.length + 1,
                        actif: true
                      });
                    }}>
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Ajouter une ligne ALUR</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="nom"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Libellé</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Ex: Zone très tendue" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="factureA"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Facturé à</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sélectionnez" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="proprietaire">Propriétaire</SelectItem>
                                  <SelectItem value="locataire">Locataire</SelectItem>
                                  <SelectItem value="les_deux">Les deux</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="honoraires"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tarif</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ''} type="number" step="0.01" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="unite"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Unité</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || "€/m²"}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="€/m²">€/m²</SelectItem>
                                    <SelectItem value="%">%</SelectItem>
                                    <SelectItem value="€">€</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button type="submit" className="w-full">Ajouter</Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              {renderScalesList(locationAlur)}
            </Card>

            {/* Section 2: Locaux hors ALUR (baux civil + stationnement) */}
            <Card className="p-6 mb-6 border-accent/40 border-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-serif">Locaux hors ALUR</h3>
                  <p className="text-sm text-muted-foreground">
                    Baux code civil + Stationnement
                  </p>
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => {
                        setEditingScale(null);
                        form.reset({
                          type: "location_services",
                          categorie: "baux_civil",
                          nom: "",
                          honoraires: undefined,
                          unite: "mois_loyer",
                          annee: new Date().getFullYear(),
                          ordre: bauxCivil.length + 1,
                          actif: true
                        });
                      }}>
                        <Plus className="h-4 w-4 mr-1" />
                        Baux civil
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Ajouter baux code civil</DialogTitle>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="nom"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Libellé</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Ex: Bailleur" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="factureA"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Facturé à</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || ""}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Sélectionnez" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="proprietaire">Propriétaire</SelectItem>
                                    <SelectItem value="locataire">Locataire</SelectItem>
                                    <SelectItem value="les_deux">Les deux</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="honoraires"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Tarif</FormLabel>
                                  <FormControl>
                                    <Input {...field} value={field.value || ''} type="number" step="0.01" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="unite"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Unité</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value || "mois_loyer"}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="mois_loyer">Mois loyer</SelectItem>
                                      <SelectItem value="€">€</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <Button type="submit" className="w-full">Ajouter</Button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => {
                        setEditingScale(null);
                        form.reset({
                          type: "location_services",
                          categorie: "stationnement",
                          nom: "",
                          honoraires: undefined,
                          unite: "mois_loyer",
                          annee: new Date().getFullYear(),
                          ordre: stationnement.length + 1,
                          actif: true
                        });
                      }}>
                        <Plus className="h-4 w-4 mr-1" />
                        Stationnement
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Ajouter stationnement</DialogTitle>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="nom"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Libellé</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Ex: Locataire" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="factureA"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Facturé à</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || ""}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Sélectionnez" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="proprietaire">Propriétaire</SelectItem>
                                    <SelectItem value="locataire">Locataire</SelectItem>
                                    <SelectItem value="les_deux">Les deux</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="honoraires"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Tarif</FormLabel>
                                  <FormControl>
                                    <Input {...field} value={field.value || ''} type="number" step="0.01" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="unite"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Unité</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value || "mois_loyer"}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="mois_loyer">Mois loyer</SelectItem>
                                      <SelectItem value="€">€</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <Button type="submit" className="w-full">Ajouter</Button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {bauxCivil.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2">Baux code civil</h4>
                  {renderScalesList(bauxCivil)}
                </div>
              )}

              {stationnement.length > 0 && (
                <div className={bauxCivil.length > 0 ? "pt-4 border-t" : ""}>
                  <h4 className="text-sm font-semibold mb-2">Stationnement</h4>
                  {renderScalesList(stationnement)}
                </div>
              )}
            </Card>

            {/* Section 3: Locaux commerciaux */}
            <Card className="p-6 mb-6 border-accent/40 border-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-serif">Locaux commerciaux</h3>
                  <p className="text-sm text-muted-foreground">
                    Gérer les lignes de facturation commerciales
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={() => {
                      setEditingScale(null);
                      form.reset({
                        type: "location_services",
                        categorie: "commercial",
                        nom: "",
                        honoraires: undefined,
                        tauxPourcentage: undefined,
                        unite: "%",
                        minimum: undefined,
                        annee: new Date().getFullYear(),
                        ordre: commercial.length + 1,
                        actif: true
                      });
                    }}>
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Ajouter ligne commerciale</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="nom"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Libellé</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Ex: Recherche locataire" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="factureA"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Facturé à</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sélectionnez" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="proprietaire">Propriétaire</SelectItem>
                                  <SelectItem value="locataire">Locataire</SelectItem>
                                  <SelectItem value="les_deux">Les deux</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="tauxPourcentage"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Taux %</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ''} type="number" step="0.01" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="minimum"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Minimum (optionnel)</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ''} type="number" step="0.01" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button type="submit" className="w-full">Ajouter</Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              {renderScalesList(commercial)}
            </Card>

            {/* Autres services location */}
            {renderScalesList(servicesScales)}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
