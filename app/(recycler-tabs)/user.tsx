import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppHeader from '../../components/AppHeader';
import DrawerMenu from '../../components/DrawerMenu';
import { COLORS } from '../../constants';

export default function RecyclerUserTab() {
  const recycler = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+233 54 123 4567',
    status: 'recycler',
    totalPickups: 156,
    totalEarnings: '₵2,450.80',
    memberSince: 'Mar 2023',
    rating: 4.8,
    completedPickups: 142,
  };

  const [currentStatus, setCurrentStatus] = useState(recycler.status);
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [showLogoutPrompt, setShowLogoutPrompt] = useState(false);
  const [showStatusSwitch, setShowStatusSwitch] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();

  const handleStatusSwitch = (newStatus: string) => {
    setCurrentStatus(newStatus);
    setShowStatusSwitch(false);
    
    if (newStatus === 'user') {
      // Navigate to user tabs
      router.push('/(tabs)/' as any);
    } else if (newStatus === 'recycler') {
      // Already on recycler mode, just update the status
      Alert.alert(
        'Status Changed',
        `You are now in ${newStatus} mode.`,
        [{ text: 'OK' }]
      );
    }
    
    Alert.alert(
      'Status Changed',
      `You are now in ${newStatus} mode.`,
      [{ text: 'OK' }]
    );
  };

  const handleDeleteYes = () => {
    setDeleteStep(2);
  };
  const handleDeleteFinal = () => {
    setShowDeletePrompt(false);
    setDeleteStep(1);
    // Add your delete logic here
  };
  const handleDeleteNo = () => {
    setShowDeletePrompt(false);
    setDeleteStep(1);
  };
  const handleLogoutYes = () => {
    setShowLogoutPrompt(false);
    // Add your logout logic here
  };
  const handleLogoutNo = () => {
    setShowLogoutPrompt(false);
  };

  const getStatusColor = (status: string) => {
    return status === 'recycler' ? COLORS.darkGreen : COLORS.primary;
  };

  const getStatusIcon = (status: string) => {
    return status === 'recycler' ? 'recycling' : 'verified-user';
  };

  const handleNotificationPress = () => {
    router.push('/NotificationScreen');
    setNotificationCount(0);
  };

  return (
    <View style={styles.container}>
      <AppHeader 
        onMenuPress={() => setDrawerOpen(true)} 
        onNotificationPress={handleNotificationPress}
        notificationCount={notificationCount}
      />
      <DrawerMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} user={recycler} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <MaterialIcons name="account-circle" size={80} color={COLORS.darkGreen} />
          </View>
          <Text style={styles.userName}>{recycler.name}</Text>
          <Text style={styles.userEmail}>{recycler.email}</Text>
          <Text style={styles.userPhone}>{recycler.phone}</Text>
          
          <View style={styles.statusContainer}>
            <MaterialIcons name={getStatusIcon(currentStatus)} size={16} color={getStatusColor(currentStatus)} />
            <Text style={[styles.statusText, { color: getStatusColor(currentStatus) }]}>{currentStatus}</Text>
          </View>
        </View>

        {/* Status Switch Section */}
        <View style={styles.statusSection}>
          <View style={styles.statusRow}>
            <MaterialIcons name="swap-horiz" size={16} color={COLORS.darkGreen} />
            <Text style={styles.statusLabel}>Switch Mode</Text>
            <TouchableOpacity 
              style={styles.switchButton}
              onPress={() => setShowStatusSwitch(true)}
            >
              <Text style={styles.switchButtonText}>Switch</Text>
            </TouchableOpacity>
          </View>
        </View>

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
            <MaterialIcons name="event" size={24} color={COLORS.darkGreen} />
            <Text style={styles.statNumber}>{recycler.memberSince}</Text>
            <Text style={styles.statLabel}>Member Since</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/EditProfileScreen')}
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
            onPress={() => router.push('/Help')}
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

        {/* Status Switch Modal */}
        {showStatusSwitch && (
          <View style={styles.statusSwitchContainer} pointerEvents="box-none">
            <View style={styles.statusSwitchModal}>
              <Text style={styles.statusSwitchTitle}>Switch Mode</Text>
              <Text style={styles.statusSwitchSubtitle}>Choose your mode:</Text>
              
              <TouchableOpacity 
                style={styles.statusOption}
                onPress={() => handleStatusSwitch('user')}
              >
                <MaterialIcons name="verified-user" size={24} color={COLORS.primary} />
                <Text style={styles.statusOptionText}>User Mode</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.statusOption}
                onPress={() => handleStatusSwitch('recycler')}
              >
                <MaterialIcons name="recycling" size={24} color={COLORS.darkGreen} />
                <Text style={styles.statusOptionText}>Recycler Mode</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowStatusSwitch(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
    marginBottom: 8,
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
}); 