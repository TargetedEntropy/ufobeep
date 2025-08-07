import { Router } from 'express';
import { upload, handleUploadError } from '../middleware/upload';
import { uploadFiles, deleteFile, getFileInfo } from '../controllers/uploadController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

// File upload routes
router.post('/', optionalAuth, upload.array('files', 5), handleUploadError, uploadFiles);
router.delete('/:filename', optionalAuth, deleteFile);
router.get('/:filename/info', getFileInfo);

export default router;