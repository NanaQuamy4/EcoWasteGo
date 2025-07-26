import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PrivacyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const fromRegister = params.fromRegister === 'true';
  const [agree, setAgree] = useState(false);
  const [disagree, setDisagree] = useState(true);

  const handleAgree = () => {
    setAgree(true);
    setDisagree(false);
  };
  const handleDisagree = () => {
    setDisagree(true);
    setAgree(false);
  };

  const handleSubmit = () => {
    if (fromRegister && agree) {
      router.replace({ pathname: '/RegisterScreen', params: { privacyAgreed: 'true' } });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#263A13" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy for EcoWasteGo</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Effective Date: <Text style={styles.sectionBold}>[22/07/2025]</Text></Text>
        <Text style={styles.sectionTitle}>Last Updated: <Text style={styles.sectionBold}>[29/08/2025]</Text></Text>
        <Text style={styles.sectionBold}>EcoWasteGo</Text>
        <Text style={styles.sectionText}>
          ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and disclose information when you use our mobile application and services (collectively, the "App").
        </Text>
        <Text style={styles.sectionText}>
          By using EcoWasteGo, you agree to the terms of this Privacy Policy.
        </Text>
        <Text style={styles.sectionHeader}>1. Information We Collect</Text>
        <Text style={styles.sectionSubHeader}>We may collect the following information when you use our App:</Text>
        <Text style={styles.sectionList}>
          a. <Text style={styles.sectionBold}>Personal Information</Text>{"\n"}
          • Name{"\n"}
          • Email address{"\n"}
          • Phone number{"\n"}
          • Role (User or Recycler){"\n"}
          • Profile photo (optional)
        </Text>
        <Text style={styles.sectionList}>
          b. <Text style={styles.sectionBold}>Location Information</Text>{"\n"}
          • Real-time location for tracking pickups and drop-offs (with permission)
        </Text>
        <Text style={styles.sectionList}>
          c. <Text style={styles.sectionBold}>Device & Usage Data</Text>{"\n"}
          • Device type and operating system{"\n"}
          • App usage statistics{"\n"}
          • Crash logs and performance metrics
        </Text>
        <Text style={styles.sectionList}>
          d. <Text style={styles.sectionBold}>Authentication Data</Text>{"\n"}
          • Information from sign-in methods (e.g., Clerk, Google, Apple)
        </Text>
        <Text style={styles.sectionList}>
          e. <Text style={styles.sectionBold}>Waste Pickup Data</Text>{"\n"}
          • Waste type{"\n"}
          • Pickup location{"\n"}
          • Status of requests (pending, accepted, completed)
        </Text>
        <Text style={styles.sectionHeader}>2. How We Use Your Information</Text>
        <Text style={styles.sectionList}>
          • Create and manage your account{"\n"}
          • Match users with certified recyclers{"\n"}
          • Track real-time location (for recyclers and users){"\n"}
          • Send notifications related to pickups{"\n"}
          • Analyze usage and improve app performance{"\n"}
          • Comply with legal obligations
        </Text>
        <Text style={styles.sectionHeader}>3. Sharing Your Information</Text>
        <Text style={styles.sectionText}>
          We do not sell your personal information. However, we may share it in the following ways:
        </Text>
        <Text style={styles.sectionList}>
          • With certified recyclers for pickup coordination{"\n"}
          • With service providers (e.g., Google Maps, Clerk) under strict privacy agreements{"\n"}
          • With law enforcement if required by law
        </Text>
        <Text style={styles.sectionHeader}>4. 🌐 Third-Party Services</Text>
        <Text style={styles.sectionList}>
          We use trusted third-party services, including:{"\n"}
          • Clerk – for user authentication and account management{"\n"}
          • MongoDB Atlas – for secure cloud database storage{"\n"}
          • Google Maps API – for location and map features{"\n"}
          • Expo – for app development and deployment{"\n"}
          Each service provider has its own privacy policy.
        </Text>
        <Text style={styles.sectionHeader}>5. Data Security</Text>
        <Text style={styles.sectionText}>
          We use industry-standard encryption and security practices to protect your data. However, no method of transmission over the internet is 100% secure.
        </Text>
        <Text style={styles.sectionHeader}>6. Location Permissions</Text>
        <Text style={styles.sectionList}>
          We request access to your device’s location to enable:{"\n"}
          • Real-time pickup tracking for recyclers{"\n"}
          • Map-based pickup requests for users{"\n"}
          You can revoke location access at any time through your device settings, but some features may become unavailable.
        </Text>
        <Text style={styles.sectionHeader}>7. Data Retention</Text>
        <Text style={styles.sectionText}>
          We retain your information for as long as your account is active or as needed for legal, regulatory, or operational purposes.
        </Text>
        <Text style={styles.sectionHeader}>8. Your Rights</Text>
        <Text style={styles.sectionList}>
          You have the right to:{"\n"}
          • Access and update your information{"\n"}
          • Request deletion of your account{"\n"}
          • Withdraw consent for data use{"\n"}
          To exercise these rights, contact us at: ecowastego@gmail.com
        </Text>
        <Text style={styles.sectionHeader}>9. Children’s Privacy</Text>
        <Text style={styles.sectionText}>
          EcoWasteGo is not intended for children under 13. We do not knowingly collect data from minors.
        </Text>
        <Text style={styles.sectionHeader}>10. Changes to This Policy</Text>
        <Text style={styles.sectionText}>
          We may update this Privacy Policy from time to time. We’ll notify you of significant changes through the App or via email.
        </Text>
        <Text style={styles.sectionHeader}>11. 📬 Contact Us</Text>
        <Text style={styles.sectionText}>
          If you have any questions or concerns, contact us at:
        </Text>
        <Text style={styles.sectionList}>
          Email: ecowastego@gmail.com{"\n"}
          Company: EcoWasteGo{"\n"}
          Address: [-------------------------------]
        </Text>
        {fromRegister && (
          <>
            <View style={styles.checkboxRow}>
              <TouchableOpacity style={styles.checkbox} onPress={handleDisagree}>
                <View style={[styles.checkboxBox, disagree && styles.checkboxChecked]}>
                  {disagree && <Text style={styles.checkboxTick}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}><Text style={{fontWeight:'bold'}}>I Disagree</Text> to all terms and conditions</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.checkboxRow}>
              <TouchableOpacity style={styles.checkbox} onPress={handleAgree}>
                <View style={[styles.checkboxBox, agree && styles.checkboxChecked]}>
                  {agree && <Text style={styles.checkboxTick}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}><Text style={{fontWeight:'bold'}}>I Agree</Text> to all terms and conditions</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.submitButton, !agree && styles.submitButtonDisabled]} disabled={!agree} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>SUBMIT</Text>
            </TouchableOpacity>
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#CFDFBF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 2,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#263A13',
    flex: 1,
    textAlign: 'center',
    marginRight: 36,
  },
  content: {
    padding: 18,
    paddingBottom: 0,
  },
  pillWrapper: {
    alignItems: 'center',
    marginBottom: 18,
  },
  policyPill: {
    backgroundColor: '#fff',
    color: '#263A13',
    fontWeight: 'bold',
    fontSize: 18,
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 8,
    textAlign: 'center',
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#263A13',
    marginBottom: 2,
  },
  sectionBold: {
    fontWeight: 'bold',
    color: '#263A13',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#263A13',
    marginTop: 18,
    marginBottom: 4,
  },
  sectionSubHeader: {
    fontSize: 14,
    color: '#263A13',
    marginBottom: 4,
  },
  sectionText: {
    fontSize: 14,
    color: '#263A13',
    marginBottom: 8,
  },
  sectionList: {
    fontSize: 14,
    color: '#263A13',
    marginBottom: 8,
    marginLeft: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#263A13',
    borderRadius: 4,
    marginRight: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#263A13',
    borderColor: '#263A13',
  },
  checkboxTick: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#263A13',
  },
  submitButton: {
    backgroundColor: '#263A13',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#B6CDBD',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 