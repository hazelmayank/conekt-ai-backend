const express = require('express');
const Truck = require('../models/Truck');
const Playlist = require('../models/Playlist');
const { validateRequest, schemas } = require('../middleware/validation');
const crypto = require('crypto');

const router = express.Router();

// Hardware authentication middleware
const authenticateHardware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.API_SECRET_KEY;
   

  if (!apiKey || apiKey !== expectedKey) {
    return res.status(401).json({ error: 'Unauthorized hardware access' });
  }

  next();
};

// Truck heartbeat
router.post('/:id/heartbeat', authenticateHardware, validateRequest(schemas.truckHeartbeat), async (req, res) => {
  try {
    const { id } = req.params;
    const { device_id, status, uptime_seconds, last_ad_playback_timestamp } = req.body;

    const truck = await Truck.findById(id);
    if (!truck) {
      return res.status(404).json({ error: 'Truck not found' });
    }

    // Update truck status
    truck.status = status;
    truck.lastHeartbeatAt = new Date();
    truck.uptimeSeconds = uptime_seconds;
    if (last_ad_playback_timestamp) {
      truck.lastAdPlaybackTimestamp = new Date(last_ad_playback_timestamp);
    }

    await truck.save();

    res.json({ 
      status: 'success',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Truck heartbeat error:', error);
    res.status(500).json({ error: 'Failed to process heartbeat' });
  }
});

// Get truck playlist
router.get('/:id/playlist', authenticateHardware, async (req, res) => {
  try {
    const { id } = req.params;
   const { date }=req.body;
    // Compute *UTC* day window for "today"
    const now = new Date();
    const startUtc = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(), 0, 0, 0, 0
    ));
    const endUtc = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(), 23, 59, 59, 999
    ));

    const playlist = await Playlist.findOne({
      truck: id,
      isActive: true,
      date: { $gte: startUtc, $lte: endUtc },
    });

    if (!playlist) {
      return res.json({ timestamp: new Date().toISOString(), version: 'v0', playlist: [] });
    }

    res.json({
      timestamp: new Date().toISOString(),
      version: playlist.version,
      playlist: playlist.items
    });
  } catch (error) {
    console.error('Get truck playlist error:', error);
    res.status(500).json({ error: 'Failed to fetch playlist' });
  }
});


// Get truck telemetry (for monitoring)
router.get('/:id/telemetry', authenticateHardware, async (req, res) => {
  try {
    const { id } = req.params;

    const truck = await Truck.findById(id);
    if (!truck) {
      return res.status(404).json({ error: 'Truck not found' });
    }

    // ---- Offline check ----
    const FIVE_MINUTES = 5 * 60 * 1000; // 5 minutes in ms
    const now = Date.now();
    let effectiveStatus = truck.status;

    if (truck.lastHeartbeatAt) {
      const diff = now - truck.lastHeartbeatAt.getTime();
      if (diff > FIVE_MINUTES) {
        effectiveStatus = 'offline';
      }
    } else {
      // If no heartbeat ever received, mark as offline
      effectiveStatus = 'offline';
    }

    // ---- Playlist lookup for today ----
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const playlist = await Playlist.findOne({
      truck: id,
      date: today,
      isActive: true // safer to only check active playlists
    });

    // ---- Build response ----
    res.json({
      timestamp: new Date().toISOString(),
      device: {
        id: truck.controllerId,
        uptime_sec: truck.uptimeSeconds,
        status: effectiveStatus, // use effective status with offline check
        last_heartbeat: truck.lastHeartbeatAt
      },
      player: {
        status: effectiveStatus === 'online' ? 'ready' : 'offline',
        playlist_version: playlist ? playlist.version : 'v0',
        last_ad_playback: truck.lastAdPlaybackTimestamp
      },
      errors: [] // placeholder for device/player errors
    });
  } catch (error) {
    console.error('Get truck telemetry error:', error);
    res.status(500).json({ error: 'Failed to fetch telemetry' });
  }
});


module.exports = router;
