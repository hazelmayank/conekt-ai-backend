# Conekt AI Backend API Documentation

## Base URL
```
https://conekt-ai-backend.onrender.com/api/
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Hardware Authentication
Hardware endpoints require an API key in the header:
```
X-API-Key: <api_secret_key>
```

---

## 🔐 Authentication Flow

### 1. Registration (Advertisers & Admins)
**Endpoint:** `POST /auth/register`

**Description:** Register a new user account with name and phone. Sends OTP for verification.

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "+917651816966",
  "role": "advertiser"
}
```

**Response (201):**
```json
{
  "ok": true,
  "message": "OTP sent for verification",
  "data": {
    "sid": "verification_sid_from_twilio"
  }
}
```

### 2. Verify Registration OTP
**Endpoint:** `POST /auth/register/verify`

**Description:** Verify the OTP sent during registration to activate the account.

**Request Body:**
```json
{
  "phone": "+917651816966",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "ok": true,
  "message": "Registration verified",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "role": "advertiser",
    "phone": "+917651816966",
    "name": "John Doe"
  }
}
```

### 3. Login (OTP-based)
**Endpoint:** `POST /auth/login`

**Description:** Login with phone number. Sends OTP for verification.

**Request Body:**
```json
{
  "phone": "+917651816966"
}
```

**Response (200):**
```json
{
  "ok": true,
  "message": "OTP sent for login",
  "data": {
    "sid": "verification_sid_from_twilio"
  }
}
```

### 4. Verify Login OTP
**Endpoint:** `POST /auth/login/verify`

**Description:** Verify the OTP sent during login to complete authentication.

**Request Body:**
```json
{
  "phone": "+917651816966",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "ok": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "role": "advertiser",
    "phone": "+917651816966",
    "name": "John Doe"
  }
}
```


---

## 🏙️ Cities & Routes

### 1. Get All Cities
**Endpoint:** `GET /cities`
**Auth Required:** Yes (Advertiser)

**Description:** Get list of all enabled cities where advertising is available.

**Response (200):**
```json
[
  {
    "_id": "city_id_1",
    "name": "Mumbai",
    "description": "Financial capital of India"
  },
  {
    "_id": "city_id_2", 
    "name": "Delhi",
    "description": "Capital city of India"
  }
]
```

### 2. Get Routes for a City
**Endpoint:** `GET /cities/:cityId/routes`
**Auth Required:** Yes (Advertiser)

**Description:** Get all active routes in a specific city with truck information.

**Response (200):**
```json
[
  {
    "_id": "route_id_1",
    "name": "Marine Drive Route",
    "description": "Scenic route along Marine Drive, Mumbai",
    "truck": {
      "_id": "truck_id_1",
      "controllerId": "TRUCK_001",
      "status": "online"
    }
  }
]
```

---

## 📊 Availability Checking

### 1. Check Route Availability
**Endpoint:** `POST /availability/check`
**Auth Required:** Yes (Advertiser)

**Description:** Check if advertising slots are available for a specific route, package duration, and start date. Start dates can be past, present, or future dates.

**Request Body:**
```json
{
  "routeId": "route_id_here",
  "package": "15",
  "startDate": "2024-01-15T00:00:00.000Z"
}
```

**Response (200) - Available:**
```json
{
  "available": true,
  "earliestStartDate": "2024-01-15T00:00:00.000Z",
  "conflictingCampaigns": []
}
```

**Response (200) - Not Available:**
```json
{
  "available": false,
  "earliestStartDate": "2024-02-01T00:00:00.000Z",
  "conflictingCampaigns": [
    {
      "_id": "campaign_id",
      "startDate": "2024-01-10T00:00:00.000Z",
      "endDate": "2024-01-25T00:00:00.000Z"
    }
  ]
}
```

### 2. Get Route Capacity
**Endpoint:** `GET /availability/route/:routeId/capacity`
**Auth Required:** Yes (Advertiser)

**Description:** Get current capacity information for a route (max 7 concurrent campaigns).

**Response (200):**
```json
{
  "totalSlots": 7,
  "usedSlots": 3,
  "availableSlots": 4,
  "campaigns": [
    {
      "_id": "campaign_id",
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-15T00:00:00.000Z",
      "asset": {
        "durationSec": 30
      }
    }
  ]
}
```

---

## 📹 Asset Management (Video Uploads)

### 1. Upload Video Asset
**Endpoint:** `POST /uploads/video-assets`
**Auth Required:** Yes (Advertiser)
**Content-Type:** `multipart/form-data`

**Description:** Upload a video file for advertising campaigns. Only video files up to 100MB are allowed.

**Form Data:**
- `video`: Video file (required)

**Response (200):**
```json
{
  "id": "asset_id",
  "url": "https://cloudinary_url/video.mp4",
  "durationSec": 30,
  "fileSize": 15728640,
  "validated": false
}
```

### 2. Get User's Assets
**Endpoint:** `GET /uploads/assets`
**Auth Required:** Yes (Advertiser)

**Description:** Get all video assets uploaded by the current user.

**Response (200):**
```json
[
  {
    "_id": "asset_id",
    "url": "https://cloudinary_url/video.mp4",
    "durationSec": 30,
    "fileSize": 15728640,
    "validated": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### 3. Get Presigned Upload URL
**Endpoint:** `POST /uploads/presign`
**Auth Required:** Yes (Advertiser)

**Description:** Get presigned URL for direct upload to Cloudinary (alternative to multipart upload).

**Response (200):**
```json
{
  "signature": "cloudinary_signature",
  "timestamp": 1640995200,
  "cloud_name": "your_cloud_name",
  "api_key": "your_api_key",
  "folder": "conekt/videos",
  "resource_type": "video"
}
```

---

## 🎯 Campaign Management

### 1. Create Campaign
**Endpoint:** `POST /campaigns`
**Auth Required:** Yes (Advertiser)

**Description:** Create a new advertising campaign. Start date must be 1st or 15th of the month, but can be any past, present, or future date. The campaign runs for the exact number of days specified in the package.

**Request Body:**
```json
{
  "routeId": "route_id_here",
  "assetId": "asset_id_here", 
  "package": "15",
  "startDate": "2024-01-15T00:00:00.000Z"
}
```

**Response (201):**
```json
{
  "id": "campaign_id",
  "status": "pending",
  "startDate": "2024-01-15T00:00:00.000Z",
  "endDate": "2024-01-30T00:00:00.000Z",
  "package": "15"
}
```

**Error Response (400) - No Slots Available:**
```json
{
  "error": "No slots available",
  "earliestStartDate": "2024-02-01T00:00:00.000Z"
}
```

### 2. Get User's Campaigns
**Endpoint:** `GET /campaigns/mine`
**Auth Required:** Yes (Advertiser)

**Description:** Get all campaigns created by the current user.

**Response (200):**
```json
[
  {
    "_id": "campaign_id",
    "status": "pending",
    "package": "15",
    "startDate": "2024-01-15T00:00:00.000Z",
    "endDate": "2024-01-30T00:00:00.000Z",
    "paymentStatus": "pending",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "route": {
      "_id": "route_id",
      "name": "Marine Drive Route"
    },
    "asset": {
      "_id": "asset_id",
      "url": "https://cloudinary_url/video.mp4",
      "durationSec": 30
    },
    "truck": {
      "_id": "truck_id",
      "controllerId": "TRUCK_001"
    }
  }
]
```

### 3. Get Specific Campaign
**Endpoint:** `GET /campaigns/:campaignId`
**Auth Required:** Yes (Advertiser)

**Description:** Get detailed information about a specific campaign.

**Response (200):**
```json
{
  "_id": "campaign_id",
  "status": "approved",
  "package": "15",
  "startDate": "2024-01-15T00:00:00.000Z",
  "endDate": "2024-01-30T00:00:00.000Z",
  "paymentStatus": "paid",
  "route": {
    "_id": "route_id",
    "name": "Marine Drive Route"
  },
  "asset": {
    "_id": "asset_id",
    "url": "https://cloudinary_url/video.mp4",
    "durationSec": 30,
    "fileSize": 15728640
  },
  "truck": {
    "_id": "truck_id",
    "controllerId": "TRUCK_001",
    "status": "online"
  }
}
```

---

## 💳 Payment Management

### 1. Create Payment Order
**Endpoint:** `POST /payments/create`
**Auth Required:** Yes (Advertiser)

**Description:** Create a Razorpay payment order for a campaign.

**Request Body:**
```json
{
  "campaignId": "campaign_id_here",
  "amount": 50000
}
```

**Response (200):**
```json
{
  "orderId": "order_razorpay_id",
  "amount": 50000,
  "currency": "INR",
  "key": "razorpay_key_id"
}
```

### 2. Verify Payment
**Endpoint:** `POST /payments/verify`
**Auth Required:** Yes (Advertiser)

**Description:** Verify payment after successful Razorpay transaction.

**Request Body:**
```json
{
  "razorpayOrderId": "order_razorpay_id",
  "razorpayPaymentId": "pay_razorpay_id",
  "razorpaySignature": "signature_from_razorpay",
  "campaignId": "campaign_id_here"
}
```

**Response (200):**
```json
{
  "message": "Payment verified successfully"
}
```

### 3. Get Payment for Campaign
**Endpoint:** `GET /payments/:campaignId`
**Auth Required:** Yes (Advertiser)

**Description:** Get payment information for a specific campaign.

**Response (200):**
```json
{
  "_id": "payment_id",
  "amount": 50000,
  "status": "paid",
  "gatewayPaymentId": "pay_razorpay_id",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

## 👤 Profile Management

### 1. Get User Profile
**Endpoint:** `GET /profile`
**Auth Required:** Yes (Advertiser)

**Description:** Get current user's profile information.

**Response (200):**
```json
{
  "_id": "user_id",
  "name": "John Doe",
  "phone": "+917651816966",
  "role": "advertiser",
  "isVerified": true,
  "isActive": true,
  "lastLogin": "2024-01-01T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### 2. Update User Profile
**Endpoint:** `PUT /profile`
**Auth Required:** Yes (Advertiser)

**Description:** Update user's profile information.

**Request Body:**
```json
{
  "phone": "+917651816999"
}
```

**Response (200):**
```json
{
  "_id": "user_id",
  "name": "John Doe", 
  "phone": "+917651816999",
  "role": "advertiser",
  "isVerified": true,
  "isActive": true
}
```

---

## 👨‍💼 Admin APIs

### 1. Admin Dashboard
**Endpoint:** `GET /admin/dashboard`
**Auth Required:** Yes (Admin)

**Description:** Get comprehensive dashboard statistics for admin panel.

**Response (200):**
```json
{
  "campaigns": {
    "total": 150,
    "pending": 12,
    "active": 45,
    "expiring": 3
  },
  "trucks": {
    "total": 8,
    "online": 6,
    "offline": 2
  },
  "assets": {
    "total": 89
  },
  "payments": {
    "total": 67
  }
}
```

### 2. Get All Campaigns (Admin)
**Endpoint:** `GET /admin/campaigns`
**Auth Required:** Yes (Admin)

**Description:** Get campaigns for admin review with pagination and filtering.

**Query Parameters:**
- `status`: Filter by status (pending, approved, rejected, live, completed)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response (200):**
```json
{
  "campaigns": [
    {
      "_id": "campaign_id",
      "status": "pending",
      "package": "15",
      "startDate": "2024-01-15T00:00:00.000Z",
      "endDate": "2024-01-30T00:00:00.000Z",
      "paymentStatus": "paid",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "advertiser": {
        "_id": "user_id",
        "phone": "+917651816966"
      },
      "route": {
        "_id": "route_id",
        "name": "Marine Drive Route"
      },
      "asset": {
        "_id": "asset_id",
        "url": "https://cloudinary_url/video.mp4",
        "durationSec": 30
      },
      "truck": {
        "_id": "truck_id",
        "controllerId": "TRUCK_001",
        "status": "online"
      }
    }
  ],
  "totalPages": 5,
  "currentPage": 1,
  "total": 45
}
```

### 3. Approve Campaign
**Endpoint:** `POST /admin/campaigns/:id/approve`
**Auth Required:** Yes (Admin)

**Description:** Approve a pending campaign with optional start date adjustment. Start date can be past, present, or future dates.

**Request Body:**
```json
{
  "startDate": "2024-01-15T00:00:00.000Z"
}
```

**Response (200):**
```json
{
  "message": "Campaign approved successfully"
}
```

### 4. Reject Campaign
**Endpoint:** `POST /admin/campaigns/:id/reject`
**Auth Required:** Yes (Admin)

**Description:** Reject a pending campaign with reason.

**Request Body:**
```json
{
  "reason": "Content does not meet advertising standards"
}
```

**Response (200):**
```json
{
  "message": "Campaign rejected successfully"
}
```

### 5. Generate Playlist
**Endpoint:** `POST /admin/playlists/generate`
**Auth Required:** Yes (Admin)

**Description:** Generate playlist for a truck based on active campaigns.

**Request Body:**
```json
{
  "truckId": "truck_id_here",
  "date": "2024-01-15T00:00:00.000Z"
}
```

**Response (200):**
```json
{
  "id": "playlist_id",
  "version": "v1640995200000",
  "itemsCount": 5,
  "truckId": "truck_id_here"
}
```

### 6. Push Playlist to Truck
**Endpoint:** `POST /admin/playlists/:id/push`
**Auth Required:** Yes (Admin)

**Description:** Push a generated playlist to the truck hardware.

**Response (200):**
```json
{
  "message": "Playlist pushed successfully"
}
```

### 7. Get Truck Playlist (Admin)
**Endpoint:** `GET /admin/trucks/:id/playlist`
**Auth Required:** Yes (Admin)

**Description:** Get current playlist for a specific truck.

**Query Parameters:**
- `date`: Date to get playlist for (default: today)

**Response (200):**
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "v1640995200000",
  "playlist": [
    {
      "id": "asset_id",
      "type": "video",
      "url": "https://cloudinary_url/video.mp4",
      "checksum": "abc123",
      "duration": 30,
      "loop": false
    }
  ]
}
```

### 8. Create Route
**Endpoint:** `POST /admin/cities/:id/routes`
**Auth Required:** Yes (Admin)

**Description:** Create a new route and truck for a city.

**Request Body:**
```json
{
  "name": "New Route Name",
  "description": "Route description"
}
```

**Response (201):**
```json
{
  "id": "route_id",
  "name": "New Route Name",
  "truckId": "truck_id",
  "controllerId": "TRUCK_1234567890"
}
```

---

## 🚛 Truck Management APIs

### 1. Get All Trucks
**Endpoint:** `GET /trucks`
**Auth Required:** Yes (Admin)

**Description:** Get list of all trucks with their status and route information.

**Response (200):**
```json
[
  {
    "_id": "truck_id",
    "controllerId": "TRUCK_001",
    "status": "online",
    "lastHeartbeatAt": "2024-01-15T10:30:00.000Z",
    "uptimeSeconds": 3600,
    "route": {
      "_id": "route_id",
      "name": "Marine Drive Route",
      "city": "city_id"
    }
  }
]
```

### 2. Get Truck Status
**Endpoint:** `GET /trucks/:id/status`
**Auth Required:** Yes (Admin)

**Description:** Get detailed status information for a specific truck.

**Response (200):**
```json
{
  "id": "truck_id",
  "controllerId": "TRUCK_001",
  "status": "online",
  "lastHeartbeatAt": "2024-01-15T10:30:00.000Z",
  "uptimeSeconds": 3600,
  "route": {
    "_id": "route_id",
    "name": "Marine Drive Route",
    "city": "city_id"
  }
}
```

---

## 🔧 Hardware APIs

### 1. Truck Heartbeat
**Endpoint:** `POST /hardware/:id/heartbeat`
**Auth Required:** Hardware API Key

**Description:** Hardware endpoint for trucks to send heartbeat and status updates. GPS coordinates are optional and can be included to track truck location.

**Headers:**
```
X-API-Key: <api_secret_key>
```

**Request Body:**
```json
{
  "device_id": "TRUCK_001",
  "status": "online",
  "uptime_seconds": 3600,
  "last_ad_playback_timestamp": "2024-01-15T10:30:00.000Z",
  "gps_coordinates": {
    "latitude": 19.0760,
    "longitude": 72.8777,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Field Descriptions:**
- `device_id` (string, required): Truck controller identifier
- `status` (string, required): Current status ("online" or "offline")
- `uptime_seconds` (number, required): Uptime in seconds since last reboot
- `last_ad_playback_timestamp` (ISO date, optional): When last ad was played
- `gps_coordinates` (object, optional): GPS location data
  - `latitude` (number, required if gps_coordinates provided): Latitude (-90 to 90)
  - `longitude` (number, required if gps_coordinates provided): Longitude (-180 to 180)
  - `timestamp` (ISO date, optional): When GPS reading was taken (defaults to request time)

**Response (200):**
```json
{
  "status": "success",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Get Truck Playlist (Hardware)
**Endpoint:** `GET /hardware/:id/playlist`
**Auth Required:** Hardware API Key

**Description:** Hardware endpoint for trucks to fetch their daily playlist.

**Headers:**
```
X-API-Key: <api_secret_key>
```

**Response (200):**
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "v1640995200000",
  "playlist": [
    {
      "id": "asset_id",
      "type": "video",
      "url": "https://cloudinary_url/video.mp4",
      "checksum": "abc123",
      "duration": 30,
      "loop": false
    }
  ]
}
```

**Response (200) - No Playlist:**
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "v0",
  "playlist": []
}
```

### 3. Get Truck Telemetry
**Endpoint:** `GET /hardware/:id/telemetry`
**Auth Required:** Hardware API Key

**Description:** Hardware endpoint for monitoring truck status and performance.

**Headers:**
```
X-API-Key: <api_secret_key>
```

**Response (200):**
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "device": {
    "id": "TRUCK_001",
    "uptime_sec": 3600,
    "status": "online",
    "last_heartbeat": "2024-01-15T10:30:00.000Z"
  },
  "player": {
    "status": "ready",
    "playlist_version": "v1640995200000",
    "last_ad_playback": "2024-01-15T10:25:00.000Z"
  },
  "errors": []
}
```

---

## 🔄 Complete User Flow

### For New Users (Advertisers & Admins):

1. **Registration Flow:**
   ```
   POST /auth/register → OTP sent
   POST /auth/register/verify → Account activated + JWT token
   ```

2. **Login Flow:**
   ```
   POST /auth/login → OTP sent
   POST /auth/login/verify → Authentication complete + JWT token
   ```

2. **Campaign Creation Flow (Advertisers):**
   ```
   GET /cities → Select city
   GET /cities/:id/routes → Select route  
   POST /uploads/video-assets → Upload video
   POST /availability/check → Check availability
   POST /campaigns → Create campaign
   POST /payments/create → Create payment order
   POST /payments/verify → Complete payment
   ```

3. **Campaign Management (Advertisers):**
   ```
   GET /campaigns/mine → View all campaigns
   GET /campaigns/:id → View specific campaign
   GET /payments/:campaignId → Check payment status
   ```

### For Admins:

1. **Admin Dashboard Flow:**
   ```
   GET /admin/dashboard → View system statistics
   GET /admin/campaigns?status=pending → Review pending campaigns
   POST /admin/campaigns/:id/approve → Approve campaign
   POST /admin/campaigns/:id/reject → Reject campaign
   ```

2. **Playlist Management Flow:**
   ```
   GET /trucks → View all trucks
   GET /trucks/:id/status → Check truck status
   POST /admin/playlists/generate → Generate playlist for truck
   POST /admin/playlists/:id/push → Push playlist to truck
   GET /admin/trucks/:id/playlist → Verify playlist
   ```

3. **Route Management Flow:**
   ```
   POST /admin/cities/:id/routes → Create new route and truck
   ```

### For Hardware/Trucks:

1. **Hardware Communication Flow:**
   ```
   POST /hardware/:id/heartbeat → Send status updates
   GET /hardware/:id/playlist → Fetch daily playlist
   GET /hardware/:id/telemetry → Get system status
   ```

### Package Options:
- `"7"`: 7-day campaign
- `"15"`: 15-day campaign  
- `"30"`: 30-day campaign

### Campaign Statuses:
- `"pending"`: Awaiting admin approval
- `"approved"`: Approved by admin
- `"live"`: Currently running
- `"completed"`: Campaign finished
- `"rejected"`: Rejected by admin

### Payment Statuses:
- `"pending"`: Payment not made
- `"paid"`: Payment completed
- `"failed"`: Payment failed

### Important Notes:

1. **Phone Number Format:** Must be in E.164 format (`+91XXXXXXXXXX`)
2. **Start Dates:** Campaigns can only start on 1st or 15th of the month, but can be any past, present, or future date.
3. **Campaign Duration:** A 15-day package runs for exactly 15 days (e.g., Oct 1st to Oct 15th)
4. **Route Capacity:** Maximum 7 concurrent campaigns per route
5. **Video Requirements:** Only video files, max 100MB, automatically scaled to 1080p
6. **Authentication:** JWT tokens expire in 7 days
7. **Availability Logic:** System checks for overlapping campaigns and suggests earliest available date
8. **Admin Access:** Admin users must be created manually in the database with `role: 'admin'`
9. **Hardware API Key:** Set `API_SECRET_KEY` environment variable for hardware authentication
10. **Playlist Generation:** Playlists are generated daily and pushed to trucks
11. **Truck Status:** Trucks are marked offline if no heartbeat received for 5+ minutes

### Error Handling:
All endpoints return consistent error format:
```json
{
  "error": "Error message",
  "details": "Additional details if available"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (account not verified)
- `404`: Not Found
- `500`: Internal Server Error


