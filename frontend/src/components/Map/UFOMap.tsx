import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import { Sighting, LocationCoords } from '../../types';
import { useSightings } from '../../hooks/useSightings';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom UFO icon
const ufoIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTkgOUgxN0wyMCAxMkgxNkwyMCAxNUgxNkwyMCAxOEg0TDggMTVINEw4IDEySDE2TDEyIDlaIiBmaWxsPSIjMDBGRjAwIiBzdHJva2U9IiMwMEZGMDAiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const verifiedUfoIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTkgOUgxN0wyMCAxMkgxNkwyMCAxNUgxNkwyMCAxOEg0TDggMTVINEw4IDEySDE2TDEyIDlaIiBmaWxsPSIjRkZENzAwIiBzdHJva2U9IiNGRkQ3MDAiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

interface UFOMapProps {
  className?: string;
  height?: string;
  showFilters?: boolean;
  center?: LocationCoords;
  zoom?: number;
}

const MapEventHandler: React.FC<{
  onLocationUpdate: (coords: LocationCoords) => void;
}> = ({ onLocationUpdate }) => {
  const { user } = useAuth();
  const { updateLocation } = useSocket();

  useMapEvents({
    locationfound: (e) => {
      const coords = { latitude: e.latlng.lat, longitude: e.latlng.lng };
      onLocationUpdate(coords);
      
      // Update location for notifications if user is authenticated
      if (user && !user.isAnonymous) {
        updateLocation(coords.latitude, coords.longitude);
      }
    },
  });

  return null;
};

const UFOMap: React.FC<UFOMapProps> = ({
  className,
  height = '500px',
  showFilters = true,
  center = { latitude: 40.7128, longitude: -74.0060 }, // NYC default
  zoom = 10,
}) => {
  const [mapCenter, setMapCenter] = useState<LocationCoords>(center);
  const [mapBounds, setMapBounds] = useState<{
    latitude: number;
    longitude: number;
    radius: number;
  } | null>(null);
  const [filters, setFilters] = useState({
    verified: false,
    recent: true,
    radius: 50,
  });

  const { data: sightingsData, isLoading, error } = useSightings({
    ...mapBounds,
    verified: filters.verified || undefined,
    recent: filters.recent || undefined,
    radius: filters.radius,
  });

  const sightings = sightingsData?.data || [];

  useEffect(() => {
    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setMapCenter(coords);
          setMapBounds({ ...coords, radius: filters.radius });
        },
        (error) => {
          console.warn('Could not get user location:', error);
          // Use default center
          setMapBounds({ ...mapCenter, radius: filters.radius });
        }
      );
    } else {
      setMapBounds({ ...mapCenter, radius: filters.radius });
    }
  }, []);

  const handleLocationUpdate = (coords: LocationCoords) => {
    setMapCenter(coords);
    setMapBounds({ ...coords, radius: filters.radius });
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    if (mapBounds) {
      setMapBounds({ ...mapBounds, radius: newFilters.radius });
    }
  };

  const mapPosition: LatLngExpression = [mapCenter.latitude, mapCenter.longitude];

  return (
    <div className={clsx('space-y-4', className)}>
      {showFilters && (
        <div className="card">
          <div className="card-body">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="verified"
                  checked={filters.verified}
                  onChange={(e) =>
                    handleFilterChange({ ...filters, verified: e.target.checked })
                  }
                  className="rounded border-gray-600 bg-gray-700 text-cosmic-600 focus:ring-cosmic-500"
                />
                <label htmlFor="verified" className="text-sm text-gray-300">
                  Verified only
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="recent"
                  checked={filters.recent}
                  onChange={(e) =>
                    handleFilterChange({ ...filters, recent: e.target.checked })
                  }
                  className="rounded border-gray-600 bg-gray-700 text-cosmic-600 focus:ring-cosmic-500"
                />
                <label htmlFor="recent" className="text-sm text-gray-300">
                  Recent (30 days)
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <label htmlFor="radius" className="text-sm text-gray-300">
                  Radius:
                </label>
                <select
                  id="radius"
                  value={filters.radius}
                  onChange={(e) =>
                    handleFilterChange({ ...filters, radius: Number(e.target.value) })
                  }
                  className="bg-gray-700 border-gray-600 text-white text-sm rounded-md px-2 py-1 focus:ring-cosmic-500 focus:border-cosmic-500"
                >
                  <option value={25}>25km</option>
                  <option value={50}>50km</option>
                  <option value={100}>100km</option>
                  <option value={250}>250km</option>
                  <option value={500}>500km</option>
                </select>
              </div>

              <div className="text-sm text-gray-400">
                {isLoading ? 'Loading...' : `${sightings.length} sightings`}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body p-0 overflow-hidden" style={{ height }}>
          {error ? (
            <div className="flex items-center justify-center h-full text-red-400">
              <div className="text-center">
                <div className="text-4xl mb-2">⚠️</div>
                <p>Failed to load map data</p>
              </div>
            </div>
          ) : (
            <MapContainer
              center={mapPosition}
              zoom={zoom}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapEventHandler onLocationUpdate={handleLocationUpdate} />

              {sightings.map((sighting) => (
                <Marker
                  key={sighting.id}
                  position={[sighting.latitude, sighting.longitude]}
                  icon={sighting.isVerified ? verifiedUfoIcon : ufoIcon}
                >
                  <Popup className="ufo-popup" maxWidth={300}>
                    <div className="p-2">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-white text-sm leading-tight">
                          {sighting.title}
                        </h3>
                        {sighting.isVerified && (
                          <span className="badge badge-success ml-2 text-xs">✓ Verified</span>
                        )}
                      </div>

                      <p className="text-gray-300 text-xs mb-3 line-clamp-2">
                        {sighting.description}
                      </p>

                      <div className="space-y-1 text-xs text-gray-400">
                        <div>📍 {sighting.location || 'Location not specified'}</div>
                        <div>
                          🕐 {formatDistanceToNow(new Date(sighting.sightingDate))} ago
                        </div>
                        <div>👥 {sighting.witnesses} witness{sighting.witnesses !== 1 ? 'es' : ''}</div>
                        {sighting._count && (
                          <div>💬 {sighting._count.chatMessages} comments</div>
                        )}
                      </div>

                      <div className="mt-3 flex gap-2">
                        <Link
                          to={`/sighting/${sighting.id}`}
                          className="btn-sm bg-cosmic-600 hover:bg-cosmic-700 text-white px-2 py-1 rounded text-xs"
                        >
                          View Details
                        </Link>
                        {sighting.imageUrls.length > 0 && (
                          <span className="badge bg-gray-600 text-gray-200 text-xs">
                            📸 {sighting.imageUrls.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center text-sm text-gray-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span>Unverified</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            <span>Verified</span>
          </div>
        </div>
        <div>
          Click markers for details • Double-click to zoom
        </div>
      </div>
    </div>
  );
};

export default UFOMap;