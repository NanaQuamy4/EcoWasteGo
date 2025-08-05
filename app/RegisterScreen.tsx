import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Image, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countryCode, setCountryCode] = useState('+233');
  const [countryFlag, setCountryFlag] = useState('🇬🇭');
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const params = useLocalSearchParams();
  const { register } = useAuth();

  React.useEffect(() => {
    if (params.privacyAgreed === 'true') {
      setAgreed(true);
    }
  }, [params.privacyAgreed]);

  function validateEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validatePassword(password: string) {
    return password.length >= 6;
  }

  const handleRegister = async () => {
    // Validation
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username.');
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    if (!agreed) {
      Alert.alert('Error', 'Please agree to the Privacy Policy and Terms of Service.');
      return;
    }

    try {
      setIsLoading(true);
      
      const userData = {
        email: email.trim(),
        password,
        username: username.trim(),
        phone: contact.trim() ? `${countryCode}${contact.trim()}` : undefined,
        role: 'customer' as const, // Default to customer role
      };

      await register(userData);
      
      // Navigate to main app
      router.push('/');
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert(
        'Registration Failed',
        error.message || 'Registration failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const countryCodes = [
    { code: '+93', country: 'Afghanistan', flag: '🇦🇫' },
    { code: '+355', country: 'Albania', flag: '🇦🇱' },
    { code: '+213', country: 'Algeria', flag: '🇩🇿' },
    { code: '+1-684', country: 'American Samoa', flag: '🇦🇸' },
    { code: '+376', country: 'Andorra', flag: '🇦🇩' },
    { code: '+244', country: 'Angola', flag: '🇦🇴' },
    { code: '+1-264', country: 'Anguilla', flag: '🇦🇮' },
    { code: '+672', country: 'Antarctica', flag: '🇦🇶' },
    { code: '+1-268', country: 'Antigua and Barbuda', flag: '🇦🇬' },
    { code: '+54', country: 'Argentina', flag: '🇦🇷' },
    { code: '+374', country: 'Armenia', flag: '🇦🇲' },
    { code: '+297', country: 'Aruba', flag: '🇦🇼' },
    { code: '+61', country: 'Australia', flag: '🇦🇺' },
    { code: '+43', country: 'Austria', flag: '🇦🇹' },
    { code: '+994', country: 'Azerbaijan', flag: '🇦🇿' },
    { code: '+1-242', country: 'Bahamas', flag: '🇧🇸' },
    { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
    { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
    { code: '+1-246', country: 'Barbados', flag: '🇧🇧' },
    { code: '+375', country: 'Belarus', flag: '🇧🇾' },
    { code: '+32', country: 'Belgium', flag: '🇧🇪' },
    { code: '+501', country: 'Belize', flag: '🇧🇿' },
    { code: '+229', country: 'Benin', flag: '🇧🇯' },
    { code: '+1-441', country: 'Bermuda', flag: '🇧🇲' },
    { code: '+975', country: 'Bhutan', flag: '🇧🇹' },
    { code: '+591', country: 'Bolivia', flag: '🇧🇴' },
    { code: '+387', country: 'Bosnia and Herzegovina', flag: '🇧🇦' },
    { code: '+267', country: 'Botswana', flag: '🇧🇼' },
    { code: '+55', country: 'Brazil', flag: '🇧🇷' },
    { code: '+246', country: 'British Indian Ocean Territory', flag: '🇮🇴' },
    { code: '+1-284', country: 'British Virgin Islands', flag: '🇻🇬' },
    { code: '+673', country: 'Brunei', flag: '🇧🇳' },
    { code: '+359', country: 'Bulgaria', flag: '🇧🇬' },
    { code: '+226', country: 'Burkina Faso', flag: '🇧🇫' },
    { code: '+257', country: 'Burundi', flag: '🇧🇮' },
    { code: '+855', country: 'Cambodia', flag: '🇰��' },
    { code: '+237', country: 'Cameroon', flag: '🇨🇲' },
    { code: '+1', country: 'Canada', flag: '🇨🇦' },
    { code: '+238', country: 'Cape Verde', flag: '🇨🇻' },
    { code: '+1-345', country: 'Cayman Islands', flag: '🇰🇾' },
    { code: '+236', country: 'Central African Republic', flag: '🇨🇫' },
    { code: '+235', country: 'Chad', flag: '🇹🇩' },
    { code: '+56', country: 'Chile', flag: '🇨🇱' },
    { code: '+86', country: 'China', flag: '🇨🇳' },
    { code: '+61', country: 'Christmas Island', flag: '🇨🇽' },
    { code: '+61', country: 'Cocos Islands', flag: '🇨🇨' },
    { code: '+57', country: 'Colombia', flag: '🇨🇴' },
    { code: '+269', country: 'Comoros', flag: '🇰🇲' },
    { code: '+682', country: 'Cook Islands', flag: '🇨🇰' },
    { code: '+506', country: 'Costa Rica', flag: '🇨🇷' },
    { code: '+385', country: 'Croatia', flag: '🇭🇷' },
    { code: '+53', country: 'Cuba', flag: '🇨🇺' },
    { code: '+599', country: 'Curacao', flag: '🇨🇼' },
    { code: '+357', country: 'Cyprus', flag: '🇨🇾' },
    { code: '+420', country: 'Czech Republic', flag: '🇨🇿' },
    { code: '+243', country: 'Democratic Republic of the Congo', flag: '🇨🇩' },
    { code: '+45', country: 'Denmark', flag: '🇩🇰' },
    { code: '+253', country: 'Djibouti', flag: '🇩🇯' },
    { code: '+1-767', country: 'Dominica', flag: '🇩🇲' },
    { code: '+1-809', country: 'Dominican Republic', flag: '🇩🇴' },
    { code: '+670', country: 'East Timor', flag: '🇹🇱' },
    { code: '+593', country: 'Ecuador', flag: '🇪🇨' },
    { code: '+20', country: 'Egypt', flag: '🇪🇬' },
    { code: '+503', country: 'El Salvador', flag: '🇸🇻' },
    { code: '+240', country: 'Equatorial Guinea', flag: '🇬🇶' },
    { code: '+291', country: 'Eritrea', flag: '🇪🇷' },
    { code: '+372', country: 'Estonia', flag: '🇪🇪' },
    { code: '+251', country: 'Ethiopia', flag: '🇪🇹' },
    { code: '+500', country: 'Falkland Islands', flag: '🇫🇰' },
    { code: '+298', country: 'Faroe Islands', flag: '🇫🇴' },
    { code: '+679', country: 'Fiji', flag: '🇫🇯' },
    { code: '+358', country: 'Finland', flag: '🇫🇮' },
    { code: '+33', country: 'France', flag: '🇫🇷' },
    { code: '+594', country: 'French Guiana', flag: '🇬🇫' },
    { code: '+689', country: 'French Polynesia', flag: '🇵🇫' },
    { code: '+241', country: 'Gabon', flag: '🇬🇦' },
    { code: '+220', country: 'Gambia', flag: '🇬🇲' },
    { code: '+995', country: 'Georgia', flag: '🇬🇪' },
    { code: '+49', country: 'Germany', flag: '🇩🇪' },
    { code: '+233', country: 'Ghana', flag: '🇬🇭' },
    { code: '+350', country: 'Gibraltar', flag: '🇬🇮' },
    { code: '+30', country: 'Greece', flag: '🇬🇷' },
    { code: '+299', country: 'Greenland', flag: '🇬🇱' },
    { code: '+1-473', country: 'Grenada', flag: '🇬🇩' },
    { code: '+590', country: 'Guadeloupe', flag: '🇬🇵' },
    { code: '+1-671', country: 'Guam', flag: '🇬🇺' },
    { code: '+502', country: 'Guatemala', flag: '🇬🇹' },
    { code: '+44-1481', country: 'Guernsey', flag: '🇬🇬' },
    { code: '+224', country: 'Guinea', flag: '🇬🇳' },
    { code: '+245', country: 'Guinea-Bissau', flag: '🇬🇼' },
    { code: '+592', country: 'Guyana', flag: '🇬🇾' },
    { code: '+509', country: 'Haiti', flag: '🇭🇹' },
    { code: '+504', country: 'Honduras', flag: '🇭🇳' },
    { code: '+852', country: 'Hong Kong', flag: '🇭🇰' },
    { code: '+36', country: 'Hungary', flag: '🇭🇺' },
    { code: '+354', country: 'Iceland', flag: '🇮🇸' },
    { code: '+91', country: 'India', flag: '🇮🇳' },
    { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
    { code: '+98', country: 'Iran', flag: '🇮🇷' },
    { code: '+964', country: 'Iraq', flag: '🇮🇶' },
    { code: '+353', country: 'Ireland', flag: '🇮🇪' },
    { code: '+44-1624', country: 'Isle of Man', flag: '🇮🇲' },
    { code: '+972', country: 'Israel', flag: '🇮🇱' },
    { code: '+39', country: 'Italy', flag: '🇮🇹' },
    { code: '+225', country: 'Ivory Coast', flag: '🇨🇮' },
    { code: '+1-876', country: 'Jamaica', flag: '🇯🇲' },
    { code: '+81', country: 'Japan', flag: '🇯🇵' },
    { code: '+44-1534', country: 'Jersey', flag: '🇯🇪' },
    { code: '+962', country: 'Jordan', flag: '🇯🇴' },
    { code: '+7', country: 'Kazakhstan', flag: '🇰🇿' },
    { code: '+254', country: 'Kenya', flag: '🇰🇪' },
    { code: '+686', country: 'Kiribati', flag: '🇰🇮' },
    { code: '+383', country: 'Kosovo', flag: '🇽🇰' },
    { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
    { code: '+996', country: 'Kyrgyzstan', flag: '🇰🇬' },
    { code: '+856', country: 'Laos', flag: '🇱🇦' },
    { code: '+371', country: 'Latvia', flag: '🇱🇻' },
    { code: '+961', country: 'Lebanon', flag: '🇱🇧' },
    { code: '+266', country: 'Lesotho', flag: '🇱🇸' },
    { code: '+231', country: 'Liberia', flag: '🇱🇷' },
    { code: '+218', country: 'Libya', flag: '🇱🇾' },
    { code: '+423', country: 'Liechtenstein', flag: '🇱🇮' },
    { code: '+370', country: 'Lithuania', flag: '🇱🇹' },
    { code: '+352', country: 'Luxembourg', flag: '🇱🇺' },
    { code: '+853', country: 'Macau', flag: '🇲🇴' },
    { code: '+389', country: 'Macedonia', flag: '🇲🇰' },
    { code: '+261', country: 'Madagascar', flag: '🇲🇬' },
    { code: '+265', country: 'Malawi', flag: '🇲🇼' },
    { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
    { code: '+960', country: 'Maldives', flag: '🇲🇻' },
    { code: '+223', country: 'Mali', flag: '🇲🇱' },
    { code: '+356', country: 'Malta', flag: '🇲🇹' },
    { code: '+692', country: 'Marshall Islands', flag: '🇲🇭' },
    { code: '+596', country: 'Martinique', flag: '🇲🇶' },
    { code: '+222', country: 'Mauritania', flag: '🇲🇷' },
    { code: '+230', country: 'Mauritius', flag: '🇲🇺' },
    { code: '+262', country: 'Mayotte', flag: '🇾🇹' },
    { code: '+52', country: 'Mexico', flag: '🇲🇽' },
    { code: '+691', country: 'Micronesia', flag: '🇫🇲' },
    { code: '+373', country: 'Moldova', flag: '🇲🇩' },
    { code: '+377', country: 'Monaco', flag: '🇲🇨' },
    { code: '+976', country: 'Mongolia', flag: '🇲🇳' },
    { code: '+382', country: 'Montenegro', flag: '🇲🇪' },
    { code: '+1-664', country: 'Montserrat', flag: '🇲🇸' },
    { code: '+212', country: 'Morocco', flag: '🇲🇦' },
    { code: '+258', country: 'Mozambique', flag: '🇲🇿' },
    { code: '+95', country: 'Myanmar', flag: '🇲🇲' },
    { code: '+264', country: 'Namibia', flag: '🇳🇦' },
    { code: '+674', country: 'Nauru', flag: '🇳🇷' },
    { code: '+977', country: 'Nepal', flag: '🇳🇵' },
    { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
    { code: '+599', country: 'Netherlands Antilles', flag: '🇳🇱' },
    { code: '+687', country: 'New Caledonia', flag: '🇳🇨' },
    { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
    { code: '+505', country: 'Nicaragua', flag: '🇳🇮' },
    { code: '+227', country: 'Niger', flag: '🇳🇪' },
    { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
    { code: '+683', country: 'Niue', flag: '🇳🇺' },
    { code: '+672', country: 'Norfolk Island', flag: '🇳🇫' },
    { code: '+850', country: 'North Korea', flag: '🇰🇵' },
    { code: '+1-670', country: 'Northern Mariana Islands', flag: '🇲🇵' },
    { code: '+47', country: 'Norway', flag: '🇳🇴' },
    { code: '+968', country: 'Oman', flag: '🇴🇲' },
    { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
    { code: '+680', country: 'Palau', flag: '🇵🇼' },
    { code: '+970', country: 'Palestine', flag: '🇵🇸' },
    { code: '+507', country: 'Panama', flag: '🇵🇦' },
    { code: '+675', country: 'Papua New Guinea', flag: '🇵🇬' },
    { code: '+595', country: 'Paraguay', flag: '🇵🇾' },
    { code: '+51', country: 'Peru', flag: '🇵🇪' },
    { code: '+63', country: 'Philippines', flag: '🇵🇭' },
    { code: '+64', country: 'Pitcairn', flag: '🇵🇳' },
    { code: '+48', country: 'Poland', flag: '🇵🇱' },
    { code: '+351', country: 'Portugal', flag: '🇵🇹' },
    { code: '+1-787', country: 'Puerto Rico', flag: '🇵🇷' },
    { code: '+974', country: 'Qatar', flag: '🇶🇦' },
    { code: '+242', country: 'Republic of the Congo', flag: '🇨🇬' },
    { code: '+262', country: 'Reunion', flag: '🇷🇪' },
    { code: '+40', country: 'Romania', flag: '🇷🇴' },
    { code: '+7', country: 'Russia', flag: '🇷🇺' },
    { code: '+250', country: 'Rwanda', flag: '🇷🇼' },
    { code: '+590', country: 'Saint Barthelemy', flag: '🇧🇱' },
    { code: '+290', country: 'Saint Helena', flag: '🇸🇭' },
    { code: '+1-869', country: 'Saint Kitts and Nevis', flag: '🇰🇳' },
    { code: '+1-758', country: 'Saint Lucia', flag: '🇱🇨' },
    { code: '+590', country: 'Saint Martin', flag: '🇲🇫' },
    { code: '+508', country: 'Saint Pierre and Miquelon', flag: '🇵🇲' },
    { code: '+1-784', country: 'Saint Vincent and the Grenadines', flag: '🇻🇨' },
    { code: '+685', country: 'Samoa', flag: '🇼🇸' },
    { code: '+378', country: 'San Marino', flag: '🇸🇲' },
    { code: '+239', country: 'Sao Tome and Principe', flag: '🇸🇹' },
    { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
    { code: '+221', country: 'Senegal', flag: '🇸🇳' },
    { code: '+381', country: 'Serbia', flag: '🇷🇸' },
    { code: '+248', country: 'Seychelles', flag: '🇸🇨' },
    { code: '+232', country: 'Sierra Leone', flag: '🇸🇱' },
    { code: '+65', country: 'Singapore', flag: '🇸🇬' },
    { code: '+1-721', country: 'Sint Maarten', flag: '🇸🇽' },
    { code: '+421', country: 'Slovakia', flag: '🇸🇰' },
    { code: '+386', country: 'Slovenia', flag: '🇸🇮' },
    { code: '+677', country: 'Solomon Islands', flag: '🇸🇧' },
    { code: '+252', country: 'Somalia', flag: '🇸🇴' },
    { code: '+27', country: 'South Africa', flag: '🇿🇦' },
    { code: '+82', country: 'South Korea', flag: '🇰🇷' },
    { code: '+211', country: 'South Sudan', flag: '🇸🇸' },
    { code: '+34', country: 'Spain', flag: '🇪🇸' },
    { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
    { code: '+249', country: 'Sudan', flag: '🇸🇩' },
    { code: '+597', country: 'Suriname', flag: '🇸🇷' },
    { code: '+47', country: 'Svalbard and Jan Mayen', flag: '🇸🇯' },
    { code: '+268', country: 'Swaziland', flag: '🇸🇿' },
    { code: '+46', country: 'Sweden', flag: '🇸🇪' },
    { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
    { code: '+963', country: 'Syria', flag: '🇸🇾' },
    { code: '+886', country: 'Taiwan', flag: '🇹🇼' },
    { code: '+992', country: 'Tajikistan', flag: '🇹🇯' },
    { code: '+255', country: 'Tanzania', flag: '🇹🇿' },
    { code: '+66', country: 'Thailand', flag: '🇹🇭' },
    { code: '+228', country: 'Togo', flag: '🇹🇬' },
    { code: '+690', country: 'Tokelau', flag: '🇹🇰' },
    { code: '+676', country: 'Tonga', flag: '🇹🇴' },
    { code: '+1-868', country: 'Trinidad and Tobago', flag: '🇹🇹' },
    { code: '+216', country: 'Tunisia', flag: '🇹🇳' },
    { code: '+90', country: 'Turkey', flag: '🇹🇷' },
    { code: '+993', country: 'Turkmenistan', flag: '🇹🇲' },
    { code: '+1-649', country: 'Turks and Caicos Islands', flag: '🇹🇨' },
    { code: '+688', country: 'Tuvalu', flag: '🇹🇻' },
    { code: '+256', country: 'Uganda', flag: '🇺🇬' },
    { code: '+380', country: 'Ukraine', flag: '🇺🇦' },
    { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪' },
    { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
    { code: '+1', country: 'United States', flag: '🇺🇸' },
    { code: '+598', country: 'Uruguay', flag: '🇺🇾' },
    { code: '+998', country: 'Uzbekistan', flag: '🇺🇿' },
    { code: '+678', country: 'Vanuatu', flag: '🇻🇺' },
    { code: '+58', country: 'Venezuela', flag: '🇻🇪' },
    { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
    { code: '+1-284', country: 'Virgin Islands, British', flag: '🇻🇬' },
    { code: '+1-340', country: 'Virgin Islands, U.S.', flag: '🇻🇮' },
    { code: '+681', country: 'Wallis and Futuna', flag: '🇼🇫' },
    { code: '+212', country: 'Western Sahara', flag: '🇪🇭' },
    { code: '+967', country: 'Yemen', flag: '🇾🇪' },
    { code: '+260', country: 'Zambia', flag: '🇿🇲' },
    { code: '+263', country: 'Zimbabwe', flag: '🇿🇼' },
  ];

  const filteredCountries = countryCodes.filter(item =>
    item.country.toLowerCase().includes(search.toLowerCase()) ||
    item.code.includes(search) ||
    item.flag.includes(search)
  );

  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <Image source={require('../assets/images/logo landscape.png')} style={styles.logo} />
      </View>
      <View style={styles.formCard}>
        <Text style={styles.registerTitle}>Register Now</Text>
        <Text style={styles.registerSubtitle}>Sign in with your password to continue</Text>
      </View>
      <View style={styles.inputRow}>
        <MaterialIcons name="person" size={22} color="#263A13" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="User name"
          value={username}
          onChangeText={setUsername}
          placeholderTextColor="#263A13"
        />
      </View>
      <View style={styles.inputRow}>
        <Image source={require('../assets/images/email.png')} style={styles.inputIconImg} />
        <TextInput
          style={styles.input}
          placeholder="Enter your Email"
          value={email}
          onChangeText={text => { setEmail(text); setEmailError(''); }}
          placeholderTextColor="#263A13"
        />
      </View>
      {emailError ? <Text style={{ color: 'red', marginBottom: 4, alignSelf: 'flex-start', marginLeft: 32 }}>{emailError}</Text> : null}
      <View style={styles.inputRow}>
        <TouchableOpacity style={styles.countryCodeWrapper} onPress={() => setCountryModalVisible(true)}>
          <Text style={styles.countryCodeText}>{countryFlag} {countryCode}</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Contact"
          value={contact}
          onChangeText={setContact}
          placeholderTextColor="#263A13"
          keyboardType="phone-pad"
        />
      </View>
      {/* Country Code Picker Modal */}
      <Modal
        visible={countryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCountryModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setCountryModalVisible(false)}>
          <View style={styles.countryModalContent}>
            <Text style={styles.countryModalTitle}>Select Country Code</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 8,
                padding: 8,
                marginBottom: 10,
                width: '100%',
              }}
              placeholder="Search country or code"
              value={search}
              onChangeText={setSearch}
            />
            <FlatList
              data={filteredCountries}
              keyExtractor={item => item.code + item.country}
              style={{ width: '100%' }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryCodeItem}
                  onPress={() => {
                    setCountryCode(item.code);
                    setCountryFlag(item.flag);
                    setCountryModalVisible(false);
                  }}
                >
                  <Text style={styles.countryCodeTextModal}>{item.flag} {item.country} ({item.code})</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
      <View style={styles.inputRow}>
        <Image source={require('../assets/images/password.png')} style={styles.inputIconImg} />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          placeholderTextColor="#263A13"
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Feather name={showPassword ? 'eye' : 'eye-off'} size={22} color="#263A13" style={styles.eyeIcon} />
        </TouchableOpacity>
      </View>
      <View style={styles.inputRow}>
        <Image source={require('../assets/images/password.png')} style={styles.inputIconImg} />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          placeholderTextColor="#263A13"
        />
        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
          <Feather name={showConfirmPassword ? 'eye' : 'eye-off'} size={22} color="#263A13" style={styles.eyeIcon} />
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 24, marginBottom: 12 }}>
        <TouchableOpacity onPress={() => setAgreed(!agreed)} style={{ marginRight: 8 }}>
          <View style={{
            width: 22,
            height: 22,
            borderWidth: 2,
            borderColor: '#263A13',
            borderRadius: 4,
            backgroundColor: agreed ? '#263A13' : '#fff',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {agreed && <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>✓</Text>}
          </View>
        </TouchableOpacity>
        <Text style={{ color: '#263A13', fontSize: 15 }}>
          I Agree to all{' '}
          <Text
            style={{ fontWeight: 'bold', textDecorationLine: 'underline', color: '#263A13' }}
            onPress={() => router.push({ pathname: '/PrivacyScreen', params: { fromRegister: 'true' } })}
          >
            Terms and Conditions
          </Text>
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.signUpButton, !agreed && { backgroundColor: '#B6CDBD' }]}
        onPress={handleRegister}
        disabled={isLoading || !agreed}
      >
        <Text style={styles.signUpButtonText}>{isLoading ? 'Signing Up...' : 'Sign up'}</Text>
      </TouchableOpacity>
      <Text style={styles.orText}>or continue with google</Text>
      <TouchableOpacity style={styles.socialButton}>
        <Image source={require('../assets/images/google.png')} style={styles.socialIconImg} />
        <Text style={styles.socialText}>continue with Google</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.socialButton}>
        <Image source={require('../assets/images/apple.png')} style={styles.socialIconImg} />
        <Text style={styles.socialText}>continue with Apple</Text>
      </TouchableOpacity>
      <View style={styles.bottomRow}>
        <Text style={styles.bottomText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => router.push('/LoginScreen')}>
          <Text style={styles.signInText}>Sign in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF6',
    paddingHorizontal: 0,
    paddingTop: 40,
  },
  logoRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logo: {
    width: 200,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  formCard: {
    backgroundColor: '#D9DED8',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 0,
    marginBottom: 16,
  },
  registerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#263A13',
    marginBottom: 2,
  },
  registerSubtitle: {
    fontSize: 16,
    color: '#263A13',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#A3C47C',
    borderRadius: 24,
    paddingHorizontal: 12,
    marginHorizontal: 8,
    marginBottom: 20,
    backgroundColor: '#fff',
    height: 48,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 8,
    color: '#000', // Ensure black color for icons
  },
  inputIconImg: {
    width: 24,
    height: 24,
    marginRight: 8,
    resizeMode: 'contain',
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#263A13',
  },
  signUpButton: {
    backgroundColor: '#223E01',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 90,
    marginBottom: 20,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  orText: {
    textAlign: 'center',
    color: '#263A13',
    marginBottom: 8,
    fontSize: 16,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#A3C47C',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  socialIconImg: {
    width: 24,
    height: 24,
    marginRight: 12,
    resizeMode: 'contain',
  },
  socialText: {
    fontSize: 16,
    color: '#263A13',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  bottomText: {
    color: '#263A13',
    fontSize: 15,
  },
  signInText: {
    color: '#263A13',
    fontWeight: 'bold',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  eyeIcon: {
    marginLeft: 8,
  },
  countryCodeWrapper: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    marginRight: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    minWidth: 60,
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeText: {
    fontSize: 13,
    color: '#263A13',
    fontWeight: 'bold',
    marginRight: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  countryModalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  countryModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#263A13',
    marginBottom: 15,
  },
  countryCodeItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  countryCodeTextModal: {
    fontSize: 16,
    color: '#263A13',
  },
}); 