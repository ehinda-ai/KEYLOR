/**
 * Service de calcul de temps de trajet entre deux adresses
 * Utilise OpenRouteService API
 */

const OPENROUTESERVICE_API_KEY = process.env.OPENROUTESERVICE_API_KEY;
const ORS_API_URL = 'https://api.openrouteservice.org/v2/directions/driving-car';

interface TravelTimeResult {
  durationMinutes: number;
  distanceKm: number;
  success: boolean;
  error?: string;
}

interface Coordinates {
  lat: number;
  lon: number;
}

/**
 * Géocode une adresse pour obtenir ses coordonnées
 */
async function geocodeAddress(address: string): Promise<Coordinates | null> {
  try {
    const geocodeUrl = `https://api.openrouteservice.org/geocode/search?api_key=${OPENROUTESERVICE_API_KEY}&text=${encodeURIComponent(address)}`;
    const response = await fetch(geocodeUrl);
    
    if (!response.ok) {
      console.error('Geocoding API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const [lon, lat] = data.features[0].geometry.coordinates;
      return { lat, lon };
    }
    
    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
}

/**
 * Calcule le temps de trajet entre deux adresses
 * @param fromAddress Adresse de départ (format: "rue, code postal, ville")
 * @param toAddress Adresse d'arrivée (format: "rue, code postal, ville")
 * @returns Temps de trajet en minutes et distance en km
 */
export async function calculateTravelTime(
  fromAddress: string,
  toAddress: string
): Promise<TravelTimeResult> {
  if (!OPENROUTESERVICE_API_KEY) {
    return {
      success: false,
      durationMinutes: 0,
      distanceKm: 0,
      error: 'Clé API OpenRouteService manquante'
    };
  }

  try {
    // Géocoder les deux adresses
    const fromCoords = await geocodeAddress(fromAddress);
    const toCoords = await geocodeAddress(toAddress);

    if (!fromCoords || !toCoords) {
      return {
        success: false,
        durationMinutes: 0,
        distanceKm: 0,
        error: 'Impossible de géocoder les adresses'
      };
    }

    // Calculer l'itinéraire
    const requestBody = {
      coordinates: [
        [fromCoords.lon, fromCoords.lat],
        [toCoords.lon, toCoords.lat]
      ]
    };

    const response = await fetch(ORS_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': OPENROUTESERVICE_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      console.error('Routing API error:', response.status);
      return {
        success: false,
        durationMinutes: 0,
        distanceKm: 0,
        error: `Erreur API: ${response.status}`
      };
    }

    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const durationMinutes = Math.ceil(route.summary.duration / 60); // Conversion secondes -> minutes
      const distanceKm = Math.round(route.summary.distance / 1000 * 10) / 10; // Conversion mètres -> km

      return {
        success: true,
        durationMinutes,
        distanceKm
      };
    }

    return {
      success: false,
      durationMinutes: 0,
      distanceKm: 0,
      error: 'Aucun itinéraire trouvé'
    };
  } catch (error) {
    console.error('Error calculating travel time:', error);
    return {
      success: false,
      durationMinutes: 0,
      distanceKm: 0,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Formate une adresse complète pour le calcul de trajets
 * Utilise le numéro de rue si disponible, sinon utilise l'adresse publique
 */
export function formatPropertyAddress(
  localisation: string, 
  codePostal: string, 
  ville: string, 
  numeroRue?: string | null
): string {
  // Si on a un numéro de rue, on l'ajoute à l'adresse
  const adresseComplete = numeroRue 
    ? `${numeroRue} ${localisation}, ${codePostal} ${ville}, France`
    : `${localisation}, ${codePostal} ${ville}, France`;
  
  return adresseComplete;
}
