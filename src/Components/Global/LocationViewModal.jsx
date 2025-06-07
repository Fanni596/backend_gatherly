import React, { useEffect, useRef } from "react";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
const VITE_MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN; // Replace with your actual API URL

mapboxgl.accessToken = VITE_MAPBOX_ACCESS_TOKEN;

const LocationViewModal = ({ initialLngLat = { lng: 70.0011, lat: 24.8607 }, onClose }) => {
  const mapRef = useRef(null);
  const mapContainer = useRef(null);
  const markerRef = useRef(null);

  // Function to open Google Maps with the current coordinates
  const openGoogleMaps = () => {
    const { lat, lng } = initialLngLat;
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    if (!mapRef.current) {
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [initialLngLat.lng, initialLngLat.lat],
        zoom: 12,
      });

      mapRef.current = map;
      map.addControl(new mapboxgl.NavigationControl());

      markerRef.current = new mapboxgl.Marker()
        .setLngLat([initialLngLat.lng, initialLngLat.lat])
        .addTo(map);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Location</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-600 text-xl">×</button>
        </div>

        {/* Map */}
        <div ref={mapContainer} className="h-96" style={{ width: '100%' }} />

        {/* Display coordinates (read-only) */}
        <div className="p-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Latitude</label>
            <input
              type="number"
              className="w-full border border-gray-300 rounded p-2 bg-gray-100"
              value={initialLngLat.lat}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Longitude</label>
            <input
              type="number"
              className="w-full border border-gray-300 rounded p-2 bg-gray-100"
              value={initialLngLat.lng}
              readOnly
            />
          </div>
        </div>

        {/* Footer with close and navigate buttons */}
        <div className="p-4 border-t flex justify-between">
          <button
            onClick={openGoogleMaps}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            Navigate on Google Maps
          </button>
          <button
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationViewModal;