import { Entypo, Feather, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AppHeader from '../../components/AppHeader';
import DrawerMenu from '../../components/DrawerMenu';
// import BottomNav from '../../components/BottomNav';

const MENU_ITEMS = [
  { label: 'Education', icon: <FontAwesome5 name="book-medical" size={22} color="#22330B" />, key: 'education' },
  { label: 'History', icon: <Feather name="rotate-ccw" size={22} color="#22330B" />, key: 'history' },
  { label: 'Rewards', icon: <Feather name="gift" size={22} color="#22330B" />, key: 'rewards' },
  { label: 'Notification', icon: <Ionicons name="notifications-outline" size={22} color="#22330B" />, key: 'notification' },
  { label: 'Help', icon: <Feather name="help-circle" size={22} color="#22330B" />, key: 'help' },
  { label: 'Contact Us', icon: <Entypo name="address" size={22} color="#22330B" />, key: 'contact' },
  { label: 'About', icon: <Feather name="info" size={22} color="#22330B" />, key: 'about' },
];

export default function UserScreen() {
  // const [activeTab, setActiveTab] = useState('User');
  const user = {
    name: 'Williams Boampong',
    email: 'nanaquamy4@gmail.com',
    phone: '54 673 2719',
    status: 'user',
  };

  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [showLogoutPrompt, setShowLogoutPrompt] = useState(false);
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
  const screenWidth = Dimensions.get('window').width;
  const drawerWidth = screenWidth * 0.78;

  return (
    <View style={styles.container}>
      <AppHeader onMenuPress={() => setDrawerOpen(true)} />
      <DrawerMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} user={user} />
      {/* Banner with blend.jpg */}
      <View style={styles.bannerWrapper}>
        <ImageBackground source={require('../../assets/images/blend.jpg')} style={styles.bannerBg} imageStyle={[styles.bannerImage, { opacity: 0.7 }]}>
          {/* Pill floats inside the banner */}
          <View style={styles.bannerContentBetter}>
            <View style={styles.personalInfoPillTall}>
              <View style={styles.personalInfoRowTall}>
                <MaterialIcons name="person" size={26} color="#fff" style={styles.pillIconCircle} />
                <Text style={styles.personalInfoTextTall}>Personal Info</Text>
                <View style={{ flex: 1 }} />
                <TouchableOpacity style={styles.editButton} onPress={() => router.push('/EditProfileScreen')}>
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', width: '100%' }}>
                <View style={{ width: 32 }} />
                <Text style={styles.myAccountTextSmall}>My Account</Text>
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>
      {/* Green container for fields and actions, starts immediately after banner */}
    <View style={styles.greenContentContainerNoOverlap}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.fieldsWrapper}>
            {/* Name Field */}
            <View style={styles.inputRow}>
              <MaterialIcons name="person" size={20} color="#263A13" style={styles.inputIcon} />
              <TextInput value={user.name} editable={false} style={styles.input} />
            </View>
            {/* Email Field */}
            <View style={styles.inputRow}>
              <MaterialIcons name="email" size={20} color="#263A13" style={styles.inputIcon} />
              <TextInput value={user.email} editable={false} style={styles.input} />
            </View>
            {/* Phone Field with country code inside */}
            <View style={styles.inputRow}>
              <View style={styles.countryCodeWrapper}>
                <Text style={styles.countryCodeText}>+233</Text>
                <MaterialIcons name="arrow-drop-down" size={20} color="#263A13" />
              </View>
              <TextInput value={user.phone} editable={false} style={styles.input} />
            </View>
            {/* Password Field */}
            <View style={styles.inputRow}>
              <MaterialIcons name="lock" size={20} color="#263A13" style={styles.inputIcon} />
              <TextInput value={"**************"} editable={false} secureTextEntry style={styles.input} />
              <Feather name="eye-off" size={20} color="#263A13" style={styles.eyeIcon} />
            </View>
          </View>
          {/* User status and actions */}
          <View style={styles.actionsWrapper}>
            <View style={styles.statusRow}>
              <MaterialIcons name="verified-user" size={20} color="#263A13" style={styles.actionIcon} />
              <Text style={styles.statusLabel}>User status</Text>
              <View style={styles.statusPill}>
                <Text style={styles.statusText}>{user.status}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/RecyclerRegistrationScreen')}>
              <MaterialIcons name="recycling" size={20} color="#263A13" style={styles.actionIcon} />
              <Text style={styles.actionLabel}>Join as a Recycler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/PrivacyScreen')}>
              <MaterialIcons name="lock" size={20} color="#263A13" style={styles.actionIcon} />
              <Text style={styles.actionLabel}>Privacy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionRow} onPress={() => setShowLogoutPrompt(true)}>
              <MaterialIcons name="logout" size={20} color="#263A13" style={styles.actionIcon} />
              <Text style={styles.actionLabel}>Log out</Text>
            </TouchableOpacity>
            {showLogoutPrompt && (
              <View style={styles.deletePromptContainer} pointerEvents="box-none">
                <Text style={styles.deletePromptText}>
                  Do you want to log out?
                </Text>
                <View style={styles.deletePromptActions}>
                  <TouchableOpacity onPress={handleLogoutYes} style={styles.promptYes}>
                    <Text style={styles.promptYesText}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleLogoutNo} style={styles.promptNo}>
                    <Text style={styles.promptNoText}>No</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            <TouchableOpacity style={styles.actionRow} onPress={() => setShowDeletePrompt(true)}>
              <MaterialIcons name="delete" size={25} color="#263A13" style={styles.actionIcon} />
              <Text style={styles.actionLabel}>Delete account</Text>
            </TouchableOpacity>
            {showDeletePrompt && (
              <View style={styles.deletePromptContainer} pointerEvents="box-none">
                {deleteStep === 1 ? (
                  <>
                    <Text style={styles.deletePromptText}>
                      Are you sure you want to {"\n"}permanently delete the account?
                    </Text>
                    <View style={styles.deletePromptActions}>
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
                    <Text style={styles.deletePromptText}>
                      Are you sure you want to {"\n"}permanently delete the account?
                    </Text>
                  </>
                )}
              </View>
            )}
          </View>
          <View style={{ height: 80 }} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  bannerWrapper: {
    marginHorizontal: 0,
    marginTop: 16,
    borderRadius: 20,
    height: 100,
    zIndex: 2,
    position: 'relative',
  },
  bannerBg: {
    flex: 1,
    justifyContent: 'center',
  },
  bannerImage: {
    borderRadius: 20,
    height: 100,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personalInfoPill: {
    backgroundColor: '#263A13',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillIcon: {
    marginRight: 6,
  },
  personalInfoText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  myAccountText: {
    marginLeft: 0,
    color: '#263A13',
    fontSize: 15,
    fontWeight: 'bold',
    alignSelf: 'center',
  },
  editButton: {
    backgroundColor: '#263A13',
    borderRadius: 16,
    paddingHorizontal: 10, // increased from 4
    paddingVertical: 4,
    elevation: 2,
    minWidth: 48, // increased from 32
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  gapBelowBanner: {
    height: 18,
  },
  fieldsWrapper: {
    marginHorizontal: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#B6CDBD',
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#263A13',
    fontWeight: 'bold',
    fontSize: 16,
    paddingVertical: 10,
  },
  countryCodeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  countryCodeText: {
    color: '#263A13',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 2,
  },
  eyeIcon: {
    marginLeft: 8,
  },
  actionsWrapper: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20, // increased spacing
    marginTop: 12, // add top margin for separation
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10, // compact
    backgroundColor: '#fff',
    borderRadius: 14, // slightly larger
    paddingVertical: 8, // slightly larger
    paddingHorizontal: 28, // much larger for horizontal length
    alignSelf: 'flex-start',
    minWidth: 220, // ensure a minimum horizontal length
  },
  actionIcon: {
    marginRight: 14, // more space from text
  },
  statusLabel: {
    fontWeight: 'bold',
    color: '#263A13',
    fontSize: 16,
  },
  statusPill: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 8, // compact
    paddingVertical: 4, // compact
    marginLeft: 8, // compact
    borderWidth: 1,
    borderColor: '#A3C47C',
    alignSelf: 'flex-start',
    minWidth: 0,
  },
  statusText: {
    color: '#263A13',
    fontWeight: 'bold',
    fontSize: 19, // larger font
    letterSpacing: 0.5,
    textTransform: 'capitalize',
  },
  actionLabel: {
    color: '#263A13',
    fontSize: 19, // larger font
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerContentBetter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center', // center vertically
    justifyContent: 'center', // center horizontally
    height: '100%',
  },
  centeredHeaderGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  myAccountTextBetter: {
    marginLeft: 0,
    color: '#263A13',
    fontSize: 25,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
  },
  personalInfoPillColumn: {
    backgroundColor: '#263A13',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personalInfoPillTall: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 240, // increased from 180
    maxWidth: '90%', // increased from 65%
    alignSelf: 'center',
  },
  personalInfoRowTall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '90%',
  },
  personalInfoTextTall: {
    color: '#263A13',
    fontWeight: 'bold',
    fontSize: 23, // larger font
    marginLeft: 8,
    alignContent: 'center',
    alignItems: 'center',
  },
  myAccountTextSmall: {
    color: '#263A13',
    fontSize: 15, // slightly larger
    fontWeight: 'bold',
    marginTop: 0,
    paddingLeft: 20,
  },
  pillIconCircle: {
    marginRight: 0,
    backgroundColor: '#263A13',
    borderRadius: 16,
    paddingTop: 0,
    padding: 2,
  },
  greenContentContainerNoOverlap: {
    flex: 1,
    backgroundColor: '#CFDFBF',
    marginTop: -32, // pull the green background up so the image rectangle floats above
    paddingTop: 80, // extend the green background even further up
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 1,
  },
  deletePromptContainer: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    alignSelf: 'center',
    width: '70%',
    marginTop: 0,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  deleteButton: {
    backgroundColor: 'red',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginBottom: 12,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  deletePromptText: {
    color: '#222',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
  },
  deletePromptActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  promptYes: {
    backgroundColor: '#eee',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 6,
  },
  promptYesText: {
    color: '#263A13',
    fontWeight: 'bold',
  },
  promptNo: {
    backgroundColor: '#eee',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  promptNoText: {
    color: '#263A13',
    fontWeight: 'bold',
  },
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.18)',
    zIndex: 99,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#C7CCC1',
    zIndex: 101,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 2,
    marginBottom: 2,
  },
  menuItemText: {
    color: '#22330B',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 18,
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    width: 230,
  },
}); 