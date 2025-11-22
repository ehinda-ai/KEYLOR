import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ContactCarouselImage } from "@shared/schema";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ContactCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: images } = useQuery<ContactCarouselImage[]>({
    queryKey: ["/api/contact-carousel-images"],
    queryFn: async () => {
      const res = await fetch('/api/contact-carousel-images');
      if (!res.ok) throw new Error('Erreur');
      return res.json();
    }
  });

  const activeImages = images?.filter(img => img.actif) || [];

  useEffect(() => {
    if (activeImages.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeImages.length);
    }, 5000); // Change d'image toutes les 5 secondes

    return () => clearInterval(interval);
  }, [activeImages.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? activeImages.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) => 
      (prev + 1) % activeImages.length
    );
  };

  if (!activeImages || activeImages.length === 0) {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200')] bg-cover bg-center opacity-30"></div>
      </div>
    );
  }

  const currentImage = activeImages[currentIndex];

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-primary/5 to-accent/5" data-testid="contact-carousel">
      {/* Image principale - couvre tout */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={currentImage.imageUrl}
          alt={currentImage.titre || "Contact carousel image"}
          className="w-full h-full object-contain transition-opacity duration-500"
          data-testid={`carousel-image-${currentIndex}`}
        />
        
        {/* Overlay gradient pour améliorer la lisibilité du texte */}
        {(currentImage.titre || currentImage.sousTitre) && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        )}
        
        {/* Texte sur l'image */}
        {(currentImage.titre || currentImage.sousTitre) && (
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            {currentImage.titre && (
              <h3 className="text-2xl font-serif font-light mb-2" data-testid="carousel-title">
                {currentImage.titre}
              </h3>
            )}
            {currentImage.sousTitre && (
              <p className="text-sm opacity-90" data-testid="carousel-subtitle">
                {currentImage.sousTitre}
              </p>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
