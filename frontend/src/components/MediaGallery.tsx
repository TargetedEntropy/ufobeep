import React, { useState } from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface MediaGalleryProps {
  images: string[];
  videos: string[];
  className?: string;
}

const MediaGallery: React.FC<MediaGalleryProps> = ({
  images = [],
  videos = [],
  className,
}) => {
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: 'image' | 'video'; index: number } | null>(null);

  const allMedia = [
    ...images.map(url => ({ url, type: 'image' as const })),
    ...videos.map(url => ({ url, type: 'video' as const })),
  ];

  const openLightbox = (url: string, type: 'image' | 'video') => {
    const index = allMedia.findIndex(media => media.url === url);
    setSelectedMedia({ url, type, index });
  };

  const closeLightbox = () => {
    setSelectedMedia(null);
  };

  const navigateMedia = (direction: 'prev' | 'next') => {
    if (!selectedMedia) return;

    let newIndex = selectedMedia.index;
    if (direction === 'prev') {
      newIndex = selectedMedia.index > 0 ? selectedMedia.index - 1 : allMedia.length - 1;
    } else {
      newIndex = selectedMedia.index < allMedia.length - 1 ? selectedMedia.index + 1 : 0;
    }

    const newMedia = allMedia[newIndex];
    setSelectedMedia({ ...newMedia, index: newIndex });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === 'ArrowLeft') {
      navigateMedia('prev');
    } else if (e.key === 'ArrowRight') {
      navigateMedia('next');
    }
  };

  if (allMedia.length === 0) return null;

  return (
    <>
      <div className={clsx('space-y-4', className)}>
        {images.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-300">Photos ({images.length})</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => openLightbox(image, 'image')}
                  className="relative group overflow-hidden rounded-lg bg-gray-800 aspect-square"
                >
                  <img
                    src={image}
                    alt={`Sighting photo ${index + 1}`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {videos.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-300">Videos ({videos.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videos.map((video, index) => (
                <div
                  key={index}
                  className="relative group overflow-hidden rounded-lg bg-gray-800"
                >
                  <video
                    src={video}
                    className="w-full aspect-video object-cover cursor-pointer"
                    controls
                    preload="metadata"
                  />
                  <button
                    onClick={() => openLightbox(video, 'video')}
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4z" />
                      <path d="M6 6h2v2H6V6zM6 10h2v2H6v-2zM6 14h2v2H6v-2zM10 6h2v2h-2V6zM10 10h2v2h-2v-2zM10 14h2v2h-2v-2zM14 6h2v2h-2V6zM14 10h2v2h-2v-2z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedMedia && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          onClick={closeLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <div className="relative max-w-7xl max-h-full p-4">
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>

            {/* Navigation Buttons */}
            {allMedia.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateMedia('prev');
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg"
                >
                  <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateMedia('next');
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg"
                >
                  <ChevronRightIcon className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Media Content */}
            <div 
              className="flex items-center justify-center max-w-full max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedMedia.type === 'image' ? (
                <img
                  src={selectedMedia.url}
                  alt="Sighting media"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <video
                  src={selectedMedia.url}
                  className="max-w-full max-h-full"
                  controls
                  autoPlay
                />
              )}
            </div>

            {/* Media Counter */}
            {allMedia.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-lg text-sm">
                {selectedMedia.index + 1} of {allMedia.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MediaGallery;