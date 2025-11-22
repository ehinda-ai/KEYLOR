import { Share2, Link as LinkIcon, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonProps {
  propertyId: string;
  propertyTitle: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ShareButton({
  propertyId,
  propertyTitle,
  variant = "default",
  size = "default",
}: ShareButtonProps) {
  const { toast } = useToast();

  const getPropertyUrl = () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/proprietes/${propertyId}`;
  };

  const handleCopyLink = () => {
    const url = getPropertyUrl();
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Lien copié",
        description: "Le lien de l'annonce a été copié dans le presse-papiers",
        duration: 2000,
      });
    });
  };

  const handleShareEmail = () => {
    const url = getPropertyUrl();
    const subject = encodeURIComponent(`Regardez cette annonce: ${propertyTitle}`);
    const body = encodeURIComponent(
      `Bonjour,\n\nJe vous recommande cette annonce immobilière:\n\n${propertyTitle}\n\n${url}\n\nBien à vous`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          data-testid="button-share-property"
        >
          {size === "icon" ? (
            <Share2 className="h-4 w-4" />
          ) : (
            <>
              <Share2 className="mr-2 h-4 w-4" />
              Partager
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCopyLink} data-testid="menu-copy-link">
          <LinkIcon className="mr-2 h-4 w-4" />
          <span>Copier le lien</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleShareEmail}
          data-testid="menu-share-email"
        >
          <Mail className="mr-2 h-4 w-4" />
          <span>Partager par email</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
