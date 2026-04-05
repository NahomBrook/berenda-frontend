// frontend/src/components/PropertyMapPicker.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";

// Dynamically import leaflet components with proper types
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);



// Import Leaflet directly for marker icon fixes
import L from "leaflet";

// Fix marker icons only on client
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
}

interface PropertyMapPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  zoomToLocation?: { lat: number; lng: number; address?: string } | null;
}

// Map click handler component - simplified without dynamic import issues
function MapClickHandler({ onLocationSelect }: { onLocationSelect: PropertyMapPickerProps['onLocationSelect'] }) {
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  
  // We'll use a ref to store the map instance
  const mapRef = useRef<any>(null);
  
  // Get the map instance using a different approach
  useEffect(() => {
    // Import useMap dynamically
    import("react-leaflet").then(({ useMap }) => {
      // This is a hook, so we need to use it in a component
      // Instead, we'll create a separate component
    });
  }, []);

  // Use a simpler approach - use a useEffect to add click handler after map is ready
  useEffect(() => {
    // Get the map container and add click handler
    const mapContainer = document.querySelector(".leaflet-container");
    if (mapContainer && (mapContainer as any)._leaflet_map) {
      const map = (mapContainer as any)._leaflet_map;
      mapRef.current = map;
      
      const handleClick = async (e: any) => {
        const { lat, lng } = e.latlng;
        console.log("Map clicked at:", lat, lng);
        
        setMarkerPosition([lat, lng]);
        
        // Remove existing marker if any
        if (mapRef.current._marker) {
          mapRef.current.removeLayer(mapRef.current._marker);
        }
        
        // Add marker
        const marker = L.marker([lat, lng]).addTo(map);
        marker.bindPopup("Selected location").openPopup();
        mapRef.current._marker = marker;
        
        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          console.log("Address found:", address);
          onLocationSelect(lat, lng, address);
        } catch (error) {
          console.error("Error getting address:", error);
          onLocationSelect(lat, lng, `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }
      };
      
      map.on("click", handleClick);
      
      return () => {
        map.off("click", handleClick);
      };
    }
  }, [onLocationSelect]);

  return markerPosition ? <Marker position={markerPosition} /> : null;
}

// Alternative simpler component using the useMapEvents hook
// This component must be used inside MapContainer
function MapEventsHandler({ onLocationSelect }: { onLocationSelect: PropertyMapPickerProps['onLocationSelect'] }) {
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  
  useEffect(() => {
    let map: any = null;
    
    // Find the map instance
    const findMap = () => {
      const container = document.querySelector(".leaflet-container");
      if (container && (container as any)._leaflet_map) {
        map = (container as any)._leaflet_map;
        
        const handleClick = async (e: any) => {
          const { lat, lng } = e.latlng;
          console.log("Map clicked at:", lat, lng);
          
          setMarkerPosition([lat, lng]);
          
          if (map._marker) {
            map.removeLayer(map._marker);
          }
          
          const marker = L.marker([lat, lng]).addTo(map);
          marker.bindPopup("Selected location").openPopup();
          map._marker = marker;
          
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
            );
            const data = await response.json();
            const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            onLocationSelect(lat, lng, address);
          } catch (error) {
            onLocationSelect(lat, lng, `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          }
        };
        
        map.on("click", handleClick);
        
        return () => {
          map.off("click", handleClick);
        };
      }
      return null;
    };
    
    const timeout = setTimeout(() => {
      findMap();
    }, 500);
    
    return () => clearTimeout(timeout);
  }, [onLocationSelect]);
  
  return markerPosition ? <Marker position={markerPosition} /> : null;
}

export default function PropertyMapPicker({ onLocationSelect, zoomToLocation }: PropertyMapPickerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([9.0320, 38.7469]); // Addis Ababa center
  const [mapZoom, setMapZoom] = useState(13);
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (zoomToLocation && zoomToLocation.lat && zoomToLocation.lng) {
      console.log("Zooming to location:", zoomToLocation);
      setMapCenter([zoomToLocation.lat, zoomToLocation.lng]);
      setMapZoom(16);
      setMarkerPos([zoomToLocation.lat, zoomToLocation.lng]);
      
      if (zoomToLocation.address) {
        onLocationSelect(zoomToLocation.lat, zoomToLocation.lng, zoomToLocation.address);
      }
    }
  }, [zoomToLocation, onLocationSelect]);

  if (!isMounted) {
    return (
      <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={mapCenter}
      zoom={mapZoom}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
      whenReady={() => {
        console.log("Map ready");
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapEventsHandler onLocationSelect={onLocationSelect} />
      {markerPos && (
        <Marker position={markerPos}>
          <Popup>Selected location</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}