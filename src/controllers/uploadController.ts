import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../utils/logger';

// Upload files for sightings
export const uploadFiles = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const files = Array.isArray(req.files) ? req.files : [req.files];
    const uploadedFiles = [];

    for (const file of files) {
      if ('fieldname' in file) {
        const fileInfo = {
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          url: `/uploads/${file.filename}`,
        };
        uploadedFiles.push(fileInfo);
      }
    }

    logger.info(`Files uploaded by user ${req.user.id}:`, uploadedFiles.map(f => f.filename));

    res.json({
      message: 'Files uploaded successfully',
      files: uploadedFiles,
    });
  } catch (error) {
    logger.error('Upload files error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
};

// Delete uploaded file
export const deleteFile = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Validate filename (security check)
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const filePath = path.join(process.cwd(), 'uploads', filename);
    
    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
      
      logger.info(`File deleted by user ${req.user.id}: ${filename}`);
      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return res.status(404).json({ error: 'File not found' });
      }
      throw error;
    }
  } catch (error) {
    logger.error('Delete file error:', error);
    res.status(500).json({ error: 'File deletion failed' });
  }
};

// Get file info
export const getFileInfo = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;

    // Validate filename
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const filePath = path.join(process.cwd(), 'uploads', filename);
    
    try {
      const stats = await fs.stat(filePath);
      const fileInfo = {
        filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        url: `/uploads/${filename}`,
      };

      res.json({ file: fileInfo });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return res.status(404).json({ error: 'File not found' });
      }
      throw error;
    }
  } catch (error) {
    logger.error('Get file info error:', error);
    res.status(500).json({ error: 'Failed to get file info' });
  }
};