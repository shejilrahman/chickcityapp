"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Check, Loader2, X } from "lucide-react";

/**
 * Completely FREE map location picker.
 * Uses: Leaflet (OSS) + OpenStreetMap tiles (free) + Nominatim reverse geocoding (free)
 */
export default function MapPicker({ onConfirm, onCancel }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [address, setAddress] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [latlng, setLatlng] = useState({ lat: 10.420439, lng: 76.104856 }); // Default: Thriprayar, Kerala

  // Reverse geocode using Nominatim
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

  const gpsLocate = useCallback(async (map, marker) => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lng } = pos.coords;
          if (map) map.setView([lat, lng], 16);
          if (marker) marker.setLatLng([lat, lng]);
          setLatlng({ lat, lng });
          await reverseGeocode(lat, lng);
        } catch (e) {
          console.error("GPS Update error:", e);
        } finally {
          setIsLocating(false);
        }
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [reverseGeocode]);

  // Load Leaflet Script and CSS once
  useEffect(() => {
    if (window.L) {
      setIsLoaded(true);
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Don't remove script/css to avoid reloading if re-opened
    };
  }, []);

  // Initialize Map only after script is loaded and container is ready
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return;
    
    const L = window.L;
    if (!L) return;

    try {
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

      marker.on("dragend", async (e) => {
        const { lat, lng } = e.target.getLatLng();
        setLatlng({ lat, lng });
        await reverseGeocode(lat, lng);
      });

      map.on("click", async (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setLatlng({ lat, lng });
        await reverseGeocode(lat, lng);
      });

      reverseGeocode(latlng.lat, latlng.lng);
      gpsLocate(map, marker);
    } catch (e) {
      console.error("Leaflet init error:", e);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  const handleGPSClick = () => {
    if (!mapInstanceRef.current || !markerRef.current) return;
    gpsLocate(mapInstanceRef.current, markerRef.current);
  };

  const handleConfirm = () => {
    const mapsLink = `https://www.google.com/maps?q=${latlng.lat},${latlng.lng}`;
    onConfirm?.(`${address}\n${mapsLink}`);
  };

  return (
    <div className="fixed inset-0 z-[9998] flex flex-col bg-white animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
        <div>
          <h3 className="font-black text-[15px] text-gray-900">Pin your location</h3>
          <p className="text-[10px] text-gray-400">Tap map or drag pin</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGPSClick}
            disabled={isLocating || !isLoaded}
            className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-2 rounded-xl active:bg-emerald-100 disabled:opacity-50"
          >
            {isLocating ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
            GPS
          </button>
          <button
            onClick={onCancel}
            className="w-10 h-10 flex items-center justify-center text-gray-400 bg-gray-100 rounded-xl active:bg-gray-200"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Map */}
      <div ref={mapRef} className="flex-1 bg-gray-50 flex items-center justify-center relative">
        {!isLoaded && (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="animate-spin text-emerald-600" size={32} />
            <span className="text-xs font-bold text-gray-400">Loading Map...</span>
          </div>
        )}
      </div>

      {/* Bottom confirm bar */}
      <div className="px-4 pb-8 pt-4 bg-white border-t border-gray-100 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        {isGeocoding ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
            <Loader2 size={14} className="animate-spin" />
            <span className="text-xs font-bold">Getting address…</span>
          </div>
        ) : (
          <p className="text-[12px] font-medium text-gray-600 mb-4 line-clamp-2 leading-relaxed min-h-[3em]">
            {address || "Locating..."}
          </p>
        )}
        <button
          onClick={handleConfirm}
          disabled={isGeocoding || !isLoaded}
          className="w-full bg-emerald-600 text-white font-black text-[15px] py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60 shadow-lg shadow-emerald-600/20"
        >
          <Check size={20} />
          Use this delivery address
        </button>
      </div>
    </div>
  );
}
