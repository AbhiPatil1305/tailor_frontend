import * as Location from 'expo-location';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export class LocationService {
  /**
   * Request permissions and get current GPS coordinates
   */
  static async getCurrentLocation(): Promise<Coordinates> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission to access location was denied');
    }

    const location = await Location.getCurrentPositionAsync({});
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  }

  // In-memory cache for reverse geocoding to prevent duplicate requests
  private static geocodeCache: Map<string, string> = new Map();

  /**
   * Reverse Geocode using OpenStreetMap Nominatim API (Free, no key required)
   * With fallback to BigDataCloud API if rate-limited.
   */
  static async reverseGeocode(coords: Coordinates): Promise<string> {
    // Round coords to 4 decimal places (approx 11m accuracy) for caching
    const cacheKey = `${coords.latitude.toFixed(4)},${coords.longitude.toFixed(4)}`;
    if (this.geocodeCache.has(cacheKey)) {
      return this.geocodeCache.get(cacheKey)!;
    }

    try {
      // Primary: Nominatim
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=18&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'TailorApp/1.0'
        }
      });
      
      if (!response.ok) throw new Error(`Nominatim failed with status: ${response.status}`);
      
      const data = await response.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(', ');
        const address = parts.slice(0, 4).join(', ');
        this.geocodeCache.set(cacheKey, address);
        return address;
      }
      throw new Error('No address found');
    } catch (error) {
      console.warn('Nominatim rate limited/failed, using fallback...', error);
      
      // Fallback: BigDataCloud Free Reverse Geocoding API (Very high rate limits, no CORS issues)
      try {
        const fallbackUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`;
        const fbRes = await fetch(fallbackUrl);
        if (fbRes.ok) {
          const fbData = await fbRes.json();
          // Construct a decent address from the components
          const parts = [fbData.locality, fbData.city, fbData.principalSubdivision, fbData.countryName].filter(Boolean);
          const fbAddress = parts.join(', ') || 'Unknown Location';
          this.geocodeCache.set(cacheKey, fbAddress);
          return fbAddress;
        }
      } catch (fbError) {
        console.warn('Fallback geocoding also failed:', fbError);
      }
      
      return 'Unknown Location';
    }
  }
}
