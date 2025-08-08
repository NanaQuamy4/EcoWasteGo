import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RecyclerPrivacyScreen() {
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
        <Text style={styles.headerTitle}>Recycler Privacy Policy</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Effective Date: <Text style={styles.sectionBold}>[22/07/2025]</Text></Text>
        <Text style={styles.sectionTitle}>Last Updated: <Text style={styles.sectionBold}>[29/08/2025]</Text></Text>
        <Text style={styles.sectionBold}>EcoWasteGo - Recycler Privacy Policy</Text>
        <Text style={styles.sectionText}>
          This privacy policy specifically addresses how we handle your information as a certified recycler providing waste management services through EcoWasteGo.
        </Text>
        
        <Text style={styles.sectionHeader}>1. Recycler-Specific Information We Collect</Text>
        <Text style={styles.sectionSubHeader}>As a recycler, we collect:</Text>
        <Text style={styles.sectionList}>
          a. <Text style={styles.sectionBold}>Business Information</Text>{"\n"}
          • Company name and business registration{"\n"}
          • Professional certifications and licenses{"\n"}
          • Business address and service areas{"\n"}
          • Tax identification and business documents
        </Text>
        <Text style={styles.sectionList}>
          b. <Text style={styles.sectionBold}>Operational Data</Text>{"\n"}
          • Vehicle information and capacity{"\n"}
          • Equipment and processing capabilities{"\n"}
          • Service availability and scheduling{"\n"}
          • Operational hours and coverage areas
        </Text>
        <Text style={styles.sectionList}>
          c. <Text style={styles.sectionBold}>Financial Information</Text>{"\n"}
          • Payment processing details{"\n"}
          • Earnings and transaction history{"\n"}
          • Commission and fee structures{"\n"}
          • Tax reporting information
        </Text>
        <Text style={styles.sectionList}>
          d. <Text style={styles.sectionBold}>Performance Metrics</Text>{"\n"}
          • Service completion rates{"\n"}
          • Customer satisfaction scores{"\n"}
          • Environmental impact data{"\n"}
          • Quality assurance metrics
        </Text>

        <Text style={styles.sectionHeader}>2. How We Use Your Recycler Data</Text>
        <Text style={styles.sectionList}>
          • Match you with appropriate customer requests{"\n"}
          • Process payments and manage earnings{"\n"}
          • Track service quality and performance{"\n"}
          • Provide operational support and training{"\n"}
          • Generate business analytics and insights{"\n"}
          • Ensure compliance with environmental regulations
        </Text>

        <Text style={styles.sectionHeader}>3. Customer Data Handling Responsibilities</Text>
        <Text style={styles.sectionText}>
          As a recycler, you will receive limited customer information for service delivery:
        </Text>
        <Text style={styles.sectionList}>
          • Customer name and contact number{"\n"}
          • Pickup address and timing{"\n"}
          • Waste type and quantity{"\n"}
          • Special instructions or requirements
        </Text>
        <Text style={styles.sectionText}>
          You are contractually obligated to:{"\n"}
          • Use customer data only for service delivery{"\n"}
          • Maintain strict confidentiality{"\n"}
          • Not share customer information with third parties{"\n"}
          • Delete customer data after service completion
        </Text>

        <Text style={styles.sectionHeader}>4. Location and Operational Privacy</Text>
        <Text style={styles.sectionText}>
          We track your location for operational purposes:
        </Text>
        <Text style={styles.sectionList}>
          • Real-time location during active pickups{"\n"}
          • Service area coverage and availability{"\n"}
          • Route optimization and efficiency tracking{"\n"}
          • Emergency response and safety monitoring
        </Text>
        <Text style={styles.sectionText}>
          Location data is used only for service coordination and is not shared with customers beyond necessary pickup coordination.
        </Text>

        <Text style={styles.sectionHeader}>5. Financial and Earnings Privacy</Text>
        <Text style={styles.sectionText}>
          Your financial information is protected through:
        </Text>
        <Text style={styles.sectionList}>
          • Encrypted payment processing{"\n"}
          • Secure earnings tracking and reporting{"\n"}
          • Confidential commission calculations{"\n"}
          • Protected tax and financial records
        </Text>

        <Text style={styles.sectionHeader}>6. Professional Liability and Insurance</Text>
        <Text style={styles.sectionText}>
          We maintain records related to:
        </Text>
        <Text style={styles.sectionList}>
          • Insurance coverage and claims{"\n"}
          • Safety records and incident reports{"\n"}
          • Regulatory compliance documentation{"\n"}
          • Professional certifications and renewals
        </Text>

        <Text style={styles.sectionHeader}>7. Environmental Compliance Data</Text>
        <Text style={styles.sectionText}>
          We track environmental compliance for:
        </Text>
        <Text style={styles.sectionList}>
          • Waste processing and disposal methods{"\n"}
          • Environmental impact measurements{"\n"}
          • Regulatory compliance reporting{"\n"}
          • Sustainability certification maintenance
        </Text>

        <Text style={styles.sectionHeader}>8. Your Rights as a Recycler</Text>
        <Text style={styles.sectionList}>
          • <Text style={styles.sectionBold}>Business Data Control:</Text> Update business information{"\n"}
          • <Text style={styles.sectionBold}>Earnings Privacy:</Text> Control earnings visibility{"\n"}
          • <Text style={styles.sectionBold}>Service History:</Text> Access your service records{"\n"}
          • <Text style={styles.sectionBold}>Performance Analytics:</Text> View your metrics{"\n"}
          • <Text style={styles.sectionBold}>Data Portability:</Text> Request business data export
        </Text>

        <Text style={styles.sectionHeader}>9. Communication and Support</Text>
        <Text style={styles.sectionList}>
          We may contact you for:{"\n"}
          • Service coordination and scheduling{"\n"}
          • Payment processing and earnings updates{"\n"}
          • Training and professional development{"\n"}
          • Regulatory compliance updates{"\n"}
          • Emergency notifications and safety alerts
        </Text>

        <Text style={styles.sectionHeader}>10. Data Retention for Recyclers</Text>
        <Text style={styles.sectionText}>
          We retain your recycler data for:{"\n"}
          • Active account period plus 5 years{"\n"}
          • Service history for 7 years{"\n"}
          • Financial records as required by law{"\n"}
          • Environmental compliance data indefinitely
        </Text>

        <Text style={styles.sectionHeader}>11. Third-Party Service Providers</Text>
        <Text style={styles.sectionText}>
          We work with trusted service providers for:
        </Text>
        <Text style={styles.sectionList}>
          • Payment processing and financial services{"\n"}
          • Insurance and liability management{"\n"}
          • Regulatory compliance monitoring{"\n"}
          • Professional training and certification
        </Text>

        <Text style={styles.sectionHeader}>12. Contact Information</Text>
        <Text style={styles.sectionText}>
          For recycler privacy concerns:
        </Text>
        <Text style={styles.sectionList}>
          Email: ecowastego@gmail.com{"\n"}
          Recycler Support: Available in-app{"\n"}
          Response Time: Within 24 hours{"\n"}
          Business Hours: Monday-Friday, 8AM-6PM
        </Text>

        {fromRegister && (
          <>
            <View style={styles.checkboxRow}>
              <TouchableOpacity style={styles.checkbox} onPress={handleDisagree}>
                <View style={[styles.checkboxBox, disagree && styles.checkboxChecked]}>
                  {disagree && <Text style={styles.checkboxTick}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}><Text style={{fontWeight:'bold'}}>I Disagree</Text> to the recycler privacy policy</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.checkboxRow}>
              <TouchableOpacity style={styles.checkbox} onPress={handleAgree}>
                <View style={[styles.checkboxBox, agree && styles.checkboxChecked]}>
                  {agree && <Text style={styles.checkboxTick}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}><Text style={{fontWeight:'bold'}}>I Agree</Text> to the recycler privacy policy</Text>
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
