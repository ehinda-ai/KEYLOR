import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <Card className="max-w-5xl mx-auto p-6 border-accent border-2 shadow-lg bg-background/95 backdrop-blur">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">Gestion des cookies</h3>
            <p className="text-sm text-muted-foreground">
              Nous utilisons des cookies pour améliorer votre expérience de navigation, analyser le trafic du site et personnaliser le contenu. 
              En cliquant sur "Accepter", vous consentez à l'utilisation de tous les cookies conformément à notre politique de confidentialité.
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Button 
              variant="outline" 
              onClick={handleDecline}
              className="flex-1 md:flex-none"
              data-testid="button-decline-cookies"
            >
              Refuser
            </Button>
            <Button 
              onClick={handleAccept}
              className="flex-1 md:flex-none"
              data-testid="button-accept-cookies"
            >
              Accepter
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
