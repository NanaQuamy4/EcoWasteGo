import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppHeader from '../../components/AppHeader';
import DrawerMenu from '../../components/DrawerMenu';
import { COLORS } from '../../constants';

export default function UserScreen() {
  const user = {
    name: 'Williams Boampong',
    email: 'nanaquamy4@gmail.com',
    phone: '54 673 2719',
    status: 'user',
    type: 'user' as const,
    totalPickups: 12,
    totalWaste: '156.8 kg',
    memberSince: 'Jan 2024',
  };

  const [currentStatus, setCurrentStatus] = useState(user.status);
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [showLogoutPrompt, setShowLogoutPrompt] = useState(false);
  const [showStatusSwitch, setShowStatusSwitch] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3); // Mock notification count

  const handleStatusSwitch = (newStatus: string) => {
    setCurrentStatus(newStatus);
    setShowStatusSwitch(false);
    
    if (newStatus === 'recycler') {
      // Navigate to recycler tabs
      router.push('/(recycler-tabs)');
    } else if (newStatus === 'user') {
      // Already on user mode, just update the status
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

  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();

  const getStatusColor = (status: string) => {
    return status === 'recycler' ? COLORS.darkGreen : COLORS.primary;
  };

  const getStatusIcon = (status: string) => {
    return status === 'recycler' ? 'recycling' : 'verified-user';
  };

  const handleNotificationPress = () => {
    // Navigate to notifications screen or show notification panel
    router.push('/NotificationScreen');
    // Clear notification count when opened
    setNotificationCount(0);
  };

  return (
    <View style={styles.container}>
      <AppHeader 
        onMenuPress={() => setDrawerOpen(true)} 
        onNotificationPress={handleNotificationPress}
        notificationCount={notificationCount}
      />
      <DrawerMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} user={user} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <MaterialIcons name="account-circle" size={80} color={COLORS.darkGreen} />
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.userPhone}>{user.phone}</Text>
          
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
            <Text style={styles.statNumber}>{user.totalPickups}</Text>
            <Text style={styles.statLabel}>Total Pickups</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="eco" size={24} color={COLORS.darkGreen} />
            <Text style={styles.statNumber}>{user.totalWaste}</Text>
            <Text style={styles.statLabel}>Waste Recycled</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="event" size={24} color={COLORS.darkGreen} />
            <Text style={styles.statNumber}>{user.memberSince}</Text>
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
            onPress={() => router.push('/RecyclerRegistrationScreen')}
          >
            <MaterialIcons name="recycling" size={20} color={COLORS.darkGreen} />
            <Text style={styles.actionText}>Join as a Recycler</Text>
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
              <Text style={styles.statusSwitchTitle}>Switch Status</Text>
              <TouchableOpacity 
                style={[styles.statusOption, currentStatus === 'user' && styles.statusOptionActive]} 
                onPress={() => handleStatusSwitch('user')}
              >
                <MaterialIcons name="verified-user" size={20} color={currentStatus === 'user' ? '#fff' : COLORS.darkGreen} />
                <Text style={[styles.statusOptionText, currentStatus === 'user' && styles.statusOptionTextActive]}>User</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.statusOption, currentStatus === 'recycler' && styles.statusOptionActive]} 
                onPress={() => handleStatusSwitch('recycler')}
              >
                <MaterialIcons name="recycling" size={20} color={currentStatus === 'recycler' ? '#fff' : COLORS.darkGreen} />
                <Text style={[styles.statusOptionText, currentStatus === 'recycler' && styles.statusOptionTextActive]}>Recycler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowStatusSwitch(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Prompts */}
        {showLogoutPrompt && (
          <View style={styles.promptContainer}>
            <Text style={styles.promptText}>Do you want to log out?</Text>
            <View style={styles.promptActions}>
              <TouchableOpacity onPress={handleLogoutYes} style={styles.promptYes}>
                <Text style={styles.promptYesText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogoutNo} style={styles.promptNo}>
                <Text style={styles.promptNoText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {showDeletePrompt && (
          <View style={styles.promptContainer}>
            {deleteStep === 1 ? (
              <>
                <Text style={styles.promptText}>
                  Are you sure you want to{"\n"}permanently delete the account?
                </Text>
                <View style={styles.promptActions}>
                  <TouchableOpacity onPress={handleDeleteYes} style={styles.promptYes}>
                    <Text style={styles.promptYesText}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleDeleteNo} style={styles.promptNo}>
                    <Text style={styles.promptNoText}>No</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteFinal}>
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
                <Text style={styles.promptText}>
                  Are you sure you want to{"\n"}permanently delete the account?
                </Text>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FFF0',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F2FFE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 4,
    borderColor: COLORS.darkGreen,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 6,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  userPhone: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2FFE5',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 0,
    borderWidth: 2,
    borderColor: COLORS.darkGreen,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statusSection: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 0,
    marginBottom: 0,
  },
  statusLabel: {
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    fontSize: 16,
  },
  switchButton: {
    backgroundColor: COLORS.darkGreen,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    elevation: 4,
    minWidth: 60,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  switchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 12,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statNumber: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  actionsContainer: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGreen,
    marginLeft: 12,
  },
  statusSwitchContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  statusSwitchModal: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    width: '85%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  statusSwitchTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 24,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  statusOptionActive: {
    backgroundColor: COLORS.darkGreen,
    borderColor: COLORS.darkGreen,
  },
  statusOptionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginLeft: 12,
    flex: 1,
  },
  statusOptionTextActive: {
    color: '#fff',
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  promptContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    alignSelf: 'center',
    width: '80%',
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 10,
  },
  promptText: {
    color: '#333',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  promptActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  promptYes: {
    backgroundColor: COLORS.darkGreen,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  promptYesText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  promptNo: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  promptNoText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#FF4444',
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
}); 