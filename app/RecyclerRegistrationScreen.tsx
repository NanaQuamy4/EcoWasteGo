import { Feather, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Image, ImageBackground, Keyboard, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const REGIONS = [
  'Ashanti', 'Greater Accra', 'Western', 'Central', 'Eastern', 'Volta', 'Northern', 'Upper East', 'Upper West',
  'Brong-Ahafo', 'Bono', 'Bono East', 'Ahafo', 'Western North', 'Savannah', 'Oti Region'
];

const REGION_CITIES: { [region: string]: string[] } = {
  'Ashanti': [
    'Kumasi', 'Obuasi', 'Ejisu', 'Konongo', 'Mampong',
    'Asokwa', 'Bantama', 'Asokore Mampong', 'Tafo', 'Suame',
    'Kwadaso', 'Oforikrom', 'Atwima', 'Bekwai', 'Effiduase',
    'Agona', 'Fomena', 'Juaben', 'Nsuta', 'Atonsu',
    'Aboabo', 'Manhyia', 'Asafo', 'Bompata', 'Afigya Kwabre',
    'Bosomtwe', 'Kuntanase', 'Kokofu', 'Asante Akim', 'Obuasi East',
    'Adansi', 'Kumawu', 'Bosome', 'Juaso', 'Manso Nkwanta'
  ],
  'Greater Accra': [
    'Accra', 'Tema', 'Madina', 'Teshie', 'Nungua',
    'Ashaiman', 'Dansoman', 'Adenta', 'Spintex', 'Osu',
    'East Legon', 'Labadi', 'Kaneshie', 'Dome', 'Lapaz',
    'Amasaman', 'Achimota', 'Ridge', 'Airport Residential', 'Sakumono',
    'Kasoa', 'Kwabenya', 'Gbawe', 'Weija', 'Mallam',
    'Abeka', 'Odorkor', 'Chorkor', 'La', 'Mamprobi',
    'New Town', 'North Kaneshie', 'North Legon', 'Bubuashie', 'Awoshie',
    'Tesano', 'Kokomlemle', 'Dzorwulu', 'Haatso', 'Abelemkpe',
    'Burma Camp', 'Kanda', 'Roman Ridge', 'West Legon', 'Sowutuom',
    'McCarthy Hill', 'Oyarifa', 'Pokuase', 'Ashaley Botwe', 'Santeo',
    'Avenor', 'Korle Gonno', 'Mamobi', 'Alajo', 'Abossey Okai',
    'Odorna', 'Kwashieman', 'Tudu', 'Kokompe', 'Kwashieman',
    'Bortianor', 'Glefe', 'Sakaman', 'Santa Maria', 'Tabora',
    'Kotobabi', 'Kpehe', 'Kokomlemle', 'Nima', 'Pig Farm',
    'Kokomlemle', 'Kanda', 'Roman Ridge', 'West Legon', 'Sowutuom'
  ],
  'Western': [
    'Sekondi', 'Takoradi', 'Tarkwa', 'Axim', 'Shama',
    'Prestea', 'Bogoso', 'Half Assini', 'Mpohor', 'Wiawso',
    'Essiama', 'Nzema', 'Elubo', 'Agona Nkwanta', 'Daboase',
    'Beyin', 'Esiama', 'Sefwi', 'Aiyinase', 'Asankragwa'
  ],
  'Central': [
    'Cape Coast', 'Winneba', 'Mankessim', 'Saltpond', 'Elmina',
    'Agona Swedru', 'Twifo Praso', 'Assin Fosu', 'Kasoa', 'Abura Dunkwa',
    'Yamoransa', 'Breman Asikuma', 'Komenda', 'Moree', 'Anomabo',
    'Awutu', 'Bawjiase', 'Jukwa', 'Ajumako', 'Asebu',
    'Nsaba', 'Odoben', 'Abakrampa', 'Assin Manso', 'Gomoa Fetteh'
  ],
  'Eastern': [
    'Koforidua', 'Nkawkaw', 'Akim Oda', 'Suhum', 'Nsawam',
    'Akim Swedru', 'Aburi', 'Mpraeso', 'Akim Tafo', 'Begoro',
    'Akim Manso', 'Asamankese', 'Donkorkrom', 'Kwahu', 'Ofoase',
    'Akwatia', 'New Abirem', 'Akim Akroso', 'Akim Oda', 'Akim Ofoase'
  ],
  'Volta': [
    'Ho', 'Kpando', 'Hohoe', 'Aflao', 'Keta',
    'Anloga', 'Akatsi', 'Sogakope', 'Denu', 'Krachi',
    'Kete Krachi', 'Nkwanta', 'Jasikan', 'Kpando', 'Adidome',
    'Dzodze', 'Peki', 'Kpedze', 'Wli', 'Agbozume'
  ],
  'Northern': [
    'Tamale', 'Yendi', 'Savelugu', 'Gushegu', 'Bimbilla',
    'Karaga', 'Saboba', 'Wulensi', 'Kpandai', 'Tolon',
    'Sagnarigu', 'Tatale', 'Chereponi', 'Salaga', 'Buipe',
    'Damongo', 'Sawla', 'Kumbungu', 'Mion', 'Zabzugu'
  ],
  'Upper East': [
    'Bolgatanga', 'Bawku', 'Navrongo', 'Zebilla', 'Sandema',
    'Paga', 'Garu', 'Binduri', 'Bongo', 'Tongo',
    'Chiana', 'Pusiga', 'Tempane', 'Bawku West', 'Kassena Nankana',
    'Fumbisi', 'Sirigu', 'Gambibgo', 'Gbedema', 'Kologo'
  ],
  'Upper West': [
    'Wa', 'Nandom', 'Tumu', 'Lawra', 'Jirapa',
    'Lambussie', 'Nadowli', 'Funsi', 'Wechiau', 'Gwollu',
    'Hain', 'Kaleo', 'Dorimon', 'Eremon', 'Babile'
  ],
  'Brong-Ahafo': [
    'Sunyani', 'Techiman', 'Berekum', 'Dormaa Ahenkro', 'Wenchi',
    'Kintampo', 'Atebubu', 'Nkoranza', 'Yeji', 'Bechem',
    'Duayaw Nkwanta', 'Goaso', 'Hwidiem', 'Kenayasi', 'Sampa',
    'Seikwa', 'Drobo', 'Japekrom', 'Acherensua', 'Fiapre'
  ],
  'Bono': [
    'Sunyani', 'Berekum', 'Dormaa Ahenkro', 'Wenchi', 'Techiman',
    'Sampa', 'Seikwa', 'Drobo', 'Japekrom', 'Acherensua',
    'Fiapre', 'Kwatire', 'Nsoatre', 'Chiraa', 'Banda'
  ],
  'Bono East': [
    'Techiman', 'Kintampo', 'Atebubu', 'Nkoranza', 'Yeji',
    'Prang', 'Kwame Danso', 'Akomadan', 'Tuobodom', 'Atebubu Amantin',
    'Zabrama', 'Abease', 'Ejura', 'Afram Plains', 'Kojokrom'
  ],
  'Ahafo': [
    'Goaso', 'Hwidiem', 'Bechem', 'Kenyasi', 'Duayaw Nkwanta',
    'Mim', 'Kukuom', 'Acherensua', 'Ayomso', 'Nkaseim',
    'Yamfo', 'Tanoso', 'Asutifi', 'Akrodie', 'Kwapong'
  ],
  'Western North': [
    'Sefwi Wiawso', 'Bibiani', 'Juaboso', 'Enchi', 'Awaso',
    'Akontombra', 'Bodi', 'Suhyenso', 'Essam', 'Adabokrom',
    'Boinzan', 'Anhwiaso', 'Bekwai', 'Sefwi Bekwai', 'Sefwi Akontombra'
  ],
  'Savannah': [
    'Damongo', 'Salaga', 'Bole', 'Sawla', 'Daboya',
    'Busunu', 'Larabanga', 'Tuna', 'Kpalbe', 'Kpandai',
    'Fufulso', 'Mankarigu', 'Labile', 'Kpembe', 'Kpalbe'
  ],
  'Oti Region': [
    'Dambai', 'Nkwanta', 'Krachi', 'Kadjebi', 'Kete Krachi',
    'Jasikan', 'Kpassa', 'Nkonya', 'Worawora', 'Brewaniase',
    'Dodi Papase', 'Akan', 'Krachi Nchumuru', 'Krachi West', 'Krachi East'
  ],
};

export const options = { headerShown: false };

export default function RecyclerRegistrationScreen() {
  const [step, setStep] = useState(1);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [certificateImage, setCertificateImage] = useState<string | null>(null);
  const [region, setRegion] = useState('Ashanti');
  const [regionDropdown, setRegionDropdown] = useState(false);
      const [regionQuery, setRegionQuery] = useState('Ashanti');
  const [city, setCity] = useState('');
  const [cityDropdown, setCityDropdown] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [transportType, setTransportType] = useState('Small Truck');
  const [truckPlate, setTruckPlate] = useState('');
  const [address, setAddress] = useState('');
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [idNo, setIdNo] = useState('');

  const [name, setName] = useState('Williams Boampong');
  const [email, setEmail] = useState('nanaquamy4@gmail.com');
  const [emailError, setEmailError] = useState('');
  const [phone, setPhone] = useState('54 673 2719');
  const [countryCode, setCountryCode] = useState('+233');
  const [countryFlag, setCountryFlag] = useState('🇬🇭');
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [search, setSearch] = useState('');

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



  const pickImage = async (setter: (uri: string) => void) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setter(result.assets[0].uri);
    }
  };

  function validateEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Helper for progress bar
  const TOTAL_STEPS = 4;

  function ProgressBar({ step }: { step: number }) {
    return (
      <View style={{ height: 8, backgroundColor: '#E3E3E3', borderRadius: 4, marginHorizontal: 32, marginTop: 16, marginBottom: 8, overflow: 'hidden' }}>
        <View style={{ width: `${(step / TOTAL_STEPS) * 100}%`, height: 8, backgroundColor: '#263A13', borderRadius: 4 }} />
      </View>
    );
  }

  // Step 1: Personal info & certificate
  if (step === 1) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <ScrollView style={styles.container} contentContainerStyle={{ alignItems: 'center', paddingBottom: 32 }}>
          <Header />
          <ImageBackground
            source={require('../assets/images/blend.jpg')}
            style={styles.bannerBg}
            imageStyle={{ borderRadius: 20 }}
          >
            <View style={styles.bannerOverlay} />
            <View style={styles.bannerPill}>
              <Text style={styles.bannerPillText}>Join as a Recycler</Text>
            </View>
          </ImageBackground>
          <View style={styles.inputRow}><MaterialIcons name="person" size={20} color="#263A13" style={styles.inputIcon} /><TextInput value={name} onChangeText={setName} editable style={styles.input} /></View>
          <View style={styles.inputRow}><MaterialIcons name="email" size={20} color="#263A13" style={styles.inputIcon} /><TextInput value={email} onChangeText={text => { setEmail(text); setEmailError(''); }} editable style={styles.input} keyboardType="email-address" autoCapitalize="none" /></View>
          {emailError ? <Text style={{ color: 'red', marginBottom: 4, alignSelf: 'flex-start', marginLeft: 32 }}>{emailError}</Text> : null}
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.countryCodeWrapper} onPress={() => setCountryModalVisible(true)}>
              <Text style={styles.countryCodeText}>{countryFlag} {countryCode}</Text>
            </TouchableOpacity>
            <TextInput 
              value={phone} 
              onChangeText={setPhone} 
              editable 
              style={styles.input} 
              keyboardType="phone-pad" 
              placeholder="Phone number (without country code)"
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
          <Text style={[styles.sectionTitle, { alignSelf: 'flex-start', marginLeft: 40 }]}>Waste Management certificate</Text>
          <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage(setCertificateImage)}>
            {certificateImage ? (
              <Image source={{ uri: certificateImage }} style={styles.uploadedImage} />
            ) : (
              <>
                <Feather name="upload" size={32} color="#222" style={{ marginBottom: 8 }} />
                <Text style={styles.uploadText}>Click to upload from phone</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
        <View style={{ paddingHorizontal: 0, paddingBottom: 12 }}>
          <ProgressBar step={step} />
          <TouchableOpacity
            onPress={() => {
              if (!validateEmail(email)) {
                setEmailError('Please enter a valid email address.');
                return;
              }
              setStep(2);
            }}
            style={styles.nextButton}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Step 2: Service Preferences
  if (step === 2) {
    // Filter regions for autocomplete
    const filteredRegions = REGIONS.filter(r => r.toLowerCase().includes(regionQuery.toLowerCase()));
    // Filter cities for selected region
    const cities = REGION_CITIES[region] || [];
    const filteredCities = cities.filter(c => c.toLowerCase().includes(cityQuery.toLowerCase()));
    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <ScrollView style={styles.container} contentContainerStyle={{ alignItems: 'center', paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          <Header />
          <ImageBackground
            source={require('../assets/images/blend.jpg')}
            style={styles.bannerBg}
            imageStyle={{ borderRadius: 20 }}
          >
            <View style={styles.bannerOverlay} />
            <View style={styles.bannerPill}>
              <Text style={styles.bannerPillText}>Join as a Recycler</Text>
            </View>
          </ImageBackground>
          <Text style={[styles.sectionTitle, { alignSelf: 'center', textAlign: 'center' }]}>Service Preferences:</Text>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Region:</Text>
            <View style={{ flex: 1 }}>
              <TextInput
                value={regionQuery}
                onChangeText={text => {
                  setRegionQuery(text);
                  setRegionDropdown(true);
                }}
                onFocus={() => setRegionDropdown(true)}
                style={styles.input}
                placeholder="Type region..."
              />
              {regionDropdown && filteredRegions.length > 0 && (
                <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#A3C47C', borderRadius: 8, maxHeight: 120, position: 'absolute', top: 48, left: 0, right: 0, zIndex: 10 }}>
                  {filteredRegions.map(item => (
                    <TouchableOpacity
                      key={item}
                      onPress={() => {
                        setRegion(item);
                        setRegionQuery(item);
                        setRegionDropdown(false);
                        setCityQuery(''); // reset city query when region changes
                        Keyboard.dismiss();
                      }}
                      style={{ padding: 12 }}
                    >
                      <Text style={{ color: '#263A13', fontSize: 16 }}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>City:</Text>
            <View style={{ flex: 1 }}>
              <TextInput
                value={city}
                onChangeText={text => {
                  setCity(text);
                  setCityQuery(text);
                  setCityDropdown(true);
                }}
                onFocus={() => setCityDropdown(true)}
                style={styles.input}
                placeholder="Type city..."
              />
              {cityDropdown && filteredCities.length > 0 && (
                <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#A3C47C', borderRadius: 8, maxHeight: 120, position: 'absolute', top: 48, left: 0, right: 0, zIndex: 10 }}>
                  {filteredCities.map(item => (
                    <TouchableOpacity
                      key={item}
                      onPress={() => {
                        setCity(item);
                        setCityQuery(item);
                        setCityDropdown(false);
                        Keyboard.dismiss();
                      }}
                      style={{ padding: 12 }}
                    >
                      <Text style={{ color: '#263A13', fontSize: 16 }}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
          <Text style={[styles.inputLabel, { marginTop: 12, marginBottom: 4 }]}>Transport Type:</Text>
          <View style={{ flexDirection: 'row', marginBottom: 20 }}>
            <TouchableOpacity style={[styles.transportType, transportType === 'Small Truck' && styles.transportTypeSelected]} onPress={() => setTransportType('Small Truck')}>
              <Text style={{ color: transportType === 'Small Truck' ? '#fff' : '#263A13' }}>Small Truck</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.transportType, transportType === 'Big Truck' && styles.transportTypeSelected]} onPress={() => setTransportType('Big Truck')}>
              <Text style={{ color: transportType === 'Big Truck' ? '#fff' : '#263A13' }}>Big Truck</Text>
            </TouchableOpacity>
          </View>
          {/* Truck Number Plate */}
          <Text style={[styles.inputLabel, { marginBottom: 4 }]}>Truck Number Plate:</Text>
          <View style={[styles.inputRowOnlyBox, { marginBottom: 20 }]}>
            <TextInput value={truckPlate} onChangeText={setTruckPlate} style={styles.input} />
          </View>
          {/* Residential Address */}
          <Text style={[styles.inputLabel, { marginBottom: 4 }]}>Residential Address:</Text>
          <View style={[styles.inputRowOnlyBox, { marginBottom: 20 }]}>
            <TextInput value={address} onChangeText={setAddress} style={styles.input} />
          </View>
        </ScrollView>
        <View style={{ paddingHorizontal: 0, paddingBottom: 12 }}>
          <ProgressBar step={step} />
          <View style={styles.navRow}>
            <TouchableOpacity onPress={() => setStep(1)}><Text style={styles.prevButtonText}>Previous</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setStep(3)}><Text style={styles.nextButtonText}>Next</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Step 3: National ID Upload
  if (step === 3) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <ScrollView style={styles.container} contentContainerStyle={{ alignItems: 'center', paddingBottom: 32 }}>
          <Header />
          <ImageBackground
            source={require('../assets/images/blend.jpg')}
            style={styles.bannerBg}
            imageStyle={{ borderRadius: 20 }}
          >
            <View style={styles.bannerOverlay} />
            <View style={styles.bannerPill}>
              <Text style={styles.bannerPillText}>Join as a Recycler</Text>
            </View>
          </ImageBackground>
          <Text style={[styles.sectionTitle, { alignSelf: 'flex-start', marginLeft: 40 }]}>Upload your National ID</Text>
          <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage(setIdFront)}>
            {idFront ? (
              <Image source={{ uri: idFront }} style={styles.uploadedImage} />
            ) : (
              <>
                <Feather name="upload" size={32} color="#222" style={{ marginBottom: 8 }} />
                <Text style={styles.uploadText}>Click to upload from phone{"\n"}front</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage(setIdBack)}>
            {idBack ? (
              <Image source={{ uri: idBack }} style={styles.uploadedImage} />
            ) : (
              <>
                <Feather name="upload" size={32} color="#222" style={{ marginBottom: 8 }} />
                <Text style={styles.uploadText}>Click to upload from phone{"\n"}back</Text>
              </>
            )}
          </TouchableOpacity>
          <View style={styles.inputRow}><Text style={styles.inputLabel}>ID NO:</Text><TextInput value={idNo} onChangeText={setIdNo} style={styles.input} /></View>
        </ScrollView>
        <View style={{ paddingHorizontal: 0, paddingBottom: 12 }}>
          <ProgressBar step={step} />
          <View style={styles.navRow}>
            <TouchableOpacity onPress={() => setStep(2)}><Text style={styles.prevButtonText}>Previous</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setStep(4)}><Text style={styles.nextButtonText}>Next</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Step 4: Profile image upload
  if (step === 4) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <ScrollView style={styles.container} contentContainerStyle={{ alignItems: 'center', paddingBottom: 32 }}>
          <Header />
          <ImageBackground
            source={require('../assets/images/blend.jpg')}
            style={styles.bannerBg}
            imageStyle={{ borderRadius: 20 }}
          >
            <View style={styles.bannerOverlay} />
            <View style={styles.bannerPill}>
              <Text style={styles.bannerPillText}>Join as a Recycler</Text>
            </View>
          </ImageBackground>
          <Text style={[styles.sectionTitle, { alignSelf: 'flex-start', marginLeft: 40 }]}>Upload your Passport picture</Text>
          <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage(setProfileImage)}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.uploadedImage} />
            ) : (
              <>
                <Feather name="upload" size={32} color="#222" style={{ marginBottom: 8 }} />
                <Text style={styles.uploadText}>Click to upload from phone</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
        <View style={{ paddingHorizontal: 0, paddingBottom: 12 }}>
          <ProgressBar step={step} />
          <View style={styles.navRow}>
            <TouchableOpacity onPress={() => setStep(3)}><Text style={styles.prevButtonText}>Previous</Text></TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={() => setStep(5)}><Text style={styles.submitButtonText}>SUBMIT</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Step 5: Pending Review
  if (step === 5) {
    return (
      <View style={styles.container}>
        <Header />
        <ImageBackground
          source={require('../assets/images/blend.jpg')}
          style={styles.bannerBg}
          imageStyle={{ borderRadius: 20 }}
        >
          <View style={styles.bannerOverlay} />
          <View style={styles.bannerPill}>
            <Text style={styles.bannerPillText}>Join as a Recycler</Text>
          </View>
        </ImageBackground>
        {/* ProgressBar removed from Pending Review */}
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Text style={styles.pendingTitle}>Pending Review</Text>
          <ActivityIndicator size="large" color="#263A13" style={{ marginVertical: 24 }} />
          <Text style={styles.pendingText}>You&apos;ll receive an update within 48-72 hours.</Text>
          <TouchableOpacity style={styles.confirmButton} onPress={() => setStep(1)}>
            <Text style={styles.confirmButtonText}>Edit and Resubmit</Text>
          </TouchableOpacity>
          <Text style={styles.pendingNote}>You can edit and resubmit within the next 24 hours.</Text>
        </View>
      </View>
    );
  }

  return null;
}

function Header() {
  const router = useRouter();
  // Add a back arrow to the left of the logo, no title text
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 8, width: '100%' }}>
      <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
        <Feather name="arrow-left" size={28} color="#263A13" />
      </TouchableOpacity>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Image source={require('../assets/images/logo landscape.png')} style={{ width: 200, height: 80, resizeMode: 'contain', marginBottom: 8 }} />
      </View>
      {/* Spacer to balance the row */}
      <View style={{ width: 44 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  bannerPill: {
    backgroundColor: '#fff',
    borderRadius: 20,
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingVertical: 10,
    elevation: 2,
  },
  bannerPillText: {
    color: '#263A13',
    fontWeight: 'bold',
    fontSize: 20,
    textAlign: 'center',
  },
  uploadBox: {
    backgroundColor: '#E3E3E3',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#888',
    width: 320,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginVertical: 18,
  },
  uploadedImage: {
    width: 300,
    height: 160,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  uploadText: {
    color: '#222',
    fontSize: 16,
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: '#223E01',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 32,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  submitButton: {
    backgroundColor: '#223E01',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 32,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#A3C47C',
    marginBottom: 12,
    paddingHorizontal: 12,
    width: 320,
    height: 48,
    marginTop: 8,
  },
  inputIcon: {
    marginRight: 8,
    fontSize: 20,
    color: '#263A13',
  },
  input: {
    flex: 1,
    color: '#263A13',
    fontWeight: 'bold',
    fontSize: 18,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#263A13',
    fontSize: 20,
    marginTop: 16,
    marginBottom: 8,
    alignSelf: 'flex-start',
    marginLeft: 24,
  },
  inputLabel: {
    color: '#263A13',
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: 8,
  },
  transportType: {
    borderWidth: 2,
    borderColor: '#A3C47C',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    backgroundColor: '#fff',
  },
  transportTypeSelected: {
    backgroundColor: '#263A13',
  },
  pendingTitle: {
    fontWeight: 'bold',
    color: '#263A13',
    fontSize: 22,
    marginBottom: 8,
  },
  pendingText: {
    color: '#263A13',
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  pendingNote: {
    color: '#263A13',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  nextButton: {
    alignSelf: 'flex-end',
    marginTop: 12,
    marginBottom: 12,
  },
  nextButtonText: {
    color: '#223E01',
    fontWeight: 'bold',
    fontSize: 18,
  },
  prevButtonText: {
    color: '#263A13',
    fontWeight: 'bold',
    fontSize: 18,
  },
  inputRowOnlyBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#A3C47C',
    marginBottom: 12,
    paddingHorizontal: 12,
    width: 320,
    height: 48,
    justifyContent: 'center',
    marginTop: 0,
    alignSelf: 'center',
  },
  bannerBg: {
    width: '100%',
    height: 80,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#D0D4CC',
    opacity: 0.7,
    borderRadius: 20,
  },
  countryCodeWrapper: {
    backgroundColor: '#E3E3E3',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A3C47C',
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginRight: 4,
    minWidth: 60,
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryCodeText: {
    color: '#263A13',
    fontWeight: 'bold',
    fontSize: 13,
    marginRight: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  countryModalTitle: {
    fontWeight: 'bold',
    color: '#263A13',
    fontSize: 20,
    marginBottom: 15,
  },
  countryCodeItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  countryCodeTextModal: {
    color: '#263A13',
    fontSize: 16,
  },
}); 