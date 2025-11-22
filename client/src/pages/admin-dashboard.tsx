import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { LogOut, Building2, Calendar, Mail, Images, BarChart3, DollarSign, Users, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Composants admin existants
import { HeroImagesAdmin } from "@/components/hero-images-admin";
import { PricingScalesAdmin } from "@/components/pricing-scales-admin";
import { ContactCarouselAdmin } from "@/components/contact-carousel-admin";
import { SocialReviewsAdmin } from "@/components/social-reviews-admin";
import { StudyApplications } from "@/components/study-applications";
import { PlanningAdmin } from "@/components/planning-admin";
import { ConfigPdfsAdmin } from "@/components/config-pdfs-admin";

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

  const { data: contacts = [] } = useQuery({
    queryKey: ["/api/contacts"],
  }) as any;

  // Stats
  const saleProperties = (properties as any[])?.filter(p => p.transactionType === "vente").length || 0;
  const rentalProperties = (properties as any[])?.filter(p => p.transactionType === "location").length || 0;
  const seasonalProperties = (properties as any[])?.filter(p => p.transactionType === "location_saisonniere").length || 0;
  const pendingBookings = (bookings as any[])?.filter(b => b.status === "en_attente").length || 0;
  const confirmedBookings = (bookings as any[])?.filter(b => b.status === "confirmee").length || 0;
  const pendingAppointments = (appointments as any[])?.filter(a => a.statut === "en_attente").length || 0;
  const recentContacts = (contacts as any[])?.slice(0, 3) || [];
  const recentProperties = (properties as any[])?.slice(0, 3) || [];
  const recentAppointments = (appointments as any[])?.slice(0, 3) || [];

  const thisMonth = new Date();
  const monthName = thisMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Vue d'ensemble</h3>
        <div className="grid grid-cols-4 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total des propriétés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{(properties as any[])?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {saleProperties} vente · {rentalProperties} location
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Visites programmées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{(appointments as any[])?.length || 0}</div>
              <p className="text-xs text-yellow-600 font-medium mt-1">{pendingAppointments} à traiter</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">À traiter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{(contacts as any[])?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">demandes de contact</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Ce mois-ci</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingBookings}</div>
              <p className="text-xs text-yellow-600 font-medium mt-1">réservations en attente</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <span>⚡ Actions rapides</span>
        </h3>
        <p className="text-sm text-muted-foreground mb-4">Accédez rapidement aux fonctionnalités principales</p>
        <div className="grid grid-cols-4 gap-3">
          <div
            className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left"
          >
            <p className="text-sm font-semibold">Ajouter un bien</p>
            <p className="text-xs text-muted-foreground">Nouvelle propriété</p>
          </div>
          <div
            className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left"
          >
            <p className="text-sm font-semibold">Réservations</p>
            <p className="text-xs text-muted-foreground">Locations saisonnières</p>
          </div>
          <div
            className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left"
          >
            <p className="text-sm font-semibold">Demandes</p>
            <p className="text-xs text-muted-foreground">Contacts et visites</p>
          </div>
          <div
            className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left"
          >
            <p className="text-sm font-semibold">Paramètres</p>
            <p className="text-xs text-muted-foreground">Configuration</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-3 gap-6">
        {/* Recent Contacts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Dernières demandes de contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentContacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune demande</p>
            ) : (
              recentContacts.map((contact: any) => (
                <div
                  key={contact.id}
                  className="bg-muted/50 rounded-lg p-3"
                >
                  <p className="font-semibold text-sm">{contact.nom}</p>
                  <p className="text-xs text-muted-foreground">{contact.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(contact.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                  <Badge className="mt-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                    {contact.sujet}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Properties */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Dernières mises à jour de biens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentProperties.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune annonce</p>
            ) : (
              recentProperties.map((property: any) => (
                <div
                  key={property.id}
                  className="bg-muted/50 rounded-lg p-3"
                >
                  <p className="font-semibold text-sm">{property.titre?.slice(0, 30)}...</p>
                  <p className="text-xs text-muted-foreground">{property.transactionType}</p>
                  <p className="font-bold text-sm mt-1">{property.prix}€</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(property.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Appointments */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Derniers rendez-vous</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun rendez-vous</p>
            ) : (
              recentAppointments.map((apt: any) => (
                <div
                  key={apt.id}
                  className="bg-muted/50 rounded-lg p-3"
                >
                  <p className="font-semibold text-sm">{apt.nom}</p>
                  <p className="text-xs text-muted-foreground">{apt.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {apt.date} à {apt.heure}
                  </p>
                  <Badge
                    className={`mt-2 text-xs ${
                      apt.statut === "confirmé"
                        ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200"
                    }`}
                  >
                    {apt.statut || "nouveau"}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const ConfigAdmin = () => {
  const { toast } = useToast();
  const [minimumValue, setMinimumValue] = useState("");
  
  const { data: configData } = useQuery<{ minimum: number }>({
    queryKey: ["/api/config/minimum-sale-fee"],
    queryFn: async () => {
      const res = await fetch("/api/config/minimum-sale-fee");
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
  });

  useEffect(() => {
    if (configData?.minimum) {
      setMinimumValue(configData.minimum.toString());
    }
  }, [configData]);

  const updateMutation = useMutation({
    mutationFn: async (value: number) => {
      const res = await fetch("/api/config/minimum-sale-fee", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ minimum: value }),
      });
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Configuration mise à jour" });
    },
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Configuration générale</h3>
      <div className="border rounded-lg p-4 space-y-3">
        <label className="block text-sm font-medium">Montant minimum pour honoraires de vente (€)</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={minimumValue}
            onChange={(e) => setMinimumValue(e.target.value)}
            className="flex-1 px-3 py-2 border rounded text-sm"
            placeholder="4500"
            data-testid="input-minimum-fee"
          />
          <Button
            onClick={() => updateMutation.mutate(parseInt(minimumValue) || 4500)}
            disabled={updateMutation.isPending}
            size="sm"
            data-testid="button-save-minimum"
          >
            {updateMutation.isPending ? "Sauvegarde..." : "Enregistrer"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Valeur actuelle: {configData?.minimum || 4500} €</p>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [activeTab, setActiveTab] = useState("stats");

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
          <h1 className="text-2xl font-bold mb-2 text-gray-900">Mon compte</h1>
          <p className="text-gray-600 mb-6">Espace privé - Gestion KEYLOR</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
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

  const navItems = [
    { id: "stats", icon: BarChart3, label: "Tableau" },
    { id: "properties", icon: Building2, label: "Annonces" },
    { id: "appointments", icon: Calendar, label: "Visites" },
    { id: "contacts", icon: Mail, label: "Contacts" },
    { id: "bookings", icon: DollarSign, label: "Réservations" },
    { id: "images", icon: Images, label: "Images" },
    { id: "estimation", icon: Users, label: "IA" },
    { id: "planning", icon: Calendar, label: "Planning" },
    { id: "settings", icon: Settings, label: "Config" },
    { id: "applications", icon: Mail, label: "Dossiers" },
  ];

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

      <div className="flex min-h-[calc(100vh-150px)]">
        {/* Sidebar navigation */}
        <div className="w-48 border-r bg-muted/30 p-4 overflow-y-auto">
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
                    activeTab === item.id
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent"
                  }`}
                  data-testid={`button-nav-${item.id}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-8">

          <div style={{ display: activeTab === "stats" ? "block" : "none" }}>
            <Card>
              <CardHeader>
                <CardTitle>Statistiques globales</CardTitle>
                <CardDescription>Aperçu de votre activité KEYLOR</CardDescription>
              </CardHeader>
              <CardContent>
                <StatsAdmin />
              </CardContent>
            </Card>
          </div>

          <div style={{ display: activeTab === "properties" ? "block" : "none" }}>
            <PropertiesAdmin />
          </div>

          <div style={{ display: activeTab === "appointments" ? "block" : "none" }}>
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
          </div>

          <div style={{ display: activeTab === "contacts" ? "block" : "none" }}>
            <ContactsAdmin />
          </div>

          <div style={{ display: activeTab === "bookings" ? "block" : "none" }}>
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
          </div>

          <div style={{ display: activeTab === "images" ? "block" : "none" }}>
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
          </div>

          <div style={{ display: activeTab === "estimation" ? "block" : "none" }}>
            <Card>
              <CardHeader>
                <CardTitle>Outils IA et calculettes</CardTitle>
                <CardDescription>Estimations, simulations crédit, modules avancés</CardDescription>
              </CardHeader>
              <CardContent>
                <ToolsAdmin />
              </CardContent>
            </Card>
          </div>

          <div style={{ display: activeTab === "planning" ? "block" : "none" }}>
            <Card>
              <CardHeader>
                <CardTitle>Planning Visites & Réservations</CardTitle>
                <CardDescription>Calendrier, codes couleur, exports (Excel/PDF) et partage email</CardDescription>
              </CardHeader>
              <CardContent>
                <PlanningAdmin />
              </CardContent>
            </Card>
          </div>

          <div style={{ display: activeTab === "settings" ? "block" : "none" }}>
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Paramètres généraux</CardTitle>
                </CardHeader>
                <CardContent>
                  <ConfigAdmin />
                </CardContent>
              </Card>

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

              <Card>
                <CardHeader>
                  <CardTitle>Documents légaux (PDFs)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ConfigPdfsAdmin />
                </CardContent>
              </Card>
            </div>
          </div>

          <div style={{ display: activeTab === "applications" ? "block" : "none" }}>
            <Card>
              <CardHeader>
                <CardTitle>Étude des dossiers de candidature</CardTitle>
                <CardDescription>Gestion, scoring et solvabilité des candidatures locataires</CardDescription>
              </CardHeader>
              <CardContent>
                <StudyApplications />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
