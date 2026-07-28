'use client';

import "@/lib/leaflet";

import { MapContainer, TileLayer, Marker } from "react-leaflet";

type MapProps = {
  latitude: number;
  longitude: number;
  zoom?: number;
  height?: string;
};

export default function Map({
  latitude,
  longitude,
  zoom = 15,
  height = "400px",
}: MapProps) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={zoom}
      scrollWheelZoom={true}
      dragging={true}
      doubleClickZoom={false}
      touchZoom={true}
      zoomControl={true}
      style={{
        width: "100%",
        height,
        borderRadius: "12px",
      }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={[latitude, longitude]} />
    </MapContainer>
  );
}