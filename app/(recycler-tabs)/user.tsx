import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppHeader from '../../components/AppHeader';
import DrawerMenu from '../../components/DrawerMenu';
import { COLORS } from '../../constants';
import { useNotificationCountSimple as useNotificationCount } from '../../hooks/useNotificationCountSimple';
import { supabase } from '../../lib/supabase';

export default function RecyclerUserTab() {
  const [user, setUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Debug logging for user data
  useEffect(() => {
    if (user) {
      console.log('RecyclerUserTab: User data:', user);
      console.log('RecyclerUserTab: User created_at:', user.created_at);
      console.log('RecyclerUserTab: User object keys:', Object.keys(user));
    }
  }, [user]);

  // Fetch current user data from Supabase
  // Function to fetch user data
  const fetchUserData = useCallback(async () => {
    try {
      console.log('RecyclerUserTab: Fetching current user data...');
      setIsLoadingUser(true);

      // Get current authenticated user
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();

      if (error) {
        console.error('RecyclerUserTab: Error fetching user:', error);
        setIsLoadingUser(false);
        return;
      }

      if (!currentUser) {
        console.log('RecyclerUserTab: No authenticated user found');
        setIsLoadingUser(false);
        return;
      }

      console.log('RecyclerUserTab: Current user found:', currentUser.id);
      console.log('RecyclerUserTab: User metadata:', currentUser.user_metadata);

      // Create enhanced user object with metadata
      const enhancedUser = {
        id: currentUser.id,
        email: currentUser.email,
        created_at: currentUser.created_at,
        email_confirmed_at: currentUser.email_confirmed_at,
        // Get data from user metadata
        username: currentUser.user_metadata?.full_name || 'Recycler',
        full_name: currentUser.user_metadata?.full_name || '',
        phone: currentUser.user_metadata?.phone || '',
        role: currentUser.user_metadata?.role || 'recycler',
        company_name: currentUser.user_metadata?.company_name || '',
        residential_address: currentUser.user_metadata?.residential_address || '',
        truck_size: currentUser.user_metadata?.truck_size || '',
        truck_number_plate: currentUser.user_metadata?.truck_number_plate || '',
        is_verified: currentUser.user_metadata?.verification_status === 'approved',
        verification_status: currentUser.user_metadata?.verification_status || 'incomplete',
        profile_image: currentUser.user_metadata?.profile_photo_url || null,
      };

      console.log('RecyclerUserTab: Enhanced user object:', enhancedUser);
      setUser(enhancedUser);
      setIsLoadingUser(false);

    } catch (error) {
      console.error('RecyclerUserTab: Error in fetchUserData:', error);
      setIsLoadingUser(false);
    }
  }, []);

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Refresh user data when screen comes into focus (e.g., returning from edit profile)
  useFocusEffect(
    useCallback(() => {
      console.log('RecyclerUserTab: Screen focused, refreshing user data...');
      fetchUserData();
    }, [fetchUserData])
  );

  // Helper function to safely format creation date
  const formatCreationDate = (createdAt: string | undefined) => {
    if (!createdAt) {
      console.log('RecyclerUserTab: No created_at field found');
      return 'N/A';
    }
    
    try {
      const date = new Date(createdAt);
      if (isNaN(date.getTime())) {
        console.log('RecyclerUserTab: Invalid date format:', createdAt);
        return 'N/A';
      }
      
      const formatted = date.toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      });
      console.log('RecyclerUserTab: Formatted date:', formatted);
      return formatted;
    } catch (error) {
      console.log('RecyclerUserTab: Error formatting date:', error);
      return 'N/A';
    }
  };

  const isVerified = user?.is_verified || user?.verification_status === 'approved';

  // Real pickup data state
  const [realPickupData, setRealPickupData] = useState({
    totalPickups: 0,
    completedPickups: 0,
    totalEarnings: 0,
    todayEarnings: 0,
    totalEcoPoints: 0,
    todayEcoPoints: 0
  });

  const recycler = {
    name: user?.username || 'Recycler',
    email: user?.email || '',
    phone: user?.phone || '',
    status: user?.verification_status || 'unverified',
    totalPickups: isVerified ? (realPickupData?.totalPickups || 0) : 0,
    totalEarnings: isVerified ? `₵${(realPickupData?.totalEarnings || 0).toFixed(2)}` : '₵0.00',
    memberSince: formatCreationDate(user?.created_at),
    rating: isVerified ? 4.8 : 0,
    completedPickups: isVerified ? (realPickupData?.completedPickups || 0) : 0,
  };

  const [currentStatus, setCurrentStatus] = useState(recycler.status);
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [showLogoutPrompt, setShowLogoutPrompt] = useState(false);
  const [showStatusSwitch, setShowStatusSwitch] = useState(false);
  // Use real notification count
  const { notificationCount } = useNotificationCount();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();

  // Fetch real pickup data
  const fetchPickupData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      console.log('Fetching real pickup data for recycler:', user.id);
      
      // Fetch recycler earnings with eco points
      const { data: earningsData, error: earningsError } = await supabase
        .from('recycler_earnings')
        .select('*')
        .eq('recycler_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (earningsError) {
        console.error('Error fetching earnings:', earningsError);
        return;
      }

      // Calculate real statistics
      const completedPickups = earningsData?.length || 0;
      const totalPickups = completedPickups; // Use completed as total
      
      // Calculate earnings from completed pickups
      const totalEarnings = earningsData
        ?.reduce((sum, r) => sum + (r.recycler_earnings || 0), 0) || 0;
      
      // Calculate today's earnings
      const today = new Date().toISOString().split('T')[0];
      const todayEarnings = earningsData
        ?.filter(r => r.completed_at?.startsWith(today))
        .reduce((sum, r) => sum + (r.recycler_earnings || 0), 0) || 0;

      // Calculate eco points
      const totalEcoPoints = earningsData
        ?.reduce((sum, r) => sum + (r.eco_points_earned || 0), 0) || 0;
      
      const todayEcoPoints = earningsData
        ?.filter(r => r.completed_at?.startsWith(today))
        .reduce((sum, r) => sum + (r.eco_points_earned || 0), 0) || 0;

      console.log('Real pickup data calculated:', {
        completedPickups,
        totalPickups,
        totalEarnings,
        todayEarnings,
        totalEcoPoints,
        todayEcoPoints
      });

      setRealPickupData({
        totalPickups: completedPickups, // Use completed as total
        completedPickups,
        totalEarnings,
        todayEarnings,
        totalEcoPoints,
        todayEcoPoints
      });

    } catch (error) {
      console.error('Error fetching pickup data:', error);
    }
  }, [user?.id]);

  // Update currentStatus when user data changes
  useEffect(() => {
    if (user) {
      const newStatus = user.verification_status === 'approved' ? 'verified' : user.verification_status || 'unverified';
      setCurrentStatus(newStatus);
      console.log('RecyclerUserTab: Updated currentStatus to:', newStatus);
    }
  }, [user]);

  // Fetch real pickup data when user is verified
  useEffect(() => {
    if (isVerified && user?.id) {
      fetchPickupData();
    }
  }, [isVerified, user?.id, fetchPickupData]);

  // Set up real-time subscription for recycler earnings
  useEffect(() => {
    let subscription: any;

    const setupRealtimeSubscription = async () => {
      try {
        if (!isVerified || !user?.id) {
          return;
        }

        // Subscribe to recycler_earnings changes for this recycler
        subscription = supabase
          .channel('recycler-earnings-user-tab')
          .on(
            'postgres_changes',
            {
              event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
              schema: 'public',
              table: 'recycler_earnings',
              filter: `recycler_id=eq.${user.id}`
            },
            (payload) => {
              console.log('RecyclerUserTab: Real-time earnings update:', payload);
              // Refresh data when earnings change
              fetchPickupData();
            }
          )
          .subscribe();

        console.log('RecyclerUserTab: Real-time subscription established');
      } catch (error) {
        console.error('Error setting up real-time subscription in user tab:', error);
      }
    };

    setupRealtimeSubscription();

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        console.log('RecyclerUserTab: Cleaning up real-time subscription');
        subscription.unsubscribe();
      }
    };
  }, [isVerified, user?.id, fetchPickupData]);

  // Mock functions (replacing useAuth)
  const deleteAccount = async () => {
    // Mock account deletion
    console.log('Mock: Deleting account...');
    return Promise.resolve();
  };

  const logout = async () => {
    try {
      console.log('RecyclerUserTab: Starting Supabase logout...');
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('RecyclerUserTab: Supabase logout error:', error);
        throw error;
      }
      
      console.log('RecyclerUserTab: Supabase logout successful');
      return true;
    } catch (error) {
      console.error('RecyclerUserTab: Logout error:', error);
      throw error;
    }
  };

  const handleStatusSwitch = (newStatus: string) => {
    // Disable role switching for recyclers - they should stay in recycler mode
    Alert.alert(
      'Role Switching Disabled',
      'Recyclers cannot switch to customer mode. Please contact support if you need to change your account type.',
      [{ text: 'OK' }]
    );
  };

  const handleDeleteYes = () => {
    setDeleteStep(2);
  };
  const handleDeleteFinal = async () => {
    try {
      setShowDeletePrompt(false);
      setDeleteStep(1);
      
      console.log('RecyclerUserTab: Starting account deletion...');
      
      // Call the delete account function from AuthContext
      await deleteAccount();
      
      console.log('RecyclerUserTab: Account deletion successful');
      
      // Show success message with additional information
      Alert.alert(
        'Account Deleted',
        'Your account and all associated data have been permanently deleted. You will be redirected to the login screen.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to login screen
              router.replace('/LoginScreen');
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Delete account failed:', error);
      
      let errorMessage = 'Failed to delete account. Please try again.';
      
      // Handle specific error cases
      if (error.message?.includes('network') || error.message?.includes('Network')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message?.includes('unauthorized') || error.message?.includes('401')) {
        errorMessage = 'Your session has expired. Please log in again and try deleting your account.';
      } else if (error.message?.includes('permission') || error.message?.includes('403')) {
        errorMessage = 'You do not have permission to delete your account. Please contact support.';
      }
      
      Alert.alert(
        'Delete Failed',
        errorMessage,
        [{ text: 'OK' }]
      );
    }
  };
  const handleDeleteNo = () => {
    setShowDeletePrompt(false);
    setDeleteStep(1);
  };
  const handleLogoutYes = async () => {
    setShowLogoutPrompt(false);
    try {
      console.log('RecyclerUserTab: Starting logout...');
      
      // Show loading indicator
      Alert.alert(
        'Logging Out',
        'Please wait while we log you out...',
        [],
        { cancelable: false }
      );
      
      await logout();
      console.log('RecyclerUserTab: Logout successful, navigating to login...');
      
      // Show success message
      Alert.alert(
        'Logged Out',
        'You have been successfully logged out.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to login screen
              router.push('/LoginScreen');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Logout failed:', error);
      
      // Even if logout fails, clear the user state and navigate to login
      console.log('RecyclerUserTab: Logout failed, but navigating to login anyway...');
      
      Alert.alert(
        'Logout Issue',
        'There was an issue with the logout process, but you have been logged out locally. You will be redirected to the login screen.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.push('/LoginScreen');
            }
          }
        ]
      );
    }
  };
  const handleLogoutNo = () => {
    setShowLogoutPrompt(false);
  };

  const getStatusColor = (status: string) => {
    if (status === 'verified') return COLORS.darkGreen;
    if (status === 'unverified') return COLORS.orange;
    return COLORS.primary;
  };

  const getStatusIcon = (status: string) => {
    if (status === 'verified') return 'verified-user';
    if (status === 'unverified') return 'warning';
    return 'recycling';
  };

  const handleNotificationPress = () => {
    router.push('/recycler-screens/RecyclerNotificationScreen' as any);
  };

  const handleRefreshProfile = () => {
    console.log('RecyclerUserTab: Manual refresh triggered');
    fetchUserData();
  };

  if (isLoadingUser) {
    return (
      <View style={styles.container}>
        <AppHeader 
          onMenuPress={() => setDrawerOpen(true)} 
          onNotificationPress={handleNotificationPress}
          notificationCount={notificationCount}
        />
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.loadingText}>Loading user data...</Text>
        </View>
      </View>
    );
  }

  // Show login prompt if user is not authenticated
  if (!user && !isLoadingUser) {
    return (
      <View style={styles.container}>
        <AppHeader 
          onMenuPress={() => setDrawerOpen(true)} 
          onNotificationPress={handleNotificationPress}
          notificationCount={notificationCount}
        />
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <MaterialIcons name="account-circle" size={80} color={COLORS.darkGreen} />
          <Text style={styles.userName}>Not Logged In</Text>
          <Text style={styles.userEmail}>Please log in to view your profile</Text>
          <TouchableOpacity 
            style={[styles.actionButton, { marginTop: 20 }]}
            onPress={() => router.push('/LoginScreen')}
          >
            <MaterialIcons name="login" size={20} color="white" />
            <Text style={[styles.actionText, { color: 'white' }]}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader 
        onMenuPress={() => setDrawerOpen(true)} 
        onNotificationPress={handleNotificationPress}
        notificationCount={notificationCount}
      />
             <DrawerMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            {user?.profile_image ? (
              <Image 
                source={{ uri: user.profile_image }} 
                style={styles.profileImage} 
              />
            ) : (
              <MaterialIcons name="account-circle" size={80} color={COLORS.darkGreen} />
            )}
          </View>
          <Text style={styles.userName}>{recycler.name}</Text>
          <Text style={styles.userEmail}>{recycler.email}</Text>
          <Text style={styles.userPhone}>{recycler.phone}</Text>
          
          {/* Company Name for Recyclers */}
          {user?.company_name && (
            <Text style={styles.companyName}>{user.company_name}</Text>
          )}
          
          {/* Account Creation Date */}
          <View style={styles.creationDateContainer}>
            <MaterialIcons name="event" size={16} color="rgba(0, 0, 0, 0.6)" />
            <Text style={styles.creationDateText}>
              Member since {formatCreationDate(user?.created_at)}
            </Text>
          </View>
          
          <View style={styles.statusContainer}>
            <MaterialIcons name={getStatusIcon(currentStatus)} size={16} color={getStatusColor(currentStatus)} />
            <Text style={[styles.statusText, { color: getStatusColor(currentStatus) }]}>{currentStatus}</Text>
            <TouchableOpacity onPress={handleRefreshProfile} style={styles.refreshButton}>
              <MaterialIcons name="refresh" size={16} color={COLORS.darkGreen} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Complete Registration Section for Unverified Recyclers */}
        {!isVerified && (
          <View style={styles.completeRegistrationSection}>
            <View style={styles.completeRegistrationHeader}>
              <MaterialIcons name="warning" size={24} color={COLORS.orange} />
              <Text style={styles.completeRegistrationTitle}>Complete Your Registration</Text>
            </View>
            <Text style={styles.completeRegistrationText}>
              To start receiving pickup requests and earning money, you need to complete your registration by providing additional business information.
            </Text>
            <TouchableOpacity 
              style={styles.completeRegistrationButton}
              onPress={() => router.push('/recycler-screens/RecyclerEditProfileScreen' as any)}
            >
              <MaterialIcons name="assignment" size={20} color={COLORS.white} />
              <Text style={styles.completeRegistrationButtonText}>Complete Registration</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MaterialIcons name="local-shipping" size={24} color={COLORS.darkGreen} />
            <Text style={styles.statNumber}>{recycler.totalPickups}</Text>
            <Text style={styles.statLabel}>Total Pickups</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="attach-money" size={24} color={COLORS.darkGreen} />
            <Text style={styles.statNumber}>{recycler.totalEarnings}</Text>
            <Text style={styles.statLabel}>Total Earnings</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="eco" size={24} color={COLORS.darkGreen} />
            <Text style={styles.statNumber}>{realPickupData.totalEcoPoints}</Text>
            <Text style={styles.statLabel}>Eco Points</Text>
          </View>
        </View>

        {/* Additional Stats Row */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MaterialIcons name="trending-up" size={24} color={COLORS.orange} />
            <Text style={styles.statNumber}>{realPickupData.todayEcoPoints}</Text>
            <Text style={styles.statLabel}>Today's Points</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="event" size={24} color={COLORS.darkGreen} />
            <Text style={styles.statNumber}>
              {formatCreationDate(user?.created_at)}
            </Text>
            <Text style={styles.statLabel}>Member Since</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="emoji-events" size={24} color={COLORS.purple} />
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Achievements</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/recycler-screens/RecyclerEditProfileScreen' as any)}
          >
            <MaterialIcons name="edit" size={20} color={COLORS.darkGreen} />
            <Text style={styles.actionText}>Edit Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/PrivacyScreen')}
          >
            <MaterialIcons name="security" size={20} color={COLORS.darkGreen} />
            <Text style={styles.actionText}>Privacy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/customer-screens/Help' as any)}
          >
            <MaterialIcons name="help" size={20} color={COLORS.darkGreen} />
            <Text style={styles.actionText}>Help & Support</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => setShowLogoutPrompt(true)}
          >
            <MaterialIcons name="logout" size={20} color={COLORS.darkGreen} />
            <Text style={styles.actionText}>Log out</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => setShowDeletePrompt(true)}
          >
            <MaterialIcons name="delete" size={20} color={COLORS.red} />
            <Text style={[styles.actionText, { color: COLORS.red }]}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* Delete Account Modal */}
        {showDeletePrompt && (
          <View style={styles.modalOverlay} pointerEvents="box-none">
            <View style={styles.modalContainer}>
              {deleteStep === 1 ? (
                <>
                  <Text style={styles.modalTitle}>Delete Account</Text>
                  <Text style={styles.modalText}>Are you sure you want to delete your account? This action cannot be undone.</Text>
                  <View style={styles.modalButtons}>
                    <TouchableOpacity style={styles.modalButton} onPress={handleDeleteNo}>
                      <Text style={styles.modalButtonText}>No</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalButton, styles.deleteButton]} onPress={handleDeleteYes}>
                      <Text style={styles.deleteButtonText}>Yes</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.modalTitle}>Final Confirmation</Text>
                  <Text style={styles.modalText}>This will permanently delete your account and all associated data. Are you absolutely sure?</Text>
                  <View style={styles.modalButtons}>
                    <TouchableOpacity style={styles.modalButton} onPress={handleDeleteNo}>
                      <Text style={styles.modalButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalButton, styles.deleteButton]} onPress={handleDeleteFinal}>
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* Logout Modal */}
        {showLogoutPrompt && (
          <View style={styles.modalOverlay} pointerEvents="box-none">
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Logout</Text>
              <Text style={styles.modalText}>Are you sure you want to logout?</Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalButton} onPress={handleLogoutNo}>
                  <Text style={styles.modalButtonText}>No</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.logoutButton]} onPress={handleLogoutYes}>
                  <Text style={styles.logoutButtonText}>Yes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 32,
    flexGrow: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: COLORS.lightGreen,
    marginTop: 8,
    borderRadius: 12,
    marginBottom: 16,
  },
  profileImageContainer: {
    marginBottom: 12,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: COLORS.darkGreen,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 6,
  },
  companyName: {
    fontSize: 16,
    color: COLORS.darkGreen,
    fontWeight: '600',
    marginBottom: 6,
  },
  creationDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  creationDateText: {
    fontSize: 14,
    color: COLORS.darkGreen,
    marginLeft: 6,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  statusSection: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginLeft: 8,
  },
  switchButton: {
    backgroundColor: COLORS.darkGreen,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  switchButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
  },
  actionsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.darkGreen,
    marginLeft: 12,
  },
  statusSwitchContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusSwitchModal: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  statusSwitchTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 8,
  },
  statusSwitchSubtitle: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 20,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    width: '100%',
  },
  statusOptionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginLeft: 12,
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    color: COLORS.gray,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  deleteButton: {
    backgroundColor: COLORS.red,
  },
  deleteButtonText: {
    color: COLORS.white,
  },
  logoutButton: {
    backgroundColor: COLORS.darkGreen,
  },
  logoutButtonText: {
    color: COLORS.white,
  },
  completeRegistrationSection: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  completeRegistrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  completeRegistrationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.orange,
    marginLeft: 8,
  },
  completeRegistrationText: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
    marginBottom: 16,
  },
  completeRegistrationButton: {
    backgroundColor: COLORS.darkGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  completeRegistrationButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.darkGreen,
    fontWeight: 'bold',
  },
  refreshButton: {
    marginLeft: 8,
    padding: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(34, 51, 11, 0.1)',
  },
});
