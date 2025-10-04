# Conekt MVP Backend

A comprehensive backend system for the Conekt digital outdoor advertising platform, built with Node.js, Express.js, and MongoDB.

## Features

- **Advertiser Management**: OTP-based authentication, campaign creation, asset uploads
- **Admin Panel**: Campaign approval, playlist generation, truck monitoring
- **Hardware Integration**: Truck heartbeat, playlist delivery, telemetry
- **Payment Processing**: Razorpay integration for campaign payments
- **Asset Management**: Cloudinary integration for video uploads

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with OTP verification
- **File Storage**: Cloudinary
- **Payments**: Razorpay
- **SMS**: Twilio

## API Endpoints

### Authentication
- `POST /api/auth/otp/send` - Send OTP to phone number
- `POST /api/auth/otp/verify` - Verify OTP and get JWT token

### Cities & Routes
- `GET /api/cities` - Get all enabled cities
- `GET /api/cities/:id/routes` - Get routes for a city

### Availability
- `POST /api/availability/check` - Check campaign availability
- `GET /api/availability/route/:id/capacity` - Get route capacity

### Uploads
- `POST /api/uploads/presign` - Generate presigned upload URL
- `POST /api/uploads/video-assets` - Upload video asset
- `GET /api/uploads/assets` - Get user's assets

### Campaigns
- `POST /api/campaigns` - Create new campaign
- `GET /api/campaigns/mine` - Get user's campaigns
- `GET /api/campaigns/:id` - Get specific campaign

### Payments
- `POST /api/payments/create` - Create payment order
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/:campaignId` - Get payment details

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

### Admin APIs
- `GET /api/admin/campaigns` - Get campaigns for review
- `POST /api/admin/campaigns/:id/approve` - Approve campaign (auto-regenerates playlists)
- `POST /api/admin/campaigns/:id/reject` - Reject campaign
- `POST /api/admin/playlists/generate` - Generate playlist for specific truck
- `POST /api/admin/playlists/generate-all` - Generate playlists for all trucks
- `POST /api/admin/playlists/:id/push` - Push playlist to truck
- `GET /api/admin/trucks/:id/playlist` - Get truck playlist
- `GET /api/admin/dashboard` - Get dashboard statistics
- `POST /api/admin/cities/:id/routes` - Create route for city
- `GET /api/admin/playlists/stats` - Get playlist statistics
- `POST /api/admin/playlists/refresh-all` - Manual playlist refresh
- `GET /api/admin/scheduler/status` - Get scheduler status
- `POST /api/admin/scheduler/refresh` - Trigger manual refresh

### Truck APIs
- `GET /api/trucks` - Get all trucks (admin)
- `GET /api/trucks/:id/status` - Get truck status

### Hardware APIs
- `POST /api/hardware/:id/heartbeat` - Truck heartbeat
- `GET /api/hardware/:id/playlist` - Get truck playlist
- `GET /api/hardware/:id/telemetry` - Get truck telemetry

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `env.example`:
   ```bash
   cp env.example .env
   ```

4. Update the `.env` file with your configuration:
   - MongoDB connection string
   - JWT secret
   - Twilio credentials
   - Cloudinary credentials
   - Razorpay credentials

5. Start the server:
   ```bash
   npm run dev
   ```

## Environment Variables

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/conekt-ai
JWT_SECRET=your-super-secret-jwt-key-here
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
API_SECRET_KEY=your-api-secret-key-for-hardware-auth
```

## Database Schema

### Users
- Phone number, role (advertiser/admin), OTP management

### Cities
- Name, enabled status, description

### Routes
- City reference, name, description, truck reference

### Trucks
- Route reference, controller ID, status, heartbeat data

### Assets
- Owner reference, Cloudinary URL, duration, validation status

### Campaigns
- Advertiser, route, truck, asset, package, dates, status, payment status

### Playlists
- Truck reference, date, version, items, push status

### Payments
- Campaign reference, gateway, amount, status, gateway IDs

### Audit Logs
- Actor, action, entity type/ID, details, metadata

## Hardware Integration

The system supports Raspberry Pi hardware with the following endpoints:

- **Heartbeat**: Trucks send status updates every 5 minutes
- **Playlist**: Trucks fetch daily playlists for ad playback
- **Telemetry**: System monitoring and error reporting

## Security Features

- JWT-based authentication
- Role-based access control
- Rate limiting
- Input validation
- CORS protection
- Helmet security headers

## Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Start production server
npm start
```

## API Documentation

The API follows RESTful conventions with JSON responses. All endpoints require authentication except for hardware endpoints which use API key authentication.

### Response Format

```json
{
  "data": {},
  "error": "Error message",
  "message": "Success message"
}
```

### Error Handling

- 400: Bad Request (validation errors)
- 401: Unauthorized (authentication required)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 500: Internal Server Error

## 🎵 Real-time Playlist Updates

The system now supports automatic playlist updates for live video streaming:

### Automatic Updates
- **Campaign Approval**: When admin approves a campaign, playlists are automatically regenerated for affected trucks
- **Scheduled Refresh**: Playlists are refreshed every 2 hours to ensure latest content
- **Daily Generation**: Tomorrow's playlists are pre-generated at 11 PM daily  
- **Morning Check**: At 6 AM, system verifies missing playlists and generates them

### Manual Controls
- Generate playlists for all trucks: `POST /api/admin/playlists/refresh-all`
- Monitor scheduler status: `GET /api/admin/scheduler/status`
- Trigger manual refresh: `POST /api/admin/scheduler/refresh`

### Environment Variables
```env
ENABLE_PLAYLIST_SCHEDULER=true  # Enable/disable auto-scheduling
```

## 🧪 Testing Playlist Updates

Test the playlist auto-update functionality:
```bash
node test-playlist-updates.js
```

This will verify:
- ✅ Playlist generation works correctly
- ✅ Auto-regeneration on campaign approval
- ✅ Scheduler is running properly

## 📈 Workflow

1. **Upload Video**: Advertiser uploads content via `/api/uploads/video-assets`
2. **Create Campaign**: Campaign created via `/api/campaigns`
3. **Admin Approval**: Admin approves via `/api/admin/campaigns/:id/approve`
4. **Auto-Regeneration**: Playlists automatically update for affected trucks
5. **Live Streaming**: Trucks immediately receive updated playlists

## License

MIT License
