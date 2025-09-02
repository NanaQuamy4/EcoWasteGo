import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, FlatList, ImageBackground, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AppHeader from '../../components/AppHeader';
import { supabase } from '../../lib/supabase';

export default function CustomerEditProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Debug logging for user data
  useEffect(() => {
    if (user) {
      console.log('CustomerEditProfileScreen: User data:', user);
      console.log('CustomerEditProfileScreen: User created_at:', user.created_at);
      console.log('CustomerEditProfileScreen: User object keys:', Object.keys(user));
    }
  }, [user]);

  // Fetch current user data on component mount
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      console.log('CustomerEditProfileScreen: Fetching current user...');
      setIsLoadingUser(true);

      const { data: { user: currentUser }, error } = await supabase.auth.getUser();

      if (error) {
        console.error('CustomerEditProfileScreen: Error fetching user:', error);
        return;
      }

      if (currentUser) {
        console.log('CustomerEditProfileScreen: Current user found:', currentUser);
        
        // Extract user data from metadata
        const userData = {
          id: currentUser.id,
          email: currentUser.email,
          full_name: currentUser.user_metadata?.full_name || '',
          phone: currentUser.user_metadata?.phone || '',
          role: currentUser.user_metadata?.role || 'customer',
          created_at: currentUser.created_at,
        };

        setUser(userData);
        
        // Populate form fields with user data
        setName(userData.full_name);
        setEmail(userData.email || '');
        setPhone(userData.phone);
        
        console.log('CustomerEditProfileScreen: User data set:', userData);
      } else {
        console.log('CustomerEditProfileScreen: No user found');
      }
    } catch (error) {
      console.error('CustomerEditProfileScreen: Error in fetchCurrentUser:', error);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      console.log('CustomerEditProfileScreen: Saving changes...');
      
      // Get current user to get their ID
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        console.error('CustomerEditProfileScreen: Error getting current user:', userError);
        Alert.alert('Error', 'Failed to get user information. Please try again.');
        return;
      }

      console.log('CustomerEditProfileScreen: Current user ID:', currentUser.id);
      
      // Update user metadata in Supabase
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          full_name: name,
          phone: phone,
        }
      });

      if (metadataError) {
        console.error('CustomerEditProfileScreen: Error updating user metadata:', metadataError);
        Alert.alert('Error', 'Failed to save changes. Please try again.');
        return;
      }

      // Update the customers table in the database
      const { error: dbError } = await supabase
        .from('customers')
        .update({
          full_name: name,
          phone: phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);

      if (dbError) {
        console.error('CustomerEditProfileScreen: Error updating customers table:', dbError);
        // Don't show error to user since metadata was updated successfully
        console.log('CustomerEditProfileScreen: Metadata updated but database update failed');
      } else {
        console.log('CustomerEditProfileScreen: Customers table updated successfully');
      }

      console.log('CustomerEditProfileScreen: User updated successfully');
      Alert.alert('Success', 'Profile changes saved successfully!');
      
      // Refresh user data
      await fetchCurrentUser();
    } catch (error) {
      console.error('CustomerEditProfileScreen: Error in handleSaveChanges:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    }
  };
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [countryCode, setCountryCode] = useState('+233');
  const [countryFlag, setCountryFlag] = useState('🇬🇭');
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [search, setSearch] = useState('');

  // Format account creation date
  const formatCreationDate = (createdAt: string | undefined) => {
    if (!createdAt) {
      console.log('CustomerEditProfileScreen: No created_at field found');
      return 'N/A';
    }
    
    try {
      const date = new Date(createdAt);
      if (isNaN(date.getTime())) {
        console.log('CustomerEditProfileScreen: Invalid date format:', createdAt);
        return 'N/A';
      }
      
      const formatted = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      console.log('CustomerEditProfileScreen: Formatted date:', formatted);
      return formatted;
    } catch (error) {
      console.log('CustomerEditProfileScreen: Error formatting date:', error);
      return 'N/A';
    }
  };

  // Full country/calling code list (shortened for brevity, but will include all countries)
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
    { code: '+855', country: 'Cambodia', flag: '🇰🇭' },
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
      <AppHeader hideLeftIcon hideRightIcon />
      {/* Banner with blend.jpg */}
      <View style={styles.bannerWrapper}>
        <ImageBackground source={require('../../assets/images/blend.jpg')} style={styles.bannerBg} imageStyle={[styles.bannerImage, { opacity: 0.7 }]}>
          <View style={styles.bannerContentCentered}>
            <View style={styles.personalInfoPillBig}>
              <View style={styles.personalInfoRowTall}>
                <MaterialIcons name="person" size={26} color="#263A13" style={styles.pillIconCircle} />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.personalInfoTextTall}>Personal Info</Text>
                  <Text style={styles.myAccountTextSmall}>My Account</Text>
                </View>
                <View style={{ flex: 1 }} />
                <TouchableOpacity style={styles.editButton}>
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>
      {/* Green container for fields and actions, starts immediately after banner */}
      <View style={styles.greenContentContainerNoOverlap}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Account Information Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            
            {/* Account Creation Date */}
            <View style={styles.creationDateContainer}>
              <MaterialIcons name="event" size={20} color="#263A13" style={styles.inputIcon} />
              <View style={styles.creationDateContent}>
                <Text style={styles.creationDateLabel}>Account Created</Text>
                <Text style={styles.creationDateValue}>
                  {formatCreationDate(user?.created_at || '')}
                </Text>
              </View>
            </View>
          </View>

          {/* Personal Information Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            {/* Name Field */}
            <View style={styles.inputRow}>
              <MaterialIcons name="person" size={20} color="#263A13" style={styles.inputIcon} />
              <TextInput 
                value={name} 
                onChangeText={setName} 
                style={styles.input} 
                placeholder="Full Name" 
              />
            </View>

            {/* Email Field */}
            <View style={styles.inputRow}>
              <MaterialIcons name="email" size={20} color="#263A13" style={styles.inputIcon} />
              <TextInput 
                value={email} 
                onChangeText={setEmail} 
                style={styles.input} 
                placeholder="Email Address" 
                keyboardType="email-address"
              />
            </View>

            {/* Phone Field */}
            <View style={styles.inputRow}>
              <View style={styles.phoneInputContainer}>
                <TouchableOpacity 
                  style={styles.countryCodeSelector}
                  onPress={() => setCountryModalVisible(true)}
                >
                  <Text style={styles.countryFlag}>{countryFlag}</Text>
                  <Text style={styles.countryCodeText}>{countryCode}</Text>
                  <MaterialIcons name="arrow-drop-down" size={16} color="#263A13" />
                </TouchableOpacity>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  style={styles.phoneInput}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                  maxLength={15}
                />
              </View>
            </View>
          </View>



          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
          <View style={{ height: 80 }} />
        </ScrollView>
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
              style={styles.countrySearchInput}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // changed from green to white
  },
  scrollContent: {
    flexGrow: 1,
  },
  bannerWrapper: {
    marginHorizontal: 0,
    marginTop: 16,
    borderRadius: 20,
    borderTopLeftRadius: 20, // rounded top corners for banner
    borderTopRightRadius: 20,
    overflow: 'hidden',
    height: 90, // reduced from 120
  },
  bannerBg: {
    flex: 1,
    justifyContent: 'center',
  },
  bannerImage: {
    borderRadius: 20,
    borderTopLeftRadius: 20, // rounded top corners for banner image
    borderTopRightRadius: 20,
    height: 110, // reduced from 150
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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
    marginLeft: 8,
    color: '#263A13',
    fontSize: 13,
    alignSelf: 'center',
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
    maxWidth: 340,
    alignSelf: 'center',
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
    marginRight: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    minWidth: 60,
    height: 32,
  },
  countryCodeText: {
    color: '#263A13',
    fontWeight: 'bold',
    fontSize: 12,
    marginRight: 2,
  },
  eyeIcon: {
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#22330B',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 16,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  pillIconCircle: {
    marginRight: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  personalInfoPillTall: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  personalInfoRowTall: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  personalInfoTextTall: {
    color: '#263A13',
    fontWeight: 'bold',
    fontSize: 18,
  },
  myAccountTextSmall: {
    color: '#263A13',
    fontSize: 13,
    textAlign: 'left',
  },
  myAccountTextAligned: {
    color: '#263A13',
    fontSize: 13,
    textAlign: 'center',
    alignSelf: 'center',
    width: '100%',
    marginTop: 0,
  },
  greenContentContainerNoOverlap: {
    flex: 1,
    backgroundColor: '#E3F0D5',
    paddingTop: 20,
  },
  editButton: {
    backgroundColor: '#F3F3F3',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    elevation: 2,
  },
  editButtonText: {
    color: '#263A13',
    fontWeight: 'bold',
  },
  fieldsPill: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 18,
    marginHorizontal: 8,
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  bannerContentCentered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    height: '100%',
  },
  personalInfoPillBig: {
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingHorizontal: 16, // reduced from 24
    paddingVertical: 8, // reduced from 12
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minWidth: 180, // reduced from 220
    maxWidth: '65%', // reduced from 80%
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryModalContent: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    width: 300,
    maxHeight: 350,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  countryModalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 12,
    color: '#263A13',
  },
  countryCodeItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  countryCodeTextModal: {
    fontSize: 16,
    color: '#263A13',
    fontWeight: 'bold',
  },
  creationDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#B6CDBD',
    marginBottom: 12,
    paddingHorizontal: 12,
    maxWidth: 340,
    alignSelf: 'center',
  },
  creationDateContent: {
    marginLeft: 8,
  },
  creationDateLabel: {
    color: '#263A13',
    fontSize: 14,
    fontWeight: 'bold',
  },
  creationDateValue: {
    color: '#263A13',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#263A13',
    marginBottom: 12,
  },
  countrySearchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    width: '100%',
  },
  phoneInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: 70,
  },
  countryFlag: {
    fontSize: 16,
    marginRight: 4,
  },
  phoneInput: {
    flex: 1,
    color: '#263A13',
    fontWeight: 'bold',
    fontSize: 16,
    paddingVertical: 10,
  },
}); 
