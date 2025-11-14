// Géocodage d'adresses via OpenStreetMap Nominatim (API gratuite)

interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
}

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";

export async function geocodeAddress(
  localisation: string,
  ville: string,
  codePostal: string
): Promise<{ latitude: string; longitude: string } | null> {
  try {
    // Construire l'adresse complète pour le géocodage
    const fullAddress = `${localisation}, ${codePostal} ${ville}, France`;
    
    const params = new URLSearchParams({
      q: fullAddress,
      format: "json",
      limit: "1",
      countrycodes: "fr",
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}?${params.toString()}`, {
      headers: {
        "User-Agent": "KEYLOR Real Estate Application/1.0",
      },
    });

    if (!response.ok) {
      console.error(`Geocoding failed for "${fullAddress}": HTTP ${response.status}`);
      return null;
    }

    const data: NominatimResponse[] = await response.json();

    if (data.length === 0) {
      console.warn(`No geocoding results for "${fullAddress}"`);
      return null;
    }

    return {
      latitude: data[0].lat,
      longitude: data[0].lon,
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

// Délai pour respecter la politique d'usage de Nominatim (1 requête/seconde max)
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
