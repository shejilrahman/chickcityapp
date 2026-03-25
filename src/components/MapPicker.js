"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Check, Loader2 } from "lucide-react";

/**
 * Completely FREE map location picker.
 * Uses: Leaflet (OSS) + OpenStreetMap tiles (free) + Nominatim reverse geocoding (free)
 * No API keys required.
 */
export default function MapPicker({ onConfirm, onCancel }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [address, setAddress] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [latlng, setLatlng] = useState({ lat: 10.420439, lng: 76.104856 }); // Default: Thriprayar, Kerala

  // Reverse geocode using Nominatim (completely free)
  const reverseGeocode = useCallback(async (lat, lng) => {
    setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      setAddress(data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } catch {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  const gpsLocate = useCallback((map, marker) => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        map.setView([lat, lng], 16);
        marker.setLatLng([lat, lng]);
        setLatlng({ lat, lng });
        await reverseGeocode(lat, lng);
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [reverseGeocode]);

  const initMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const L = window.L;

    const map = L.map(mapRef.current).setView([latlng.lat, latlng.lng], 15);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    // Custom red marker icon
    const icon = L.divIcon({
      html: `<div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;margin-left:-16px;margin-top:-28px">
               <svg viewBox="0 0 24 24" width="32" height="32" fill="#059669" stroke="white" stroke-width="1">
                 <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                 <circle cx="12" cy="9" r="2.5" fill="white"/>
               </svg>
             </div>`,
      iconSize: [32, 32],
      className: "",
    });

    const marker = L.marker([latlng.lat, latlng.lng], { icon, draggable: true }).addTo(map);
    markerRef.current = marker;

    // On marker drag end
    marker.on("dragend", async (e) => {
      const { lat, lng } = e.target.getLatLng();
      setLatlng({ lat, lng });
      await reverseGeocode(lat, lng);
    });

    // On map click — move marker
    map.on("click", async (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setLatlng({ lat, lng });
      await reverseGeocode(lat, lng);
    });

    // Initial reverse geocode
    reverseGeocode(latlng.lat, latlng.lng);

    // Use GPS to center immediately
    gpsLocate(map, marker);
  }, [latlng.lat, latlng.lng, reverseGeocode, gpsLocate]);

  useEffect(() => {
    // Dynamically load Leaflet CSS and JS (no npm install needed)
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => initMap();
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(script);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [initMap]);

  const handleGPSClick = () => {
    if (!mapInstanceRef.current || !markerRef.current) return;
    gpsLocate(mapInstanceRef.current, markerRef.current);
  };

  const handleConfirm = () => {
    const mapsLink = `https://www.google.com/maps?q=${latlng.lat},${latlng.lng}`;
    onConfirm?.(`${address}\n${mapsLink}`);
  };

  return (
    <div className="fixed inset-0 z-[9998] flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
        <div>
          <h3 className="font-black text-[15px] text-gray-900">Pin your location</h3>
          <p className="text-[10px] text-gray-400">Tap the map or drag the pin</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGPSClick}
            disabled={isLocating}
            className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-2 rounded-xl active:bg-emerald-100 disabled:opacity-50"
          >
            {isLocating ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
            GPS
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-2 text-xs text-gray-500 font-bold rounded-xl bg-gray-100 active:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Map */}
      <div ref={mapRef} className="flex-1" />

      {/* Bottom confirm bar */}
      <div className="px-4 pb-6 pt-3 bg-white border-t border-gray-100">
        {isGeocoding ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
            <Loader2 size={14} className="animate-spin" />
            <span className="text-xs">Finding address…</span>
          </div>
        ) : (
          <p className="text-[11px] text-gray-600 mb-3 line-clamp-2 leading-snug">{address}</p>
        )}
        <button
          onClick={handleConfirm}
          disabled={isGeocoding}
          className="w-full bg-emerald-600 text-white font-black text-[15px] py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60 shadow-lg shadow-emerald-600/20"
        >
          <Check size={18} />
          Use this location
        </button>
      </div>
    </div>
  );
}
