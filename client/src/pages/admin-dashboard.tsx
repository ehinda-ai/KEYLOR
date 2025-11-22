import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { LogOut, Building2, Calendar, Mail, Images, BarChart3, DollarSign, Users, Settings } from "lucide-react";

// Composants admin existants
import { HeroImagesAdmin } from "@/components/hero-images-admin";
import { PricingScalesAdmin } from "@/components/pricing-scales-admin";
import { ContactCarouselAdmin } from "@/components/contact-carousel-admin";
import { SocialReviewsAdmin } from "@/components/social-reviews-admin";

// Composants à créer
const PropertiesAdmin = () => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold">Gestion des annonces</h3>
    <p className="text-sm text-muted-foreground">Module de gestion des propriétés à vendre, louer et locations saisonnières</p>
    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md text-sm">
      Intégration en cours - Routes API déjà disponibles : GET/POST /api/properties, PATCH/DELETE
    </div>
  </div>
);

const AppointmentsAdmin = () => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold">Gestion des rendez-vous</h3>
    <p className="text-sm text-muted-foreground">Créneaux de visite, disponibilités, réservations</p>
    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md text-sm">
      Routes API : GET/POST /api/appointments, PATCH/DELETE /api/appointments/:id
    </div>
  </div>
);

const ContactsAdmin = () => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold">Gestion des contacts</h3>
    <p className="text-sm text-muted-foreground">Demandes de contact, messages clients</p>
    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md text-sm">
      Routes API : GET /api/contacts, POST/PATCH/DELETE /api/contacts/:id
    </div>
  </div>
);

const BookingsAdmin = () => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold">Gestion des réservations saisonnières</h3>
    <p className="text-sm text-muted-foreground">Demandes de réservation, confirmations, refus</p>
    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md text-sm">
      Routes API : GET /api/seasonal-booking-requests, PUT/:id/confirm, PUT/:id/refuse, PUT/:id/cancel
    </div>
  </div>
);

const EstimationsAdmin = () => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold">Estimations IA</h3>
    <p className="text-sm text-muted-foreground">Estimations de propriétés avec OpenAI</p>
    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md text-sm">
      Route API : POST /api/estimate-ai (disponible)
    </div>
  </div>
);

const AlertsAdmin = () => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold">Alertes propriétés</h3>
    <p className="text-sm text-muted-foreground">Alertes clients basées sur critères de recherche</p>
    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md text-sm">
      Routes API : GET/POST /api/property-alerts, PATCH/DELETE
    </div>
  </div>
);

const StatsAdmin = () => {
  const { data: properties = [] } = useQuery({
    queryKey: ["/api/properties"],
  }) as any;

  const { data: bookings = [] } = useQuery({
    queryKey: ["/api/seasonal-booking-requests"],
  }) as any;

  const { data: appointments = [] } = useQuery({
    queryKey: ["/api/appointments"],
  }) as any;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Tableau de bord</h3>
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Annonces</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(properties as any[])?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Réservations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(bookings as any[])?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rendez-vous</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(appointments as any[])?.length || 0}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showLoginForm, setShowLoginForm] = useState(false);

  useEffect(() => {
    // Vérifier si authentifié (via session)
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/check-auth");
        setIsAuthenticated(response.ok);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (response.ok) {
        setIsAuthenticated(true);
        setShowLoginForm(false);
        setPassword("");
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      setIsAuthenticated(false);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Accès Admin</CardTitle>
            <CardDescription>Mon compte - Gestion KEYLOR</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Mot de passe administrateur</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  placeholder="Entrez le mot de passe"
                  data-testid="input-admin-password"
                />
              </div>
              <Button type="submit" className="w-full" data-testid="button-admin-login">
                Accéder à mon compte
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mon compte - KEYLOR Admin</h1>
            <p className="text-sm text-muted-foreground">Gestion complète de votre agence immobilière</p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="gap-2"
            data-testid="button-admin-logout"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="stats" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Tableau</span>
            </TabsTrigger>
            <TabsTrigger value="properties" className="gap-2">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Annonces</span>
            </TabsTrigger>
            <TabsTrigger value="appointments" className="gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Visites</span>
            </TabsTrigger>
            <TabsTrigger value="contacts" className="gap-2">
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Contacts</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="gap-2">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Réservations</span>
            </TabsTrigger>
            <TabsTrigger value="images" className="gap-2">
              <Images className="w-4 h-4" />
              <span className="hidden sm:inline">Images</span>
            </TabsTrigger>
            <TabsTrigger value="estimation" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">IA</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Config</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Statistiques globales</CardTitle>
                <CardDescription>Aperçu de votre activité KEYLOR</CardDescription>
              </CardHeader>
              <CardContent>
                <StatsAdmin />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="properties" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des annonces</CardTitle>
                <CardDescription>Ventes, locations, locations saisonnières</CardDescription>
              </CardHeader>
              <CardContent>
                <PropertiesAdmin />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des visites</CardTitle>
                <CardDescription>Créneau de visites et rendez-vous</CardDescription>
              </CardHeader>
              <CardContent>
                <AppointmentsAdmin />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Messages et contacts</CardTitle>
                <CardDescription>Demandes de contact, alertes</CardDescription>
              </CardHeader>
              <CardContent>
                <ContactsAdmin />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Réservations saisonnières</CardTitle>
                <CardDescription>Gestion des demandes de réservation</CardDescription>
              </CardHeader>
              <CardContent>
                <BookingsAdmin />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="images" className="space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Images du carrousel accueil</CardTitle>
                </CardHeader>
                <CardContent>
                  <HeroImagesAdmin />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Images du carrousel contact</CardTitle>
                </CardHeader>
                <CardContent>
                  <ContactCarouselAdmin />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="estimation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Estimations & Outils IA</CardTitle>
                <CardDescription>Estimations de propriétés, simulations de crédit</CardDescription>
              </CardHeader>
              <CardContent>
                <EstimationsAdmin />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Barèmes et tarifs</CardTitle>
                </CardHeader>
                <CardContent>
                  <PricingScalesAdmin />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Réseaux sociaux & avis</CardTitle>
                </CardHeader>
                <CardContent>
                  <SocialReviewsAdmin />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
