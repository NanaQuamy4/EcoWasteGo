// App Colors
export const COLORS = {
  primary: '#1C3301',
  secondary: '#4CAF50',
  background: '#CFDFBF',
  lightGreen: '#E3F0D5',
  white: '#fff',
  black: '#000',
  gray: '#666',
  lightGray: '#999',
  darkGreen: '#22330B',
  red: '#f44336',
  lightRed: '#ffebee',
  green: '#4CAF50',
  lightBlue: '#E3F2FD',
  darkBlue: '#1976D2',
  orange: '#FF9800',
  blue: '#2196F3',
  purple: '#9C27B0',
  // Additional colors for analytics
  text: '#333333',
  textLight: '#666666',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  accent: '#FF9800',
} as const;

// App Dimensions
export const DIMENSIONS = {
  borderRadius: 12,
  cardBorderRadius: 16,
  padding: 16,
  margin: 16,
} as const;



// Environmental Impact Calculations
export const ENVIRONMENTAL_FACTORS = {
  co2PerKg: 0.5, // kg CO2 saved per kg recycled
  treesPerKg: 0.025, // trees equivalent per kg
  energyHoursPerKg: 2.5, // light bulb hours per kg
  carKmPerKg: 0.3, // car kilometers equivalent per kg
} as const;

// Message Suggestions for Text Recycler
export const MESSAGE_SUGGESTION_SETS = [
  [
    'When will you arrive?',
    'I\'m at the pickup location',
    'Can you call when you\'re close?',
    'Is there a delay?',
  ],
  [
    'I have extra waste to add',
    'Can you bring extra bags?',
    'Do you accept all types of waste?',
    'What\'s your payment method?',
  ],
  [
    'I\'m running late, please wait',
    'Can you come back later?',
    'I\'ll be there in 10 minutes',
    'Sorry for the inconvenience',
  ],
  [
    'Thank you for the service',
    'Great job today!',
    'I\'ll recommend you to others',
    'See you next time',
  ],
  [
    'Is the weight correct?',
    'Can you explain the calculation?',
    'I think there\'s an error',
    'The rate seems different',
  ],
];

// Dummy responses for text simulation
export const DUMMY_RESPONSES = [
  'I\'m on my way, will be there in 5 minutes.',
  'Yes, I can wait. No problem.',
  'I accept all recyclable materials.',
  'Thank you for choosing our service!',
  'The weight is accurate, I double-checked.',
];

// Google Maps API Key
export const GOOGLE_MAPS_API_KEY = 'AIzaSyBUNUKncuC9GT6h4U-nDdjOea4-P7F_w4E'; 