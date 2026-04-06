import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import MapView, { Marker, Circle, Callout, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Linking from 'expo-linking';
import {
  MapPin,
  RefreshCw,
  Navigation,
  Phone,
  Filter,
  Hospital,
  Shield,
  Flame,
  Users,
  Heart,
} from 'lucide-react-native';
import { useGeolocation } from '../../hooks/useGeolocation';
import { colors, fontSize, spacing } from '../../styles/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Haversine distance in km
const haversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

interface PlaceMarker {
  id: string;
  type: 'hospital' | 'police' | 'fire' | 'ngo' | 'helper';
  name: string;
  lat: number;
  lng: number;
  phone: string;
  status: string;
  distance: string;
  distanceKm: number;
  skill?: string;
  rating?: string;
}

// Overpass API endpoints
const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

const classifyElement = (el: any): 'hospital' | 'police' | 'fire' | 'ngo' | null => {
  const t = el.tags || {};
  const amenity = t.amenity || '';
  const emergency = t.emergency || '';
  const office = t.office || '';
  const social = t['social_facility'] || '';
  const building = t.building || '';

  if (['hospital', 'clinic', 'doctors'].includes(amenity)) return 'hospital';
  if (amenity === 'police' || building === 'police' || (office === 'government' && t.government === 'police')) return 'police';
  if (amenity === 'fire_station' || emergency === 'fire_station' || building === 'fire_station') return 'fire';
  if (office === 'ngo' || office === 'association' || social || amenity === 'social_facility') return 'ngo';
  return null;
};

const fetchNearbyPlaces = async (lat: number, lng: number): Promise<PlaceMarker[]> => {
  const hR = 5000; // hospitals: 5km
  const sR = 15000; // others: 15km
  const query = `[out:json][timeout:30];(
node["amenity"~"^(hospital|clinic|doctors)$"](around:${hR},${lat},${lng});
way["amenity"="hospital"](around:${hR},${lat},${lng});
node["amenity"="police"](around:${sR},${lat},${lng});
way["amenity"="police"](around:${sR},${lat},${lng});
node["building"="police"](around:${sR},${lat},${lng});
node["amenity"="fire_station"](around:${sR},${lat},${lng});
way["amenity"="fire_station"](around:${sR},${lat},${lng});
node["emergency"="fire_station"](around:${sR},${lat},${lng});
node["office"~"^(ngo|association)$"](around:${sR},${lat},${lng});
way["office"="ngo"](around:${sR},${lat},${lng});
node["amenity"="social_facility"](around:${sR},${lat},${lng});
node["social_facility"](around:${sR},${lat},${lng});
);out center body 100;`;

  let lastError: Error | null = null;

  for (const url of OVERPASS_URLS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(url, {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status}`);
        continue;
      }

      const data = await res.json();
      if (!data.elements || data.elements.length === 0) {
        lastError = new Error('No results');
        continue;
      }

      const seen = new Set<string>();
      return data.elements
        .map((el: any) => {
          const elLat = el.lat ?? el.center?.lat;
          const elLng = el.lon ?? el.center?.lon;
          if (!elLat || !elLng) return null;

          const type = classifyElement(el);
          if (!type) return null;

          const key = `${type}_${elLat.toFixed(5)}_${elLng.toFixed(5)}`;
          if (seen.has(key)) return null;
          seen.add(key);

          const nameMap: Record<string, string> = { hospital: 'Hospital / Clinic', police: 'Police Station', fire: 'Fire Station', ngo: 'NGO / Social Service' };
          const name = el.tags?.name || el.tags?.['name:en'] || nameMap[type];
          const phoneMap: Record<string, string> = { hospital: '108', police: '100', fire: '101', ngo: '181' };
          const dist = haversine(lat, lng, elLat, elLng);

          return {
            id: `osm_${el.id}`,
            type,
            name,
            lat: elLat,
            lng: elLng,
            phone: el.tags?.phone || el.tags?.['contact:phone'] || phoneMap[type],
            status: type === 'hospital' ? 'Open 24/7' : 'Active',
            distance: dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)} km`,
            distanceKm: dist,
          };
        })
        .filter(Boolean)
        .sort((a: PlaceMarker, b: PlaceMarker) => a.distanceKm - b.distanceKm);
    } catch (err) {
      lastError = err as Error;
      continue;
    }
  }
  throw lastError || new Error('All Overpass endpoints failed');
};

// Fallback services
const fallbackPolice = [
  { name: 'City Police Station', offset: [0.008, 0.005] },
  { name: 'Sadar Police Station', offset: [-0.006, 0.009] },
  { name: 'Traffic Police Post', offset: [0.003, -0.007] },
];
const fallbackFire = [
  { name: 'Municipal Fire Station', offset: [0.006, -0.008] },
  { name: 'Fire & Rescue Station', offset: [-0.007, 0.006] },
];
const fallbackNgo = [
  { name: 'Red Cross Society', offset: [0.005, 0.007] },
  { name: 'Women Helpline Centre', offset: [-0.004, -0.008] },
  { name: 'Child Welfare Committee', offset: [-0.008, 0.004] },
];

const generateFallbackServices = (lat: number, lng: number, existingPlaces: PlaceMarker[]): PlaceMarker[] => {
  const countByType = (type: string) => existingPlaces.filter((p) => p.type === type).length;
  const fallbacks: PlaceMarker[] = [];
  const phoneMap: Record<string, string> = { police: '100', fire: '101', ngo: '181' };
  const statusMap: Record<string, string> = { police: 'Active', fire: 'Active', ngo: 'Available' };
  let idx = 0;

  const addIfNeeded = (type: 'police' | 'fire' | 'ngo', templates: any[], minCount: number) => {
    const existing = countByType(type);
    if (existing >= minCount) return;
    const needed = minCount - existing;
    templates.slice(0, needed).forEach((t) => {
      const fLat = lat + t.offset[0] + (Math.random() - 0.5) * 0.002;
      const fLng = lng + t.offset[1] + (Math.random() - 0.5) * 0.002;
      const dist = haversine(lat, lng, fLat, fLng);
      fallbacks.push({
        id: `fb_${type}_${idx++}`,
        type,
        name: t.name,
        lat: fLat,
        lng: fLng,
        phone: phoneMap[type],
        status: statusMap[type],
        distance: dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)} km`,
        distanceKm: dist,
      });
    });
  };

  addIfNeeded('police', fallbackPolice, 2);
  addIfNeeded('fire', fallbackFire, 1);
  addIfNeeded('ngo', fallbackNgo, 2);
  return fallbacks;
};

// Dummy helper people
const helperNames = [
  'Rahul Sharma', 'Priya Singh', 'Amit Kumar', 'Sneha Patel',
  'Vikram Reddy', 'Ananya Gupta', 'Rohan Verma', 'Deepika Nair',
];
const helperSkills = [
  'First Aid Certified', 'CPR Trained', 'Volunteer Medic',
  'Self-Defense Trainer', 'Emergency Driver', 'Community Guardian',
  'Disaster Relief Worker', 'Night Patrol Volunteer',
];

const generateHelperPeople = (lat: number, lng: number): PlaceMarker[] =>
  Array.from({ length: 6 }, (_, i) => {
    const angle = (i / 6) * 2 * Math.PI + (Math.random() - 0.5) * 0.5;
    const r = 0.002 + Math.random() * 0.006;
    const hLat = lat + r * Math.sin(angle);
    const hLng = lng + r * Math.cos(angle);
    const dist = haversine(lat, lng, hLat, hLng);
    return {
      id: `helper_${i}`,
      type: 'helper' as const,
      name: helperNames[i],
      skill: helperSkills[i],
      lat: hLat,
      lng: hLng,
      phone: '',
      rating: (4 + Math.random()).toFixed(1),
      status: i < 4 ? 'Available' : 'Busy',
      distance: dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)} km`,
      distanceKm: dist,
    };
  }).sort((a, b) => a.distanceKm - b.distanceKm);

// Marker colors by type
const markerColors: Record<string, string> = {
  hospital: '#ef4444',
  police: '#1d4ed8',
  fire: '#ea580c',
  ngo: '#7c3aed',
  helper: '#059669',
};

type FilterType = 'all' | 'hospital' | 'police' | 'fire' | 'ngo' | 'helper';

const MapScreen: React.FC = () => {
  const { location, loading: locationLoading, error: locationError, getLocation } = useGeolocation();
  const mapRef = useRef<MapView>(null);

  const [places, setPlaces] = useState<PlaceMarker[]>([]);
  const [helpers, setHelpers] = useState<PlaceMarker[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<PlaceMarker | null>(null);
  const lastLoadCenter = useRef<[number, number] | null>(null);

  const loadPlaces = useCallback(async (lat: number, lng: number) => {
    // Skip if we already loaded for a nearby centre (< 1 km)
    if (lastLoadCenter.current) {
      const d = haversine(lat, lng, lastLoadCenter.current[0], lastLoadCenter.current[1]);
      if (d < 1) return;
    }
    lastLoadCenter.current = [lat, lng];
    setPlacesLoading(true);
    setPlacesError(null);
    try {
      const results = await fetchNearbyPlaces(lat, lng);
      const withFallbacks = [...results, ...generateFallbackServices(lat, lng, results)];
      setPlaces((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        const newOnes = withFallbacks.filter((r) => !ids.has(r.id));
        return [...prev, ...newOnes];
      });
    } catch (err: any) {
      console.warn('Overpass API error:', err);
      const fallbacks = generateFallbackServices(lat, lng, []);
      setPlaces((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        return [...prev, ...fallbacks.filter((f) => !ids.has(f.id))];
      });
      setPlacesError(err.message || 'Failed to load nearby places');
    } finally {
      setPlacesLoading(false);
    }
  }, []);

  useEffect(() => {
    getLocation();
  }, []);

  useEffect(() => {
    if (location) {
      setHelpers(generateHelperPeople(location.latitude, location.longitude));
      loadPlaces(location.latitude, location.longitude);
    }
  }, [location, loadPlaces]);

  const handleRefresh = async () => {
    await getLocation();
    if (location) {
      lastLoadCenter.current = null;
      setPlaces([]);
      loadPlaces(location.latitude, location.longitude);
      setHelpers(generateHelperPeople(location.latitude, location.longitude));
    }
  };

  const openDirections = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url);
  };

  const callNumber = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleRegionChange = (region: Region) => {
    if (location) {
      const d = haversine(location.latitude, location.longitude, region.latitude, region.longitude);
      if (d > 2) {
        loadPlaces(region.latitude, region.longitude);
      }
    }
  };

  const allMarkers = [...places, ...helpers];
  const filteredMarkers = filter === 'all' ? allMarkers : allMarkers.filter((m) => m.type === filter);

  const filterButtons: { key: FilterType; label: string; icon: any; color: string }[] = [
    { key: 'all', label: 'All', icon: MapPin, color: colors.primary[500] },
    { key: 'hospital', label: 'Hospital', icon: Hospital, color: '#ef4444' },
    { key: 'police', label: 'Police', icon: Shield, color: '#1d4ed8' },
    { key: 'fire', label: 'Fire', icon: Flame, color: '#ea580c' },
    { key: 'ngo', label: 'NGO', icon: Users, color: '#7c3aed' },
    { key: 'helper', label: 'Helper', icon: Heart, color: '#059669' },
  ];

  if (locationLoading && !location) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  if (locationError && !location) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorIcon}>
          <MapPin color={colors.error[500]} size={40} />
        </View>
        <Text style={styles.errorTitle}>Location Error</Text>
        <Text style={styles.errorText}>{locationError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={getLocation}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initialRegion = location
    ? {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }
    : {
        latitude: 28.6139,
        longitude: 77.209,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Emergency Map</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <RefreshCw color="#fff" size={20} />
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {filterButtons.map((btn) => {
          const Icon = btn.icon;
          const count = btn.key === 'all' ? allMarkers.length : allMarkers.filter((m) => m.type === btn.key).length;
          const isActive = filter === btn.key;
          return (
            <TouchableOpacity
              key={btn.key}
              style={[styles.filterChip, isActive && { backgroundColor: btn.color }]}
              onPress={() => setFilter(btn.key)}
            >
              <Icon color={isActive ? '#fff' : btn.color} size={16} />
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{btn.label}</Text>
              <View style={[styles.filterBadge, isActive && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeText, isActive && styles.filterBadgeTextActive]}>{count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Loading indicator */}
      {placesLoading && (
        <View style={styles.placesLoadingBar}>
          <ActivityIndicator size="small" color={colors.primary[500]} />
          <Text style={styles.placesLoadingText}>Loading nearby places...</Text>
        </View>
      )}

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={initialRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
          onRegionChangeComplete={handleRegionChange}
        >
          {/* User location circle */}
          {location && (
            <Circle
              center={{ latitude: location.latitude, longitude: location.longitude }}
              radius={200}
              fillColor="rgba(59, 130, 246, 0.1)"
              strokeColor="rgba(59, 130, 246, 0.3)"
              strokeWidth={1}
            />
          )}

          {/* Place and Helper markers */}
          {filteredMarkers.map((marker) => (
            <Marker
              key={marker.id}
              coordinate={{ latitude: marker.lat, longitude: marker.lng }}
              pinColor={markerColors[marker.type]}
              onPress={() => setSelectedMarker(marker)}
            >
              <Callout tooltip onPress={() => {}}>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{marker.name}</Text>
                  {marker.type === 'helper' ? (
                    <>
                      <Text style={styles.calloutText}>{marker.skill}</Text>
                      <View style={styles.calloutRow}>
                        <View style={[styles.statusBadge, marker.status === 'Available' ? styles.statusAvailable : styles.statusBusy]}>
                          <Text style={styles.statusText}>{marker.status}</Text>
                        </View>
                        <Text style={styles.calloutRating}>★ {marker.rating}</Text>
                      </View>
                      <Text style={styles.calloutDistance}>{marker.distance} away</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.calloutText}>
                        {marker.type === 'fire' ? 'Fire Station' : marker.type === 'ngo' ? 'NGO / Social' : marker.type.charAt(0).toUpperCase() + marker.type.slice(1)}
                      </Text>
                      <Text style={styles.calloutDistance}>{marker.distance} away</Text>
                      <View style={styles.calloutActions}>
                        <TouchableOpacity style={styles.calloutButton} onPress={() => callNumber(marker.phone)}>
                          <Phone color="#fff" size={14} />
                          <Text style={styles.calloutButtonText}>Call {marker.phone}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.calloutButton, styles.calloutButtonSecondary]} onPress={() => openDirections(marker.lat, marker.lng)}>
                          <Navigation color={colors.primary[500]} size={14} />
                          <Text style={[styles.calloutButtonText, styles.calloutButtonTextSecondary]}>Directions</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>

        {/* Center on user button */}
        {location && (
          <TouchableOpacity
            style={styles.centerButton}
            onPress={() => {
              mapRef.current?.animateToRegion({
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              });
            }}
          >
            <Navigation color={colors.primary[500]} size={24} />
          </TouchableOpacity>
        )}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
          <Text style={styles.legendText}>You</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
          <Text style={styles.legendText}>Hospital</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#1d4ed8' }]} />
          <Text style={styles.legendText}>Police</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ea580c' }]} />
          <Text style={styles.legendText}>Fire</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#7c3aed' }]} />
          <Text style={styles.legendText}>NGO</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#059669' }]} />
          <Text style={styles.legendText}>Helper</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark[950],
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.dark[950],
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.dark[400],
    marginTop: spacing.md,
    fontSize: fontSize.base,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.dark[950],
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.error[500] + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  errorTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.error[500],
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: fontSize.base,
    color: colors.dark[400],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: fontSize.base,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark[800],
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: '#fff',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.dark[800],
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    maxHeight: 50,
    backgroundColor: colors.dark[900],
  },
  filterContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark[800],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  filterText: {
    fontSize: fontSize.sm,
    color: colors.dark[300],
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  filterBadge: {
    backgroundColor: colors.dark[700],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.dark[400],
  },
  filterBadgeTextActive: {
    color: '#fff',
  },
  placesLoadingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    backgroundColor: colors.dark[800],
    gap: spacing.sm,
  },
  placesLoadingText: {
    fontSize: fontSize.sm,
    color: colors.dark[400],
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  centerButton: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  callout: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.md,
    minWidth: 200,
    maxWidth: 280,
  },
  calloutTitle: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.dark[900],
    marginBottom: spacing.xs,
  },
  calloutText: {
    fontSize: fontSize.sm,
    color: colors.dark[500],
    marginBottom: spacing.xs,
  },
  calloutDistance: {
    fontSize: fontSize.xs,
    color: colors.dark[400],
    marginBottom: spacing.sm,
  },
  calloutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  calloutRating: {
    fontSize: fontSize.sm,
    color: '#f59e0b',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusAvailable: {
    backgroundColor: '#d1fae5',
  },
  statusBusy: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.dark[700],
  },
  calloutActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  calloutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error[500],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    gap: 4,
  },
  calloutButtonSecondary: {
    backgroundColor: colors.primary[500] + '20',
  },
  calloutButtonText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: '#fff',
  },
  calloutButtonTextSecondary: {
    color: colors.primary[500],
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.dark[900],
    borderTopWidth: 1,
    borderTopColor: colors.dark[800],
    gap: spacing.md,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: fontSize.xs,
    color: colors.dark[400],
  },
});

export default MapScreen;
