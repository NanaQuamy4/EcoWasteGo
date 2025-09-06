import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { isAdminUser } from '../../lib/adminConfig';
import { supabase } from '../../lib/supabase';

interface AnalyticsData {
  totalUsers: number;
  totalCustomers: number;
  totalRecyclers: number;
  verifiedRecyclers: number;
  pendingVerifications: number;
  approvedVerifications: number;
  rejectedVerifications: number;
  newUsersThisMonth: number;
  growthRate: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
  recyclerLeaderboard: Array<{
    id: string;
    name: string;
    email: string;
    totalPickups: number;
    totalEarnings: number;
    totalEcoPoints: number;
    averageRating: number;
    rank: number;
  }>;
  customerLeaderboard: Array<{
    id: string;
    name: string;
    email: string;
    totalPickups: number;
    totalWasteRecycled: number;
    totalCo2Saved: number;
    totalPoints: number;
    rank: number;
  }>;
  regionalAnalytics: Array<{
    region: string;
    totalRequests: number;
    completedRequests: number;
    totalWasteRecycled: number;
    averageRating: number;
    topWasteTypes: Array<{
      type: string;
      count: number;
    }>;
    rank: number;
  }>;
}

export default function AdminAnalyticsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalUsers: 0,
    totalCustomers: 0,
    totalRecyclers: 0,
    verifiedRecyclers: 0,
    pendingVerifications: 0,
    approvedVerifications: 0,
    rejectedVerifications: 0,
    newUsersThisMonth: 0,
    growthRate: 0,
    recentActivity: [],
    recyclerLeaderboard: [],
    customerLeaderboard: [],
    regionalAnalytics: []
  });

  useEffect(() => {
    checkAdminAccess();
    fetchAnalyticsData();
  }, []);

  const fetchRecyclerLeaderboard = async () => {
    try {
      // Use the rating leaderboard function for better data
      const { data: ratingLeaderboard, error: ratingError } = await supabase
        .rpc('get_recycler_rating_leaderboard');

      if (ratingError) {
        console.error('Error fetching rating leaderboard:', ratingError);
        // Fallback to earnings-based leaderboard
        return await fetchEarningsBasedLeaderboard();
      }

      // Transform rating leaderboard data
      const leaderboard = ratingLeaderboard?.map((item: any, index: number) => ({
        id: item.recycler_id,
        name: item.recycler_name,
        email: '', // Not available in rating function
        totalPickups: item.total_ratings,
        totalEarnings: 0, // Not available in rating function
        totalEcoPoints: 0, // Not available in rating function
        averageRating: parseFloat(item.average_rating.toString()),
        rank: item.rank
      })) || [];

      return leaderboard;
    } catch (error) {
      console.error('Error fetching recycler leaderboard:', error);
      return [];
    }
  };

  const fetchEarningsBasedLeaderboard = async () => {
    try {
      // Fetch recycler earnings data with user info
      const { data: earningsData, error: earningsError } = await supabase
        .from('recycler_earnings')
        .select(`
          recycler_id,
          total_amount,
          recycler_earnings,
          eco_points_earned,
          completed_at
        `)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (earningsError) {
        console.error('Error fetching recycler earnings:', earningsError);
        return [];
      }

      // Fetch recycler details
      const { data: recyclersData, error: recyclersError } = await supabase
        .from('recyclers')
        .select('id, full_name, email')
        .in('id', earningsData?.map(e => e.recycler_id) || []);

      if (recyclersError) {
        console.error('Error fetching recyclers:', recyclersError);
        return [];
      }

      // Calculate leaderboard data
      const recyclerStats = new Map();
      
      earningsData?.forEach(earning => {
        const recyclerId = earning.recycler_id;
        if (!recyclerStats.has(recyclerId)) {
          recyclerStats.set(recyclerId, {
            id: recyclerId,
            totalPickups: 0,
            totalEarnings: 0,
            totalEcoPoints: 0
          });
        }
        
        const stats = recyclerStats.get(recyclerId);
        stats.totalPickups += 1;
        stats.totalEarnings += earning.recycler_earnings || 0;
        stats.totalEcoPoints += earning.eco_points_earned || 0;
      });

      // Create leaderboard array
      const leaderboard = Array.from(recyclerStats.values())
        .map(stats => {
          const recycler = recyclersData?.find(r => r.id === stats.id);
          return {
            ...stats,
            name: recycler?.full_name || 'Unknown',
            email: recycler?.email || '',
            averageRating: 4.5 // Mock rating for now
          };
        })
        .sort((a, b) => b.totalEcoPoints - a.totalEcoPoints) // Sort by eco points
        .slice(0, 10) // Top 10
        .map((item, index) => ({
          ...item,
          rank: index + 1
        }));

      return leaderboard;
    } catch (error) {
      console.error('Error fetching earnings-based leaderboard:', error);
      return [];
    }
  };

  const fetchCustomerLeaderboard = async () => {
    try {
      // Fetch pickup requests data
      const { data: pickupData, error: pickupError } = await supabase
        .from('pickup_requests')
        .select(`
          customer_id,
          estimated_weight,
          status,
          final_price,
          created_at
        `)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (pickupError) {
        console.error('Error fetching pickup data:', pickupError);
        return [];
      }

      // Fetch customer details
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, full_name, email')
        .in('id', pickupData?.map(p => p.customer_id) || []);

      if (customersError) {
        console.error('Error fetching customers:', customersError);
        return [];
      }

      // Calculate customer stats
      const customerStats = new Map();
      
      pickupData?.forEach(pickup => {
        const customerId = pickup.customer_id;
        if (!customerStats.has(customerId)) {
          customerStats.set(customerId, {
            id: customerId,
            totalPickups: 0,
            totalWasteRecycled: 0,
            totalCo2Saved: 0,
            totalPoints: 0
          });
        }
        
        const stats = customerStats.get(customerId);
        stats.totalPickups += 1;
        
        const weight = parseFloat(pickup.estimated_weight?.toString() || '0');
        stats.totalWasteRecycled += weight;
        stats.totalCo2Saved += weight * 0.5; // 0.5 kg CO2 saved per kg of waste
        stats.totalPoints += Math.floor(weight * 10); // 10 points per kg
      });

      // Create leaderboard array
      const leaderboard = Array.from(customerStats.values())
        .map(stats => {
          const customer = customersData?.find(c => c.id === stats.id);
          return {
            ...stats,
            name: customer?.full_name || 'Unknown',
            email: customer?.email || ''
          };
        })
        .sort((a, b) => b.totalWasteRecycled - a.totalWasteRecycled) // Sort by waste recycled
        .slice(0, 10) // Top 10
        .map((item, index) => ({
          ...item,
          rank: index + 1
        }));

      return leaderboard;
    } catch (error) {
      console.error('Error fetching customer leaderboard:', error);
      return [];
    }
  };

  const fetchRegionalAnalytics = async () => {
    try {
      // Fetch pickup requests data with location information
      const { data: pickupData, error: pickupError } = await supabase
        .from('pickup_requests')
        .select(`
          pickup_address,
          estimated_weight,
          waste_type,
          status,
          customer_rating,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (pickupError) {
        console.error('Error fetching pickup data for regional analytics:', pickupError);
        return [];
      }

      // Extract regions from addresses
      const extractRegion = (address: string): string => {
        if (!address) return 'Unknown';
        
        // Common Ghana regions and areas
        const regions = [
          'Greater Accra', 'Ashanti', 'Western', 'Central', 'Volta', 'Eastern',
          'Northern', 'Upper East', 'Upper West', 'Brong-Ahafo', 'Western North',
          'Ahafo', 'Bono', 'Bono East', 'Oti', 'Savannah', 'North East'
        ];
        
        const addressLower = address.toLowerCase();
        
        // Check for specific regions
        for (const region of regions) {
          if (addressLower.includes(region.toLowerCase())) {
            return region;
          }
        }
        
        // Check for major cities that can indicate regions
        if (addressLower.includes('accra') || addressLower.includes('tema')) {
          return 'Greater Accra';
        }
        if (addressLower.includes('kumasi') || addressLower.includes('obuasi')) {
          return 'Ashanti';
        }
        if (addressLower.includes('takoradi') || addressLower.includes('sekondi')) {
          return 'Western';
        }
        if (addressLower.includes('cape coast') || addressLower.includes('kasoa')) {
          return 'Central';
        }
        if (addressLower.includes('ho') || addressLower.includes('keta')) {
          return 'Volta';
        }
        if (addressLower.includes('koforidua') || addressLower.includes('akim')) {
          return 'Eastern';
        }
        if (addressLower.includes('tamale') || addressLower.includes('yendi')) {
          return 'Northern';
        }
        if (addressLower.includes('bolgatanga') || addressLower.includes('navrongo')) {
          return 'Upper East';
        }
        if (addressLower.includes('wa') || addressLower.includes('lawra')) {
          return 'Upper West';
        }
        if (addressLower.includes('sunyani') || addressLower.includes('techiman')) {
          return 'Bono';
        }
        
        // If no specific region found, try to extract from common patterns
        const parts = address.split(',').map(part => part.trim());
        if (parts.length > 1) {
          const lastPart = parts[parts.length - 1].toLowerCase();
          if (lastPart.includes('region') || lastPart.includes('district')) {
            return parts[parts.length - 1];
          }
        }
        
        return 'Other';
      };

      // Calculate regional stats
      const regionalStats = new Map<string, {
        region: string;
        totalRequests: number;
        completedRequests: number;
        totalWasteRecycled: number;
        totalRating: number;
        ratingCount: number;
        wasteTypeCounts: Map<string, number>;
      }>();
      
      pickupData?.forEach(pickup => {
        const region = extractRegion(pickup.pickup_address);
        
        if (!regionalStats.has(region)) {
          regionalStats.set(region, {
            region,
            totalRequests: 0,
            completedRequests: 0,
            totalWasteRecycled: 0,
            totalRating: 0,
            ratingCount: 0,
            wasteTypeCounts: new Map()
          });
        }
        
        const stats = regionalStats.get(region);
        if (stats) {
          stats.totalRequests += 1;
          
          if (pickup.status === 'completed') {
            stats.completedRequests += 1;
            
            const weight = parseFloat(pickup.estimated_weight?.toString() || '0');
            stats.totalWasteRecycled += weight;
            
            if (pickup.customer_rating) {
              stats.totalRating += pickup.customer_rating;
              stats.ratingCount += 1;
            }
            
            // Count waste types
            const wasteType = pickup.waste_type || 'general';
            stats.wasteTypeCounts.set(wasteType, (stats.wasteTypeCounts.get(wasteType) || 0) + 1);
          }
        }
      });

      // Create regional analytics array
      const regionalAnalytics = Array.from(regionalStats.values())
        .map(stats => {
          const averageRating = stats.ratingCount > 0 ? stats.totalRating / stats.ratingCount : 0;
          
          // Get top 3 waste types
          const topWasteTypes = Array.from(stats.wasteTypeCounts.entries())
            .sort((a, b) => (b[1] as number) - (a[1] as number))
            .slice(0, 3)
            .map(([type, count]) => ({ type: type as string, count: count as number }));
          
          return {
            region: stats.region,
            totalRequests: stats.totalRequests,
            completedRequests: stats.completedRequests,
            totalWasteRecycled: Math.round(stats.totalWasteRecycled * 10) / 10, // Round to 1 decimal
            averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
            topWasteTypes: topWasteTypes as Array<{ type: string; count: number }>
          };
        })
        .sort((a, b) => b.totalRequests - a.totalRequests) // Sort by total requests
        .slice(0, 10) // Top 10 regions
        .map((item, index) => ({
          ...item,
          rank: index + 1
        }));

      return regionalAnalytics;
    } catch (error) {
      console.error('Error fetching regional analytics:', error);
      return [];
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const activities: Array<{
        id: string;
        type: string;
        description: string;
        timestamp: string;
      }> = [];
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get recent user registrations
      const [recentCustomers, recentRecyclers, recentPickupRequests, recentHelpMessages] = await Promise.all([
        supabase
          .from('customers')
          .select('id, full_name, email, created_at')
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('recyclers')
          .select('id, full_name, email, created_at')
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('pickup_requests')
          .select('id, status, created_at, updated_at')
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('help_messages')
          .select('id, user_name, user_role, subject, created_at')
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      // Add customer registrations
      if (recentCustomers.data) {
        recentCustomers.data.forEach(customer => {
          if (!isAdminUser(customer.email)) {
            activities.push({
              id: `customer_${customer.id}`,
              type: 'user_registration',
              description: `New customer registered: ${customer.full_name}`,
              timestamp: customer.created_at
            });
          }
        });
      }

      // Add recycler registrations
      if (recentRecyclers.data) {
        recentRecyclers.data.forEach(recycler => {
          if (!isAdminUser(recycler.email)) {
            activities.push({
              id: `recycler_${recycler.id}`,
              type: 'user_registration',
              description: `New recycler registered: ${recycler.full_name}`,
              timestamp: recycler.created_at
            });
          }
        });
      }

      // Add pickup request activities
      if (recentPickupRequests.data) {
        recentPickupRequests.data.forEach(request => {
          activities.push({
            id: `pickup_${request.id}`,
            type: 'pickup_request',
            description: `New pickup request created (Status: ${request.status})`,
            timestamp: request.created_at
          });
        });
      }

      // Add help message activities
      if (recentHelpMessages.data) {
        recentHelpMessages.data.forEach(message => {
          activities.push({
            id: `help_${message.id}`,
            type: 'help_message',
            description: `Help message from ${message.user_name} (${message.user_role}): ${message.subject}`,
            timestamp: message.created_at
          });
        });
      }

      // Sort by timestamp (most recent first) and limit to 10
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      // Fetch users data directly, excluding admin users
      const [customersResult, recyclersResult] = await Promise.all([
        supabase.from('customers').select('id, email, created_at'),
        supabase.from('recyclers').select('id, email, created_at, verification_status')
      ]);

      if (customersResult.error || recyclersResult.error) {
        console.error('Error fetching users:', customersResult.error || recyclersResult.error);
        return;
      }

      // Filter out admin users
      const nonAdminCustomers = customersResult.data?.filter(c => !isAdminUser(c.email)) || [];
      const nonAdminRecyclers = recyclersResult.data?.filter(r => !isAdminUser(r.email)) || [];

      // Remove duplicates (in case user exists in both tables)
      const allEmails = new Set<string>();
      const uniqueUsers: Array<{ id: string; email: string; created_at: string; verification_status?: string }> = [];
      
      // Add all recyclers first
      nonAdminRecyclers.forEach(recycler => {
        if (!allEmails.has(recycler.email)) {
          allEmails.add(recycler.email);
          uniqueUsers.push(recycler);
        }
      });
      
      // Add customers only if they don't already exist
      nonAdminCustomers.forEach(customer => {
        if (!allEmails.has(customer.email)) {
          allEmails.add(customer.email);
          uniqueUsers.push(customer);
        }
      });

      // Calculate analytics
      const totalUsers = uniqueUsers.length;
      const totalCustomers = uniqueUsers.filter(u => nonAdminCustomers.some(c => c.email === u.email)).length;
      const totalRecyclers = uniqueUsers.filter(u => nonAdminRecyclers.some(r => r.email === u.email)).length;
      const verifiedRecyclers = nonAdminRecyclers.filter(r => r.verification_status === 'approved').length;
      const pendingVerifications = nonAdminRecyclers.filter(r => r.verification_status === 'pending').length;
      const approvedVerifications = nonAdminRecyclers.filter(r => r.verification_status === 'approved').length;
      const rejectedVerifications = nonAdminRecyclers.filter(r => r.verification_status === 'rejected').length;

      // Calculate new users this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const newUsersThisMonth = [...nonAdminCustomers, ...nonAdminRecyclers]
        .filter(user => new Date(user.created_at) >= startOfMonth).length;

      // Calculate growth rate (simplified)
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      const usersLastMonth = [...nonAdminCustomers, ...nonAdminRecyclers]
        .filter(user => {
          const createdDate = new Date(user.created_at);
          return createdDate >= lastMonth && createdDate <= endOfLastMonth;
        }).length;
      
      const growthRate = usersLastMonth > 0 ? ((newUsersThisMonth - usersLastMonth) / usersLastMonth) * 100 : 0;

      // Fetch recent activities, leaderboards, and regional analytics
      const [recentActivities, recyclerLeaderboard, customerLeaderboard, regionalAnalytics] = await Promise.all([
        fetchRecentActivities(),
        fetchRecyclerLeaderboard(),
        fetchCustomerLeaderboard(),
        fetchRegionalAnalytics()
      ]);

      setAnalyticsData({
        totalUsers,
        totalCustomers,
        totalRecyclers,
        verifiedRecyclers,
        pendingVerifications,
        approvedVerifications,
        rejectedVerifications,
        newUsersThisMonth,
        growthRate,
        recentActivity: recentActivities,
        recyclerLeaderboard,
        customerLeaderboard,
        regionalAnalytics
      });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
  };

  const checkAdminAccess = async () => {
    try {
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();
      
      if (error || !currentUser) {
        Alert.alert('Access Denied', 'You must be logged in to access this page.');
        router.replace('/admin-screens/AdminPortal');
        return;
      }

      // Check if user is admin using our config function
      if (!isAdminUser(currentUser.email)) {
        Alert.alert('Access Denied', 'You do not have permission to access this page.');
        router.replace('/admin-screens/AdminPortal');
        return;
      }
    } catch (error) {
      console.error('Admin access check error:', error);
      router.replace('/admin-screens/AdminPortal');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <MaterialIcons name="analytics" size={48} color="#207E06" />
          <Text style={styles.loadingText}>Loading Analytics...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Analytics</Text>
          <Text style={styles.headerSubtitle}>Platform insights and reports</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Overview Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform Overview</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewCard}>
              <View style={styles.overviewIcon}>
                <MaterialIcons name="people" size={24} color="#207E06" />
              </View>
              <Text style={styles.overviewNumber}>{analyticsData.totalUsers}</Text>
              <Text style={styles.overviewLabel}>Total Users</Text>
            </View>
            <View style={styles.overviewCard}>
              <View style={styles.overviewIcon}>
                <MaterialIcons name="verified-user" size={24} color="#4CAF50" />
              </View>
              <Text style={styles.overviewNumber}>{analyticsData.verifiedRecyclers}</Text>
              <Text style={styles.overviewLabel}>Verified Recyclers</Text>
            </View>
            <View style={styles.overviewCard}>
              <View style={styles.overviewIcon}>
                <MaterialIcons name="trending-up" size={24} color="#2196F3" />
              </View>
              <Text style={styles.overviewNumber}>{analyticsData.newUsersThisMonth}</Text>
              <Text style={styles.overviewLabel}>This Month</Text>
            </View>
            <View style={styles.overviewCard}>
              <View style={styles.overviewIcon}>
                <MaterialIcons name="schedule" size={24} color="#FF9800" />
              </View>
              <Text style={styles.overviewNumber}>{analyticsData.pendingVerifications}</Text>
              <Text style={styles.overviewLabel}>Pending</Text>
            </View>
          </View>
        </View>

        {/* User Growth */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Growth</Text>
          <View style={styles.growthCard}>
            <View style={styles.growthHeader}>
              <MaterialIcons name="trending-up" size={24} color="#4CAF50" />
              <Text style={styles.growthTitle}>Monthly Growth</Text>
            </View>
            <View style={styles.growthStats}>
              <View style={styles.growthStat}>
                <Text style={styles.growthNumber}>{analyticsData.newUsersThisMonth}</Text>
                <Text style={styles.growthLabel}>New Users</Text>
              </View>
              <View style={styles.growthStat}>
                <Text style={[styles.growthNumber, { color: analyticsData.growthRate >= 0 ? '#4CAF50' : '#F44336' }]}>
                  {analyticsData.growthRate >= 0 ? '+' : ''}{analyticsData.growthRate}%
                </Text>
                <Text style={styles.growthLabel}>Growth Rate</Text>
              </View>
            </View>
          </View>
        </View>

        {/* User Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Distribution</Text>
          <View style={styles.distributionCard}>
            <View style={styles.distributionItem}>
              <View style={styles.distributionIcon}>
                <MaterialIcons name="person" size={20} color="#2196F3" />
              </View>
              <View style={styles.distributionContent}>
                <Text style={styles.distributionLabel}>Customers</Text>
                <Text style={styles.distributionValue}>{analyticsData.totalCustomers} users</Text>
              </View>
              <Text style={styles.distributionPercentage}>
                {analyticsData.totalUsers > 0 ? Math.round((analyticsData.totalCustomers / analyticsData.totalUsers) * 100) : 0}%
              </Text>
            </View>
            <View style={styles.distributionItem}>
              <View style={styles.distributionIcon}>
                <MaterialIcons name="local-shipping" size={20} color="#FF9800" />
              </View>
              <View style={styles.distributionContent}>
                <Text style={styles.distributionLabel}>Recyclers</Text>
                <Text style={styles.distributionValue}>{analyticsData.totalRecyclers} users</Text>
              </View>
              <Text style={styles.distributionPercentage}>
                {analyticsData.totalUsers > 0 ? Math.round((analyticsData.totalRecyclers / analyticsData.totalUsers) * 100) : 0}%
              </Text>
            </View>
          </View>
        </View>

        {/* Verification Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verification Status</Text>
          <View style={styles.verificationCard}>
            <View style={styles.verificationItem}>
              <View style={styles.verificationIcon}>
                <MaterialIcons name="schedule" size={20} color="#FFA500" />
              </View>
              <Text style={styles.verificationLabel}>Pending</Text>
              <Text style={styles.verificationCount}>{analyticsData.pendingVerifications}</Text>
            </View>
            <View style={styles.verificationItem}>
              <View style={styles.verificationIcon}>
                <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
              </View>
              <Text style={styles.verificationLabel}>Approved</Text>
              <Text style={styles.verificationCount}>{analyticsData.approvedVerifications}</Text>
            </View>
            <View style={styles.verificationItem}>
              <View style={styles.verificationIcon}>
                <MaterialIcons name="cancel" size={20} color="#F44336" />
              </View>
              <Text style={styles.verificationLabel}>Rejected</Text>
              <Text style={styles.verificationCount}>{analyticsData.rejectedVerifications}</Text>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            {analyticsData.recentActivity.length > 0 ? (
              analyticsData.recentActivity.map((activity) => (
                <View key={activity.id} style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <MaterialIcons 
                      name={activity.type === 'verification' ? 'verified-user' : 'notifications'} 
                      size={20} 
                      color="#207E06" 
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityDescription}>{activity.description}</Text>
                    <Text style={styles.activityTime}>
                      {new Date(activity.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.noActivityContainer}>
                <MaterialIcons name="history" size={32} color="#CCCCCC" />
                <Text style={styles.noActivityText}>No recent activity</Text>
              </View>
            )}
          </View>
        </View>

        {/* Recycler Leaderboard */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Top Performing Recyclers</Text>
          <View style={styles.leaderboardCard}>
            <View style={styles.leaderboardHeader}>
              <MaterialIcons name="local-shipping" size={24} color="#207E06" />
              <Text style={styles.leaderboardTitle}>Top Rated Recyclers</Text>
            </View>
            {analyticsData.recyclerLeaderboard.length > 0 ? (
              analyticsData.recyclerLeaderboard.map((recycler, index) => (
                <View key={recycler.id} style={styles.leaderboardItem}>
                  <View style={styles.rankContainer}>
                    <Text style={[
                      styles.rankNumber,
                      index < 3 && styles.rankNumberTop
                    ]}>
                      {recycler.rank}
                    </Text>
                    {index < 3 && (
                      <MaterialIcons 
                        name={index === 0 ? "emoji-events" : index === 1 ? "workspace-premium" : "military-tech"} 
                        size={16} 
                        color={index === 0 ? "#FFD700" : index === 1 ? "#C0C0C0" : "#CD7F32"} 
                      />
                    )}
                  </View>
                  <View style={styles.leaderboardContent}>
                    <Text style={styles.leaderboardName}>{recycler.name}</Text>
                    <Text style={styles.leaderboardEmail}>{recycler.email}</Text>
                    <View style={styles.leaderboardStats}>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{recycler.averageRating.toFixed(1)}</Text>
                        <Text style={styles.statLabel}>Avg Rating</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{recycler.totalPickups}</Text>
                        <Text style={styles.statLabel}>Ratings</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{recycler.totalEcoPoints || 0}</Text>
                        <Text style={styles.statLabel}>Eco Points</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.noDataContainer}>
                <MaterialIcons name="local-shipping" size={32} color="#CCCCCC" />
                <Text style={styles.noDataText}>No recycler data available</Text>
              </View>
            )}
          </View>
        </View>

        {/* Customer Leaderboard */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌱 Top Environmental Contributors</Text>
          <View style={styles.leaderboardCard}>
            <View style={styles.leaderboardHeader}>
              <MaterialIcons name="eco" size={24} color="#4CAF50" />
              <Text style={styles.leaderboardTitle}>Waste Recycled Leaderboard</Text>
            </View>
            {analyticsData.customerLeaderboard.length > 0 ? (
              analyticsData.customerLeaderboard.map((customer, index) => (
                <View key={customer.id} style={styles.leaderboardItem}>
                  <View style={styles.rankContainer}>
                    <Text style={[
                      styles.rankNumber,
                      index < 3 && styles.rankNumberTop
                    ]}>
                      {customer.rank}
                    </Text>
                    {index < 3 && (
                      <MaterialIcons 
                        name={index === 0 ? "emoji-events" : index === 1 ? "workspace-premium" : "military-tech"} 
                        size={16} 
                        color={index === 0 ? "#FFD700" : index === 1 ? "#C0C0C0" : "#CD7F32"} 
                      />
                    )}
                  </View>
                  <View style={styles.leaderboardContent}>
                    <Text style={styles.leaderboardName}>{customer.name}</Text>
                    <Text style={styles.leaderboardEmail}>{customer.email}</Text>
                    <View style={styles.leaderboardStats}>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{customer.totalWasteRecycled.toFixed(1)}kg</Text>
                        <Text style={styles.statLabel}>Waste Recycled</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{customer.totalCo2Saved.toFixed(1)}kg</Text>
                        <Text style={styles.statLabel}>CO₂ Saved</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{customer.totalPoints}</Text>
                        <Text style={styles.statLabel}>Points</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.noDataContainer}>
                <MaterialIcons name="eco" size={32} color="#CCCCCC" />
                <Text style={styles.noDataText}>No customer data available</Text>
              </View>
            )}
          </View>
        </View>

        {/* Regional Analytics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗺️ Regional Performance</Text>
          <View style={styles.leaderboardCard}>
            <View style={styles.leaderboardHeader}>
              <MaterialIcons name="location-on" size={24} color="#2196F3" />
              <Text style={styles.leaderboardTitle}>Top Regions by Pickup Requests</Text>
            </View>
            {analyticsData.regionalAnalytics.length > 0 ? (
              analyticsData.regionalAnalytics.map((region, index) => (
                <View key={region.region} style={styles.leaderboardItem}>
                  <View style={styles.rankContainer}>
                    <Text style={[
                      styles.rankNumber,
                      index < 3 && styles.rankNumberTop
                    ]}>
                      {region.rank}
                    </Text>
                    {index < 3 && (
                      <MaterialIcons 
                        name={index === 0 ? "emoji-events" : index === 1 ? "workspace-premium" : "military-tech"} 
                        size={16} 
                        color={index === 0 ? "#FFD700" : index === 1 ? "#C0C0C0" : "#CD7F32"} 
                      />
                    )}
                  </View>
                  <View style={styles.leaderboardContent}>
                    <Text style={styles.leaderboardName}>{region.region}</Text>
                    <View style={styles.leaderboardStats}>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{region.totalRequests}</Text>
                        <Text style={styles.statLabel}>Total Requests</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{region.completedRequests}</Text>
                        <Text style={styles.statLabel}>Completed</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{region.totalWasteRecycled}kg</Text>
                        <Text style={styles.statLabel}>Waste Recycled</Text>
                      </View>
                    </View>
                    <View style={styles.regionalDetails}>
                      <View style={styles.regionalDetailItem}>
                        <MaterialIcons name="star" size={14} color="#FF9800" />
                        <Text style={styles.regionalDetailText}>
                          Avg Rating: {region.averageRating > 0 ? region.averageRating.toFixed(1) : 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.regionalDetailItem}>
                        <MaterialIcons name="recycling" size={14} color="#4CAF50" />
                        <Text style={styles.regionalDetailText}>
                          Top: {region.topWasteTypes[0]?.type || 'N/A'} ({region.topWasteTypes[0]?.count || 0})
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.noDataContainer}>
                <MaterialIcons name="location-on" size={32} color="#CCCCCC" />
                <Text style={styles.noDataText}>No regional data available</Text>
              </View>
            )}
          </View>
        </View>

        {/* Coming Soon Section */}
        <View style={styles.section}>
          <View style={styles.comingSoonCard}>
            <MaterialIcons name="construction" size={48} color="#FF9800" />
            <Text style={styles.comingSoonTitle}>More Analytics Coming Soon</Text>
            <Text style={styles.comingSoonText}>
              We&apos;re working on advanced analytics features including detailed reports, 
              user behavior insights, and performance metrics.
            </Text>
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <MaterialIcons name="check" size={16} color="#4CAF50" />
                <Text style={styles.featureText}>Detailed user reports</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons name="check" size={16} color="#4CAF50" />
                <Text style={styles.featureText}>Performance metrics</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialIcons name="check" size={16} color="#4CAF50" />
                <Text style={styles.featureText}>Export capabilities</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingText: {
    fontSize: 18,
    color: '#207E06',
    fontWeight: '600',
    marginTop: 16,
  },
  header: {
    backgroundColor: '#207E06',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 8,
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  overviewIcon: {
    backgroundColor: '#F0F8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  overviewNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  growthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  growthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  growthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 12,
  },
  growthStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  growthStat: {
    alignItems: 'center',
  },
  growthNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  growthLabel: {
    fontSize: 12,
    color: '#666666',
  },
  distributionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  distributionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  distributionIcon: {
    backgroundColor: '#F0F8F0',
    borderRadius: 8,
    padding: 8,
    marginRight: 12,
  },
  distributionContent: {
    flex: 1,
  },
  distributionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  distributionValue: {
    fontSize: 12,
    color: '#666666',
  },
  distributionPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#207E06',
  },
  verificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  verificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  verificationIcon: {
    backgroundColor: '#F0F8F0',
    borderRadius: 8,
    padding: 8,
    marginRight: 12,
  },
  verificationLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  verificationCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#207E06',
  },
  comingSoonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  comingSoonText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  featureList: {
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  // Activity styles
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  activityIcon: {
    backgroundColor: '#F0F8F0',
    borderRadius: 8,
    padding: 8,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#666666',
  },
  noActivityContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noActivityText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 8,
  },
  // Leaderboard styles
  leaderboardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  leaderboardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 12,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    minWidth: 40,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666666',
    marginRight: 8,
  },
  rankNumberTop: {
    color: '#207E06',
    fontSize: 20,
  },
  leaderboardContent: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  leaderboardEmail: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 12,
  },
  leaderboardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#207E06',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'center',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 8,
  },
  // Regional analytics styles
  regionalDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  regionalDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  regionalDetailText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
});
