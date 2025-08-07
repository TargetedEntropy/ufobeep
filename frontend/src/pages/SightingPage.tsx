import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSighting, useDeleteSighting, useReportSighting } from '../hooks/useSightings';
import { useAuth } from '../contexts/AuthContext';
import ChatRoom from '../components/Chat/ChatRoom';
import MediaGallery from '../components/MediaGallery';
import UFOMap from '../components/Map/UFOMap';
import {
  MapPinIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  CloudIcon,
  EyeIcon,
  ChatBubbleLeftIcon,
  CheckBadgeIcon,
  PencilIcon,
  TrashIcon,
  FlagIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow, format } from 'date-fns';
import clsx from 'clsx';

const SightingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: sighting, isLoading, error } = useSighting(id!);
  const deleteSighting = useDeleteSighting();
  const reportSighting = useReportSighting();
  
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'chat' | 'map'>('details');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cosmic-500"></div>
      </div>
    );
  }

  if (error || !sighting) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <div className="card-body text-center py-12">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-xl font-semibold mb-2">Sighting Not Found</h2>
            <p className="text-gray-400 mb-6">
              This sighting may have been removed or doesn't exist.
            </p>
            <Link to="/map" className="btn btn-primary">
              Browse Other Sightings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = sighting.user?.id === user?.id;
  const canEdit = isOwner || user?.isAdmin;
  const canDelete = isOwner || user?.isAdmin;

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this sighting? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteSighting.mutateAsync(id!);
      navigate('/map');
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return;

    try {
      await reportSighting.mutateAsync({ id: id!, reason: reportReason.trim() });
      setShowReportDialog(false);
      setReportReason('');
    } catch (error) {
      // Error handled in hook
    }
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-secondary"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back
        </button>

        <div className="flex items-center space-x-2">
          {canEdit && (
            <Link
              to={`/sighting/${id}/edit`}
              className="btn btn-secondary"
            >
              <PencilIcon className="w-4 h-4 mr-2" />
              Edit
            </Link>
          )}

          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleteSighting.isLoading}
              className="btn btn-danger"
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              Delete
            </button>
          )}

          {!isOwner && (
            <button
              onClick={() => setShowReportDialog(true)}
              className="btn btn-secondary"
            >
              <FlagIcon className="w-4 h-4 mr-2" />
              Report
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sighting Info */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-white mb-2">
                    {sighting.title}
                  </h1>
                  {sighting.isVerified && (
                    <div className="flex items-center mb-2">
                      <CheckBadgeIcon className="w-5 h-5 text-green-400 mr-2" />
                      <span className="badge badge-success">Verified Sighting</span>
                    </div>
                  )}
                  <div className="text-sm text-gray-400">
                    Reported by {sighting.user?.username || 'Anonymous'} •{' '}
                    {formatDistanceToNow(new Date(sighting.createdAt))} ago
                  </div>
                </div>

                <div className="text-right text-sm text-gray-400">
                  <div className="flex items-center">
                    <EyeIcon className="w-4 h-4 mr-1" />
                    {sighting.viewCount} views
                  </div>
                  <div className="flex items-center mt-1">
                    <ChatBubbleLeftIcon className="w-4 h-4 mr-1" />
                    {sighting._count?.chatMessages || 0} comments
                  </div>
                </div>
              </div>
            </div>

            <div className="card-body">
              <p className="text-gray-300 leading-relaxed mb-6">
                {sighting.description}
              </p>

              {/* Sighting Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <MapPinIcon className="w-4 h-4 mr-2 text-cosmic-400" />
                    <span className="text-gray-400">Location:</span>
                    <span className="ml-2 text-white">
                      {sighting.location || `${sighting.latitude.toFixed(4)}, ${sighting.longitude.toFixed(4)}`}
                    </span>
                  </div>

                  <div className="flex items-center text-sm">
                    <CalendarDaysIcon className="w-4 h-4 mr-2 text-cosmic-400" />
                    <span className="text-gray-400">Date:</span>
                    <span className="ml-2 text-white">
                      {format(new Date(sighting.sightingDate), 'PPP p')}
                    </span>
                  </div>

                  {sighting.duration && (
                    <div className="flex items-center text-sm">
                      <ClockIcon className="w-4 h-4 mr-2 text-cosmic-400" />
                      <span className="text-gray-400">Duration:</span>
                      <span className="ml-2 text-white">
                        {Math.floor(sighting.duration / 60)}m {sighting.duration % 60}s
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <UserGroupIcon className="w-4 h-4 mr-2 text-cosmic-400" />
                    <span className="text-gray-400">Witnesses:</span>
                    <span className="ml-2 text-white">
                      {sighting.witnesses}
                    </span>
                  </div>

                  {sighting.weather && (
                    <div className="flex items-center text-sm">
                      <CloudIcon className="w-4 h-4 mr-2 text-cosmic-400" />
                      <span className="text-gray-400">Weather:</span>
                      <span className="ml-2 text-white">
                        {getWeatherIcon(sighting.weather)} {sighting.weather}
                      </span>
                    </div>
                  )}

                  {sighting.visibility && (
                    <div className="flex items-center text-sm">
                      <EyeIcon className="w-4 h-4 mr-2 text-cosmic-400" />
                      <span className="text-gray-400">Visibility:</span>
                      <span className="ml-2 text-white">
                        {sighting.visibility}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Media Gallery */}
          {(sighting.imageUrls.length > 0 || sighting.videoUrls.length > 0) && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold">Evidence</h2>
              </div>
              <div className="card-body">
                <MediaGallery
                  images={sighting.imageUrls}
                  videos={sighting.videoUrls}
                />
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="card">
            <div className="card-header">
              <nav className="flex space-x-4">
                {['details', 'chat', 'map'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={clsx(
                      'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      activeTab === tab
                        ? 'bg-cosmic-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    )}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </nav>
            </div>

            <div className="card-body">
              {activeTab === 'details' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Additional Information</h3>
                  <div className="text-gray-400">
                    <p>This sighting was reported on {format(new Date(sighting.createdAt), 'PPP')}.</p>
                    {sighting.reportCount > 0 && (
                      <p className="text-yellow-400 mt-2">
                        This sighting has been reported {sighting.reportCount} time(s).
                      </p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="h-96">
                  <ChatRoom 
                    sightingId={sighting.id} 
                    sightingTitle={sighting.title}
                  />
                </div>
              )}

              {activeTab === 'map' && (
                <div className="h-96">
                  <UFOMap
                    center={{ latitude: sighting.latitude, longitude: sighting.longitude }}
                    zoom={15}
                    height="384px"
                    showFilters={false}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Chat */}
        <div className="lg:col-span-1">
          <ChatRoom 
            sightingId={sighting.id} 
            sightingTitle={sighting.title}
            className="h-[600px] flex flex-col"
          />
        </div>
      </div>

      {/* Report Dialog */}
      {showReportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card max-w-md mx-4">
            <div className="card-header">
              <h3 className="text-lg font-semibold">Report Sighting</h3>
            </div>
            <div className="card-body">
              <p className="text-gray-300 mb-4">
                Why are you reporting this sighting?
              </p>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Please describe why this sighting should be reviewed..."
                className="textarea"
                rows={4}
                maxLength={500}
              />
              <div className="text-xs text-gray-400 mt-1">
                {reportReason.length}/500 characters
              </div>
            </div>
            <div className="card-footer">
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowReportDialog(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReport}
                  disabled={!reportReason.trim() || reportSighting.isLoading}
                  className="btn btn-danger"
                >
                  {reportSighting.isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Reporting...
                    </div>
                  ) : (
                    <>
                      <FlagIcon className="w-4 h-4 mr-2" />
                      Submit Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SightingPage;