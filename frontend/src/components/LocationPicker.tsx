import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import { LocationCoords } from '../types';
import { useGeolocation } from '../hooks/useGeolocation';
import { 
  MapPinIcon, 
  MagnifyingGlassIcon,
  GlobeAltIcon 
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import toast from 'react-hot-toast';

// Fix for default markers
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationPickerProps {
  value: LocationCoords | null;
  onChange: (location: LocationCoords & { address?: string }) => void;
  className?: string;
  height?: string;
  showSearch?: boolean;
}

const MapClickHandler: React.FC<{
  onLocationSelect: (coords: LocationCoords) => void;
}> = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      onLocationSelect({
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
      });
    },
  });
  return null;
};

const LocationPicker: React.FC<LocationPickerProps> = ({
  value,
  onChange,
  className,
  height = '300px',
  showSearch = true,
}) => {
  const [mapCenter, setMapCenter] = useState<LocationCoords>({
    latitude: 40.7128,
    longitude: -74.0060, // NYC default
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [locationAddress, setLocationAddress] = useState<string>('');

  const { location: userLocation, loading, getCurrentLocation } = useGeolocation();

  // Initialize map center
  useEffect(() => {
    if (value) {
      setMapCenter(value);
    } else if (userLocation) {
      setMapCenter(userLocation);
    }
  }, [value, userLocation]);

  // Reverse geocoding to get address
  useEffect(() => {
    if (value) {
      reverseGeocode(value.latitude, value.longitude);
    }
  }, [value]);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // Using OpenStreetMap Nominatim API for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        setLocationAddress(data.display_name);
      }
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
    }
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      // Using OpenStreetMap Nominatim API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchQuery
        )}&format=json&limit=1&addressdetails=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const coords = {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
        };
        
        setMapCenter(coords);
        onChange({
          ...coords,
          address: result.display_name,
        });
        toast.success('Location found!');
      } else {
        toast.error('Location not found');
      }
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleLocationSelect = (coords: LocationCoords) => {
    onChange({
      ...coords,
      address: locationAddress,
    });
  };

  const useCurrentLocation = async () => {
    try {
      const coords = await getCurrentLocation();
      setMapCenter(coords);
      onChange(coords);
      toast.success('Using current location');
    } catch (error: any) {
      toast.error(error.message || 'Failed to get current location');
    }
  };

  const mapPosition: LatLngExpression = [mapCenter.latitude, mapCenter.longitude];
  const selectedPosition: LatLngExpression | null = value
    ? [value.latitude, value.longitude]
    : null;

  return (
    <div className={clsx('space-y-4', className)}>
      {showSearch && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for a location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
                  className="input pl-10"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={searchLocation}
              disabled={searching || !searchQuery.trim()}
              className="btn btn-secondary"
            >
              {searching ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : (
                <MagnifyingGlassIcon className="w-4 h-4" />
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={loading}
            className="btn btn-secondary btn-sm"
          >
            <GlobeAltIcon className="w-4 h-4 mr-2" />
            Use Current Location
          </button>
        </div>
      )}

      <div className="card">
        <div className="card-body p-0 overflow-hidden" style={{ height }}>
          <MapContainer
            center={mapPosition}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapClickHandler onLocationSelect={handleLocationSelect} />
            
            {selectedPosition && (
              <Marker position={selectedPosition} />
            )}
          </MapContainer>
        </div>
      </div>

      {value && (
        <div className="card">
          <div className="card-body">
            <div className="flex items-start space-x-3">
              <MapPinIcon className="w-5 h-5 text-cosmic-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-white">
                  Selected Location
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
                </div>
                {locationAddress && (
                  <div className="text-sm text-gray-300 mt-2">
                    {locationAddress}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-400 text-center">
        Click on the map to select a location
      </div>
    </div>
  );
};

export default LocationPicker;