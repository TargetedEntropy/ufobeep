import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCreateSighting } from '../hooks/useSightings';
import { SightingFormData, LocationCoords, UploadedFile } from '../types';
import FileUpload from '../components/FileUpload';
import LocationPicker from '../components/LocationPicker';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  CloudIcon,
  EyeIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const SubmitPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const createSighting = useCreateSighting();
  
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SightingFormData>({
    defaultValues: {
      sightingDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      witnesses: 1,
    },
  });

  const selectedLocation = watch('latitude') && watch('longitude') 
    ? { latitude: watch('latitude'), longitude: watch('longitude') }
    : null;

  const onSubmit = async (data: SightingFormData) => {
    try {
      // Validate required fields
      if (!data.latitude || !data.longitude) {
        toast.error('Please select a location on the map');
        return;
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('latitude', data.latitude.toString());
      formData.append('longitude', data.longitude.toString());
      formData.append('sightingDate', data.sightingDate);
      formData.append('witnesses', data.witnesses.toString());
      
      if (data.location) formData.append('location', data.location);
      if (data.duration) formData.append('duration', data.duration.toString());
      if (data.weather) formData.append('weather', data.weather);
      if (data.visibility) formData.append('visibility', data.visibility);

      // Add uploaded file URLs
      const imageUrls = uploadedFiles
        .filter(file => file.mimetype.startsWith('image/'))
        .map(file => file.url);
      const videoUrls = uploadedFiles
        .filter(file => file.mimetype.startsWith('video/'))
        .map(file => file.url);

      formData.append('imageUrls', JSON.stringify(imageUrls));
      formData.append('videoUrls', JSON.stringify(videoUrls));

      const newSighting = await createSighting.mutateAsync(formData);
      
      toast.success('Sighting submitted successfully!');
      navigate(`/sighting/${newSighting.id}`);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleLocationSelect = (location: LocationCoords & { address?: string }) => {
    setValue('latitude', location.latitude);
    setValue('longitude', location.longitude);
    if (location.address) {
      setValue('location', location.address);
    }
  };

  const handleFilesUploaded = (files: UploadedFile[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
    setPendingFiles([]);
  };

  const handleFilesChanged = (files: File[]) => {
    setPendingFiles(files);
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <div className="card-header">
          <h1 className="text-2xl font-bold gradient-text">Report a UFO Sighting</h1>
          <p className="text-gray-400 mt-2">
            Share your experience with the community. All reports are valuable for research.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card-body space-y-8">
          {/* Anonymous user notice */}
          {!isAuthenticated && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-start">
                <InformationCircleIcon className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-yellow-400 font-medium mb-1">Anonymous Submission</h3>
                  <p className="text-yellow-300 text-sm">
                    You're submitting anonymously. Consider{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/register')}
                      className="underline hover:no-underline"
                    >
                      creating an account
                    </button>{' '}
                    to track your submissions and get notifications.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
              Basic Information
            </h2>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                Title *
              </label>
              <input
                {...register('title', {
                  required: 'Title is required',
                  minLength: { value: 5, message: 'Title must be at least 5 characters' },
                  maxLength: { value: 100, message: 'Title must be less than 100 characters' },
                })}
                type="text"
                id="title"
                className="input"
                placeholder="Brief description of what you saw"
              />
              {errors.title && (
                <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                {...register('description', {
                  required: 'Description is required',
                  minLength: { value: 10, message: 'Description must be at least 10 characters' },
                  maxLength: { value: 2000, message: 'Description must be less than 2000 characters' },
                })}
                id="description"
                rows={5}
                className="textarea"
                placeholder="Describe what you saw in detail. Include size, shape, color, movement patterns, duration, and any other relevant observations."
              />
              {errors.description && (
                <p className="text-red-400 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
              Location *
            </h2>

            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <LocationPicker
                  value={selectedLocation}
                  onChange={handleLocationSelect}
                  height="400px"
                />
              )}
            />

            {errors.latitude && (
              <p className="text-red-400 text-sm">Location is required</p>
            )}

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-2">
                Location Description (Optional)
              </label>
              <input
                {...register('location', {
                  maxLength: { value: 200, message: 'Location description too long' },
                })}
                type="text"
                id="location"
                className="input"
                placeholder="e.g., Near Central Park, Manhattan"
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
              When Did This Occur?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="sightingDate" className="block text-sm font-medium text-gray-300 mb-2">
                  <CalendarDaysIcon className="w-4 h-4 inline mr-1" />
                  Date & Time *
                </label>
                <input
                  {...register('sightingDate', {
                    required: 'Date and time is required',
                    validate: (value) => {
                      const date = new Date(value);
                      const now = new Date();
                      const oneYearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
                      
                      if (date > new Date()) {
                        return 'Sighting date cannot be in the future';
                      }
                      if (date < oneYearAgo) {
                        return 'Sighting date cannot be more than a year ago';
                      }
                      return true;
                    },
                  })}
                  type="datetime-local"
                  id="sightingDate"
                  className="input"
                />
                {errors.sightingDate && (
                  <p className="text-red-400 text-sm mt-1">{errors.sightingDate.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-300 mb-2">
                  <ClockIcon className="w-4 h-4 inline mr-1" />
                  Duration (seconds)
                </label>
                <input
                  {...register('duration', {
                    min: { value: 1, message: 'Duration must be at least 1 second' },
                    max: { value: 86400, message: 'Duration cannot exceed 24 hours' },
                  })}
                  type="number"
                  id="duration"
                  className="input"
                  placeholder="How long did you observe it?"
                />
                {errors.duration && (
                  <p className="text-red-400 text-sm mt-1">{errors.duration.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
              Additional Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="witnesses" className="block text-sm font-medium text-gray-300 mb-2">
                  <UserGroupIcon className="w-4 h-4 inline mr-1" />
                  Witnesses
                </label>
                <input
                  {...register('witnesses', {
                    min: { value: 1, message: 'Must have at least 1 witness' },
                    max: { value: 1000, message: 'Too many witnesses' },
                  })}
                  type="number"
                  id="witnesses"
                  className="input"
                  min="1"
                />
              </div>

              <div>
                <label htmlFor="weather" className="block text-sm font-medium text-gray-300 mb-2">
                  <CloudIcon className="w-4 h-4 inline mr-1" />
                  Weather
                </label>
                <select
                  {...register('weather')}
                  id="weather"
                  className="input"
                >
                  <option value="">Select weather</option>
                  <option value="Clear">Clear</option>
                  <option value="Partly cloudy">Partly cloudy</option>
                  <option value="Cloudy">Cloudy</option>
                  <option value="Overcast">Overcast</option>
                  <option value="Foggy">Foggy</option>
                  <option value="Rainy">Rainy</option>
                  <option value="Stormy">Stormy</option>
                </select>
              </div>

              <div>
                <label htmlFor="visibility" className="block text-sm font-medium text-gray-300 mb-2">
                  <EyeIcon className="w-4 h-4 inline mr-1" />
                  Visibility
                </label>
                <select
                  {...register('visibility')}
                  id="visibility"
                  className="input"
                >
                  <option value="">Select visibility</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                  <option value="Very poor">Very poor</option>
                </select>
              </div>
            </div>
          </div>

          {/* Media Upload */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
              Photos & Videos
            </h2>

            <FileUpload
              onFilesUploaded={handleFilesUploaded}
              onFilesChanged={handleFilesChanged}
              maxFiles={5}
              allowCamera={true}
              allowedTypes="both"
            />

            {/* Show uploaded files */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-300">Uploaded Files</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      {file.mimetype.startsWith('image/') ? (
                        <img
                          src={file.url}
                          alt="Uploaded"
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      ) : (
                        <video
                          src={file.url}
                          className="w-full h-24 object-cover rounded-lg"
                          controls={false}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeUploadedFile(index)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-700">
            <div className="text-sm text-gray-400">
              * Required fields
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || (pendingFiles.length > 0)}
                className="btn btn-primary"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  'Submit Sighting'
                )}
              </button>
            </div>
          </div>

          {pendingFiles.length > 0 && (
            <div className="text-sm text-yellow-400 text-center">
              Please upload pending files before submitting
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default SubmitPage;