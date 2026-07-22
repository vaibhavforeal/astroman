// Small built-in city gazetteer for the birth-details quick-pick.
// Each entry: [name, latitude, longitude, standardUtcOffsetHours].
// NOTE: offsets are STANDARD time. Historical daylight-saving is not applied —
// users born during DST should nudge the offset by 1 hour manually.

const CITIES = [
  // --- India ---
  ["New Delhi, India", 28.6139, 77.2090, 5.5],
  ["Mumbai, India", 19.0760, 72.8777, 5.5],
  ["Bengaluru, India", 12.9716, 77.5946, 5.5],
  ["Chennai, India", 13.0827, 80.2707, 5.5],
  ["Kolkata, India", 22.5726, 88.3639, 5.5],
  ["Hyderabad, India", 17.3850, 78.4867, 5.5],
  ["Pune, India", 18.5204, 73.8567, 5.5],
  ["Ahmedabad, India", 23.0225, 72.5714, 5.5],
  ["Jaipur, India", 26.9124, 75.7873, 5.5],
  ["Lucknow, India", 26.8467, 80.9462, 5.5],
  ["Varanasi, India", 25.3176, 82.9739, 5.5],
  ["Chandigarh, India", 30.7333, 76.7794, 5.5],
  ["Kochi, India", 9.9312, 76.2673, 5.5],
  ["Nagpur, India", 21.1458, 79.0882, 5.5],
  ["Patna, India", 25.5941, 85.1376, 5.5],
  ["Bhopal, India", 23.2599, 77.4126, 5.5],
  ["Guwahati, India", 26.1445, 91.7362, 5.5],
  ["Amritsar, India", 31.6340, 74.8723, 5.5],
  ["Surat, India", 21.1702, 72.8311, 5.5],
  ["Indore, India", 22.7196, 75.8577, 5.5],
  ["Coimbatore, India", 11.0168, 76.9558, 5.5],
  ["Thiruvananthapuram, India", 8.5241, 76.9366, 5.5],
  // --- South Asia / neighbours ---
  ["Kathmandu, Nepal", 27.7172, 85.3240, 5.75],
  ["Colombo, Sri Lanka", 6.9271, 79.8612, 5.5],
  ["Dhaka, Bangladesh", 23.8103, 90.4125, 6.0],
  ["Karachi, Pakistan", 24.8607, 67.0011, 5.0],
  ["Lahore, Pakistan", 31.5204, 74.3587, 5.0],
  // --- Rest of the world ---
  ["Dubai, UAE", 25.2048, 55.2708, 4.0],
  ["London, UK", 51.5074, -0.1278, 0.0],
  ["New York, USA", 40.7128, -74.0060, -5.0],
  ["Los Angeles, USA", 34.0522, -118.2437, -8.0],
  ["Chicago, USA", 41.8781, -87.6298, -6.0],
  ["San Francisco, USA", 37.7749, -122.4194, -8.0],
  ["Houston, USA", 29.7604, -95.3698, -6.0],
  ["Toronto, Canada", 43.6532, -79.3832, -5.0],
  ["Singapore", 1.3521, 103.8198, 8.0],
  ["Kuala Lumpur, Malaysia", 3.1390, 101.6869, 8.0],
  ["Hong Kong", 22.3193, 114.1694, 8.0],
  ["Tokyo, Japan", 35.6762, 139.6503, 9.0],
  ["Sydney, Australia", -33.8688, 151.2093, 10.0],
  ["Nairobi, Kenya", -1.2921, 36.8219, 3.0],
  ["Johannesburg, South Africa", -26.2041, 28.0473, 2.0]
].map(([name, lat, lon, tz]) => ({ name, lat, lon, tz }));

module.exports = { CITIES };
