# Admin Online Recyclers Management Setup

This guide explains how to set up and use the admin functionality to monitor and manage online recyclers.

## 🚀 **What's Included**

### **1. Database Functions** (`admin_online_recyclers_management.sql`)
- ✅ **`admin_get_all_recyclers_status()`** - Get all recyclers with their online status
- ✅ **`admin_get_online_recyclers_summary()`** - Get summary statistics
- ✅ **`admin_force_recycler_offline()`** - Force a recycler offline
- ✅ **`admin_get_recycler_activity_log()`** - Get activity log for specified hours
- ✅ **`admin_recyclers_monitoring` view** - Easy monitoring view

### **2. React Hook** (`hooks/useAdminRecyclerMonitoring.ts`)
- ✅ **Real-time monitoring** of all recyclers
- ✅ **Summary statistics** (online, available, busy, offline counts)
- ✅ **Force offline functionality**
- ✅ **Activity log retrieval**
- ✅ **Filtering and helper functions**

### **3. Admin Screen** (`app/admin-screens/OnlineRecyclersScreen.tsx`)
- ✅ **Real-time dashboard** showing all recyclers
- ✅ **Status filtering** (All, Available, Busy, Offline, Inactive, Unverified)
- ✅ **Summary cards** with key metrics
- ✅ **Force offline buttons** for online recyclers
- ✅ **Pull-to-refresh** functionality
- ✅ **Detailed recycler information**

## 📋 **Setup Instructions**

### **Step 1: Run the SQL Script**
```sql
-- Run this in your Supabase SQL Editor
\i admin_online_recyclers_management.sql
```

### **Step 2: Update Admin Navigation**
Add the new screen to your admin navigation:

```typescript
// In your admin navigation file
import OnlineRecyclersScreen from './OnlineRecyclersScreen';

// Add to your navigation stack
<Stack.Screen 
  name="OnlineRecyclers" 
  component={OnlineRecyclersScreen} 
  options={{ title: 'Online Recyclers' }}
/>
```

### **Step 3: Add Navigation Button**
Add a button to navigate to the online recyclers screen:

```typescript
<TouchableOpacity 
  style={styles.adminButton}
  onPress={() => router.push('/admin-screens/OnlineRecyclers')}
>
  <MaterialIcons name="people" size={24} color={COLORS.white} />
  <Text style={styles.adminButtonText}>Online Recyclers</Text>
</TouchableOpacity>
```

## 🎯 **Admin Features**

### **Real-time Monitoring**
- **Live updates** when recycler status changes
- **Status categories**: Available, Busy, Offline, Inactive, Unverified
- **Connection status**: Active, Online, Offline based on heartbeat

### **Summary Dashboard**
- **Total recyclers** count
- **Online recyclers** (active in last 5 minutes)
- **Available recyclers** (online and available)
- **Busy recyclers** (online but not available)
- **Offline recyclers** (not online)
- **Inactive recyclers** (online but no recent heartbeat)
- **Unverified recyclers** (not approved)

### **Management Actions**
- **Force offline** - Admin can force any online recycler offline
- **View details** - See recycler information, rating, verification status
- **Activity monitoring** - Track when recyclers go online/offline
- **Filter by status** - Quickly find recyclers by their current status

### **Recycler Information Displayed**
- **Name and contact** information
- **Truck size** and **rating**
- **Verification status** (approved/pending/rejected)
- **Last seen** timestamp
- **Current status** with color-coded indicators
- **Session information** for debugging

## 🔧 **Admin Permissions**

### **Current Setup**
The SQL script includes basic RLS policies that allow all authenticated users to access admin functions. **You should update these based on your admin authentication system:**

```sql
-- Update these policies in the SQL script based on your admin system
CREATE POLICY "Admins can read all recycler data" ON recyclers
  FOR SELECT USING (
    -- Example: Check if user is admin
    auth.uid() IN (SELECT user_id FROM admin_users)
    -- Or: auth.jwt() ->> 'role' = 'admin'
  );
```

### **Admin Authentication Options**
1. **Admin users table** - Create a separate `admin_users` table
2. **JWT role claims** - Use Supabase JWT with role claims
3. **User metadata** - Store admin status in user metadata
4. **Email-based** - Check if user email is in admin list

## 📊 **Usage Examples**

### **View All Online Recyclers**
```typescript
const { recyclers, summary } = useAdminRecyclerMonitoring();
const onlineRecyclers = recyclers.filter(r => r.isOnline);
```

### **Get Summary Statistics**
```typescript
const { summary } = useAdminRecyclerMonitoring();
console.log(`Available recyclers: ${summary?.availableRecyclers}`);
```

### **Force Recycler Offline**
```typescript
const { forceRecyclerOffline } = useAdminRecyclerMonitoring();
await forceRecyclerOffline(recyclerId);
```

### **Get Activity Log**
```typescript
const { getActivityLog } = useAdminRecyclerMonitoring();
const activity = await getActivityLog(24); // Last 24 hours
```

## 🎨 **UI Features**

### **Status Indicators**
- 🟢 **Available** - Green, ready to receive requests
- 🟠 **Busy** - Orange, online but not available
- ⚫ **Offline** - Gray, not online
- 🔴 **Inactive** - Red, online but no recent heartbeat
- 🟣 **Unverified** - Purple, not approved yet

### **Interactive Elements**
- **Filter buttons** with counts for each status
- **Force offline buttons** for online recyclers
- **Pull-to-refresh** for manual updates
- **Real-time updates** without manual refresh

## 🔍 **Monitoring Queries**

### **Check Current Status**
```sql
SELECT * FROM admin_recyclers_monitoring 
WHERE status_category = 'Available';
```

### **Get Summary**
```sql
SELECT * FROM admin_get_online_recyclers_summary();
```

### **View Activity Log**
```sql
SELECT * FROM admin_get_recycler_activity_log(24);
```

## 🚨 **Important Notes**

1. **Admin Permissions** - Update RLS policies based on your admin system
2. **Real-time Updates** - The system uses Supabase real-time subscriptions
3. **Performance** - Large numbers of recyclers may require pagination
4. **Security** - Admin functions should be properly secured
5. **Logging** - All admin actions are logged in `admin_notifications`

The admin system is now ready to use! You can monitor all recyclers in real-time and manage their online status as needed.
