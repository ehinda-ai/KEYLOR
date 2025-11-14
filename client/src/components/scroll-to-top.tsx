import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [location] = useLocation();

  // Scroll to top when route changes
  useEffect(() => {
    const mainElement = document.getElementById("main-content");
    if (mainElement) {
      mainElement.scrollTo({
        top: 0,
        behavior: "instant",
      });
    }
  }, [location]);

  useEffect(() => {
    const mainElement = document.getElementById("main-content");
    
    if (!mainElement) return;

    const toggleVisibility = () => {
      if (mainElement.scrollTop > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Check initial scroll position
    toggleVisibility();

    mainElement.addEventListener("scroll", toggleVisibility);

    return () => {
      mainElement.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    const mainElement = document.getElementById("main-content");
    
    if (mainElement) {
      mainElement.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Button
      onClick={scrollToTop}
      size="icon"
      className="fixed bottom-8 right-8 z-50 shadow-lg"
      data-testid="button-scroll-to-top"
      aria-label="Remonter en haut de la page"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  );
}
