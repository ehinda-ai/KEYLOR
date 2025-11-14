import { db } from "./server/db";
import { properties } from "@shared/schema";
import { geocodeAddress, delay } from "./server/geocoding";
import { eq, or, isNull } from "drizzle-orm";

async function geocodeAllProperties() {
  console.log("🗺️  Starting geocoding of properties...");
  
  // Récupérer toutes les propriétés sans coordonnées GPS
  const propertiesToGeocode = await db
    .select()
    .from(properties)
    .where(
      or(
        isNull(properties.latitude),
        isNull(properties.longitude)
      )
    );

  console.log(`Found ${propertiesToGeocode.length} properties to geocode`);

  let successCount = 0;
  let failCount = 0;

  for (const property of propertiesToGeocode) {
    console.log(`\nGeocoding: ${property.titre} (${property.ville})`);
    
    const coords = await geocodeAddress(
      property.localisation,
      property.ville,
      property.codePostal
    );

    if (coords) {
      await db
        .update(properties)
        .set({
          latitude: coords.latitude,
          longitude: coords.longitude,
        })
        .where(eq(properties.id, property.id));
      
      console.log(`✅ Success: ${coords.latitude}, ${coords.longitude}`);
      successCount++;
    } else {
      console.log(`❌ Failed to geocode`);
      failCount++;
    }

    // Respect Nominatim usage policy (1 request/second max)
    await delay(1100);
  }

  console.log(`\n📊 Geocoding complete:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
}

geocodeAllProperties()
  .then(() => {
    console.log("\n✨ Geocoding finished!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Geocoding error:", error);
    process.exit(1);
  });
