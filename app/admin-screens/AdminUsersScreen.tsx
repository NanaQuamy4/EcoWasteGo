import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { isAdminUser } from '../../lib/adminConfig';
import { supabase } from '../../lib/supabase';

interface User {
  user_type: 'customer' | 'recycler';
  id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
  company_name?: string;
  verification_status?: string;
  admin_verified?: boolean;
  verification_expires_at?: string;
}

interface UserStats {
  user_type: string;
  total_users: number;
  new_users_30_days: number;
  new_users_7_days: number;
  new_users_1_day: number;
}

export default function AdminUsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'customers' | 'recyclers'>('all');

  useEffect(() => {
    checkAdminAccess();
    fetchUsers();
    fetchStats();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isAdminUser(user.email)) {
      Alert.alert('Access Denied', 'You do not have permission to access this screen.');
      router.replace('/admin-screens/AdminPortal');
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_all_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter out the admin user from the list
      const filteredData = (data || []).filter(user => !isAdminUser(user.email));
      setUsers(filteredData);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_user_stats')
        .select('*');

      if (error) throw error;
      setStats(data || []);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUsers(), fetchStats()]);
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert('Error', 'Failed to logout. Please try again.');
      } else {
        router.replace('/LoginScreen');
      }
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const handleBack = () => {
    router.back();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getVerificationStatusColor = (status?: string) => {
    switch (status) {
      case 'approved': return '#4CAF50';
      case 'pending': return '#FFA500';
      case 'rejected': return '#F44336';
      case 'expired': return '#9E9E9E';
      default: return '#666666';
    }
  };

  const getVerificationStatusIcon = (status?: string) => {
    switch (status) {
      case 'approved': return 'check-circle';
      case 'pending': return 'schedule';
      case 'rejected': return 'cancel';
      case 'expired': return 'timer-off';
      default: return 'help';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.phone.includes(searchQuery);
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'customers' && user.user_type === 'customer') ||
                         (filterType === 'recyclers' && user.user_type === 'recycler');
    
    return matchesSearch && matchesFilter;
  });

  const customerStats = stats.find(s => s.user_type === 'customer') || {
    total_users: 0,
    new_users_30_days: 0,
    new_users_7_days: 0,
    new_users_1_day: 0
  };

  const recyclerStats = stats.find(s => s.user_type === 'recycler') || {
    total_users: 0,
    new_users_30_days: 0,
    new_users_7_days: 0,
    new_users_1_day: 0
  };

  // Calculate actual user counts (excluding admin)
  const actualCustomerCount = users.filter(user => user.user_type === 'customer').length;
  const actualRecyclerCount = users.filter(user => user.user_type === 'recycler').length;
  const actualTotalCount = actualCustomerCount + actualRecyclerCount;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <MaterialIcons name="people" size={48} color="#207E06" />
          <Text style={styles.loadingText}>Loading Users...</Text>
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
          <Text style={styles.headerTitle}>User Management</Text>
          <Text style={styles.headerSubtitle}>Manage all platform users</Text>
        </View>
      </View>

             {/* Statistics Cards */}
       <View style={styles.statsContainer}>
         <View style={styles.statCard}>
           <View style={styles.statIconContainer}>
             <MaterialIcons name="people" size={24} color="#207E06" />
           </View>
           <Text style={styles.statNumber}>{actualTotalCount}</Text>
           <Text style={styles.statLabel}>Total Users</Text>
         </View>
         <View style={styles.statCard}>
           <View style={styles.statIconContainer}>
             <MaterialIcons name="person" size={24} color="#2196F3" />
           </View>
           <Text style={styles.statNumber}>{actualCustomerCount}</Text>
           <Text style={styles.statLabel}>Customers</Text>
         </View>
         <View style={styles.statCard}>
           <View style={styles.statIconContainer}>
             <MaterialIcons name="local-shipping" size={24} color="#FF9800" />
           </View>
           <Text style={styles.statNumber}>{actualRecyclerCount}</Text>
           <Text style={styles.statLabel}>Recyclers</Text>
         </View>
       </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color="#666666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999999"
          />
        </View>
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[styles.filterButtonText, filterType === 'all' && styles.filterButtonTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'customers' && styles.filterButtonActive]}
            onPress={() => setFilterType('customers')}
          >
            <Text style={[styles.filterButtonText, filterType === 'customers' && styles.filterButtonTextActive]}>
              Customers
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'recyclers' && styles.filterButtonActive]}
            onPress={() => setFilterType('recyclers')}
          >
            <Text style={[styles.filterButtonText, filterType === 'recyclers' && styles.filterButtonTextActive]}>
              Recyclers
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Users List */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="people" size={64} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No Users Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try adjusting your search or filter' : 'No users registered yet'}
            </Text>
          </View>
        ) : (
          filteredUsers.map((user) => (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                  <View style={[styles.avatar, { backgroundColor: user.user_type === 'recycler' ? '#FFF3E0' : '#E3F2FD' }]}>
                    <MaterialIcons 
                      name={user.user_type === 'recycler' ? 'local-shipping' : 'person'} 
                      size={24} 
                      color={user.user_type === 'recycler' ? '#FF9800' : '#2196F3'} 
                    />
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{user.full_name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <View style={styles.userTypeContainer}>
                      <Text style={[styles.userType, { color: user.user_type === 'recycler' ? '#FF9800' : '#2196F3' }]}>
                        {user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>
                {user.verification_status && (
                  <View style={[styles.statusBadge, { backgroundColor: getVerificationStatusColor(user.verification_status) + '20' }]}>
                    <MaterialIcons 
                      name={getVerificationStatusIcon(user.verification_status) as any} 
                      size={16} 
                      color={getVerificationStatusColor(user.verification_status)} 
                    />
                    <Text style={[styles.statusText, { color: getVerificationStatusColor(user.verification_status) }]}>
                      {user.verification_status.toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                  <MaterialIcons name="phone" size={16} color="#666666" />
                  <Text style={styles.infoText}>{user.phone}</Text>
                </View>
                {user.company_name && (
                  <View style={styles.infoRow}>
                    <MaterialIcons name="business" size={16} color="#666666" />
                    <Text style={styles.infoText}>{user.company_name}</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <MaterialIcons name="schedule" size={16} color="#666666" />
                  <Text style={styles.infoText}>Joined: {formatDate(user.created_at)}</Text>
                </View>
                {user.verification_expires_at && (
                  <View style={styles.infoRow}>
                    <MaterialIcons name="event" size={16} color="#666666" />
                    <Text style={styles.infoText}>Expires: {formatDate(user.verification_expires_at)}</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  statIconContainer: {
    backgroundColor: '#F0F8F0',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1A1A1A',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#207E06',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  userTypeContainer: {
    alignSelf: 'flex-start',
  },
  userType: {
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: '#F0F8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  cardContent: {
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
    flex: 1,
  },
});
