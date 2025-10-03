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

---

## 🔐 Authentication Flow

### 1. Registration (Advertisers)
**Endpoint:** `POST /auth/register`

**Description:** Register a new advertiser account with name, phone, and password. Sends OTP for verification.

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "+917651816966",
  "password": "securepassword123",
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

### 3. Login (Advertisers)
**Endpoint:** `POST /auth/login`

**Description:** Login with phone number and password for advertisers.

**Request Body:**
```json
{
  "phone": "+917651816966",
  "password": "securepassword123"
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

**Description:** Check if advertising slots are available for a specific route, package duration, and start date.

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

**Description:** Create a new advertising campaign. Start date must be 1st or 15th of the month.

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

## 🔄 Complete User Flow

### For New Advertisers:

1. **Registration Flow:**
   ```
   POST /auth/register → OTP sent
   POST /auth/register/verify → Account activated + JWT token
   ```

2. **Campaign Creation Flow:**
   ```
   GET /cities → Select city
   GET /cities/:id/routes → Select route  
   POST /uploads/video-assets → Upload video
   POST /availability/check → Check availability
   POST /campaigns → Create campaign
   POST /payments/create → Create payment order
   POST /payments/verify → Complete payment
   ```

3. **Campaign Management:**
   ```
   GET /campaigns/mine → View all campaigns
   GET /campaigns/:id → View specific campaign
   GET /payments/:campaignId → Check payment status
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
2. **Start Dates:** Campaigns can only start on 1st or 15th of the month
3. **Route Capacity:** Maximum 7 concurrent campaigns per route
4. **Video Requirements:** Only video files, max 100MB, automatically scaled to 1080p
5. **Authentication:** JWT tokens expire in 7 days
6. **Availability Logic:** System checks for overlapping campaigns and suggests earliest available date

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

