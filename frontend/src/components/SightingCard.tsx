import React from 'react';
import { Link } from 'react-router-dom';
import { Sighting } from '../types';
import { formatDistanceToNow } from 'date-fns';
import {
  MapPinIcon,
  EyeIcon,
  ChatBubbleLeftIcon,
  CheckBadgeIcon,
  PhotoIcon,
  VideoCameraIcon,
  ClockIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface SightingCardProps {
  sighting: Sighting;
  showActions?: boolean;
  compact?: boolean;
}

const SightingCard: React.FC<SightingCardProps> = ({
  sighting,
  showActions = true,
  compact = false,
}) => {
  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const getWeatherIcon = (weather?: string) => {
    if (!weather) return '🌤️';
    const w = weather.toLowerCase();
    if (w.includes('clear') || w.includes('sunny')) return '☀️';
    if (w.includes('cloudy')) return '☁️';
    if (w.includes('rain')) return '🌧️';
    if (w.includes('storm')) return '⛈️';
    if (w.includes('fog')) return '🌫️';
    return '🌤️';
  };

  return (
    <div className={clsx('card hover:ring-2 hover:ring-cosmic-500 transition-all', compact && 'p-4')}>
      <div className={clsx(compact ? 'space-y-3' : 'card-body')}>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Link
              to={`/sighting/${sighting.id}`}
              className="text-lg font-semibold text-white hover:text-cosmic-400 transition-colors"
            >
              {sighting.title}
            </Link>
            {sighting.isVerified && (
              <div className="flex items-center mt-1">
                <CheckBadgeIcon className="w-4 h-4 text-green-400 mr-1" />
                <span className="badge badge-success text-xs">Verified</span>
              </div>
            )}
          </div>
          
          <div className="text-xs text-gray-400 text-right">
            <div className="flex items-center">
              <ClockIcon className="w-3 h-3 mr-1" />
              {formatDate(sighting.createdAt)}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className={clsx(
          'text-gray-300',
          compact ? 'text-sm line-clamp-2' : 'text-sm line-clamp-3'
        )}>
          {sighting.description}
        </p>

        {/* Metadata */}
        <div className="space-y-2">
          {/* Location and Date */}
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center">
              <MapPinIcon className="w-4 h-4 mr-1" />
              <span>{sighting.location || `${sighting.latitude.toFixed(4)}, ${sighting.longitude.toFixed(4)}`}</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">{getWeatherIcon(sighting.weather)}</span>
              {formatDate(sighting.sightingDate)}
            </div>
          </div>

          {/* Sighting details */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <UserGroupIcon className="w-3 h-3 mr-1" />
                {sighting.witnesses} witness{sighting.witnesses !== 1 ? 'es' : ''}
              </div>
              {sighting.duration && (
                <div>
                  {Math.floor(sighting.duration / 60)}m {sighting.duration % 60}s duration
                </div>
              )}
              {sighting.weather && (
                <div>
                  {sighting.weather}
                </div>
              )}
            </div>
            
            <div className="flex items-center">
              <span>Reported by {sighting.user?.username || 'Anonymous'}</span>
            </div>
          </div>
        </div>

        {/* Media indicators */}
        {(sighting.imageUrls.length > 0 || sighting.videoUrls.length > 0) && (
          <div className="flex items-center space-x-2">
            {sighting.imageUrls.length > 0 && (
              <div className="flex items-center text-xs text-gray-400">
                <PhotoIcon className="w-4 h-4 mr-1" />
                {sighting.imageUrls.length} photo{sighting.imageUrls.length !== 1 ? 's' : ''}
              </div>
            )}
            {sighting.videoUrls.length > 0 && (
              <div className="flex items-center text-xs text-gray-400">
                <VideoCameraIcon className="w-4 h-4 mr-1" />
                {sighting.videoUrls.length} video{sighting.videoUrls.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}

        {/* Actions and stats */}
        {showActions && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-700">
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <div className="flex items-center">
                <EyeIcon className="w-4 h-4 mr-1" />
                {sighting.viewCount} view{sighting.viewCount !== 1 ? 's' : ''}
              </div>
              <div className="flex items-center">
                <ChatBubbleLeftIcon className="w-4 h-4 mr-1" />
                {sighting._count?.chatMessages || 0} comment{(sighting._count?.chatMessages || 0) !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Link
                to={`/sighting/${sighting.id}`}
                className="btn btn-primary btn-sm"
              >
                View Details
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SightingCard;