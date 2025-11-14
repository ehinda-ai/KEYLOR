import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SocialMediaLink } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { ContactForm } from "@/components/contact-form";
import { ContactCarousel } from "@/components/contact-carousel";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Mail, Phone, MapPin, Clock, Facebook, Instagram, Linkedin, Twitter, Youtube, MessageCircle } from "lucide-react";
import { SiTiktok } from "react-icons/si";

export default function ContactPage() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const propertyId = searchParams.get('propertyId') || undefined;

  const { data: socialLinks = [] } = useQuery<SocialMediaLink[]>({
    queryKey: ["/api/social-links"],
  });

  const activeSocialLinks = socialLinks.filter(link => link.actif).sort((a, b) => a.ordre - b.ordre);

  const getSocialIcon = (plateforme: string) => {
    const className = "h-5 w-5";
    switch (plateforme) {
      case "facebook": return <Facebook className={className} />;
      case "instagram": return <Instagram className={className} />;
      case "linkedin": return <Linkedin className={className} />;
      case "twitter": return <Twitter className={className} />;
      case "youtube": return <Youtube className={className} />;
      case "tiktok": return <SiTiktok className={className} />;
      case "whatsapp": return <MessageCircle className={className} />;
      default: return null;
   }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Icônes de contact en haut - style épuré */}
        <div className="text-center mb-6 animate-fade-in">
          <div className="flex flex-wrap justify-center items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <a 
                  href="tel:+33650023636" 
                  className="w-12 h-12 rounded-full bg-accent/10 hover:bg-accent/20 hover:scale-110 flex items-center justify-center text-accent transition-all duration-300"
                  data-testid="contact-channel-telephone-header"
                >
                  <Phone className="h-6 w-6" />
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">06 50 02 36 36</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <a 
                  href="mailto:contact@keylor.fr" 
                  className="w-12 h-12 rounded-full bg-accent/10 hover:bg-accent/20 hover:scale-110 flex items-center justify-center text-accent transition-all duration-300"
                  data-testid="contact-channel-email-header"
                >
                  <Mail className="h-6 w-6" />
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">contact@keylor.fr</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <a 
                  href="https://maps.google.com/?q=Les+Etoiles+26800+Etoile+sur+Rhône" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-12 h-12 rounded-full bg-accent/10 hover:bg-accent/20 hover:scale-110 flex items-center justify-center text-accent transition-all duration-300"
                  data-testid="contact-channel-adresse-header"
                >
                  <MapPin className="h-6 w-6" />
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">26800 Étoile-sur-Rhône</p>
              </TooltipContent>
            </Tooltip>

            {/* Réseaux sociaux */}
            {activeSocialLinks.length > 0 && (
              <>
                <div className="w-px h-8 bg-border/50 mx-2"></div>
                {activeSocialLinks.map((link) => (
                  <Tooltip key={link.id}>
                    <TooltipTrigger asChild>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-12 h-12 rounded-full bg-accent/10 hover:bg-accent/20 hover:scale-110 flex items-center justify-center text-accent transition-all duration-300"
                        data-testid={`social-link-header-${link.plateforme}`}
                      >
                        {getSocialIcon(link.plateforme)}
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">{link.nom}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Grid 2 colonnes : Formulaire à gauche + Carrousel à droite */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          
          {/* Colonne gauche - Formulaire de contact */}
          <div className="animate-fade-in flex">
            <Card className="p-5 md:p-6 bg-card/80 backdrop-blur-sm border-accent/20 shadow-lg w-full" style={{ borderRadius: '16px' }}>
              <ContactForm propertyId={propertyId} />
            </Card>
          </div>

          {/* Colonne droite - Carrousel (caché sur mobile) */}
          <div className="hidden lg:flex animate-fade-in-delayed">
            <div className="w-full rounded-lg overflow-hidden bg-card/60 backdrop-blur-sm border border-accent/20" style={{ minHeight: '600px' }}>
              <ContactCarousel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
