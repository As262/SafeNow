import { useEffect, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Loader, RefreshCw } from "lucide-react";

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Haversine distance in km
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Custom icon builder
const createIcon = (color, emoji, size = 36) =>
  L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background:${color};width:${size}px;height:${size}px;border-radius:50%;
      border:3px solid #fff;display:flex;align-items:center;justify-content:center;
      font-size:${Math.round(size * 0.44)}px;box-shadow:0 2px 8px rgba(0,0,0,.35);
    ">${emoji}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 2)],
  });

const userIcon = L.divIcon({
  className: "user-location-marker",
  html: `<div style="position:relative;width:22px;height:22px;">
    <div style="position:absolute;inset:0;background:#3b82f6;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);"></div>
    <div style="position:absolute;inset:-6px;background:#3b82f6;border-radius:50%;opacity:.35;animation:ping 1.5s cubic-bezier(0,0,.2,1) infinite;"></div>
  </div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -14],
});

const helperIcons = {
  hospital: createIcon("#ef4444", "🏥"),
  police: createIcon("#1d4ed8", "🚔"),
  fire: createIcon("#ea580c", "🚒"),
  ngo: createIcon("#7c3aed", "🤝"),
  helper: createIcon("#059669", "🙋"),
};

// ── Overpass API: fetch hospitals, police, fire, NGOs ──
const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const classifyElement = (el) => {
  const t = el.tags || {};
  const amenity = t.amenity || "";
  const emergency = t.emergency || "";
  const office = t.office || "";
  const social = t["social_facility"] || "";
  const building = t.building || "";

  if (["hospital", "clinic", "doctors"].includes(amenity)) return "hospital";
  if (amenity === "police" || building === "police" || (office === "government" && t.government === "police")) return "police";
  if (amenity === "fire_station" || emergency === "fire_station" || building === "fire_station") return "fire";
  if (office === "ngo" || office === "association" || social || amenity === "social_facility") return "ngo";
  return null;
};

const fetchNearbyPlaces = async (lat, lng) => {
  // Hospitals within 5 km, but police/fire/NGO need 15 km because they're sparse in OSM (especially India)
  const hR = 5000;
  const sR = 15000;
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

  let lastError = null;

  for (const url of OVERPASS_URLS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(url, {
        method: "POST",
        body: `data=${encodeURIComponent(query)}`,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) { lastError = new Error(`HTTP ${res.status}`); continue; }

      const data = await res.json();
      if (!data.elements || data.elements.length === 0) { lastError = new Error("No results"); continue; }

      const seen = new Set();
      return data.elements
        .map((el) => {
          const elLat = el.lat ?? el.center?.lat;
          const elLng = el.lon ?? el.center?.lon;
          if (!elLat || !elLng) return null;

          const type = classifyElement(el);
          if (!type) return null;

          const key = `${type}_${elLat.toFixed(5)}_${elLng.toFixed(5)}`;
          if (seen.has(key)) return null;
          seen.add(key);

          const nameMap = { hospital: "Hospital / Clinic", police: "Police Station", fire: "Fire Station", ngo: "NGO / Social Service" };
          const name = el.tags?.name || el.tags?.["name:en"] || nameMap[type];
          const phoneMap = { hospital: "108", police: "100", fire: "101", ngo: "181" };
          const dist = haversine(lat, lng, elLat, elLng);

          return {
            id: `osm_${el.id}`,
            type,
            name,
            lat: elLat,
            lng: elLng,
            phone: el.tags?.phone || el.tags?.["contact:phone"] || phoneMap[type],
            status: type === "hospital" ? "Open 24/7" : "Active",
            distance: dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)} km`,
            distanceKm: dist,
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.distanceKm - b.distanceKm);
    } catch (err) {
      lastError = err;
      continue;
    }
  }
  throw lastError || new Error("All Overpass endpoints failed");
};

// ── Fallback services when OSM data is sparse ──
const fallbackPolice = [
  { name: "City Police Station", offset: [0.008, 0.005] },
  { name: "Sadar Police Station", offset: [-0.006, 0.009] },
  { name: "Traffic Police Post", offset: [0.003, -0.007] },
  { name: "Women Police Station", offset: [-0.009, -0.004] },
];
const fallbackFire = [
  { name: "Municipal Fire Station", offset: [0.006, -0.008] },
  { name: "Fire & Rescue Station", offset: [-0.007, 0.006] },
];
const fallbackNgo = [
  { name: "Red Cross Society", offset: [0.005, 0.007] },
  { name: "Women Helpline Centre", offset: [-0.004, -0.008] },
  { name: "District Legal Services Authority", offset: [0.009, -0.003] },
  { name: "Child Welfare Committee", offset: [-0.008, 0.004] },
];

const generateFallbackServices = (lat, lng, existingPlaces) => {
  const countByType = (type) => existingPlaces.filter((p) => p.type === type).length;
  const fallbacks = [];
  const phoneMap = { police: "100", fire: "101", ngo: "181" };
  const statusMap = { police: "Active", fire: "Active", ngo: "Available" };
  let idx = 0;

  const addIfNeeded = (type, templates, minCount) => {
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

  addIfNeeded("police", fallbackPolice, 3);
  addIfNeeded("fire", fallbackFire, 2);
  addIfNeeded("ngo", fallbackNgo, 3);
  return fallbacks;
};

// ── Dummy helper people ──
const helperNames = [
  "Rahul Sharma", "Priya Singh", "Amit Kumar", "Sneha Patel",
  "Vikram Reddy", "Ananya Gupta", "Rohan Verma", "Deepika Nair",
  "Karan Malhotra", "Meera Joshi", "Arjun Das", "Pooja Mehta",
];
const helperSkills = [
  "First Aid Certified", "CPR Trained", "Volunteer Medic",
  "Self-Defense Trainer", "Emergency Driver", "Community Guardian",
  "Disaster Relief Worker", "Night Patrol Volunteer",
];

const generateHelperPeople = (lat, lng) =>
  Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * 2 * Math.PI + (Math.random() - 0.5) * 0.5;
    const r = 0.002 + Math.random() * 0.008;
    const hLat = lat + r * Math.sin(angle);
    const hLng = lng + r * Math.cos(angle);
    const dist = haversine(lat, lng, hLat, hLng);
    return {
      id: `helper_${i}`,
      type: "helper",
      name: helperNames[i],
      skill: helperSkills[i],
      lat: hLat,
      lng: hLng,
      rating: (4 + Math.random()).toFixed(1),
      status: i < 6 ? "Available" : "Busy",
      distance: dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)} km`,
      distanceKm: dist,
    };
  }).sort((a, b) => a.distanceKm - b.distanceKm);

// ── Fly to user on first load ──
function FlyToUser({ position }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (position && !done.current) {
      map.flyTo(position, 15, { duration: 1.2 });
      done.current = true;
    }
  }, [position, map]);
  return null;
}

// ── Reload places when the user pans or zooms the map ──
function MapMoveLoader({ onMove, debounceMs = 1500 }) {
  const timer = useRef(null);
  useMapEvents({
    moveend(e) {
      const center = e.target.getCenter();
      clearTimeout(timer.current);
      timer.current = setTimeout(() => onMove(center.lat, center.lng), debounceMs);
    },
  });
  return null;
}

// ════════════════════════════════════════
const MapView = () => {
  const [userPos, setUserPos] = useState(null);
  const [places, setPlaces] = useState([]);
  const [helpers, setHelpers] = useState([]);
  const [locError, setLocError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesError, setPlacesError] = useState(null);
  const [filter, setFilter] = useState("all");
  const lastLoadCenter = useRef(null);

  const loadPlaces = useCallback(async (lat, lng) => {
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
      // Fill gaps with fallback markers when OSM data is sparse
      const withFallbacks = [...results, ...generateFallbackServices(lat, lng, results)];
      setPlaces((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        const newOnes = withFallbacks.filter((r) => !ids.has(r.id));
        return [...prev, ...newOnes];
      });
    } catch (err) {
      console.warn("Overpass API error:", err);
      // Even if API fails, show fallback markers
      const fallbacks = generateFallbackServices(lat, lng, []);
      setPlaces((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        return [...prev, ...fallbacks.filter((f) => !ids.has(f.id))];
      });
      setPlacesError(err.message || "Failed to load nearby places");
    } finally {
      setPlacesLoading(false);
    }
  }, []);

  // Get exact user location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPos([latitude, longitude]);
        setHelpers(generateHelperPeople(latitude, longitude));
        loadPlaces(latitude, longitude);
        setLoading(false);
      },
      (err) => {
        setLocError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }, [loadPlaces]);

  // Combine real places + dummy helpers
  const allMarkers = [...places, ...helpers];
  const filtered = filter === "all" ? allMarkers : allMarkers.filter((m) => m.type === filter);

  const filterButtons = [
    { key: "all", label: "All", emoji: "📍" },
    { key: "hospital", label: "Hospitals", emoji: "🏥" },
    { key: "police", label: "Police", emoji: "🚔" },
    { key: "fire", label: "Fire", emoji: "🚒" },
    { key: "ngo", label: "NGO", emoji: "🤝" },
    { key: "helper", label: "Helpers", emoji: "🙋" },
  ].map((b) => ({ ...b, count: (b.key === "all" ? allMarkers : allMarkers.filter((m) => m.type === b.key)).length }));

  if (loading) {
    return (
      <div className="w-full h-[500px] bg-dark-800 rounded-xl flex flex-col items-center justify-center">
        <Loader className="w-10 h-10 text-primary-500 animate-spin mb-4" />
        <p className="text-gray-400">Getting your exact location...</p>
      </div>
    );
  }

  if (locError) {
    return (
      <div className="w-full h-[500px] bg-dark-800 rounded-xl flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
          <MapPin className="w-10 h-10 text-red-500" />
        </div>
        <p className="text-red-400 mb-2 font-semibold">Location Error</p>
        <p className="text-gray-400 text-sm mb-4">{locError}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors">
          Retry
        </button>
      </div>
    );
  }

  const defaultCenter = userPos || [28.6139, 77.209];

  return (
    <div className="w-full space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 items-center">
        {filterButtons.map((btn) => (
          <button
            key={btn.key}
            onClick={() => setFilter(btn.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${
              filter === btn.key
                ? "bg-primary-600 text-white shadow-lg shadow-primary-600/30"
                : "bg-dark-700 text-gray-300 hover:bg-dark-600"
            }`}
          >
            {btn.emoji} {btn.label}
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${filter === btn.key ? "bg-white/20" : "bg-dark-600"}`}>
              {btn.count}
            </span>
          </button>
        ))}
        {placesLoading && (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <RefreshCw className="w-3 h-3 animate-spin" /> Loading places...
          </span>
        )}
        {placesError && !placesLoading && (
          <button onClick={() => userPos && loadPlaces(userPos[0], userPos[1])} className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300">
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        )}
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-dark-700 shadow-lg" style={{ height: "500px" }}>
        <MapContainer center={defaultCenter} zoom={14} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FlyToUser position={userPos} />
          <MapMoveLoader onMove={loadPlaces} />

          {/* User marker */}
          {userPos && (
            <>
              <Circle center={userPos} radius={200} pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.08, weight: 1 }} />
              <Marker position={userPos} icon={userIcon}>
                <Popup>
                  <div className="text-center">
                    <p className="font-bold text-gray-900">📍 You are here</p>
                    <p className="text-xs text-gray-500 mt-1">{userPos[0].toFixed(6)}, {userPos[1].toFixed(6)}</p>
                  </div>
                </Popup>
              </Marker>
            </>
          )}

          {/* All place & helper markers */}
          {filtered.map((item) => (
            <Marker key={item.id} position={[item.lat, item.lng]} icon={helperIcons[item.type] || helperIcons.hospital}>
              <Popup>
                <div style={{ minWidth: 200 }}>
                  <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                  {item.type === "helper" ? (
                    <>
                      <p className="text-xs text-gray-500 mt-1">{item.skill}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${item.status === "Available" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {item.status}
                        </span>
                        <span className="text-xs text-gray-500">⭐ {item.rating}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">📏 {item.distance} away</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-gray-500 capitalize mt-1">
                        {item.type === "fire" ? "Fire Station" : item.type === "ngo" ? "NGO / Social" : item.type} &bull; {item.distance}
                      </p>
                      <p className="text-xs mt-1">
                        <span className="inline-block px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">{item.status}</span>
                      </p>
                      <a href={`tel:${item.phone}`} className="inline-block mt-2 px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 transition-colors">
                        📞 Call {item.phone}
                      </a>
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-400">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> You</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Hospital</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-700 inline-block" /> Police</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-600 inline-block" /> Fire Station</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-purple-600 inline-block" /> NGO</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" /> Helper</span>
      </div>
    </div>
  );
};

export default MapView;
