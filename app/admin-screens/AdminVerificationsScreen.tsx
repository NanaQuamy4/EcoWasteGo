import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Linking, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { isAdminUser } from '../../lib/adminConfig';
import { supabase } from '../../lib/supabase';

interface RecyclerVerification {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  company_name: string;
  residential_address: string;
  areas_of_operation: string;
  truck_size: string;
  truck_number_plate: string;
  drivers_license: string;
  verification_status: 'pending' | 'approved' | 'rejected' | 'expired';
  verification_request_date: string;
  admin_notes?: string | null;
  profile_photo_url?: string | null;
}

export default function AdminVerifications() {
  const router = useRouter();
  const [verifications, setVerifications] = useState<RecyclerVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string>('');

  useEffect(() => {
    checkAdminAccess();
    fetchVerifications();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();
      
      if (error || !currentUser || !isAdminUser(currentUser.email)) {
        Alert.alert('Access Denied', 'You do not have permission to access this page.');
        router.replace('/admin-screens/AdminPortal');
        return;
      }
    } catch (error) {
      console.error('Admin access check error:', error);
      router.replace('/admin-screens/AdminPortal');
    }
  };

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      
      // Use a raw SQL query to completely bypass RLS issues
      const { data, error } = await supabase
        .rpc('get_recycler_verifications');

      if (error) {
        console.error('RPC Error:', error);
        
                 // Try using a raw SQL query as fallback
         const { data: sqlData, error: sqlError } = await supabase
           .from('recyclers')
           .select(`
             id,
             full_name,
             email,
             phone,
             company_name,
             residential_address,
             areas_of_operation,
             truck_size,
             truck_number_plate,
             drivers_license,
             verification_status,
             verification_request_date,
             admin_notes
           `)
           .not('verification_status', 'is', null);

        if (sqlError) {
          console.error('SQL Error:', sqlError);
          
                     // Final fallback: try with minimal columns
           const { data: minimalData, error: minimalError } = await supabase
             .from('recyclers')
             .select('id, full_name, email, phone, verification_status, drivers_license')
             .not('verification_status', 'is', null);

          if (minimalError) {
            console.error('Minimal query also failed:', minimalError);
            Alert.alert('Error', 'Failed to load verifications. Please try again later.');
            return;
          }

                     // Use minimal data and fill missing fields with placeholders
           const minimalVerifications = (minimalData || []).map(item => ({
             ...item,
             company_name: 'N/A',
             residential_address: 'N/A',
             areas_of_operation: 'N/A',
             truck_size: 'N/A',
             truck_number_plate: 'N/A',
             drivers_license: item.drivers_license || 'N/A',
             verification_request_date: new Date().toISOString(),
             admin_notes: null
           }));
          
          setVerifications(minimalVerifications);
        } else {
          setVerifications(sqlData || []);
        }
      } else {
        setVerifications(data || []);
      }
    } catch (error) {
      console.error('Fetch verifications error:', error);
      Alert.alert('Error', 'Failed to load verifications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleVerificationAction = async (recyclerId: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      // Get current admin user
      const { data: { user: currentAdminUser } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('recyclers')
        .update({
          verification_status: action === 'approve' ? 'approved' : 'rejected',
          admin_verified: action === 'approve',
          admin_verification_date: new Date().toISOString(),
          admin_verified_by: currentAdminUser?.id || null,
          admin_notes: notes || null,
          verification_expires_at: action === 'approve' 
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
            : null
        })
        .eq('id', recyclerId);

      if (error) {
        console.error('Error updating verification:', error);
        Alert.alert('Error', 'Failed to update verification status.');
        return;
      }

      // Update user metadata using RPC function
      const { error: metadataError } = await supabase.rpc('update_user_verification_status', {
        user_id: recyclerId,
        verification_status: action === 'approve' ? 'approved' : 'rejected',
        admin_verified: action === 'approve',
        admin_verification_date: new Date().toISOString(),
        admin_notes: notes || null
      });

      if (metadataError) {
        console.error('Error updating user metadata:', metadataError);
        // Don't fail the whole operation, just log the error
      }

      // Create notification for the recycler
      const notificationMessage = action === 'approve' 
        ? `🎉 Congratulations! Your verification has been approved. You can now start accepting waste collection requests and earning money.`
        : `Your verification request has been reviewed. Unfortunately, it was not approved at this time. Please review the admin notes and resubmit your application.`;

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: recyclerId,
          title: action === 'approve' ? 'Verification Approved!' : 'Verification Update',
          message: notificationMessage,
          type: 'verification',
          is_read: false,
          created_at: new Date().toISOString(),
          action_data: action === 'reject' ? {
            action_type: 'retry_verification',
            deep_link: '/recycler-screens/RecyclerEditProfileScreen',
            button_text: 'Retry Verification',
            section: 'verification_info'
          } : null,
        });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Don't fail the whole operation, just log the error
      }

      Alert.alert(
        'Success', 
        `Recycler ${action === 'approve' ? 'approved' : 'rejected'} successfully. ${action === 'approve' ? 'They have been notified and can now start accepting requests.' : 'They have been notified of the decision.'}`
      );
      
      fetchVerifications(); // Refresh the list
    } catch (error) {
      console.error('Verification action error:', error);
      Alert.alert('Error', 'Failed to process verification action.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVerifications();
  };

  const handleBack = () => {
    router.back();
  };

  const handleViewLicense = (licenseUri: string) => {
    if (!licenseUri || licenseUri === 'N/A') {
      Alert.alert('No License', 'No driver\'s license provided by this recycler.');
      return;
    }

    // Check if it's a PDF file
    const isPdf = licenseUri.toLowerCase().includes('.pdf') || licenseUri.toLowerCase().includes('pdf');
    
    if (isPdf) {
      // For PDF files, open in external app
      Alert.alert(
        'Open PDF',
        'This is a PDF document. Would you like to open it in your default PDF viewer?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open PDF', 
            onPress: () => {
              Linking.openURL(licenseUri).catch(() => {
                Alert.alert('Error', 'Could not open PDF. The file may be inaccessible or you may not have a PDF viewer installed.');
              });
            }
          }
        ]
      );
    } else {
      // For image files, show in modal
      setSelectedImageUri(licenseUri);
      setImageModalVisible(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'approved': return '#4CAF50';
      case 'rejected': return '#F44336';
      case 'expired': return '#9E9E9E';
      default: return '#666666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'schedule';
      case 'approved': return 'check-circle';
      case 'rejected': return 'cancel';
      case 'expired': return 'timer-off';
      default: return 'help';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const pendingVerifications = verifications.filter(v => v.verification_status === 'pending');
  const approvedVerifications = verifications.filter(v => v.verification_status === 'approved');
  const rejectedVerifications = verifications.filter(v => v.verification_status === 'rejected');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <MaterialIcons name="verified-user" size={48} color="#207E06" />
          <Text style={styles.loadingText}>Loading Verifications...</Text>
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
          <Text style={styles.headerTitle}>Recycler Verifications</Text>
          <Text style={styles.headerSubtitle}>Review and manage applications</Text>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <MaterialIcons name="schedule" size={24} color="#FFA500" />
          </View>
          <Text style={styles.statNumber}>{pendingVerifications.length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
          </View>
          <Text style={styles.statNumber}>{approvedVerifications.length}</Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <MaterialIcons name="cancel" size={24} color="#F44336" />
          </View>
          <Text style={styles.statNumber}>{rejectedVerifications.length}</Text>
          <Text style={styles.statLabel}>Rejected</Text>
        </View>
      </View>

      {/* Verifications List */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {verifications.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="verified-user" size={64} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No Verifications</Text>
            <Text style={styles.emptySubtitle}>No recycler verification requests found</Text>
          </View>
        ) : (
          verifications.map((verification) => (
            <View key={verification.id} style={styles.verificationCard}>
              <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                  <View style={styles.avatar}>
                    {verification.profile_photo_url ? (
                      <Image 
                        source={{ uri: verification.profile_photo_url }} 
                        style={styles.avatarImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <MaterialIcons name="person" size={24} color="#207E06" />
                    )}
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{verification.full_name}</Text>
                    <Text style={styles.userEmail}>{verification.email}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(verification.verification_status) + '20' }]}>
                  <MaterialIcons 
                    name={getStatusIcon(verification.verification_status) as any} 
                    size={16} 
                    color={getStatusColor(verification.verification_status)} 
                  />
                  <Text style={[styles.statusText, { color: getStatusColor(verification.verification_status) }]}>
                    {verification.verification_status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                  <MaterialIcons name="phone" size={16} color="#666666" />
                  <Text style={styles.infoText}>{verification.phone}</Text>
                </View>
                <View style={styles.infoRow}>
                  <MaterialIcons name="business" size={16} color="#666666" />
                  <Text style={styles.infoText}>{verification.company_name || 'No company name'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <MaterialIcons name="location-on" size={16} color="#666666" />
                  <Text style={styles.infoText}>{verification.residential_address}</Text>
                </View>
                <View style={styles.infoRow}>
                  <MaterialIcons name="map" size={16} color="#666666" />
                  <Text style={styles.infoText}>{verification.areas_of_operation}</Text>
                </View>
                <View style={styles.infoRow}>
                  <MaterialIcons name="local-shipping" size={16} color="#666666" />
                  <Text style={styles.infoText}>{verification.truck_size} - {verification.truck_number_plate}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.infoRow} 
                  onPress={() => handleViewLicense(verification.drivers_license)}
                >
                  <MaterialIcons name="card-membership" size={16} color="#666666" />
                  <Text style={[styles.infoText, verification.drivers_license && verification.drivers_license !== 'N/A' ? styles.clickableText : null]}>
                    {verification.drivers_license && verification.drivers_license !== 'N/A' 
                      ? 'Tap to view driver\'s license document' 
                      : 'No license provided'
                    }
                  </Text>
                  {verification.drivers_license && verification.drivers_license !== 'N/A' && (
                    <MaterialIcons name="visibility" size={16} color="#207E06" style={{ marginLeft: 8 }} />
                  )}
                </TouchableOpacity>
                <View style={styles.infoRow}>
                  <MaterialIcons name="schedule" size={16} color="#666666" />
                  <Text style={styles.infoText}>Requested: {formatDate(verification.verification_request_date)}</Text>
                </View>
              </View>

              {verification.admin_notes && (
                <View style={styles.notesSection}>
                  <Text style={styles.notesLabel}>Admin Notes:</Text>
                  <Text style={styles.notesText}>{verification.admin_notes}</Text>
                </View>
              )}

              {verification.verification_status === 'pending' && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleVerificationAction(verification.id, 'approve')}
                  >
                    <MaterialIcons name="check" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleVerificationAction(verification.id, 'reject')}
                  >
                    <MaterialIcons name="close" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Driver&apos;s License Document</Text>
              <TouchableOpacity 
                onPress={() => setImageModalVisible(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color="#666666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.imageContainer} showsVerticalScrollIndicator={false}>
              <Image 
                source={{ uri: selectedImageUri }} 
                style={styles.licenseImage}
                resizeMode="contain"
                onError={() => {
                  Alert.alert('Error', 'Failed to load image. The file may be corrupted or inaccessible.');
                  setImageModalVisible(false);
                }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  verificationCard: {
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
     backgroundColor: '#F0F8F0',
     borderRadius: 20,
     width: 40,
     height: 40,
     justifyContent: 'center',
     alignItems: 'center',
     marginRight: 12,
   },
   avatarImage: {
     width: 40,
     height: 40,
     borderRadius: 20,
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
    marginBottom: 16,
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
  clickableText: {
    color: '#207E06',
    textDecorationLine: 'underline',
  },
  notesSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  closeButton: {
    padding: 4,
  },
  imageContainer: {
    maxHeight: 400,
  },
  licenseImage: {
    width: '100%',
    height: 400,
  },
});

