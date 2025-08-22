import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { CountryCode } from 'react-native-country-picker-modal';
import { COLORS } from '../constants';

interface PhoneNumberInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  onCountryChange?: (countryCode: string) => void;
  selectedCountryCode?: string;
  onValidationChange?: (isValid: boolean, error?: string) => void;
}

interface CountryData {
  code: CountryCode;
  name: string;
  dialCode: string;
  flag: string;
}

const allCountries: CountryData[] = [
  { code: 'AF', name: 'Afghanistan', dialCode: '+93', flag: '🇦🇫' },
  { code: 'AL', name: 'Albania', dialCode: '+355', flag: '🇦🇱' },
  { code: 'DZ', name: 'Algeria', dialCode: '+213', flag: '🇩🇿' },
  { code: 'AS', name: 'American Samoa', dialCode: '+1-684', flag: '🇦🇸' },
  { code: 'AD', name: 'Andorra', dialCode: '+376', flag: '🇦🇩' },
  { code: 'AO', name: 'Angola', dialCode: '+244', flag: '🇦🇴' },
  { code: 'AI', name: 'Anguilla', dialCode: '+1-264', flag: '🇦🇮' },
  { code: 'AQ', name: 'Antarctica', dialCode: '+672', flag: '🇦🇶' },
  { code: 'AG', name: 'Antigua and Barbuda', dialCode: '+1-268', flag: '🇦🇬' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
  { code: 'AM', name: 'Armenia', dialCode: '+374', flag: '🇦🇲' },
  { code: 'AW', name: 'Aruba', dialCode: '+297', flag: '🇦🇼' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'AT', name: 'Austria', dialCode: '+43', flag: '🇦🇹' },
  { code: 'AZ', name: 'Azerbaijan', dialCode: '+994', flag: '🇦🇿' },
  { code: 'BS', name: 'Bahamas', dialCode: '+1-242', flag: '🇧🇸' },
  { code: 'BH', name: 'Bahrain', dialCode: '+973', flag: '🇧🇭' },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩' },
  { code: 'BB', name: 'Barbados', dialCode: '+1-246', flag: '🇧🇧' },
  { code: 'BY', name: 'Belarus', dialCode: '+375', flag: '🇧🇾' },
  { code: 'BE', name: 'Belgium', dialCode: '+32', flag: '🇧🇪' },
  { code: 'BZ', name: 'Belize', dialCode: '+501', flag: '🇧🇿' },
  { code: 'BJ', name: 'Benin', dialCode: '+229', flag: '🇧🇯' },
  { code: 'BM', name: 'Bermuda', dialCode: '+1-441', flag: '🇧🇲' },
  { code: 'BT', name: 'Bhutan', dialCode: '+975', flag: '🇧🇹' },
  { code: 'BO', name: 'Bolivia', dialCode: '+591', flag: '🇧🇴' },
  { code: 'BA', name: 'Bosnia and Herzegovina', dialCode: '+387', flag: '🇧🇦' },
  { code: 'BW', name: 'Botswana', dialCode: '+267', flag: '🇧🇼' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'IO', name: 'British Indian Ocean Territory', dialCode: '+246', flag: '🇮🇴' },
  { code: 'VG', name: 'British Virgin Islands', dialCode: '+1-284', flag: '🇻🇬' },
  { code: 'BN', name: 'Brunei', dialCode: '+673', flag: '🇧🇳' },
  { code: 'BG', name: 'Bulgaria', dialCode: '+359', flag: '🇧🇬' },
  { code: 'BF', name: 'Burkina Faso', dialCode: '+226', flag: '🇧🇫' },
  { code: 'BI', name: 'Burundi', dialCode: '+257', flag: '🇧🇮' },
  { code: 'KH', name: 'Cambodia', dialCode: '+855', flag: '🇰🇭' },
  { code: 'CM', name: 'Cameroon', dialCode: '+237', flag: '🇨🇲' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'CV', name: 'Cape Verde', dialCode: '+238', flag: '🇨🇻' },
  { code: 'KY', name: 'Cayman Islands', dialCode: '+1-345', flag: '🇰🇾' },
  { code: 'CF', name: 'Central African Republic', dialCode: '+236', flag: '🇨🇫' },
  { code: 'TD', name: 'Chad', dialCode: '+235', flag: '🇹🇩' },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
  { code: 'CX', name: 'Christmas Island', dialCode: '+61', flag: '🇨🇽' },
  { code: 'CC', name: 'Cocos Islands', dialCode: '+61', flag: '🇨🇨' },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴' },
  { code: 'KM', name: 'Comoros', dialCode: '+269', flag: '🇰🇲' },
  { code: 'CK', name: 'Cook Islands', dialCode: '+682', flag: '🇨🇰' },
  { code: 'CR', name: 'Costa Rica', dialCode: '+506', flag: '🇨🇷' },
  { code: 'HR', name: 'Croatia', dialCode: '+385', flag: '🇭🇷' },
  { code: 'CU', name: 'Cuba', dialCode: '+53', flag: '🇨🇺' },
  { code: 'CW', name: 'Curacao', dialCode: '+599', flag: '🇨🇼' },
  { code: 'CY', name: 'Cyprus', dialCode: '+357', flag: '🇨🇾' },
  { code: 'CZ', name: 'Czech Republic', dialCode: '+420', flag: '🇨🇿' },
  { code: 'CD', name: 'Democratic Republic of the Congo', dialCode: '+243', flag: '🇨🇩' },
  { code: 'DK', name: 'Denmark', dialCode: '+45', flag: '🇩🇰' },
  { code: 'DJ', name: 'Djibouti', dialCode: '+253', flag: '🇩🇯' },
  { code: 'DM', name: 'Dominica', dialCode: '+1-767', flag: '🇩🇲' },
  { code: 'DO', name: 'Dominican Republic', dialCode: '+1-809', flag: '🇩🇴' },
  { code: 'TL', name: 'East Timor', dialCode: '+670', flag: '🇹🇱' },
  { code: 'EC', name: 'Ecuador', dialCode: '+593', flag: '🇪🇨' },
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬' },
  { code: 'SV', name: 'El Salvador', dialCode: '+503', flag: '🇸🇻' },
  { code: 'GQ', name: 'Equatorial Guinea', dialCode: '+240', flag: '🇬🇶' },
  { code: 'ER', name: 'Eritrea', dialCode: '+291', flag: '🇪🇷' },
  { code: 'EE', name: 'Estonia', dialCode: '+372', flag: '🇪🇪' },
  { code: 'ET', name: 'Ethiopia', dialCode: '+251', flag: '🇪🇹' },
  { code: 'FK', name: 'Falkland Islands', dialCode: '+500', flag: '🇫🇰' },
  { code: 'FO', name: 'Faroe Islands', dialCode: '+298', flag: '🇫🇴' },
  { code: 'FJ', name: 'Fiji', dialCode: '+679', flag: '🇫🇯' },
  { code: 'FI', name: 'Finland', dialCode: '+358', flag: '🇫🇮' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'GF', name: 'French Guiana', dialCode: '+594', flag: '🇬🇫' },
  { code: 'PF', name: 'French Polynesia', dialCode: '+689', flag: '🇵🇫' },
  { code: 'GA', name: 'Gabon', dialCode: '+241', flag: '🇬🇦' },
  { code: 'GM', name: 'Gambia', dialCode: '+220', flag: '🇬🇲' },
  { code: 'GE', name: 'Georgia', dialCode: '+995', flag: '🇬🇪' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭' },
  { code: 'GI', name: 'Gibraltar', dialCode: '+350', flag: '🇬🇮' },
  { code: 'GR', name: 'Greece', dialCode: '+30', flag: '🇬🇷' },
  { code: 'GL', name: 'Greenland', dialCode: '+299', flag: '🇬🇱' },
  { code: 'GD', name: 'Grenada', dialCode: '+1-473', flag: '🇬🇩' },
  { code: 'GP', name: 'Guadeloupe', dialCode: '+590', flag: '🇬🇵' },
  { code: 'GU', name: 'Guam', dialCode: '+1-671', flag: '🇬🇺' },
  { code: 'GT', name: 'Guatemala', dialCode: '+502', flag: '🇬🇹' },
  { code: 'GG', name: 'Guernsey', dialCode: '+44-1481', flag: '🇬🇬' },
  { code: 'GN', name: 'Guinea', dialCode: '+224', flag: '🇬🇳' },
  { code: 'GW', name: 'Guinea-Bissau', dialCode: '+245', flag: '🇬🇼' },
  { code: 'GY', name: 'Guyana', dialCode: '+592', flag: '🇬🇾' },
  { code: 'HT', name: 'Haiti', dialCode: '+509', flag: '🇭🇹' },
  { code: 'HN', name: 'Honduras', dialCode: '+504', flag: '🇭🇳' },
  { code: 'HK', name: 'Hong Kong', dialCode: '+852', flag: '🇭🇰' },
  { code: 'HU', name: 'Hungary', dialCode: '+36', flag: '🇭🇺' },
  { code: 'IS', name: 'Iceland', dialCode: '+354', flag: '🇮🇸' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩' },
  { code: 'IR', name: 'Iran', dialCode: '+98', flag: '🇮🇷' },
  { code: 'IQ', name: 'Iraq', dialCode: '+964', flag: '🇮🇶' },
  { code: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮🇪' },
  { code: 'IM', name: 'Isle of Man', dialCode: '+44-1624', flag: '🇮🇲' },
  { code: 'IL', name: 'Israel', dialCode: '+972', flag: '🇮🇱' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹' },
  { code: 'CI', name: 'Ivory Coast', dialCode: '+225', flag: '🇨🇮' },
  { code: 'JM', name: 'Jamaica', dialCode: '+1-876', flag: '🇯🇲' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  { code: 'JE', name: 'Jersey', dialCode: '+44-1534', flag: '🇯🇪' },
  { code: 'JO', name: 'Jordan', dialCode: '+962', flag: '🇯🇴' },
  { code: 'KZ', name: 'Kazakhstan', dialCode: '+7', flag: '🇰🇿' },
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪' },
  { code: 'KI', name: 'Kiribati', dialCode: '+686', flag: '🇰🇮' },
  { code: 'XK', name: 'Kosovo', dialCode: '+383', flag: '🇽🇰' },
  { code: 'KW', name: 'Kuwait', dialCode: '+965', flag: '🇰🇼' },
  { code: 'KG', name: 'Kyrgyzstan', dialCode: '+996', flag: '🇰🇬' },
  { code: 'LA', name: 'Laos', dialCode: '+856', flag: '🇱🇦' },
  { code: 'LV', name: 'Latvia', dialCode: '+371', flag: '🇱🇻' },
  { code: 'LB', name: 'Lebanon', dialCode: '+961', flag: '🇱🇧' },
  { code: 'LS', name: 'Lesotho', dialCode: '+266', flag: '🇱🇸' },
  { code: 'LR', name: 'Liberia', dialCode: '+231', flag: '🇱🇷' },
  { code: 'LY', name: 'Libya', dialCode: '+218', flag: '🇱🇾' },
  { code: 'LI', name: 'Liechtenstein', dialCode: '+423', flag: '🇱🇮' },
  { code: 'LT', name: 'Lithuania', dialCode: '+370', flag: '🇱🇹' },
  { code: 'LU', name: 'Luxembourg', dialCode: '+352', flag: '🇱🇺' },
  { code: 'MO', name: 'Macau', dialCode: '+853', flag: '🇲🇴' },
  { code: 'MK', name: 'Macedonia', dialCode: '+389', flag: '🇲🇰' },
  { code: 'MG', name: 'Madagascar', dialCode: '+261', flag: '🇲🇬' },
  { code: 'MW', name: 'Malawi', dialCode: '+265', flag: '🇲🇼' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾' },
  { code: 'MV', name: 'Maldives', dialCode: '+960', flag: '🇲🇻' },
  { code: 'ML', name: 'Mali', dialCode: '+223', flag: '🇲🇱' },
  { code: 'MT', name: 'Malta', dialCode: '+356', flag: '🇲🇹' },
  { code: 'MH', name: 'Marshall Islands', dialCode: '+692', flag: '🇲🇭' },
  { code: 'MQ', name: 'Martinique', dialCode: '+596', flag: '🇲🇶' },
  { code: 'MR', name: 'Mauritania', dialCode: '+222', flag: '🇲🇷' },
  { code: 'MU', name: 'Mauritius', dialCode: '+230', flag: '🇲🇺' },
  { code: 'YT', name: 'Mayotte', dialCode: '+262', flag: '🇾🇹' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽' },
  { code: 'FM', name: 'Micronesia', dialCode: '+691', flag: '🇫🇲' },
  { code: 'MD', name: 'Moldova', dialCode: '+373', flag: '🇲🇩' },
  { code: 'MC', name: 'Monaco', dialCode: '+377', flag: '🇲🇨' },
  { code: 'MN', name: 'Mongolia', dialCode: '+976', flag: '🇲🇳' },
  { code: 'ME', name: 'Montenegro', dialCode: '+382', flag: '🇲🇪' },
  { code: 'MS', name: 'Montserrat', dialCode: '+1-664', flag: '🇲🇸' },
  { code: 'MA', name: 'Morocco', dialCode: '+212', flag: '🇲🇦' },
  { code: 'MZ', name: 'Mozambique', dialCode: '+258', flag: '🇲🇿' },
  { code: 'MM', name: 'Myanmar', dialCode: '+95', flag: '🇲🇲' },
  { code: 'NA', name: 'Namibia', dialCode: '+264', flag: '🇳🇦' },
  { code: 'NR', name: 'Nauru', dialCode: '+674', flag: '🇳🇷' },
  { code: 'NP', name: 'Nepal', dialCode: '+977', flag: '🇳🇵' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱' },
  { code: 'NC', name: 'New Caledonia', dialCode: '+687', flag: '🇳🇨' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿' },
  { code: 'NI', name: 'Nicaragua', dialCode: '+505', flag: '🇳🇮' },
  { code: 'NE', name: 'Niger', dialCode: '+227', flag: '🇳🇪' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬' },
  { code: 'NU', name: 'Niue', dialCode: '+683', flag: '🇳🇺' },
  { code: 'NF', name: 'Norfolk Island', dialCode: '+672', flag: '🇳🇫' },
  { code: 'KP', name: 'North Korea', dialCode: '+850', flag: '🇰🇵' },
  { code: 'MP', name: 'Northern Mariana Islands', dialCode: '+1-670', flag: '🇲🇵' },
  { code: 'NO', name: 'Norway', dialCode: '+47', flag: '🇳🇴' },
  { code: 'OM', name: 'Oman', dialCode: '+968', flag: '🇴🇲' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰' },
  { code: 'PW', name: 'Palau', dialCode: '+680', flag: '🇵🇼' },
  { code: 'PS', name: 'Palestine', dialCode: '+970', flag: '🇵🇸' },
  { code: 'PA', name: 'Panama', dialCode: '+507', flag: '🇵🇦' },
  { code: 'PG', name: 'Papua New Guinea', dialCode: '+675', flag: '🇵🇬' },
  { code: 'PY', name: 'Paraguay', dialCode: '+595', flag: '🇵🇾' },
  { code: 'PE', name: 'Peru', dialCode: '+51', flag: '🇵🇪' },
  { code: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭' },
  { code: 'PN', name: 'Pitcairn', dialCode: '+64', flag: '🇵🇳' },
  { code: 'PL', name: 'Poland', dialCode: '+48', flag: '🇵🇱' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹' },
  { code: 'PR', name: 'Puerto Rico', dialCode: '+1-787', flag: '🇵🇷' },
  { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦' },
  { code: 'RE', name: 'Reunion', dialCode: '+262', flag: '🇷🇪' },
  { code: 'RO', name: 'Romania', dialCode: '+40', flag: '🇷🇴' },
  { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺' },
  { code: 'RW', name: 'Rwanda', dialCode: '+250', flag: '🇷🇼' },
  { code: 'BL', name: 'Saint Barthelemy', dialCode: '+590', flag: '🇧🇱' },
  { code: 'SH', name: 'Saint Helena', dialCode: '+290', flag: '🇸🇭' },
  { code: 'KN', name: 'Saint Kitts and Nevis', dialCode: '+1-869', flag: '🇰🇳' },
  { code: 'LC', name: 'Saint Lucia', dialCode: '+1-758', flag: '🇱🇨' },
  { code: 'MF', name: 'Saint Martin', dialCode: '+590', flag: '🇲🇫' },
  { code: 'PM', name: 'Saint Pierre and Miquelon', dialCode: '+508', flag: '🇵🇲' },
  { code: 'VC', name: 'Saint Vincent and the Grenadines', dialCode: '+1-784', flag: '🇻🇨' },
  { code: 'WS', name: 'Samoa', dialCode: '+685', flag: '🇼🇸' },
  { code: 'SM', name: 'San Marino', dialCode: '+378', flag: '🇸🇲' },
  { code: 'ST', name: 'Sao Tome and Principe', dialCode: '+239', flag: '🇸🇹' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
  { code: 'SN', name: 'Senegal', dialCode: '+221', flag: '🇸🇳' },
  { code: 'RS', name: 'Serbia', dialCode: '+381', flag: '🇷🇸' },
  { code: 'SC', name: 'Seychelles', dialCode: '+248', flag: '🇸🇨' },
  { code: 'SL', name: 'Sierra Leone', dialCode: '+232', flag: '🇸🇱' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬' },
  { code: 'SX', name: 'Sint Maarten', dialCode: '+1-721', flag: '🇸🇽' },
  { code: 'SK', name: 'Slovakia', dialCode: '+421', flag: '🇸🇰' },
  { code: 'SI', name: 'Slovenia', dialCode: '+386', flag: '🇸🇮' },
  { code: 'SB', name: 'Solomon Islands', dialCode: '+677', flag: '🇸🇧' },
  { code: 'SO', name: 'Somalia', dialCode: '+252', flag: '🇸🇴' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷' },
  { code: 'SS', name: 'South Sudan', dialCode: '+211', flag: '🇸🇸' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸' },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94', flag: '🇱🇰' },
  { code: 'SD', name: 'Sudan', dialCode: '+249', flag: '🇸🇩' },
  { code: 'SR', name: 'Suriname', dialCode: '+597', flag: '🇸🇷' },
  { code: 'SJ', name: 'Svalbard and Jan Mayen', dialCode: '+47', flag: '🇸🇯' },
  { code: 'SZ', name: 'Swaziland', dialCode: '+268', flag: '🇸🇿' },
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭' },
  { code: 'SY', name: 'Syria', dialCode: '+963', flag: '🇸🇾' },
  { code: 'TW', name: 'Taiwan', dialCode: '+886', flag: '🇹🇼' },
  { code: 'TJ', name: 'Tajikistan', dialCode: '+992', flag: '🇹🇯' },
  { code: 'TZ', name: 'Tanzania', dialCode: '+255', flag: '🇹🇿' },
  { code: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭' },
  { code: 'TG', name: 'Togo', dialCode: '+228', flag: '🇹🇬' },
  { code: 'TK', name: 'Tokelau', dialCode: '+690', flag: '🇹🇰' },
  { code: 'TO', name: 'Tonga', dialCode: '+676', flag: '🇹🇴' },
  { code: 'TT', name: 'Trinidad and Tobago', dialCode: '+1-868', flag: '🇹🇹' },
  { code: 'TN', name: 'Tunisia', dialCode: '+216', flag: '🇹🇳' },
  { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷' },
  { code: 'TM', name: 'Turkmenistan', dialCode: '+993', flag: '🇹🇲' },
  { code: 'TC', name: 'Turks and Caicos Islands', dialCode: '+1-649', flag: '🇹🇨' },
  { code: 'TV', name: 'Tuvalu', dialCode: '+688', flag: '🇹🇻' },
  { code: 'VI', name: 'U.S. Virgin Islands', dialCode: '+1-340', flag: '🇻🇮' },
  { code: 'UG', name: 'Uganda', dialCode: '+256', flag: '🇺🇬' },
  { code: 'UA', name: 'Ukraine', dialCode: '+380', flag: '🇺🇦' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'UY', name: 'Uruguay', dialCode: '+598', flag: '🇺🇾' },
  { code: 'UZ', name: 'Uzbekistan', dialCode: '+998', flag: '🇺🇿' },
  { code: 'VU', name: 'Vanuatu', dialCode: '+678', flag: '🇻🇺' },
  { code: 'VA', name: 'Vatican', dialCode: '+379', flag: '🇻🇦' },
  { code: 'VE', name: 'Venezuela', dialCode: '+58', flag: '🇻🇪' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', flag: '🇻🇳' },
  { code: 'WF', name: 'Wallis and Futuna', dialCode: '+681', flag: '🇼🇫' },
  { code: 'EH', name: 'Western Sahara', dialCode: '+212', flag: '🇪🇭' },
  { code: 'YE', name: 'Yemen', dialCode: '+967', flag: '🇾🇪' },
  { code: 'ZM', name: 'Zambia', dialCode: '+260', flag: '🇿🇲' },
  { code: 'ZW', name: 'Zimbabwe', dialCode: '+263', flag: '🇿🇼' },
];

// Phone number validation rules by country
const phoneValidationRules: Record<string, { minLength: number; maxLength: number; pattern?: RegExp }> = {
  'GH': { minLength: 9, maxLength: 9 }, // Ghana
  'US': { minLength: 10, maxLength: 10 }, // United States
  'CA': { minLength: 10, maxLength: 10 }, // Canada
  'GB': { minLength: 10, maxLength: 11 }, // United Kingdom
  'NG': { minLength: 10, maxLength: 11 }, // Nigeria
  'KE': { minLength: 9, maxLength: 9 }, // Kenya
  'ZA': { minLength: 9, maxLength: 9 }, // South Africa
  'EG': { minLength: 10, maxLength: 10 }, // Egypt
  'IN': { minLength: 10, maxLength: 10 }, // India
  'CN': { minLength: 11, maxLength: 11 }, // China
  'JP': { minLength: 10, maxLength: 11 }, // Japan
  'DE': { minLength: 10, maxLength: 12 }, // Germany
  'FR': { minLength: 9, maxLength: 10 }, // France
  'IT': { minLength: 9, maxLength: 10 }, // Italy
  'ES': { minLength: 9, maxLength: 9 }, // Spain
  'BR': { minLength: 10, maxLength: 11 }, // Brazil
  'MX': { minLength: 10, maxLength: 10 }, // Mexico
  'AU': { minLength: 9, maxLength: 9 }, // Australia
  'NZ': { minLength: 9, maxLength: 9 }, // New Zealand
  'SG': { minLength: 8, maxLength: 8 }, // Singapore
  'MY': { minLength: 9, maxLength: 10 }, // Malaysia
  'TH': { minLength: 9, maxLength: 9 }, // Thailand
  'VN': { minLength: 9, maxLength: 10 }, // Vietnam
  'PH': { minLength: 10, maxLength: 10 }, // Philippines
  'ID': { minLength: 9, maxLength: 12 }, // Indonesia
  'TR': { minLength: 10, maxLength: 10 }, // Turkey
  'SA': { minLength: 9, maxLength: 9 }, // Saudi Arabia
  'AE': { minLength: 9, maxLength: 9 }, // UAE
  'QA': { minLength: 8, maxLength: 8 }, // Qatar
  'KW': { minLength: 8, maxLength: 8 }, // Kuwait
  'BH': { minLength: 8, maxLength: 8 }, // Bahrain
  'OM': { minLength: 8, maxLength: 8 }, // Oman
  'JO': { minLength: 9, maxLength: 9 }, // Jordan
  'LB': { minLength: 8, maxLength: 8 }, // Lebanon
  'IL': { minLength: 9, maxLength: 9 }, // Israel
  'RU': { minLength: 10, maxLength: 10 }, // Russia
  'UA': { minLength: 9, maxLength: 9 }, // Ukraine
  'PL': { minLength: 9, maxLength: 9 }, // Poland
  'CZ': { minLength: 9, maxLength: 9 }, // Czech Republic
  'HU': { minLength: 9, maxLength: 9 }, // Hungary
  'RO': { minLength: 9, maxLength: 9 }, // Romania
  'BG': { minLength: 9, maxLength: 9 }, // Bulgaria
  'HR': { minLength: 9, maxLength: 9 }, // Croatia
  'RS': { minLength: 9, maxLength: 9 }, // Serbia
  'SI': { minLength: 8, maxLength: 8 }, // Slovenia
  'SK': { minLength: 9, maxLength: 9 }, // Slovakia
  'LT': { minLength: 8, maxLength: 8 }, // Lithuania
  'LV': { minLength: 8, maxLength: 8 }, // Latvia
  'EE': { minLength: 8, maxLength: 8 }, // Estonia
  'FI': { minLength: 9, maxLength: 9 }, // Finland
  'SE': { minLength: 9, maxLength: 9 }, // Sweden
  'NO': { minLength: 8, maxLength: 8 }, // Norway
  'DK': { minLength: 8, maxLength: 8 }, // Denmark
  'NL': { minLength: 9, maxLength: 9 }, // Netherlands
  'BE': { minLength: 9, maxLength: 9 }, // Belgium
  'CH': { minLength: 9, maxLength: 9 }, // Switzerland
  'AT': { minLength: 10, maxLength: 12 }, // Austria
  'PT': { minLength: 9, maxLength: 9 }, // Portugal
  'GR': { minLength: 10, maxLength: 10 }, // Greece
  'IE': { minLength: 9, maxLength: 9 }, // Ireland
  'MT': { minLength: 8, maxLength: 8 }, // Malta
  'CY': { minLength: 8, maxLength: 8 }, // Cyprus
  'LU': { minLength: 9, maxLength: 9 }, // Luxembourg
  'IS': { minLength: 7, maxLength: 7 }, // Iceland
  'AD': { minLength: 6, maxLength: 6 }, // Andorra
  'MC': { minLength: 8, maxLength: 8 }, // Monaco
  'LI': { minLength: 7, maxLength: 7 }, // Liechtenstein
  'SM': { minLength: 8, maxLength: 8 }, // San Marino
  'VA': { minLength: 8, maxLength: 8 }, // Vatican
  'default': { minLength: 8, maxLength: 15 }, // Default for other countries
};

// Function to validate phone number based on country
const validatePhoneNumber = (phoneNumber: string, countryCode: string): { isValid: boolean; error?: string } => {
  if (!phoneNumber) {
    return { isValid: false, error: 'Phone number is required' };
  }

  const rules = phoneValidationRules[countryCode] || phoneValidationRules['default'];
  
  if (phoneNumber.length < rules.minLength) {
    return { 
      isValid: false, 
      error: `Phone number must be at least ${rules.minLength} digits` 
    };
  }
  
  if (phoneNumber.length > rules.maxLength) {
    return { 
      isValid: false, 
      error: `Phone number must be no more than ${rules.maxLength} digits` 
    };
  }

  // Additional pattern validation if specified
  if (rules.pattern && !rules.pattern.test(phoneNumber)) {
    return { 
      isValid: false, 
      error: 'Phone number format is invalid' 
    };
  }

  return { isValid: true };
};

export default function PhoneNumberInput({
  value,
  onChangeText,
  placeholder = 'Enter phone number',
  error,
  disabled = false,
  onCountryChange,
  selectedCountryCode,
  onValidationChange,
}: PhoneNumberInputProps) {
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryData>(
    allCountries.find(c => c.code === (selectedCountryCode || 'GH')) || allCountries[0]
  );
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCountries = allCountries.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.dialCode.includes(searchQuery) ||
    country.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCountrySelect = (country: CountryData) => {
    setSelectedCountry(country);
    setShowCountryPicker(false);
    setSearchQuery('');
    
    // Notify parent component about country change
    if (onCountryChange) {
      onCountryChange(country.dialCode);
    }
    
    // Re-validate phone number with new country
    if (onValidationChange && value) {
      const validation = validatePhoneNumber(value, country.code);
      onValidationChange(validation.isValid, validation.error);
    }
  };

  const handlePhoneNumberChange = (text: string) => {
    // Remove any non-digit characters except the country code
    const cleanedText = text.replace(/[^\d]/g, '');
    
    // Send the full phone number (with country code) to the parent
    const fullPhoneNumber = `${selectedCountry.dialCode}${cleanedText}`;
    onChangeText(fullPhoneNumber);
    
    // Validate phone number and notify parent
    if (onValidationChange) {
      const validation = validatePhoneNumber(cleanedText, selectedCountry.code);
      onValidationChange(validation.isValid, validation.error);
    }
  };

  const getFullPhoneNumber = () => {
    if (!value) return '';
    return `${selectedCountry.dialCode}${value}`;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.inputContainer, error && styles.inputError]}>
        {/* Country Code Button */}
        <TouchableOpacity
          style={styles.countryButton}
          onPress={() => setShowCountryPicker(true)}
          disabled={disabled}
        >
          <Text style={styles.flagText}>{selectedCountry.flag}</Text>
          <Text style={styles.dialCodeText}>{selectedCountry.dialCode}</Text>
          <MaterialIcons name="keyboard-arrow-down" size={20} color={COLORS.gray} />
        </TouchableOpacity>

        {/* Phone Number Input */}
        <TextInput
          style={styles.phoneInput}
          value={value}
          onChangeText={handlePhoneNumberChange}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray}
          keyboardType="phone-pad"
          editable={!disabled}
        />
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

             {/* Country Picker Modal */}
       <Modal
         visible={showCountryPicker}
         animationType="slide"
         transparent={true}
         onRequestClose={() => setShowCountryPicker(false)}
       >
         <View style={styles.modalOverlay}>
           <View style={styles.modalContent}>
             <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>Select Country</Text>
               <TouchableOpacity
                 style={styles.closeButton}
                 onPress={() => {
                   setShowCountryPicker(false);
                   setSearchQuery('');
                 }}
               >
                 <MaterialIcons name="close" size={24} color={COLORS.gray} />
               </TouchableOpacity>
             </View>

             {/* Search Input */}
             <View style={styles.searchContainer}>
               <MaterialIcons name="search" size={20} color={COLORS.gray} style={styles.searchIcon} />
               <TextInput
                 style={styles.searchInput}
                 placeholder="Search countries..."
                 value={searchQuery}
                 onChangeText={setSearchQuery}
                 placeholderTextColor={COLORS.gray}
               />
             </View>

             <FlatList
               data={filteredCountries}
               keyExtractor={(item) => item.code}
               renderItem={({ item }) => (
                 <TouchableOpacity
                   style={styles.countryItem}
                   onPress={() => handleCountrySelect(item)}
                 >
                   <Text style={styles.countryFlag}>{item.flag}</Text>
                   <View style={styles.countryInfo}>
                     <Text style={styles.countryName}>{item.name}</Text>
                     <Text style={styles.countryDialCode}>{item.dialCode}</Text>
                   </View>
                 </TouchableOpacity>
               )}
               showsVerticalScrollIndicator={false}
             />
           </View>
         </View>
       </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  inputError: {
    borderColor: COLORS.red,
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: COLORS.lightGray,
    marginRight: 12,
  },
  flagText: {
    fontSize: 20,
    marginRight: 8,
  },
  dialCodeText: {
    fontSize: 16,
    color: COLORS.darkGreen,
    fontWeight: '600',
    marginRight: 4,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.darkGreen,
    paddingVertical: 12,
  },
  errorText: {
    color: COLORS.red,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  closeButton: {
    padding: 4,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 16,
    color: COLORS.darkGreen,
    fontWeight: '500',
  },
  countryDialCode: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.darkGreen,
    paddingVertical: 8,
  },
}); 