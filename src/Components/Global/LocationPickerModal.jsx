import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { debounce } from 'lodash';

const VITE_MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN; // Replace with your actual API URL

mapboxgl.accessToken = VITE_MAPBOX_ACCESS_TOKEN;
const LocationPickerModal = ({ initialLngLat = { lng: 67.0011, lat: 24.8607 }, onClose, onSave }) => {
  const mapRef = useRef(null);
  const mapContainer = useRef(null);
  const markerRef = useRef(null);
  const searchInputRef = useRef(null);
  const [location, setLocation] = useState(initialLngLat);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [addressDetails, setAddressDetails] = useState({});
  const [showPasteLink, setShowPasteLink] = useState(false);
  const [googleMapsLink, setGoogleMapsLink] = useState("");
  const [isResolvingLink, setIsResolvingLink] = useState(false);

  // Enhanced debounced search with better place details
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        // First request for autocomplete results
        const autocompleteResponse = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
          `access_token=${mapboxgl.accessToken}&autocomplete=true&types=address,place,poi,neighborhood,locality,region,postcode,country&limit=5`
        );
        
        const autocompleteData = await autocompleteResponse.json();
        
        // Enrich results with more details
        const enrichedResults = await Promise.all(
          autocompleteData.features.map(async (feature) => {
            // Get more details for each result
            const detailResponse = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${feature.id}.json?` +
              `access_token=${mapboxgl.accessToken}`
            );
            const detailData = await detailResponse.json();
            return {
              ...feature,
              detailedContext: detailData.features[0]?.context || [],
              fullAddress: detailData.features[0]?.place_name || feature.place_name
            };
          })
        );
        
        setSearchResults(enrichedResults);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  // Handle search input changes
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Handle selecting a search result
  const handleSelectResult = async (result) => {
    const [lng, lat] = result.center;
    const placeName = result.text || result.place_name || "Selected location";
    
    // Extract address components
    const addressComponents = {
      street: result.text || '',
      city: result.context?.find(c => c.id.includes('place'))?.text || '',
      region: result.context?.find(c => c.id.includes('region'))?.text || '',
      country: result.context?.find(c => c.id.includes('country'))?.text || '',
      postcode: result.context?.find(c => c.id.includes('postcode'))?.text || '',
    };

    setLocation({ lng, lat });
    setSearchQuery(placeName);
    setSelectedPlace(placeName);
    setAddressDetails(addressComponents);
    setSearchResults([]);
    
    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat]);
    }
    
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: 14,
        essential: true
      });
    }

    // Focus back on input after selection
    searchInputRef.current.focus();
  };

  // Handle short Google Maps links (goo.gl or maps.app.goo.gl)
  const handleShortLink = async (shortUrl) => {
    setIsResolvingLink(true);
    try {
      // Extract the path from the short URL
      const path = shortUrl.split('goo.gl/')[1] || shortUrl.split('maps.app.goo.gl/')[1];
      
      if (!path) {
        throw new Error('Invalid Google Maps short link');
      }
      
      // Use the Firebase Dynamic Links API to expand it
      const response = await fetch(`https://firebasedynamiclinks.googleapis.com/v1/shortLinks/${path}?key=AIzaSyB2YJ8_0wYQZ-9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q`);
      const data = await response.json();
      
      if (data?.previewLink) {
        extractCoordinatesFromUrl(data.previewLink);
      } else {
        // Fallback to direct API call
        const directResponse = await fetch(shortUrl, {
          method: 'HEAD',
          redirect: 'manual'
        });
        
        if (directResponse.status >= 300 && directResponse.status < 400) {
          const location = directResponse.headers.get('Location');
          if (location) {
            extractCoordinatesFromUrl(location);
            return;
          }
        }
        
        throw new Error('Could not resolve short link');
      }
    } catch (error) {
      console.error("Error resolving short link:", error);
      alert("Couldn't resolve the short link. Please try the full URL or paste the coordinates directly.");
    } finally {
      setIsResolvingLink(false);
    }
  };

  // Extract coordinates from Google Maps URL
  const extractCoordinatesFromUrl = (url) => {
    const patterns = [
      // New Google Maps URL format
      /@(-?\d+\.\d+),(-?\d+\.\d+)/,
      // Old Google Maps URL format
      /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
      // Alternative format
      /\/place\/[^/]+\/@(-?\d+\.\d+),(-?\d+\.\d+)/,
      // Direct coordinates in query params
      /q=(-?\d+\.\d+),(-?\d+\.\d+)/
    ];

    let lat, lng;

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        if (pattern === patterns[1]) { // Old format has reversed order
          lat = parseFloat(match[1]);
          lng = parseFloat(match[2]);
        } else {
          lat = parseFloat(match[1]);
          lng = parseFloat(match[2]);
        }
        break;
      }
    }

    if (lat && lng) {
      setLocation({ lat, lng });
      
      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      }
      
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [lng, lat],
          zoom: 14,
          essential: true
        });
      }

      // Reverse geocode to get address details
      fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?` +
        `access_token=${mapboxgl.accessToken}`
      )
        .then(response => response.json())
        .then(data => {
          if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            setSearchQuery(feature.place_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            setSelectedPlace(feature.place_name || "Selected location");
            
            // Extract address components
            const addressComponents = {
              street: feature.text || '',
              city: feature.context?.find(c => c.id.includes('place'))?.text || '',
              region: feature.context?.find(c => c.id.includes('region'))?.text || '',
              country: feature.context?.find(c => c.id.includes('country'))?.text || '',
              postcode: feature.context?.find(c => c.id.includes('postcode'))?.text || '',
            };
            setAddressDetails(addressComponents);
          }
        });

      setShowPasteLink(false);
      setGoogleMapsLink("");
    } else {
      alert("Couldn't extract coordinates from the link. Please make sure it's a valid Google Maps URL.");
    }
  };

  // Parse Google Maps link and extract coordinates
  const handlePasteGoogleMapsLink = () => {
    if (!googleMapsLink) return;

    // Check if it's a short link (goo.gl or maps.app.goo.gl)
    if (googleMapsLink.includes('goo.gl') || googleMapsLink.includes('maps.app.goo.gl')) {
      handleShortLink(googleMapsLink);
      return;
    }

    // Handle regular/long URLs
    extractCoordinatesFromUrl(googleMapsLink);
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [location.lng, location.lat],
      zoom: 12,
    });

    mapRef.current = map;

    // Add controls
    map.addControl(new mapboxgl.NavigationControl());
    map.addControl(new mapboxgl.ScaleControl());

    // Create marker
    markerRef.current = new mapboxgl.Marker({
      draggable: true,
      color: "#3b82f6"
    })
      .setLngLat([location.lng, location.lat])
      .addTo(map);

    // Update location when marker is dragged
    markerRef.current.on("dragend", () => {
      const pos = markerRef.current.getLngLat();
      setLocation({ lng: pos.lng, lat: pos.lat });
      setSelectedPlace(null);
      setAddressDetails({});
    });

    // Update marker position when map is clicked
    map.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      markerRef.current.setLngLat([lng, lat]);
      setLocation({ lng, lat });
      setSelectedPlace(null);
      setAddressDetails({});
      
      // Reverse geocode to get address
      fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?` +
        `access_token=${mapboxgl.accessToken}`
      )
        .then(response => response.json())
        .then(data => {
          if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            setSearchQuery(feature.place_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            setSelectedPlace(feature.place_name || "Selected location");
          }
        });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update marker position when coordinates change
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLngLat([location.lng, location.lat]);
    }
  }, [location.lng, location.lat]);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Pick a Location</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-600 text-xl">×</button>
        </div>

        {/* Search Box */}
        <div className="p-4 relative">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search for places, addresses, or points of interest..."
              className="w-full border border-gray-300 rounded p-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
            />
            <div className="absolute left-3 top-3 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            {isSearching && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
              </div>
            )}
          </div>
          
          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-96 overflow-y-auto">
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => handleSelectResult(result)}
                >
                  <div className="font-medium text-gray-800 flex items-center">
                    {result.properties?.category && (
                      <span className="mr-2 text-blue-500">
                        {result.properties.category === 'poi' ? '📍' : 
                         result.properties.category === 'address' ? '🏠' : '🌍'}
                      </span>
                    )}
                    {result.text}
                  </div>
                  <div className="text-sm text-gray-500">{result.fullAddress}</div>
                  {result.detailedContext?.length > 0 && (
                    <div className="text-xs text-gray-400 mt-1">
                      {result.detailedContext.map(ctx => ctx.text).join(' · ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Paste Google Maps Link Option */}
          <div className="mt-2 text-right">
            <button 
              onClick={() => setShowPasteLink(!showPasteLink)}
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center justify-end w-full"
            >
              <span>Or paste a Google Maps link</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-4 w-4 ml-1 transition-transform ${showPasteLink ? 'rotate-180' : ''}`} 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {showPasteLink && (
              <div className="mt-2 flex">
                <input
                  type="text"
                  value={googleMapsLink}
                  onChange={(e) => setGoogleMapsLink(e.target.value)}
                  placeholder="Paste Google Maps link here..."
                  className="flex-1 border border-gray-300 rounded-l p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={handlePasteGoogleMapsLink}
                  disabled={isResolvingLink}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r flex items-center justify-center min-w-[80px]"
                >
                  {isResolvingLink ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div>
                  ) : (
                    "Go"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Selected Place Details */}
        {selectedPlace && (
          <div className="px-4 pb-2">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <div className="font-medium text-blue-800">{selectedPlace}</div>
                  <div className="text-sm text-gray-600">
                    {addressDetails.street && <span>{addressDetails.street}, </span>}
                    {addressDetails.city && <span>{addressDetails.city}, </span>}
                    {addressDetails.region && <span>{addressDetails.region} </span>}
                    {addressDetails.postcode && <span>{addressDetails.postcode}</span>}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Coordinates: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Map */}
        <div ref={mapContainer} className="h-96" style={{ width: '100%' }} />

        {/* Coordinates Display */}
        <div className="p-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Latitude</label>
            <input
              type="number"
              className="w-full border border-gray-300 rounded p-2"
              value={location.lat}
              onChange={(e) => {
                setLocation({ ...location, lat: parseFloat(e.target.value) || 0 });
                setSelectedPlace(null);
                setAddressDetails({});
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Longitude</label>
            <input
              type="number"
              className="w-full border border-gray-300 rounded p-2"
              value={location.lng}
              onChange={(e) => {
                setLocation({ ...location, lng: parseFloat(e.target.value) || 0 });
                setSelectedPlace(null);
                setAddressDetails({});
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <div className="flex space-x-3">
            <a
              href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              View in Google Maps
            </a>
            <button
              onClick={() => {
                onSave({
                  ...location,
                  placeName: selectedPlace || `Custom location (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`,
                  addressDetails
                });
                console.log('Location saved:', location);
                onClose();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Save Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPickerModal;