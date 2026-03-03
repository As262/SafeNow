import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import { useState } from "react";
import { MapPin, Phone, Clock } from "lucide-react";

// Note: Replace with your actual Google Maps API key in production
const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY_HERE";

const mapContainerStyle = {
  width: "100%",
  height: "500px",
  borderRadius: "8px",
};

const defaultCenter = {
  lat: 28.6139, // New Delhi
  lng: 77.209,
};

const MapView = ({ requests, selectedRequest }) => {
  const [infoWindowRequest, setInfoWindowRequest] = useState(null);

  // If no API key is provided, show a placeholder
  if (
    !GOOGLE_MAPS_API_KEY ||
    GOOGLE_MAPS_API_KEY === "YOUR_GOOGLE_MAPS_API_KEY_HERE"
  ) {
    return (
      <div className="w-full h-full bg-dark-800 rounded-lg flex flex-col items-center justify-center p-6 text-center">
        <MapPin className="w-16 h-16 text-gray-600 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">
          Google Maps Integration
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          To enable live map view, add your Google Maps API key
        </p>

        {/* Mock Map Display */}
        <div className="w-full bg-dark-900 rounded-lg p-4 mt-4">
          <p className="text-xs text-gray-500 mb-3">
            Active Request Locations:
          </p>
          {requests.length === 0 ? (
            <p className="text-sm text-gray-400">No active requests</p>
          ) : (
            <div className="space-y-2">
              {requests.map((request, index) => (
                <div
                  key={request.id}
                  className={`p-3 rounded-lg transition-all ${
                    selectedRequest?.id === request.id
                      ? "bg-primary-600/20 border border-primary-600"
                      : "bg-dark-800"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-white">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {request.userName}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3" />
                        {request.userId}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        📍 {request.location?.latitude?.toFixed?.(4) || '—'},{" "}
                        {request.location?.longitude?.toFixed?.(4) || '—'}
                      </p>
                      <p className="text-xs text-red-400 mt-1 font-semibold">
                        {request.type}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500 rounded-lg">
          <p className="text-xs text-blue-400">
            💡 Add GOOGLE_MAPS_API_KEY in MapView.jsx to enable interactive map
          </p>
        </div>
      </div>
    );
  }

  // Actual Google Maps implementation (when API key is provided)
  const center = selectedRequest
    ? {
        lat: selectedRequest.location.latitude,
        lng: selectedRequest.location.longitude,
      }
    : requests.length > 0
      ? {
          lat: requests[0].location.latitude,
          lng: requests[0].location.longitude,
        }
      : defaultCenter;

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={selectedRequest ? 15 : 12}
        options={{
          styles: [
            // Dark theme for map
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            {
              elementType: "labels.text.stroke",
              stylers: [{ color: "#242f3e" }],
            },
            {
              elementType: "labels.text.fill",
              stylers: [{ color: "#746855" }],
            },
          ],
          disableDefaultUI: false,
          zoomControl: true,
        }}
      >
        {requests.map((request, index) => (
          <Marker
            key={request.id}
            position={{
              lat: request.location.latitude,
              lng: request.location.longitude,
            }}
            onClick={() => setInfoWindowRequest(request)}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor:
                selectedRequest?.id === request.id ? "#ef4444" : "#dc2626",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
              scale: selectedRequest?.id === request.id ? 12 : 8,
            }}
            label={{
              text: (index + 1).toString(),
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          />
        ))}

        {infoWindowRequest && (
          <InfoWindow
            position={{
              lat: infoWindowRequest.location.latitude,
              lng: infoWindowRequest.location.longitude,
            }}
            onCloseClick={() => setInfoWindowRequest(null)}
          >
            <div className="p-2">
              <h3 className="font-bold text-gray-900">
                {infoWindowRequest.userName}
              </h3>
              <p className="text-sm text-gray-600">{infoWindowRequest.type}</p>
              <p className="text-xs text-gray-500 mt-1">
                📞 {infoWindowRequest.userId}
              </p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  );
};

export default MapView;
