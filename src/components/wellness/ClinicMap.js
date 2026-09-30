"use client";

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { NEARBY_CENTRES } from './nearbyCentres';

const DEFAULT_POS = [28.6139, 77.209];

function Recenter({ pos }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.setView(pos, 13);
  }, [pos, map]);
  return null;
}

const userIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
});

export default function ClinicMap({ onNearbyReady }) {
  const [pos, setPos] = useState(null);
  const [locError, setLocError] = useState(false);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setLocError(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => setPos([p.coords.latitude, p.coords.longitude]),
      () => setLocError(true),
      { timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    if (onNearbyReady) onNearbyReady(NEARBY_CENTRES);
  }, [onNearbyReady]);

  const center = pos || DEFAULT_POS;

  return (
    <div className="clinic-map-wrap">
      <MapContainer center={center} zoom={13} className="clinic-map" scrollWheelZoom={false}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; <a href='http://osm.org/copyright'>OpenStreetMap</a> contributors"
        />
        <Recenter pos={pos} />
        {pos && (
          <Marker position={pos} icon={userIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}
        {NEARBY_CENTRES.map((c) => (
          <Marker key={c.id} position={[c.lat, c.lng]}>
            <Popup>
              <strong>{c.name}</strong>
              <br />{c.area} · {c.dist}
              <br />{c.hours}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <p className="clinic-map-note">
        {pos ? 'Showing centres near your live location.' : locError ? 'Location blocked — showing centres near central Delhi.' : 'Locating you… showing centres near central Delhi.'}{' '}
        <span>Distances are sample data.</span>
      </p>
    </div>
  );
}
