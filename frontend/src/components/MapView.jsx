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
        <div className="w-20 h-20 bg-dark-700 rounded-full flex items-center justify-center mb-4">
          <MapPin className="w-10 h-10 text-gray-500" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          Google Maps Integration
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          To enable live map view, add your Google Maps API key
        </p>
        <div className="p-3 bg-blue-500/10 border border-blue-500 rounded-lg">
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
