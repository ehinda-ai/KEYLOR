import { Link, useLocation } from "wouter";
import { Menu, X, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { useState } from "react";
import keylorLogo from "@/assets/keylor-logo.png";

export function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Accueil", href: "/" },
    { name: "Vendre", href: "/vendre" },
    { name: "Faire gérer", href: "/gestion-location" },
    { name: "Nos offres", href: "/nos-offres" },
    { name: "Barème", href: "/bareme" },
    { name: "Rendez-vous", href: "/rendez-vous" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-accent/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center hover-elevate rounded-md px-3 py-2 flex-shrink-0">
            <img 
              src={keylorLogo} 
              alt="KEYLOR" 
              className="h-12 w-auto"
              data-testid="logo-keylor"
            />
          </Link>

          {/* Navigation centrale - Desktop */}
          <nav className="hidden md:flex items-center gap-2 flex-1 justify-center">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={`font-serif font-light text-base ${location === item.href ? "bg-accent/15 text-accent" : ""}`}
                  data-testid={`link-nav-${item.name.toLowerCase()}`}
                >
                  {item.name}
                </Button>
              </Link>
            ))}
          </nav>

          {/* Actions à droite */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <ThemeToggle />
            <Link href="/admin/mon-compte">
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex items-center gap-2"
                data-testid="button-admin-access"
              >
                <LogIn className="h-4 w-4" />
                <span className="text-sm">Mon compte</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Menu mobile */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t py-4 flex flex-col gap-2">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${location === item.href ? "bg-accent/10" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`link-mobile-${item.name.toLowerCase()}`}
                >
                  {item.name}
                </Button>
              </Link>
            ))}
            <Link href="/admin/mon-compte">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => setMobileMenuOpen(false)}
                data-testid="link-mobile-admin"
              >
                <LogIn className="h-4 w-4" />
                Mon compte
              </Button>
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
