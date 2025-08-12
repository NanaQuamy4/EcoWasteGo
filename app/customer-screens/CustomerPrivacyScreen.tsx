import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CustomerPrivacyScreen() {
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
        <Text style={styles.headerTitle}>Customer Privacy Policy</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Effective Date: <Text style={styles.sectionBold}>[22/07/2025]</Text></Text>
        <Text style={styles.sectionTitle}>Last Updated: <Text style={styles.sectionBold}>[29/08/2025]</Text></Text>
        <Text style={styles.sectionBold}>EcoWasteGo - Customer Privacy Policy</Text>
        <Text style={styles.sectionText}>
          This privacy policy specifically addresses how we handle your personal information as a customer using EcoWasteGo&apos;s waste disposal services.
        </Text>
        
        <Text style={styles.sectionHeader}>1. Customer-Specific Information We Collect</Text>
        <Text style={styles.sectionSubHeader}>As a customer, we collect:</Text>
        <Text style={styles.sectionList}>
          a. <Text style={styles.sectionBold}>Personal Information</Text>{"\n"}
          • Name and contact details{"\n"}
          • Email address and phone number{"\n"}
          • Residential address for pickup scheduling{"\n"}
          • Profile photo (optional)
        </Text>
        <Text style={styles.sectionList}>
          b. <Text style={styles.sectionBold}>Waste Disposal Data</Text>{"\n"}
          • Types of waste you dispose of{"\n"}
          • Pickup location and timing{"\n"}
          • Waste quantity and descriptions{"\n"}
          • Disposal history and patterns
        </Text>
        <Text style={styles.sectionList}>
          c. <Text style={styles.sectionBold}>Location Information</Text>{"\n"}
          • Pickup address for service coordination{"\n"}
          • Real-time location during active pickups (with permission){"\n"}
          • Preferred pickup locations
        </Text>
        <Text style={styles.sectionList}>
          d. <Text style={styles.sectionBold}>Payment Information</Text>{"\n"}
          • Payment method details{"\n"}
          • Transaction history{"\n"}
          • Billing address
        </Text>

        <Text style={styles.sectionHeader}>2. How We Use Your Customer Data</Text>
        <Text style={styles.sectionList}>
          • Schedule and coordinate waste pickups{"\n"}
          • Match you with certified recyclers in your area{"\n"}
          • Process payments and manage billing{"\n"}
          • Track your environmental impact and rewards{"\n"}
          • Send service notifications and updates{"\n"}
          • Provide customer support and assistance
        </Text>

        <Text style={styles.sectionHeader}>3. Sharing Your Information with Recyclers</Text>
        <Text style={styles.sectionText}>
          To provide our services, we share limited information with certified recyclers:
        </Text>
        <Text style={styles.sectionList}>
          • Your name and contact number for pickup coordination{"\n"}
          • Pickup address and timing{"\n"}
          • Waste type and quantity{"\n"}
          • Special instructions or requirements
        </Text>
        <Text style={styles.sectionText}>
          Recyclers are contractually bound to protect your information and use it only for service delivery.
        </Text>

        <Text style={styles.sectionHeader}>4. Your Privacy Rights as a Customer</Text>
        <Text style={styles.sectionList}>
          • <Text style={styles.sectionBold}>Control Your Data:</Text> Update or delete your account{"\n"}
          • <Text style={styles.sectionBold}>Location Privacy:</Text> Revoke location access anytime{"\n"}
          • <Text style={styles.sectionBold}>Service History:</Text> View and manage your disposal records{"\n"}
          • <Text style={styles.sectionBold}>Communication Preferences:</Text> Control notification settings{"\n"}
          • <Text style={styles.sectionBold}>Data Portability:</Text> Request a copy of your data
        </Text>

        <Text style={styles.sectionHeader}>5. Location and Pickup Privacy</Text>
        <Text style={styles.sectionText}>
          We understand the sensitivity of your pickup location. We:
        </Text>
        <Text style={styles.sectionList}>
          • Only share your address with assigned recyclers{"\n"}
          • Use secure location tracking only during active pickups{"\n"}
          • Allow you to set pickup preferences and restrictions{"\n"}
          • Provide options for alternative pickup locations
        </Text>

        <Text style={styles.sectionHeader}>6. Payment and Financial Privacy</Text>
        <Text style={styles.sectionText}>
          Your payment information is protected through:
        </Text>
        <Text style={styles.sectionList}>
          • Encrypted payment processing{"\n"}
          • Secure transaction handling{"\n"}
          • Limited access to payment details{"\n"}
          • Compliance with financial data regulations
        </Text>

        <Text style={styles.sectionHeader}>7. Environmental Impact Tracking</Text>
        <Text style={styles.sectionText}>
          We track your environmental contributions to:
        </Text>
        <Text style={styles.sectionList}>
          • Calculate your carbon footprint reduction{"\n"}
          • Award points and rewards{"\n"}
          • Provide sustainability insights{"\n"}
          • Share community impact statistics (anonymized)
        </Text>

        <Text style={styles.sectionHeader}>8. Customer Support and Communication</Text>
        <Text style={styles.sectionList}>
          We may contact you for:{"\n"}
          • Service confirmations and updates{"\n"}
          • Pickup scheduling and coordination{"\n"}
          • Payment processing and billing{"\n"}
          • Customer satisfaction surveys{"\n"}
          • Important service announcements
        </Text>

        <Text style={styles.sectionHeader}>9. Data Retention for Customers</Text>
        <Text style={styles.sectionText}>
          We retain your customer data for:{"\n"}
          • Active account period plus 2 years{"\n"}
          • Service history for 5 years{"\n"}
          • Payment records as required by law{"\n"}
          • Environmental impact data indefinitely (anonymized)
        </Text>

        <Text style={styles.sectionHeader}>10. Contact Information</Text>
        <Text style={styles.sectionText}>
          For customer privacy concerns:
        </Text>
        <Text style={styles.sectionList}>
          Email: ecowastego@gmail.com{"\n"}
          Customer Support: Available in-app{"\n"}
          Response Time: Within 24 hours
        </Text>

        {fromRegister && (
          <>
            <View style={styles.checkboxRow}>
              <TouchableOpacity style={styles.checkbox} onPress={handleDisagree}>
                <View style={[styles.checkboxBox, disagree && styles.checkboxChecked]}>
                  {disagree && <Text style={styles.checkboxTick}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}><Text style={{fontWeight:'bold'}}>I Disagree</Text> to the customer privacy policy</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.checkboxRow}>
              <TouchableOpacity style={styles.checkbox} onPress={handleAgree}>
                <View style={[styles.checkboxBox, agree && styles.checkboxChecked]}>
                  {agree && <Text style={styles.checkboxTick}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}><Text style={{fontWeight:'bold'}}>I Agree</Text> to the customer privacy policy</Text>
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
