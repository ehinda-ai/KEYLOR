import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { ScrollToTop } from "@/components/scroll-to-top";
import { CookieConsent } from "@/components/cookie-consent";
import HomePage from "@/pages/home";
import NosOffresPage from "@/pages/nos-offres";
import VendrePage from "@/pages/vendre";
import GestionLocationPage from "@/pages/gestion-location";
import RendezVousPage from "@/pages/rendez-vous";
import PropertyDetailPage from "@/pages/property-detail";
import ContactPage from "@/pages/contact";
import BaremePage from "@/pages/bareme";
import EstimationIAPage from "@/pages/estimation-ia";
import AdminDashboard from "@/pages/admin-dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/nos-offres" component={NosOffresPage} />
      <Route path="/acheter" component={NosOffresPage} />
      <Route path="/louer" component={NosOffresPage} />
      <Route path="/vendre" component={VendrePage} />
      <Route path="/gestion-location" component={GestionLocationPage} />
      <Route path="/estimation-ia" component={EstimationIAPage} />
      <Route path="/rendez-vous" component={RendezVousPage} />
      <Route path="/proprietes/:id" component={PropertyDetailPage} />
      <Route path="/bareme" component={BaremePage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/admin/mon-compte" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const location = window.location.pathname;
  const isAdminPage = location.startsWith("/admin");

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <div className="flex flex-col min-h-screen">
            {/* Header toujours visible */}
            <Header />

            {/* Contenu principal */}
            <main id="main-content" className="flex-1 bg-background">
              <Router />
            </main>
          </div>

          {!isAdminPage && <ScrollToTop />}
          {!isAdminPage && <CookieConsent />}
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
