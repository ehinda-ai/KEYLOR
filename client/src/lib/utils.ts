import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getPropertyImageUrl(imagePath: string): string {
  if (!imagePath) {
    return "/placeholder.jpg";
  }
  
  // Les images avec URL complète (comme Unsplash) sont retournées telles quelles
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Les images uploadées sont déjà sur keylor.fr dans /objects/uploads/
  // Pas besoin de préfixe, le chemin relatif fonctionne
  return imagePath;
}
