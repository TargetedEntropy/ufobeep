import React, { useState, useRef } from 'react';
import { uploadService } from '../services/uploadService';
import { UploadedFile } from '../types';
import {
  PhotoIcon,
  VideoCameraIcon,
  XMarkIcon,
  CameraIcon,
  DocumentIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import toast from 'react-hot-toast';

interface FileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  onFilesChanged: (files: File[]) => void;
  maxFiles?: number;
  allowCamera?: boolean;
  allowedTypes?: 'images' | 'videos' | 'both';
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesUploaded,
  onFilesChanged,
  maxFiles = 5,
  allowCamera = true,
  allowedTypes = 'both',
  className,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const getAcceptTypes = () => {
    switch (allowedTypes) {
      case 'images':
        return 'image/jpeg,image/jpg,image/png,image/webp';
      case 'videos':
        return 'video/mp4,video/webm,video/quicktime';
      case 'both':
      default:
        return 'image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/webm,video/quicktime';
    }
  };

  const validateAndAddFiles = (newFiles: File[]) => {
    const validFiles: File[] = [];
    
    for (const file of newFiles) {
      if (files.length + validFiles.length >= maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`);
        break;
      }

      const validation = uploadService.validateFile(file);
      if (!validation.isValid) {
        toast.error(`${file.name}: ${validation.error}`);
        continue;
      }

      // Check if file already exists
      if (files.some(f => f.name === file.name && f.size === file.size)) {
        toast.error(`File "${file.name}" already selected`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      const updatedFiles = [...files, ...validFiles];
      setFiles(updatedFiles);
      onFilesChanged(updatedFiles);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    validateAndAddFiles(selectedFiles);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const capturedFiles = Array.from(e.target.files || []);
    validateAndAddFiles(capturedFiles);
    // Reset input
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    validateAndAddFiles(droppedFiles);
  };

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesChanged(updatedFiles);
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      toast.error('No files selected');
      return;
    }

    setUploading(true);
    try {
      const uploadedFiles = await uploadService.uploadFiles(files);
      onFilesUploaded(uploadedFiles);
      setFiles([]);
      onFilesChanged([]);
      toast.success(`${uploadedFiles.length} file(s) uploaded successfully!`);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Upload failed';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <PhotoIcon className="w-5 h-5 text-green-400" />;
    } else if (file.type.startsWith('video/')) {
      return <VideoCameraIcon className="w-5 h-5 text-blue-400" />;
    }
    return <DocumentIcon className="w-5 h-5 text-gray-400" />;
  };

  const getFilePreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      return (
        <img
          src={URL.createObjectURL(file)}
          alt="Preview"
          className="w-16 h-16 object-cover rounded-md"
          onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
        />
      );
    } else if (file.type.startsWith('video/')) {
      return (
        <video
          src={URL.createObjectURL(file)}
          className="w-16 h-16 object-cover rounded-md"
          onLoadedData={(e) => URL.revokeObjectURL((e.target as HTMLVideoElement).src)}
        />
      );
    }
    return null;
  };

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Upload Area */}
      <div
        className={clsx(
          'border-2 border-dashed rounded-lg p-6 transition-colors',
          dragOver
            ? 'border-cosmic-400 bg-cosmic-400/10'
            : 'border-gray-600 hover:border-gray-500'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="text-lg font-medium text-gray-300 mb-2">
            Upload Photos & Videos
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Drag and drop files here, or click to select files
          </p>
          
          <div className="flex justify-center space-x-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={getAcceptTypes()}
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary"
            >
              <PhotoIcon className="w-4 h-4 mr-2" />
              Choose Files
            </button>
            
            {allowCamera && (allowedTypes === 'images' || allowedTypes === 'both') && (
              <>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraCapture}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="btn btn-secondary"
                >
                  <CameraIcon className="w-4 h-4 mr-2" />
                  Camera
                </button>
              </>
            )}
          </div>

          <p className="text-xs text-gray-500 mt-3">
            Max {maxFiles} files, 10MB each. Supported: JPEG, PNG, WebP, MP4, WebM, MOV
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-300">
              Selected Files ({files.length}/{maxFiles})
            </h4>
            <button
              type="button"
              onClick={uploadFiles}
              disabled={uploading}
              className="btn btn-primary btn-sm"
            >
              {uploading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </div>
              ) : (
                <>
                  <CloudArrowUpIcon className="w-4 h-4 mr-2" />
                  Upload {files.length} file{files.length !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg border border-gray-700"
              >
                {getFilePreview(file) || (
                  <div className="w-16 h-16 bg-gray-700 rounded-md flex items-center justify-center">
                    {getFileIcon(file)}
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {uploadService.formatFileSize(file.size)} • {file.type}
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;