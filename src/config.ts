export const config = {
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  directionsApiUrl: 'https://maps.googleapis.com/maps/api/directions/json',
  roadsApiUrl: 'https://roads.googleapis.com/v1/speedLimits'
};
