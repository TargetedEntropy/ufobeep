import React, { useState } from 'react';
import UFOMap from '../components/Map/UFOMap';
import SightingCard from '../components/SightingCard';
import { useSightings } from '../hooks/useSightings';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

const MapPage: React.FC = () => {
  const [view, setView] = useState<'map' | 'list'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: sightingsData, isLoading } = useSightings({
    limit: 50,
    recent: true,
  });

  const sightings = sightingsData?.data || [];
  
  const filteredSightings = sightings.filter(sighting =>
    sighting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sighting.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sighting.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold gradient-text">UFO Sightings Map</h1>
              <p className="text-gray-400 mt-1">
                Explore {sightings.length} reported sightings around the world
              </p>
            </div>
            
            <div className="flex items-center space-x-2 mt-4 sm:mt-0">
              <button
                onClick={() => setView('map')}
                className={`btn btn-sm ${view === 'map' ? 'btn-primary' : 'btn-secondary'}`}
              >
                🗺️ Map
              </button>
              <button
                onClick={() => setView('list')}
                className={`btn btn-sm ${view === 'list' ? 'btn-primary' : 'btn-secondary'}`}
              >
                📋 List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search sightings by title, description, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            
            <button className="btn btn-secondary">
              <FunnelIcon className="w-4 h-4 mr-2" />
              Advanced Filters
            </button>
          </div>
          
          {searchQuery && (
            <div className="mt-3 text-sm text-gray-400">
              Showing {filteredSightings.length} results for "{searchQuery}"
            </div>
          )}
        </div>
      </div>

      {/* Map or List View */}
      {view === 'map' ? (
        <UFOMap height="600px" showFilters={true} />
      ) : (
        <div className="grid gap-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cosmic-500"></div>
              <span className="ml-3 text-gray-400">Loading sightings...</span>
            </div>
          ) : filteredSightings.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-xl font-semibold mb-2">No sightings found</h2>
                <p className="text-gray-400">
                  {searchQuery
                    ? 'Try adjusting your search terms or clearing the search.'
                    : 'No sightings have been reported yet. Be the first to report one!'
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSightings.map((sighting) => (
                <SightingCard
                  key={sighting.id}
                  sighting={sighting}
                  showActions={true}
                />
              ))}
              
              {filteredSightings.length >= 50 && (
                <div className="card">
                  <div className="card-body text-center">
                    <p className="text-gray-400">
                      Showing first 50 results. Use filters to narrow down your search.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="card-body">
            <div className="text-2xl font-bold text-cosmic-400">
              {sightings.length}
            </div>
            <div className="text-sm text-gray-400">Total Sightings</div>
          </div>
        </div>
        
        <div className="card text-center">
          <div className="card-body">
            <div className="text-2xl font-bold text-green-400">
              {sightings.filter(s => s.isVerified).length}
            </div>
            <div className="text-sm text-gray-400">Verified</div>
          </div>
        </div>
        
        <div className="card text-center">
          <div className="card-body">
            <div className="text-2xl font-bold text-yellow-400">
              {sightings.filter(s => s.imageUrls.length > 0).length}
            </div>
            <div className="text-sm text-gray-400">With Photos</div>
          </div>
        </div>
        
        <div className="card text-center">
          <div className="card-body">
            <div className="text-2xl font-bold text-purple-400">
              {sightings.reduce((sum, s) => sum + (s._count?.chatMessages || 0), 0)}
            </div>
            <div className="text-sm text-gray-400">Total Comments</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;