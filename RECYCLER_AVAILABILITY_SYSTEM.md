# Recycler Availability System

## Overview
The Recycler Availability System allows recyclers to control their discoverability by customers. When a recycler goes "offline", they become hidden from customer searches and won't receive new pickup requests. When they go "online", they become discoverable and can receive requests.

## How It Works

### 1. Recycler Side (Availability Control)

#### Frontend Implementation
- **Location**: `app/(recycler-tabs)/index.tsx`
- **Toggle Button**: Recyclers can toggle between Online/Offline status
- **Visual Indicator**: Shows current status with a colored dot and toggle switch
- **Real-time Updates**: Status changes are immediately reflected in the UI

#### Backend Integration
- **API Endpoint**: `PUT /api/recyclers/availability`
- **Controller**: `RecyclersController.updateAvailability()`
- **Database Update**: Updates `is_available` field in `recycler_profiles` table

#### Key Features
- **Persistent State**: Availability status is saved to database
- **Error Handling**: Graceful fallback if API calls fail
- **User Feedback**: Clear alerts confirm status changes
- **Verification Check**: Only verified recyclers can change availability

### 2. Customer Side (Discovery)

#### Frontend Implementation
- **Location**: `app/(tabs)/index.tsx`
- **Filtered Results**: Only shows available recyclers
- **Real-time Data**: Loads recycler data from backend API
- **Fallback**: Uses mock data if API fails

#### Backend Integration
- **API Endpoint**: `GET /api/optimized-users/recyclers`
- **Controller**: `OptimizedUsersController.getRecyclers()`
- **Database Query**: Filters by `is_available = true`

#### Key Features
- **Availability Filter**: Automatically excludes offline recyclers
- **Search Integration**: Search results respect availability status
- **Caching**: Optimized queries with database caching
- **Pagination**: Efficient loading of large recycler lists

### 3. Database Schema

#### Key Fields
```sql
-- recycler_profiles table
is_available BOOLEAN DEFAULT TRUE,           -- Controls discoverability
availability_schedule JSONB,                 -- Weekly schedule (future enhancement)
```

#### Indexes
```sql
-- Optimized for availability queries
CREATE INDEX idx_recycler_profiles_is_available ON recycler_profiles(is_available);
```

### 4. API Endpoints

#### Update Availability
```
PUT /api/recyclers/availability
Body: {
  "is_available": boolean,
  "availability_schedule": object
}
```

#### Get Available Recyclers
```
GET /api/optimized-users/recyclers?page=1&limit=10&search=query
Response: Only recyclers with is_available = true
```

### 5. Security & Validation

#### Authentication
- Recyclers must be authenticated to change availability
- Only verified recyclers can toggle status
- Role-based access control enforced

#### Data Validation
- Availability status must be boolean
- Schedule data validated before database update
- Error handling for invalid requests

### 6. User Experience Flow

#### Recycler Going Online
1. Recycler opens app and sees "Offline" status
2. Taps toggle button to go online
3. Backend updates database
4. UI shows "Online" status with green indicator
5. Recycler becomes discoverable to customers

#### Recycler Going Offline
1. Recycler sees "Online" status
2. Taps toggle button to go offline
3. Backend updates database
4. UI shows "Offline" status with red indicator
5. Recycler becomes hidden from customer searches

#### Customer Discovery
1. Customer opens app and sees nearby recyclers
2. Only available (online) recyclers are displayed
3. Customer can search and filter recyclers
4. Offline recyclers are automatically excluded

### 7. Technical Implementation Details

#### State Management
- Local state for immediate UI updates
- Backend synchronization for persistence
- Error handling with user feedback

#### Caching Strategy
- Database queries cached for performance
- Cache invalidation on availability changes
- Optimized for real-time updates

#### Error Handling
- Network failure fallbacks
- Database error recovery
- User-friendly error messages

### 8. Future Enhancements

#### Advanced Scheduling
- Day-of-week availability
- Time-based availability windows
- Holiday and vacation scheduling

#### Real-time Updates
- WebSocket integration for instant status changes
- Push notifications for availability updates
- Live location tracking

#### Analytics
- Availability patterns analysis
- Peak hours identification
- Revenue impact of availability

## Testing

Run the test script to verify system functionality:
```bash
node test-availability-system.js
```

## Troubleshooting

### Common Issues
1. **Status not updating**: Check authentication and verification status
2. **Recyclers not appearing**: Verify `is_available` field in database
3. **API errors**: Check network connectivity and backend logs

### Debug Steps
1. Verify recycler verification status
2. Check database `is_available` field
3. Review API endpoint responses
4. Monitor frontend console for errors

## Conclusion

The Recycler Availability System provides a robust foundation for controlling recycler discoverability. It ensures that customers only see available recyclers while giving recyclers full control over their availability status. The system is designed with performance, security, and user experience in mind.
