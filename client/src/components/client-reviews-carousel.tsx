import { useQuery } from "@tanstack/react-query";
import { ClientReview } from "@shared/schema";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ClientReviewsCarousel() {
  const { data: reviews = [] } = useQuery<ClientReview[]>({
    queryKey: ["/api/reviews"],
  });

  const activeReviews = reviews
    .filter(review => review.actif)
    .sort((a, b) => a.ordre - b.ordre);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true,
      align: "center",
      skipSnaps: false,
    },
    [Autoplay({ delay: 5000, stopOnInteraction: true })]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const renderStars = (note: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span
        key={i}
        className={`${i < note ? "text-accent" : "text-muted-foreground/30"}`}
      >
        ★
      </span>
    ));
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (activeReviews.length === 0) {
    return null;
  }

  return (
    <section className="py-12 px-6 bg-card/80 backdrop-blur-sm border border-accent/20 shadow-lg" style={{ borderRadius: '16px' }}>
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-serif font-light mb-2" data-testid="text-reviews-title">
            Ils nous font confiance
          </h2>
          <p className="text-sm text-muted-foreground">
            Témoignages clients
          </p>
        </div>

        <div className="relative overflow-hidden">
          {/* Carousel */}
          <div className="hide-scrollbar" ref={emblaRef}>
            <div className="flex">
              {activeReviews.map((review) => (
                <div
                  key={review.id}
                  className="flex-[0_0_100%] min-w-0 px-4"
                  data-testid={`review-slide-${review.id}`}
                >
                  <div className="mx-auto max-w-2xl bg-background/50 rounded-lg p-6">
                    {/* Stars */}
                    <div className="flex justify-center mb-4">
                      <div className="flex text-lg">
                        {renderStars(review.note)}
                      </div>
                    </div>

                    {/* Comment */}
                    <blockquote className="text-center mb-6">
                      <p className="text-base text-foreground italic leading-relaxed">
                        "{review.commentaire}"
                      </p>
                    </blockquote>

                    {/* Author Info */}
                    <div className="flex items-center justify-center gap-3">
                      <Avatar className="h-12 w-12 border border-accent/30">
                        {review.photoUrl && <AvatarImage src={review.photoUrl} alt={review.nomComplet} />}
                        <AvatarFallback className="bg-accent/10 text-accent text-sm font-medium">
                          {getInitials(review.nomComplet)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="font-semibold text-sm text-foreground" data-testid={`review-author-${review.id}`}>
                          {review.nomComplet}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {review.ville && <span>{review.ville}</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          {activeReviews.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={scrollPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm hover:bg-accent/10 border-accent/20"
                data-testid="button-reviews-prev"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={scrollNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm hover:bg-accent/10 border-accent/20"
                data-testid="button-reviews-next"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Dots Navigation */}
          {activeReviews.length > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {scrollSnaps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollTo(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === selectedIndex
                      ? "w-8 bg-accent"
                      : "w-2 bg-accent/30 hover:bg-accent/50"
                  }`}
                  aria-label={`Aller à l'avis ${index + 1}`}
                  data-testid={`button-dot-${index}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
