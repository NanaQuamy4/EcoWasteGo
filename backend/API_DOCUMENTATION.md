# EcoWasteGo API Documentation

## Overview

The EcoWasteGo API provides comprehensive endpoints for waste management, user authentication, payments, analytics, and recycler management. All endpoints are built with TypeScript and use Supabase for data storage.

## Base URL

```
http://localhost:5000/api
```

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Authentication (`/auth`)

#### POST `/auth/register`
- **Description**: Register a new user
- **Access**: Public
- **Body**: `{ email, password, username, role }`
- **Response**: User data with token

#### POST `/auth/login`
- **Description**: Login user
- **Access**: Public
- **Body**: `{ email, password }`
- **Response**: User data with token

#### POST `/auth/forgot-password`
- **Description**: Send password reset email
- **Access**: Public
- **Body**: `{ email }`
- **Response**: Success message

#### POST `/auth/reset-password`
- **Description**: Reset password with token
- **Access**: Public
- **Body**: `{ token, newPassword }`
- **Response**: Success message

#### POST `/auth/verify-email`
- **Description**: Verify email with OTP
- **Access**: Public
- **Body**: `{ email, token }`
- **Response**: Success message

#### POST `/auth/logout`
- **Description**: Logout user
- **Access**: Private
- **Response**: Success message

#### GET `/auth/me`
- **Description**: Get current user data
- **Access**: Private
- **Response**: User profile data

### Users (`/users`)

#### GET `/users/profile`
- **Description**: Get current user profile
- **Access**: Private
- **Response**: User profile data

#### PUT `/users/profile`
- **Description**: Update current user profile
- **Access**: Private
- **Body**: `{ username, phone, address, city, state, profile_image }`
- **Response**: Updated user profile

#### GET `/users/recyclers`
- **Description**: Get all verified recyclers
- **Access**: Public
- **Response**: List of recycler profiles

#### GET `/users/recyclers/:id`
- **Description**: Get specific recycler details
- **Access**: Public
- **Response**: Recycler profile with details

#### DELETE `/users/account`
- **Description**: Delete current user account
- **Access**: Private
- **Response**: Success message

### Waste Collections (`/waste`)

#### POST `/waste/collections`
- **Description**: Create new waste collection request
- **Access**: Private (Customer only)
- **Body**: `{ waste_type, weight, description, pickup_date, pickup_time, address, special_instructions }`
- **Response**: Created collection data

#### GET `/waste/collections`
- **Description**: Get waste collections for current user
- **Access**: Private
- **Query**: `{ status, page, limit }`
- **Response**: List of collections

#### GET `/waste/collections/:id`
- **Description**: Get specific collection details
- **Access**: Private
- **Response**: Collection details

#### PUT `/waste/collections/:id/accept`
- **Description**: Accept collection request (recycler only)
- **Access**: Private (Recycler only)
- **Response**: Updated collection data

#### PUT `/waste/collections/:id/start`
- **Description**: Start waste collection (recycler only)
- **Access**: Private (Recycler only)
- **Response**: Updated collection data

#### PUT `/waste/collections/:id/complete`
- **Description**: Complete waste collection (recycler only)
- **Access**: Private (Recycler only)
- **Body**: `{ actual_weight, notes }`
- **Response**: Updated collection data

#### PUT `/waste/collections/:id/cancel`
- **Description**: Cancel collection request
- **Access**: Private
- **Response**: Updated collection data

#### GET `/waste/available`
- **Description**: Get available collections for recyclers
- **Access**: Private (Recycler only)
- **Query**: `{ page, limit }`
- **Response**: List of available collections

### Payments (`/payments`)

#### POST `/payments/create`
- **Description**: Create payment for collection
- **Access**: Private (Customer only)
- **Body**: `{ collection_id, amount, payment_method, description }`
- **Response**: Created payment data

#### GET `/payments`
- **Description**: Get payments for current user
- **Access**: Private
- **Query**: `{ status, page, limit }`
- **Response**: List of payments

#### GET `/payments/:id`
- **Description**: Get specific payment details
- **Access**: Private
- **Response**: Payment details

#### PUT `/payments/:id/confirm`
- **Description**: Confirm payment (recycler only)
- **Access**: Private (Recycler only)
- **Response**: Updated payment data

#### PUT `/payments/:id/complete`
- **Description**: Complete payment (recycler only)
- **Access**: Private (Recycler only)
- **Body**: `{ transaction_id, notes }`
- **Response**: Updated payment data

#### PUT `/payments/:id/cancel`
- **Description**: Cancel payment
- **Access**: Private
- **Response**: Updated payment data

#### GET `/payments/summary`
- **Description**: Get payment summary
- **Access**: Private
- **Query**: `{ period }`
- **Response**: Payment summary statistics

### Recyclers (`/recyclers`)

#### POST `/recyclers/profile`
- **Description**: Create/update recycler profile
- **Access**: Private (Recycler only)
- **Body**: `{ business_name, business_license, service_areas, waste_types, vehicle_info, experience_years, hourly_rate, availability_schedule, bio, certifications }`
- **Response**: Recycler profile data

#### GET `/recyclers/profile`
- **Description**: Get current recycler profile
- **Access**: Private (Recycler only)
- **Response**: Recycler profile data

#### GET `/recyclers/search`
- **Description**: Search for recyclers
- **Access**: Public
- **Query**: `{ location, waste_type, rating, availability, page, limit }`
- **Response**: List of matching recyclers

#### GET `/recyclers/:id`
- **Description**: Get specific recycler profile
- **Access**: Public
- **Response**: Recycler profile details

#### PUT `/recyclers/availability`
- **Description**: Update recycler availability
- **Access**: Private (Recycler only)
- **Body**: `{ availability_schedule, is_available }`
- **Response**: Updated profile data

#### POST `/recyclers/reviews`
- **Description**: Add review for recycler
- **Access**: Private (Customer only)
- **Body**: `{ recycler_id, collection_id, rating, comment }`
- **Response**: Created review data

#### GET `/recyclers/:id/reviews`
- **Description**: Get reviews for recycler
- **Access**: Public
- **Query**: `{ page, limit }`
- **Response**: List of reviews

#### GET `/recyclers/stats`
- **Description**: Get recycler statistics
- **Access**: Private (Recycler only)
- **Query**: `{ period }`
- **Response**: Statistics data

### Analytics (`/analytics`)

#### GET `/analytics`
- **Description**: Get complete analytics data
- **Access**: Private (Recycler only)
- **Query**: `{ period }`
- **Response**: Complete analytics data

#### GET `/analytics/performance`
- **Description**: Get performance data only
- **Access**: Private (Recycler only)
- **Query**: `{ period }`
- **Response**: Performance metrics

#### GET `/analytics/environmental-impact`
- **Description**: Get environmental impact data
- **Access**: Private (Recycler only)
- **Query**: `{ period }`
- **Response**: Environmental impact metrics

#### GET `/analytics/summary`
- **Description**: Get analytics summary
- **Access**: Private (Recycler only)
- **Query**: `{ period }`
- **Response**: Summary statistics

## Data Models

### User
```typescript
interface User {
  id: string;
  email: string;
  username: string;
  phone?: string;
  role: 'customer' | 'recycler' | 'admin';
  email_verified: boolean;
  profile_image?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  created_at: string;
  updated_at: string;
}
```

### Waste Collection
```typescript
interface WasteCollection {
  id: string;
  customer_id: string;
  recycler_id?: string;
  waste_type: string;
  weight: number;
  description?: string;
  pickup_date: string;
  pickup_time: string;
  address: string;
  special_instructions?: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  actual_weight?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  accepted_at?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
}
```

### Payment
```typescript
interface Payment {
  id: string;
  customer_id: string;
  recycler_id: string;
  collection_id: string;
  amount: number;
  payment_method: string;
  description?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  transaction_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  completed_at?: string;
  cancelled_at?: string;
}
```

### Recycler Profile
```typescript
interface RecyclerProfile {
  id: string;
  recycler_id: string;
  business_name: string;
  business_license?: string;
  service_areas: string[];
  waste_types: string[];
  vehicle_info?: string;
  experience_years: number;
  hourly_rate: number;
  availability_schedule: object;
  bio?: string;
  certifications?: string[];
  average_rating: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}
```

### Analytics Data
```typescript
interface AnalyticsData {
  performance: RecyclerPerformance;
  environmentalImpact: EnvironmentalImpact;
  period: 'week' | 'month' | 'year';
}

interface RecyclerPerformance {
  totalPickups: number;
  totalEarnings: number;
  averagePickupValue: number;
  efficiency: number;
  dailyPerformance: DailyPerformance[];
}

interface EnvironmentalImpact {
  wasteDiverted: number;
  co2Reduced: number;
  treesEquivalent: number;
  landfillSpaceSaved: number;
  energySaved: number;
}
```

## Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": "Error message"
}
```

### Common HTTP Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **429**: Too Many Requests
- **500**: Internal Server Error

## Rate Limiting

All endpoints are subject to rate limiting:
- **Limit**: 100 requests per 15 minutes per IP
- **Response**: 429 Too Many Requests

## Security Features

1. **JWT Authentication**: Secure token-based authentication
2. **Role-based Access Control**: Different endpoints for customers and recyclers
3. **Input Validation**: All inputs are validated and sanitized
4. **CORS Protection**: Configured for frontend domain
5. **Rate Limiting**: Prevents abuse
6. **Helmet Security**: HTTP headers protection
7. **SQL Injection Protection**: Using Supabase ORM

## Environment Variables

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

## Testing

### Health Check
```bash
curl http://localhost:5000/health
```

### Authentication Test
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Analytics Test (with token)
```bash
curl -X GET "http://localhost:5000/api/analytics?period=week" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Notes

1. **TypeScript**: All endpoints are written in TypeScript for type safety
2. **Supabase Integration**: Uses Supabase for database and authentication
3. **Real-time Data**: All calculations are based on actual database records
4. **Scalable Architecture**: Modular design with separate routes and services
5. **Comprehensive Logging**: All operations are logged for debugging
6. **Error Handling**: Graceful error handling with meaningful messages 