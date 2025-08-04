# Frontend Integration API Documentation

## Overview

This document provides API endpoints for all frontend screens that require backend integration. Each screen is mapped to its corresponding API endpoints with examples.

## Screen-Specific API Endpoints

### 1. CallRecyclerScreen.tsx

**Purpose**: Display recycler contact information and allow calling

#### Endpoints:
- `GET /api/recyclers/:id/contact` - Get recycler contact details
- `GET /api/recyclers/:id/stats` - Get recycler statistics

#### Example Usage:
```typescript
// Get recycler contact info
const fetchRecyclerContact = async (recyclerId: string) => {
  const response = await fetch(`/api/recyclers/${recyclerId}/contact`);
  const data = await response.json();
  return data.data; // Returns: { recyclerId, name, phone, profileImage, businessName, rating, truckType, rate, pastPickups, experienceYears }
};

// Get recycler stats
const fetchRecyclerStats = async (recyclerId: string) => {
  const response = await fetch(`/api/recyclers/${recyclerId}/stats`);
  const data = await response.json();
  return data.data; // Returns: { totalCollections, completedCollections, totalEarnings, averageRating, totalReviews, efficiency }
};
```

### 2. NotificationScreen.tsx

**Purpose**: Display and manage user notifications

#### Endpoints:
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read
- `DELETE /api/notifications/:id` - Delete notification
- `GET /api/notifications/unread-count` - Get unread count

#### Example Usage:
```typescript
// Get notifications
const fetchNotifications = async () => {
  const response = await fetch('/api/notifications?page=1&limit=20');
  const data = await response.json();
  return data.data;
};

// Mark as read
const markAsRead = async (notificationId: string) => {
  await fetch(`/api/notifications/${notificationId}/read`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` }
  });
};

// Get unread count
const getUnreadCount = async () => {
  const response = await fetch('/api/notifications/unread-count');
  const data = await response.json();
  return data.data.unreadCount;
};
```

### 3. Rewards.tsx

**Purpose**: Display rewards, achievements, and leaderboard

#### Endpoints:
- `GET /api/rewards` - Get user's claimed rewards
- `GET /api/rewards/available` - Get available rewards to claim
- `POST /api/rewards/claim` - Claim a reward
- `GET /api/rewards/leaderboard` - Get rewards leaderboard
- `GET /api/rewards/stats` - Get user rewards statistics

#### Example Usage:
```typescript
// Get available rewards
const fetchAvailableRewards = async () => {
  const response = await fetch('/api/rewards/available');
  const data = await response.json();
  return data.data; // Returns: { availableRewards, totalWasteCollected, totalPoints }
};

// Claim reward
const claimReward = async (rewardId: string, title: string, points: number) => {
  const response = await fetch('/api/rewards/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reward_id: rewardId, reward_title: title, points })
  });
  return response.json();
};

// Get leaderboard
const fetchLeaderboard = async () => {
  const response = await fetch('/api/rewards/leaderboard?limit=10');
  const data = await response.json();
  return data.data;
};
```

### 4. history.tsx & HistoryDetail.tsx

**Purpose**: Display waste collection history and details

#### Endpoints:
- `GET /api/history` - Get user's collection history
- `GET /api/history/:id` - Get specific collection details
- `GET /api/history/stats` - Get history statistics
- `GET /api/history/export` - Export history data
- `GET /api/history/filter` - Get filtered history

#### Example Usage:
```typescript
// Get history
const fetchHistory = async (page = 1, status?: string) => {
  const params = new URLSearchParams({ page: page.toString() });
  if (status) params.append('status', status);
  
  const response = await fetch(`/api/history?${params}`);
  const data = await response.json();
  return data.data;
};

// Get collection details
const fetchCollectionDetails = async (collectionId: string) => {
  const response = await fetch(`/api/history/${collectionId}`);
  const data = await response.json();
  return data.data;
};

// Export history
const exportHistory = async () => {
  const response = await fetch('/api/history/export?format=csv');
  const blob = await response.blob();
  // Handle file download
};
```

### 5. AnalyticsScreen.tsx

**Purpose**: Display recycler analytics and performance data

#### Endpoints:
- `GET /api/analytics` - Get complete analytics data
- `GET /api/analytics/performance` - Get performance metrics only
- `GET /api/analytics/environmental-impact` - Get environmental impact
- `GET /api/analytics/summary` - Get analytics summary

#### Example Usage:
```typescript
// Get analytics data
const fetchAnalytics = async (period: 'week' | 'month' | 'year' = 'week') => {
  const response = await fetch(`/api/analytics?period=${period}`);
  const data = await response.json();
  return data.data; // Returns: { performance, environmentalImpact, period }
};

// Get performance only
const fetchPerformance = async (period: 'week' | 'month' | 'year' = 'week') => {
  const response = await fetch(`/api/analytics/performance?period=${period}`);
  const data = await response.json();
  return data.data;
};
```

### 6. EarningsScreen.tsx

**Purpose**: Display recycler earnings and financial data

#### Endpoints:
- `GET /api/analytics` - Get earnings data (part of analytics)
- `GET /api/payments/summary` - Get payment summary
- `GET /api/recyclers/stats` - Get recycler statistics

#### Example Usage:
```typescript
// Get earnings data
const fetchEarnings = async (period: 'week' | 'month' | 'year' = 'week') => {
  const response = await fetch(`/api/analytics?period=${period}`);
  const data = await response.json();
  return data.data.performance; // Returns earnings data
};

// Get payment summary
const fetchPaymentSummary = async (period: 'week' | 'month' | 'year' = 'month') => {
  const response = await fetch(`/api/payments/summary?period=${period}`);
  const data = await response.json();
  return data.data;
};
```

### 7. RecyclerRequests.tsx

**Purpose**: Display and manage recycler requests

#### Endpoints:
- `GET /api/waste/available` - Get available collections
- `GET /api/waste/collections` - Get recycler's collections
- `PUT /api/waste/collections/:id/accept` - Accept collection
- `PUT /api/waste/collections/:id/start` - Start collection
- `PUT /api/waste/collections/:id/complete` - Complete collection

#### Example Usage:
```typescript
// Get available requests
const fetchAvailableRequests = async () => {
  const response = await fetch('/api/waste/available');
  const data = await response.json();
  return data.data;
};

// Accept request
const acceptRequest = async (collectionId: string) => {
  const response = await fetch(`/api/waste/collections/${collectionId}/accept`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

### 8. TrackingScreen.tsx

**Purpose**: Track collection progress

#### Endpoints:
- `GET /api/waste/collections/:id` - Get collection details
- `GET /api/waste/collections` - Get user's collections

#### Example Usage:
```typescript
// Get collection tracking info
const fetchCollectionTracking = async (collectionId: string) => {
  const response = await fetch(`/api/waste/collections/${collectionId}`);
  const data = await response.json();
  return data.data;
};
```

### 9. PaymentSummary.tsx & PaymentMade.tsx

**Purpose**: Display payment information and confirmations

#### Endpoints:
- `GET /api/payments/:id` - Get payment details
- `GET /api/payments` - Get user's payments
- `PUT /api/payments/:id/confirm` - Confirm payment
- `PUT /api/payments/:id/complete` - Complete payment

#### Example Usage:
```typescript
// Get payment details
const fetchPaymentDetails = async (paymentId: string) => {
  const response = await fetch(`/api/payments/${paymentId}`);
  const data = await response.json();
  return data.data;
};

// Confirm payment
const confirmPayment = async (paymentId: string) => {
  const response = await fetch(`/api/payments/${paymentId}/confirm`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

### 10. EditProfileScreen.tsx

**Purpose**: Edit user profile information

#### Endpoints:
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile

#### Example Usage:
```typescript
// Get user profile
const fetchUserProfile = async () => {
  const response = await fetch('/api/users/profile');
  const data = await response.json();
  return data.data;
};

// Update profile
const updateProfile = async (profileData: any) => {
  const response = await fetch('/api/users/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData)
  });
  return response.json();
};
```

## Common API Patterns

### Authentication
All private endpoints require the JWT token in the Authorization header:
```typescript
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

### Error Handling
```typescript
const handleApiCall = async (apiCall: () => Promise<any>) => {
  try {
    const response = await apiCall();
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.error);
    }
  } catch (error) {
    console.error('API Error:', error);
    // Handle error appropriately
  }
};
```

### Pagination
Most list endpoints support pagination:
```typescript
const fetchPaginatedData = async (page = 1, limit = 10) => {
  const response = await fetch(`/api/endpoint?page=${page}&limit=${limit}`);
  return response.json();
};
```

## Data Models

### Recycler Contact Data
```typescript
interface RecyclerContact {
  recyclerId: string;
  name: string;
  phone: string;
  profileImage?: string;
  businessName?: string;
  rating: number;
  truckType: string;
  rate: string;
  pastPickups: number;
  experienceYears: number;
}
```

### Notification Data
```typescript
interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
  read_at?: string;
}
```

### Reward Data
```typescript
interface Reward {
  id: string;
  user_id: string;
  reward_id: string;
  title: string;
  points: number;
  claimed_at: string;
}
```

### History Data
```typescript
interface CollectionHistory {
  id: string;
  customer_id: string;
  recycler_id?: string;
  waste_type: string;
  weight: number;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  pickup_date: string;
  pickup_time: string;
  address: string;
  created_at: string;
  completed_at?: string;
  customers?: { username: string; phone: string; address: string };
  recyclers?: { username: string; phone: string };
}
```

## Integration Checklist

For each frontend screen, ensure:

1. ✅ **API endpoints are implemented** in the backend
2. ✅ **Authentication is properly handled** with JWT tokens
3. ✅ **Error handling is implemented** for API failures
4. ✅ **Loading states are managed** during API calls
5. ✅ **Data validation** is performed on both client and server
6. ✅ **Real-time updates** are handled where necessary
7. ✅ **Offline support** is considered for critical features
8. ✅ **Security measures** are in place (CORS, rate limiting, etc.)

## Testing

Test each endpoint with:
```bash
# Example: Test recycler contact endpoint
curl -X GET "http://localhost:5000/api/recyclers/123/contact" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Example: Test notifications endpoint
curl -X GET "http://localhost:5000/api/notifications" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

This comprehensive API documentation ensures all frontend screens have the necessary backend support for full functionality. 