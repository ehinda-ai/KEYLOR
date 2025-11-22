import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useSearch } from "wouter";
import { Property, insertSeasonalBookingRequestSchema, InsertSeasonalBookingRequest } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppointmentForm } from "@/components/appointment-form";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MapPin,
  Maximize,
  Bed,
  Home,
  ArrowLeft,
  Calendar as CalendarIcon,
  Mail,
  FileText,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState, useEffect, useMemo } from "react";
import { AmenitiesIcons, CapacityInfo, PolicyBadges, IncludedServices } from "@/components/AmenitiesIcons";
import { SeasonalBookingCard } from "@/components/SeasonalBookingCard";
import { RentalApplicationForm } from "@/components/rental-application-form";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { resolveImageUrl } from "@/lib/imageUrl";

export default function PropertyDetailPage() {
  const [, params] = useRoute("/proprietes/:id");
  const searchString = useSearch();
  const searchParams = useMemo(() => new URLSearchParams(searchString), [searchString]);
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [rentalApplicationOpen, setRentalApplicationOpen] = useState(false);
  
  const checkInParam = searchParams.get('checkIn');
  const checkOutParam = searchParams.get('checkOut');
  
  const [dateArrivee, setDateArrivee] = useState<Date | undefined>(
    checkInParam ? new Date(checkInParam) : undefined
  );
  const [dateDepart, setDateDepart] = useState<Date | undefined>(
    checkOutParam ? new Date(checkOutParam) : undefined
  );
  
  const { toast } = useToast();

  const { data: property, isLoading } = useQuery<Property>({
    queryKey: ["/api/properties", params?.id],
    enabled: !!params?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 px-6">
        <div className="container mx-auto max-w-7xl">
          <Card className="h-[600px] animate-pulse bg-muted" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen py-8 px-6">
        <div className="container mx-auto max-w-7xl text-center">
          <h1 className="text-3xl font-serif mb-4">Propriété non trouvée</h1>
          <Link href="/proprietes">
            <Button variant="outline">Retour aux propriétés</Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(parseFloat(price));
  };

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="container mx-auto max-w-7xl">
        <Link href="/nos-offres">
          <Button variant="ghost" className="mb-6" data-testid="button-back">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux offres
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="mb-6">
              {property.photos.length > 0 ? (
                <div className="space-y-4">
                  <div className="relative aspect-[16/9] overflow-hidden rounded-lg">
                    <img
                      src={resolveImageUrl(property.photos[selectedImageIndex]) || '/placeholder.jpg'}
                      alt={`${property.titre} - Image ${selectedImageIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {property.photos.length > 1 && (
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                      {property.photos.map((photo, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`relative aspect-video overflow-hidden rounded-md hover-elevate transition-all ${
                            selectedImageIndex === index ? "ring-2 ring-accent" : ""
                          }`}
                          data-testid={`button-thumbnail-${index}`}
                        >
                          <img
                            src={resolveImageUrl(photo) || '/placeholder.jpg'}
                            alt={`Miniature ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-[16/9] bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Aucune image disponible</p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Badge>
                    {property.type.charAt(0).toUpperCase() + property.type.slice(1)}
                  </Badge>
                  {property.featured && (
                    <Badge className="bg-accent/10 text-accent">En vedette</Badge>
                  )}
                  {property.badge === "exclusivite" && (
                    <Badge className="bg-accent text-white">Exclusivité</Badge>
                  )}
                  {property.badge === "nouveaute" && (
                    <Badge className="bg-primary text-white">Nouveauté</Badge>
                  )}
                  {property.badge === "coup_de_coeur" && (
                    <Badge className="bg-rose-500 text-white">Coup de cœur</Badge>
                  )}
                </div>

                <h1 className="text-4xl md:text-5xl font-serif font-light mb-4">
                  {property.titre}
                </h1>

                <div className="flex items-center gap-2 text-muted-foreground mb-6">
                  <MapPin className="h-5 w-5" />
                  <span className="text-lg">{property.localisation}</span>
                </div>

                <p className="text-5xl font-serif font-light text-accent mb-8">
                  {formatPrice(property.prix)}
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <Maximize className="h-6 w-6 mx-auto mb-2 text-accent" />
                  <p className="text-2xl font-serif mb-1">{property.surface}</p>
                  <p className="text-sm text-muted-foreground">m²</p>
                </div>
                {property.pieces && (
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <Home className="h-6 w-6 mx-auto mb-2 text-accent" />
                    <p className="text-2xl font-serif mb-1">{property.pieces}</p>
                    <p className="text-sm text-muted-foreground">pièces</p>
                  </div>
                )}
                {property.chambres && (
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <Bed className="h-6 w-6 mx-auto mb-2 text-accent" />
                    <p className="text-2xl font-serif mb-1">{property.chambres}</p>
                    <p className="text-sm text-muted-foreground">chambres</p>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <h2 className="text-2xl font-serif font-normal mb-4">Description</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {property.description}
                </p>
              </div>

              <Separator />

              <div>
                <h2 className="text-2xl font-serif font-normal mb-4">Localisation</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>Ville :</strong> {property.ville}</p>
                  <p><strong>Code postal :</strong> {property.codePostal}</p>
                  <p><strong>Adresse :</strong> {property.localisation}</p>
                </div>
              </div>

              {property.transactionType === "location_saisonniere" && (
                <>
                  <Separator />
                  <div>
                    <h2 className="text-2xl font-serif font-normal mb-4">Tarification saisonnière</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {property.prixBasseSaison && (
                        <div className="p-4 bg-accent/5 rounded-lg border border-accent/20">
                          <p className="text-sm text-muted-foreground mb-1">Basse saison</p>
                          <p className="text-2xl font-serif text-accent">{formatPrice(property.prixBasseSaison)}</p>
                          <p className="text-sm text-muted-foreground">par semaine</p>
                        </div>
                      )}
                      {property.prixMoyenneSaison && (
                        <div className="p-4 bg-accent/5 rounded-lg border border-accent/20">
                          <p className="text-sm text-muted-foreground mb-1">Moyenne saison</p>
                          <p className="text-2xl font-serif text-accent">{formatPrice(property.prixMoyenneSaison)}</p>
                          <p className="text-sm text-muted-foreground">par semaine</p>
                        </div>
                      )}
                      {property.prixHauteSaison && (
                        <div className="p-4 bg-accent/5 rounded-lg border border-accent/20">
                          <p className="text-sm text-muted-foreground mb-1">Haute saison</p>
                          <p className="text-2xl font-serif text-accent">{formatPrice(property.prixHauteSaison)}</p>
                          <p className="text-sm text-muted-foreground">par semaine</p>
                        </div>
                      )}
                    </div>
                    
                    {(property.depotGarantie || property.taxeSejour || property.personnesMax) && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        {property.depotGarantie && (
                          <div className="p-3 bg-muted/30 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Dépôt de garantie</p>
                            <p className="font-medium">{formatPrice(property.depotGarantie)}</p>
                          </div>
                        )}
                        {property.taxeSejour && (
                          <div className="p-3 bg-muted/30 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Taxe de séjour</p>
                            <p className="font-medium">{formatPrice(property.taxeSejour)} / pers / nuit</p>
                          </div>
                        )}
                        {property.personnesMax && (
                          <div className="p-3 bg-muted/30 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Capacité maximum</p>
                            <p className="font-medium">{property.personnesMax} personnes</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Separator />
                  <div>
                    <h2 className="text-2xl font-serif font-normal mb-4">Capacité & Équipements</h2>
                    <div className="space-y-4">
                      <CapacityInfo property={property} />
                      <AmenitiesIcons property={property} variant="detailed" />
                    </div>
                  </div>

                  <Separator />
                  <div>
                    <IncludedServices property={property} />
                  </div>

                  <Separator />
                  <div>
                    <h2 className="text-2xl font-serif font-normal mb-4">Règles de location</h2>
                    <PolicyBadges property={property} />
                    <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Informations sur les risques</p>
                      <a 
                        href="https://www.georisques.gouv.fr" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-accent hover:underline font-medium"
                      >
                        Consulter les risques sur Géorisques.gouv.fr →
                      </a>
                    </div>
                  </div>
                </>
              )}

              {(property.dpe || property.ges || property.honoraires || property.taxeFonciere || property.copropriete || property.anneeConstruction) && (
                <>
                  <Separator />
                  <div>
                    <h2 className="text-2xl font-serif font-normal mb-4">Informations légales</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {property.dpe && (
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">DPE (Classe énergétique)</p>
                          <p className="font-medium">Classe {property.dpe}</p>
                        </div>
                      )}
                      {property.ges && (
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">GES (Émissions de gaz)</p>
                          <p className="font-medium">Classe {property.ges}</p>
                        </div>
                      )}
                      {property.anneeConstruction && (
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Année de construction</p>
                          <p className="font-medium">{property.anneeConstruction}</p>
                        </div>
                      )}
                      {property.honoraires && (
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Honoraires</p>
                          <p className="font-medium">À la charge de l'{property.honoraires}</p>
                          {property.montantHonoraires && (
                            <p className="text-sm mt-1">{formatPrice(property.montantHonoraires)}</p>
                          )}
                        </div>
                      )}
                      {property.taxeFonciere && (
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Taxe foncière</p>
                          <p className="font-medium">{formatPrice(property.taxeFonciere)} / an</p>
                        </div>
                      )}
                      {property.copropriete && (
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Copropriété</p>
                          <p className="font-medium">Oui</p>
                          {property.nombreLots && (
                            <p className="text-sm mt-1">{property.nombreLots} lots</p>
                          )}
                          {property.chargesAnnuelles && (
                            <p className="text-sm mt-1">Charges : {formatPrice(property.chargesAnnuelles)} / an</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="space-y-4">
              {property.transactionType === "location_saisonniere" ? (
                <SeasonalBookingCard 
                  property={property} 
                  dateArrivee={dateArrivee}
                  setDateArrivee={setDateArrivee}
                  dateDepart={dateDepart}
                  setDateDepart={setDateDepart}
                />
              ) : (
                <>
                  <Card className="p-6">
                    <h3 className="text-xl font-serif font-normal mb-6">
                      Intéressé par ce bien ?
                    </h3>
                    
                    <div className="space-y-3">
                      <Dialog open={appointmentDialogOpen} onOpenChange={setAppointmentDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="w-full" size="lg" data-testid="button-request-visit">
                            <CalendarIcon className="mr-2 h-5 w-5" />
                            Demander une visite
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
                          <DialogHeader className="px-6 pt-6">
                            <DialogTitle className="text-2xl font-serif">Planifier votre visite</DialogTitle>
                            <DialogDescription className="text-base">
                              Sélectionnez un créneau disponible pour visiter <strong>{property.titre}</strong>
                            </DialogDescription>
                          </DialogHeader>
                          <div className="overflow-y-auto px-6 pb-6">
                            <AppointmentForm
                              propertyId={property.id}
                              onSuccess={() => setAppointmentDialogOpen(false)}
                            />
                          </div>
                        </DialogContent>
                      </Dialog>

                      {property.transactionType === "location" && (
                        <Button 
                          variant="default" 
                          className="w-full" 
                          size="lg" 
                          onClick={() => setRentalApplicationOpen(true)}
                          data-testid="button-deposit-application"
                        >
                          <FileText className="mr-2 h-5 w-5" />
                          Déposer votre dossier de candidature
                        </Button>
                      )}

                      <Link href={`/contact?propertyId=${property.id}`}>
                        <Button variant="outline" className="w-full" size="lg" data-testid="button-contact-property">
                          <Mail className="mr-2 h-5 w-5" />
                          Nous contacter
                        </Button>
                      </Link>
                    </div>
                  </Card>

                  <Card className="p-6 bg-accent/5">
                    <h4 className="font-serif font-normal mb-3">Besoin d'aide ?</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Nos experts sont disponibles pour répondre à toutes vos questions
                    </p>
                    <div className="space-y-2 text-sm">
                      <p className="font-medium">📞 01 23 45 67 89</p>
                      <p className="font-medium">✉️ contact@keylor.fr</p>
                    </div>
                  </Card>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire de candidature location */}
      {property && (property.transactionType === "location" || property.transactionType === "location_saisonniere") && (
        <RentalApplicationForm
          property={property}
          open={rentalApplicationOpen}
          onOpenChange={setRentalApplicationOpen}
        />
      )}
    </div>
  );
}
