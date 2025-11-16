/**
 * Résout les paths API d'images vers des URLs complètes
 * En dev : pointe vers localhost:5001 (intranet Replit)
 * En prod : utilise le proxy Nginx de keylor.fr qui redirige vers intranet.keylor.fr
 */
export function resolveImageUrl(objectPath: string | null | undefined): string | null {
  if (!objectPath) return null;
  
  // En développement : pointer vers l'intranet Replit (port 5001)
  if (import.meta.env.DEV) {
    return `http://localhost:5001${objectPath}`;
  }
  
  // En production : Nginx de keylor.fr proxie /objects/public/* vers intranet.keylor.fr
  // Donc on garde juste le path relatif
  return objectPath;
}
