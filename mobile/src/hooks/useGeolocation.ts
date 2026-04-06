import { useState } from 'react';
import * as Location from 'expo-location';
import { LocationCoords } from '../types';

interface UseGeolocationReturn {
  location: LocationCoords | null;
  error: string | null;
  loading: boolean;
  getLocation: () => Promise<void>;
}

export const useGeolocation = (): UseGeolocationReturn => {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getLocation = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setError('Location permission denied');
        setLoading(false);
        return;
      }

      // Get current location
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 0,
      });

      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy || undefined,
      });
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
      setLoading(false);
    }
  };

  return { location, error, loading, getLocation };
};
