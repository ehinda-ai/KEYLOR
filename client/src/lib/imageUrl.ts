/**
 * Résout les paths API d'images vers des URLs complètes
 * En dev : pointe vers https://keylor-intranet-Keyvalor.replit.app (intranet Replit)
 * En prod : utilise le proxy Nginx de keylor.fr qui redirige vers intranet.keylor.fr
 * 
 * Les images sont stockées dans Object Storage côté intranet.
 * /objects/uploads/* → images privées (admin)
 * /objects/public/* → images publiques (vitrine)
 */
export function resolveImageUrl(objectPath: string | null | undefined): string | null {
  if (!objectPath) return null;
  
  // URLs absolues (Unsplash, etc.) - garder telles quelles
  if (objectPath.startsWith('http://') || objectPath.startsWith('https://')) {
    return objectPath;
  }
  
  // Chemins relatifs depuis Object Storage
  if (objectPath.startsWith('/objects/')) {
    if (import.meta.env.DEV) {
      // En dev : pointer vers l'intranet Replit
      return `https://keylor-intranet-Keyvalor.replit.app${objectPath}`;
    } else {
      // En prod : Nginx de keylor.fr proxie /objects/* vers intranet.keylor.fr
      return objectPath;
    }
  }
  
  // Autres chemins relatifs
  return objectPath;
}

/**
 * Fournit une image par défaut pour les locations
 */
export function getDefaultPropertyImage(transactionType?: string): string {
  // Image par défaut selon le type de transaction
  const defaultImages: Record<string, string> = {
    location: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200',
    location_saisonniere: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200',
    vente: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200',
  };
  
  return defaultImages[transactionType || 'vente'] || defaultImages.vente;
}
