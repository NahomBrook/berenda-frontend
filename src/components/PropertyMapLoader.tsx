// frontend/src/components/PropertyMapLoader.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";


// Fix marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface PropertyMapLoaderProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  zoomToLocation?: { lat: number; lng: number; address?: string } | null;
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect: PropertyMapLoaderProps['onLocationSelect'] }) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  
  const map = useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        );
        const data = await response.json();
        const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        onLocationSelect(lat, lng, address);
        
        // Add marker
        L.marker([lat, lng]).addTo(map).bindPopup(address).openPopup();
      } catch (error) {
        onLocationSelect(lat, lng, `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    },
  });
  
  return position ? <Marker position={position} /> : null;
}

export default function PropertyMapLoader({ onLocationSelect, zoomToLocation }: PropertyMapLoaderProps) {
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (zoomToLocation && zoomToLocation.lat && zoomToLocation.lng) {
      setMarkerPos([zoomToLocation.lat, zoomToLocation.lng]);
      if (mapRef.current) {
        mapRef.current.setView([zoomToLocation.lat, zoomToLocation.lng], 16);
      }
    }
  }, [zoomToLocation]);

  return (
    <MapContainer
      center={[9.0320, 38.7469]}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onLocationSelect={onLocationSelect} />
      {markerPos && (
        <Marker position={markerPos}>
          <Popup>Selected location</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}