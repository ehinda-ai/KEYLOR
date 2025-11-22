/**
 * Résout les paths API d'images vers des URLs complètes
 * En dev : pointe vers https://keylor-intranet-Keyvalor.replit.app (intranet Replit)
 * En prod : utilise le proxy Nginx de keylor.fr qui redirige vers intranet.keylor.fr
 * 
 * Les images sont stockées dans Object Storage côté intranet et servies via /objects/public/
 */
export function resolveImageUrl(objectPath: string | null | undefined): string | null {
  if (!objectPath) return null;
  
  // En développement : pointer vers l'intranet Replit
  if (import.meta.env.DEV) {
    return `https://keylor-intranet-Keyvalor.replit.app${objectPath}`;
  }
  
  // En production : Nginx de keylor.fr proxie /objects/public/* vers intranet.keylor.fr
  // Donc on garde juste le path relatif
  return objectPath;
}
