const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const Asset = require('../models/Asset');
const { authenticateToken, requireAdvertiser } = require('../middleware/auth');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'), false);
    }
  }
});

// Generate presigned upload URL
router.post('/presign', authenticateToken, requireAdvertiser, async (req, res) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const params = {
      folder: 'conekt/videos',
      resource_type: 'video',
      timestamp: timestamp
    };

    const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);
    
    res.json({
      signature,
      timestamp,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      folder: params.folder,
      resource_type: params.resource_type
    });
  } catch (error) {
    console.error('Presign upload error:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

// Upload video asset
router.post('/video-assets', authenticateToken, requireAdvertiser, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
  {
    resource_type: 'video',
    folder: 'conekt/videos',
    public_id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    transformation: [
      { width: 1920, height: 1080, crop: "scale" } // force 1080p
    ]
  },
  (error, result) => {
    if (error) reject(error);
    else resolve(result);
  }
);

      uploadStream.end(req.file.buffer);
    });

    // Create asset record
    const asset = new Asset({
      owner: req.user._id,
      url: result.secure_url,
      publicId: result.public_id,
      durationSec: Math.round(result.duration),
      fileSize: result.bytes,
      mimeType: req.file.mimetype,
      checksum: result.etag
    });

    await asset.save();

    res.json({
      id: asset._id,
      url: asset.url,
      durationSec: asset.durationSec,
      fileSize: asset.fileSize,
      validated: asset.validated
    });
  } catch (error) {
    console.error('Upload video error:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// Get user's assets    
router.get('/assets', authenticateToken, requireAdvertiser, async (req, res) => {
  try {
    const assets = await Asset.find({ owner: req.user._id })
      .select('url durationSec fileSize validated createdAt')
      .sort({ createdAt: -1 });

    res.json(assets);
  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

module.exports = router;
