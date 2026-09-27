export interface CityInfo {
  name: string;
  state: string;
  latitude: number;
  longitude: number;
  region: 'North' | 'South' | 'East' | 'West' | 'Central' | 'Northeast';
}

export const INDIAN_CITIES: CityInfo[] = [
  { name: 'New Delhi', state: 'Delhi NCR', latitude: 28.6139, longitude: 77.2090, region: 'North' },
  { name: 'Mumbai', state: 'Maharashtra', latitude: 19.0760, longitude: 72.8777, region: 'West' },
  { name: 'Kolkata', state: 'West Bengal', latitude: 22.5726, longitude: 88.3639, region: 'East' },
  { name: 'Chennai', state: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707, region: 'South' },
  { name: 'Bengaluru', state: 'Karnataka', latitude: 12.9716, longitude: 77.5946, region: 'South' },
  { name: 'Hyderabad', state: 'Telangana', latitude: 17.3850, longitude: 78.4867, region: 'South' },
  { name: 'Ahmedabad', state: 'Gujarat', latitude: 23.0225, longitude: 72.5714, region: 'West' },
  { name: 'Pune', state: 'Maharashtra', latitude: 18.5204, longitude: 73.8567, region: 'West' },
  { name: 'Patna', state: 'Bihar', latitude: 25.5941, longitude: 85.1376, region: 'East' },
  { name: 'Bhubaneswar', state: 'Odisha', latitude: 20.2961, longitude: 85.8245, region: 'East' },
  { name: 'Ranchi', state: 'Jharkhand', latitude: 23.3441, longitude: 85.3096, region: 'East' },
  { name: 'Guwahati', state: 'Assam', latitude: 26.1445, longitude: 91.7362, region: 'Northeast' },
  { name: 'Jaipur', state: 'Rajasthan', latitude: 26.9124, longitude: 75.7873, region: 'North' },
  { name: 'Lucknow', state: 'Uttar Pradesh', latitude: 26.8467, longitude: 80.9462, region: 'North' },
  { name: 'Nagpur', state: 'Maharashtra', latitude: 21.1458, longitude: 79.0882, region: 'Central' },
  { name: 'Bhopal', state: 'Madhya Pradesh', latitude: 23.2599, longitude: 77.4126, region: 'Central' },
  { name: 'Srinagar', state: 'Jammu & Kashmir', latitude: 34.0837, longitude: 74.7973, region: 'North' },
  { name: 'Thiruvananthapuram', state: 'Kerala', latitude: 8.5241, longitude: 76.9366, region: 'South' },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', latitude: 17.6868, longitude: 83.2185, region: 'South' },
  { name: 'Dehradun', state: 'Uttarakhand', latitude: 30.3165, longitude: 78.0322, region: 'North' },
  { name: 'Shimla', state: 'Himachal Pradesh', latitude: 31.1048, longitude: 77.1734, region: 'North' },
  { name: 'Raipur', state: 'Chhattisgarh', latitude: 21.2514, longitude: 81.6296, region: 'Central' },
  { name: 'Chandigarh', state: 'Punjab / Haryana', latitude: 30.7333, longitude: 76.7794, region: 'North' },
  { name: 'Varanasi', state: 'Uttar Pradesh', latitude: 25.3176, longitude: 82.9739, region: 'North' },
  { name: 'Shillong', state: 'Meghalaya', latitude: 25.5788, longitude: 91.8933, region: 'Northeast' },
  { name: 'Cuttack', state: 'Odisha', latitude: 20.4625, longitude: 85.8828, region: 'East' },
  { name: 'Surat', state: 'Gujarat', latitude: 21.1702, longitude: 72.8311, region: 'West' },
  { name: 'Indore', state: 'Madhya Pradesh', latitude: 22.7196, longitude: 75.8577, region: 'Central' },
  { name: 'Kochi', state: 'Kerala', latitude: 9.9312, longitude: 76.2673, region: 'South' },
  { name: 'Agartala', state: 'Tripura', latitude: 23.8315, longitude: 91.2868, region: 'Northeast' },
];

/**
 * Calculates geographical distance between two points in km (Haversine formula).
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Returns nearest city and distance in km for any given grid coordinates.
 */
export function getNearestCity(lat: number, lon: number): { city: CityInfo; distanceKm: number } {
  let nearest = INDIAN_CITIES[0];
  let minDistance = calculateDistanceKm(lat, lon, nearest.latitude, nearest.longitude);

  for (let i = 1; i < INDIAN_CITIES.length; i++) {
    const d = calculateDistanceKm(lat, lon, INDIAN_CITIES[i].latitude, INDIAN_CITIES[i].longitude);
    if (d < minDistance) {
      minDistance = d;
      nearest = INDIAN_CITIES[i];
    }
  }

  return { city: nearest, distanceKm: Math.round(minDistance) };
}
