"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import leaflet components
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

import "leaflet/dist/leaflet.css";
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

export default function PropertyMapPicker({ onLocationSelect, zoomToLocation }: PropertyMapPickerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([9.0320, 38.7469]);
  const [mapZoom, setMapZoom] = useState(12);
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (zoomToLocation && zoomToLocation.lat && zoomToLocation.lng) {
      setMapCenter([zoomToLocation.lat, zoomToLocation.lng]);
      setMapZoom(16);
      setMarkerPos([zoomToLocation.lat, zoomToLocation.lng]);
    }
  }, [zoomToLocation]);

  if (!isMounted) {
    return (
      <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  return (
    <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markerPos && (
        <Marker position={markerPos}>
          <Popup>Selected location</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
