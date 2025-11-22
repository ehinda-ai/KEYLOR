import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Property, SocialMediaLink } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PropertyCard } from "@/components/property-card";
import { HeroCarousel } from "@/components/hero-carousel";
import { Home, TrendingUp, FileCheck, Phone, Mail, MapPin, Shield, Award, Users, CheckCircle2, Facebook, Instagram, Linkedin, Twitter, Youtube } from "lucide-react";
import { SiTiktok } from "react-icons/si";
import keylorLogo from "@/assets/keylor-logo.png";

export default function HomePage() {
  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const { data: socialLinks = [] } = useQuery<SocialMediaLink[]>({
    queryKey: ["/api/social-links"],
  });

  const featuredProperties = properties?.filter(p => p.featured).slice(0, 3) || [];
  const activeSocialLinks = socialLinks.filter(link => link.actif).sort((a, b) => a.ordre - b.ordre);

  const getSocialIcon = (plateforme: string) => {
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
    <div className="min-h-screen">
      {/* Hero Section - Layout élégant avec fond structuré */}
      <section className="relative bg-gradient-to-br from-background via-background to-accent/5 py-6 lg:py-8">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Colonne gauche: Logo et Tagline */}
            <div className="space-y-6">
              {/* Carte élégante contenant logo et titre */}
              <Card className="p-6 md:p-8 bg-card/60 backdrop-blur-sm border-accent/20">
                <div className="flex flex-col md:flex-row items-center md:items-center gap-6 md:gap-8">
                  {/* Logo avec fond subtil */}
                  <div data-testid="hero-logo-section" className="flex-shrink-0 bg-background/80 rounded-lg p-4">
                    <img 
                      src={keylorLogo} 
                      alt="KEYLOR" 
                      className="h-40 md:h-48 lg:h-56 w-auto"
                      data-testid="hero-logo-image"
                    />
                  </div>
                  
                  {/* Titre principal à côté du logo */}
                  <div className="flex-1 text-center md:text-left">
                    <h1 className="text-xl md:text-2xl lg:text-3xl font-serif font-light text-foreground leading-tight" data-testid="text-hero-subtitle">
                      Vendre, louer, acheter ou faire gérer, avec sérénité et confiance.
                    </h1>
                  </div>
                </div>
              </Card>
              
              {/* Sous-titre et boutons */}
              <div data-testid="hero-tagline-section" className="text-center md:text-left px-2">
                <div className="w-24 h-1 bg-accent mx-auto md:mx-0 rounded-full mb-4"></div>
                <p className="text-lg text-muted-foreground mb-6">
                  KEYLOR, c'est un accompagnement à chaque étape de votre projet immobilier
                </p>
                
                {/* CTA Buttons */}
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <Link href="/vendre#estimation-form">
                    <Button size="lg" variant="default" data-testid="button-hero-estimate">
                      Faire estimer mon bien à la vente
                    </Button>
                  </Link>
                  <Link href="/nos-offres">
                    <Button size="lg" variant="outline" data-testid="button-hero-browse">
                      Voir nos offres
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Colonne droite: Carrousel avec cadre élégant */}
            <Card className="p-2 bg-card/60 backdrop-blur-sm border-accent/20" data-testid="hero-carousel-section">
              <div className="h-[300px] md:h-[350px] lg:h-[400px] rounded-md overflow-hidden">
                <HeroCarousel />
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Section Services - 3 cartes principales */}
      <section className="py-6 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-4">
            <h2 className="text-3xl md:text-4xl font-serif font-light mb-2" data-testid="text-services-title">
              Des services sur mesure, pensés pour vous : vente, location ou acquisition.
            </h2>
            <p className="text-base text-muted-foreground">
              Chaque étape de votre projet est accompagnée avec soin, clarté et solutions adaptées à vos besoins.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Carte Vente */}
            <Card className="hover-elevate transition-all group border-2 border-accent/40 flex flex-col" data-testid="card-service-sell">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/20 transition-colors">
                  <FileCheck className="h-8 w-8 text-accent" />
                </div>
                <CardTitle className="text-2xl font-serif font-normal leading-tight min-h-[3.5rem] flex items-center justify-center">
                  Confier mon bien<br/>à la vente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col">
                <p className="text-muted-foreground text-sm leading-relaxed flex-1 text-left">
                  Vendez votre bien en toute confiance.
                  De l’estimation à la signature, KEYLOR vous accompagne avec une stratégie adaptée à votre bien et au marché local.
                </p>
                <Link href="/vendre" onClick={() => window.scrollTo(0, 0)}>
                  <Button className="w-full" size="lg" data-testid="button-service-sell">
                    Vendre avec confiance
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Carte Gestion locative */}
            <Card className="hover-elevate transition-all group border-2 border-accent/40 flex flex-col" data-testid="card-service-manage">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/20 transition-colors">
                  <TrendingUp className="h-8 w-8 text-accent" />
                </div>
                <CardTitle className="text-2xl font-serif font-normal leading-tight min-h-[3.5rem] flex items-center justify-center">
                  Confier la gestion<br/>locative
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col">
                <p className="text-muted-foreground text-sm leading-relaxed flex-1 text-left">
                  Confiez-nous la gestion de votre bien, l’esprit tranquille.
                  Loyers, relations locataires, gestion administrative et technique… nous veillons à la sécurité et à la rentabilité de votre investissement au quotidien.
                </p>
                <Link href="/gestion-location" onClick={() => window.scrollTo(0, 0)}>
                  <Button className="w-full" size="lg" data-testid="button-service-manage">
                    Gérer mon bien sereinement
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Carte Recherche bien */}
            <Card className="hover-elevate transition-all group border-2 border-accent/40 flex flex-col" data-testid="card-service-search">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/20 transition-colors">
                  <Home className="h-8 w-8 text-accent" />
                </div>
                <CardTitle className="text-2xl font-serif font-normal leading-tight min-h-[3.5rem] flex items-center justify-center">
                  Je recherche<br/>un bien
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col">
                <p className="text-muted-foreground text-sm leading-relaxed flex-1 text-left">
                  Trouvez le bien qui correspond à vos besoins parmi notre sélection en achat ou location.
                  Notre équipe vous accompagne pour faire de votre projet immobilier une réussite.
                </p>
                <Link href="/nos-offres" onClick={() => window.scrollTo(0, 0)}>
                  <Button className="w-full" size="lg" data-testid="button-service-search">
                    Trouver mon futur chez-moi
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Section Pourquoi nous choisir */}
      <section className="py-8 px-6 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-6">
            <h2 className="text-4xl md:text-5xl font-serif font-light mb-3" data-testid="text-why-title">
              Pourquoi choisir KEYLOR ?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Une approche humaine et efficace, pour que votre projet immobilier se réalise en toute sérénité.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-4" data-testid="feature-transparency">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <Shield className="h-6 w-6 text-accent" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-serif font-normal mb-2">Transparence totale</h3>
                <p className="text-muted-foreground text-sm text-left">
                  Avec KEYLOR, vous savez toujours où vous en êtes : tarifs clairs, méthodes transparentes et accompagnement sans surprise.
                </p>
              </div>
            </div>

            <div className="flex gap-4" data-testid="feature-expertise">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <Award className="h-6 w-6 text-accent" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-serif font-normal mb-2">Expertise locale</h3>
                <p className="text-muted-foreground text-sm text-left">
                  Notre connaissance fine du marché et notre réseau vous permettent de vendre, louer ou acheter au meilleur prix, là où vous êtes.
                </p>
              </div>
            </div>

            <div className="flex gap-4" data-testid="feature-service">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-accent" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-serif font-normal mb-2">Service personnalisé</h3>
                <p className="text-muted-foreground text-sm text-left">
                  Votre projet est unique, et notre accompagnement aussi. Nous adaptons chaque solution à vos besoins, pour que vous avanciez en toute confiance.
                </p>
              </div>
            </div>

            <div className="flex gap-4" data-testid="feature-tools">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-accent" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-serif font-normal mb-2">Outils modernes</h3>
                <p className="text-muted-foreground text-sm text-left">
                  Visites virtuelles, rapports en ligne et outils digitaux : nous utilisons la technologie pour simplifier votre expérience et vous faire gagner du temps.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Biens en vedette */}
      {featuredProperties.length > 0 && (
        <section className="py-8 px-6">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-6">
              <h2 className="text-4xl md:text-5xl font-serif font-light mb-3" data-testid="text-featured-title">
                Nos biens coup de cœur
              </h2>
              <p className="text-lg text-muted-foreground">
                Découvrez notre sélection exclusive de biens coup de cœur, disponibles dès maintenant.
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="h-[400px] animate-pulse bg-muted" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            )}

            <div className="text-center mt-8">
              <Link href="/nos-offres" onClick={() => window.scrollTo(0, 0)}>
                <Button variant="outline" size="lg" data-testid="button-view-all">
                  Parcourir l’intégralité des biens
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA principal */}
      <section className="py-8 px-6 bg-accent/5">
        <div className="container mx-auto max-w-5xl text-center">
          <h2 className="text-4xl md:text-5xl font-serif font-light mb-4" data-testid="text-cta-title">
            Prêt à donner vie à votre projet immobilier ?
          </h2>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
            Notre équipe vous guide à chaque étape, avec écoute, conseils personnalisés et accompagnement complet.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" onClick={() => window.scrollTo(0, 0)}>
              <Button size="lg" className="px-8" data-testid="button-cta-contact">
                Je contacte KEYLOR
              </Button>
            </Link>
            <Link href="/vendre" onClick={() => window.scrollTo(0, 0)}>
              <Button size="lg" variant="outline" className="px-8" data-testid="button-cta-estimate">
                Recevoir mon estimation gratuite
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer / Contact */}
      <section className="py-8 px-6 bg-card border-t">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
            <div>
              <h3 className="text-lg font-serif font-normal mb-4 text-foreground">Contact</h3>
              <div className="space-y-3 text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <span>06 50 00 00 00</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span>contact@keylor.fr</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-serif font-normal mb-4 text-foreground">Adresse</h3>
              <div className="flex items-start justify-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                <span>
                  Les Etoiles<br />
                  26800 Etoile sur Rhône
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-serif font-normal mb-4 text-foreground">Horaires</h3>
              <div className="space-y-2 text-muted-foreground text-sm">
                <p>Lundi - Vendredi: 9h - 18h</p>
                <p>Samedi: Sur rendez-vous</p>
                <p>Dimanche: Fermé</p>
              </div>
            </div>
          </div>

          {/* Social Media Links */}
          {activeSocialLinks.length > 0 && (
            <div className="mt-8 pt-6 border-t border-border/50">
              <div className="flex items-center justify-center gap-4">
                {activeSocialLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-md hover-elevate active-elevate-2 text-muted-foreground hover:text-accent transition-colors"
                    aria-label={link.nom}
                    data-testid={`social-link-${link.plateforme}`}
                  >
                    {getSocialIcon(link.plateforme)}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
