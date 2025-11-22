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

// Composants CRUD nouveaux
import { PropertiesAdmin } from "@/components/properties-admin";
import { AppointmentsAdmin } from "@/components/appointments-admin";
import { ContactsAdmin } from "@/components/contacts-admin";
import { BookingsAdmin } from "@/components/bookings-admin";
import { VisitAvailabilityAdmin } from "@/components/visit-availability-admin";
import { SeasonalAvailabilityAdmin } from "@/components/seasonal-availability-admin";

const ToolsAdmin = () => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold">Outils IA et calculettes</h3>
    <div className="grid grid-cols-2 gap-4">
      <div className="border rounded-lg p-4">
        <h4 className="font-semibold text-sm mb-2">Estimations AI</h4>
        <p className="text-xs text-muted-foreground mb-3">API pour estimer les propriétés avec OpenAI</p>
        <div className="text-xs bg-blue-50 dark:bg-blue-950 p-2 rounded font-mono">
          POST /api/estimate-ai
        </div>
      </div>
      <div className="border rounded-lg p-4">
        <h4 className="font-semibold text-sm mb-2">Simulations crédit</h4>
        <p className="text-xs text-muted-foreground mb-3">Calculs de simulation de crédit immobilier</p>
        <div className="text-xs bg-blue-50 dark:bg-blue-950 p-2 rounded font-mono">
          GET /api/loan-simulations
        </div>
      </div>
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
        const response = await fetch("/api/admin/check-auth", { credentials: "include" });
        if (response.status === 401) {
          setIsAuthenticated(false);
          return;
        }
        const data = await response.json();
        setIsAuthenticated(data.authenticated === true);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
    // Vérifier l'auth toutes les 30 secondes
    const interval = setInterval(checkAuth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      if (response.ok) {
        setIsAuthenticated(true);
        setShowLoginForm(false);
        setPassword("");
      } else {
        const error = await response.json();
        console.error("Login failed:", error.error);
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { 
        method: "POST",
        credentials: "include"
      });
      setIsAuthenticated(false);
      // Attendre un peu puis rediriger
      setTimeout(() => navigate("/"), 500);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4 -mt-20">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-2 text-gray-900">Accès Admin</h1>
          <p className="text-gray-600 mb-6">Mon compte - Gestion KEYLOR</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe administrateur</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Entrez le mot de passe"
                data-testid="input-admin-password"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 transition"
              data-testid="button-admin-login"
            >
              Accéder à mon compte
            </button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md font-medium hover:bg-gray-300 transition"
              data-testid="button-admin-back-home"
            >
              ← Retour à l'accueil
            </button>
          </form>
        </div>
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
            <PropertiesAdmin />
          </TabsContent>

          <TabsContent value="appointments" className="space-y-4">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Rendez-vous de visite</h2>
                <AppointmentsAdmin />
              </div>
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">Configuration des créneaux</h2>
                <VisitAvailabilityAdmin />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contacts" className="space-y-4">
            <ContactsAdmin />
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Demandes de réservation</h2>
                <BookingsAdmin />
              </div>
              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold mb-4">Gestion des saisons</h2>
                <SeasonalAvailabilityAdmin />
              </div>
            </div>
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
                <CardTitle>Outils IA et calculettes</CardTitle>
                <CardDescription>Estimations, simulations crédit, modules avancés</CardDescription>
              </CardHeader>
              <CardContent>
                <ToolsAdmin />
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
